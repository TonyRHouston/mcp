import sqlite3 from 'sqlite3';
import { Cache } from './Cache';
import { GFile } from './GFile';
import * as path from 'path';
import * as fs from 'fs';

/**
 * SQLite-based cache implementation for Google Drive file metadata
 */
export class SQLiteCache implements Cache {
  private db: sqlite3.Database | null = null;
  private accountId: string;
  private dbPath: string;

  constructor(configuration: Record<string, string>) {
    this.accountId = configuration.account || 'default';

    // Ensure cache directory exists
    const cacheDir = path.join(process.cwd(), 'cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    this.dbPath = path.join(cacheDir, `gdrive-${this.accountId}.db`);
    this.initDatabase();
  }

  /**
   * Helper to wrap db.get in a Promise
   */
  private dbGet(sql: string, params: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db!.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  /**
   * Helper to wrap db.all in a Promise
   */
  private dbAll(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db!.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Helper to wrap db.run in a Promise
   */
  private dbRun(sql: string, params: any[] = []): Promise<{ changes?: number }> {
    return new Promise((resolve, reject) => {
      this.db!.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        this.createTables().then(resolve).catch(reject);
      });
    });
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.dbRun(`
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        revision TEXT,
        trashed INTEGER DEFAULT 0,
        is_directory INTEGER DEFAULT 0,
        size INTEGER DEFAULT 0,
        md5_checksum TEXT,
        last_modified INTEGER,
        mime_type TEXT,
        "exists" INTEGER DEFAULT 1
      )
    `);

    await this.dbRun(`
      CREATE TABLE IF NOT EXISTS parents (
        file_id TEXT NOT NULL,
        parent_id TEXT NOT NULL,
        PRIMARY KEY (file_id, parent_id),
        FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
      )
    `);

    await this.dbRun(`
      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    await this.dbRun(`CREATE INDEX IF NOT EXISTS idx_files_name ON files(name)`);
    await this.dbRun(`CREATE INDEX IF NOT EXISTS idx_parents_parent ON parents(parent_id)`);
  }

  async getFile(id: string): Promise<GFile | null> {
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.dbGet('SELECT * FROM files WHERE id = ?', [id]);
    if (!row) return null;

    const parents = await this.dbAll('SELECT parent_id FROM parents WHERE file_id = ?', [id]);

    return this.rowToGFile(row, parents);
  }

  async getFiles(folderId: string): Promise<GFile[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.dbAll(
      `
      SELECT f.*, GROUP_CONCAT(p.parent_id) as parent_ids
      FROM files f
      LEFT JOIN parents p ON f.id = p.file_id
      WHERE p.parent_id = ?
      GROUP BY f.id
    `,
      [folderId]
    );

    return rows.map((row) => {
      const parents = row.parent_ids
        ? row.parent_ids.split(',').map((p: { parent_id: string }) => ({ parent_id: p }))
        : [];
      return this.rowToGFile(row, parents);
    });
  }

  async getFileByName(parentId: string, filename: string): Promise<GFile | null> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.dbAll(
      `
      SELECT f.*, GROUP_CONCAT(p.parent_id) as parent_ids
      FROM files f
      JOIN parents p ON f.id = p.file_id
      WHERE p.parent_id = ? AND f.name = ?
      GROUP BY f.id
    `,
      [parentId, filename]
    );

    if (rows.length === 0) return null;
    if (rows.length > 1) {
      throw new Error(`Multiple files found with name ${filename} in folder ${parentId}`);
    }

    const row = rows[0];
    const parents = row.parent_ids
      ? row.parent_ids.split(',').map((p: string) => ({ parent_id: p }))
      : [];
    return this.rowToGFile(row, parents);
  }

  async addOrUpdateFile(file: GFile): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    // Insert or update file
    const result = await this.dbRun(
      `
      INSERT OR REPLACE INTO files (
        id, name, revision, trashed, is_directory, size, 
        md5_checksum, last_modified, mime_type, "exists"
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        file.id,
        file.name,
        file.revision || null,
        file.trashed ? 1 : 0,
        file.isDirectory ? 1 : 0,
        file.size,
        file.md5Checksum || null,
        file.lastModified,
        file.mimeType || null,
        file.exists ? 1 : 0,
      ]
    );

    // Delete existing parents
    await this.dbRun('DELETE FROM parents WHERE file_id = ?', [file.id]);

    // Insert new parents
    for (const parentId of file.parents) {
      await this.dbRun('INSERT INTO parents (file_id, parent_id) VALUES (?, ?)', [file.id, parentId]);
    }

    return result.changes || 1;
  }

  async deleteFile(id: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.dbRun('DELETE FROM files WHERE id = ?', [id]);
    await this.dbRun('DELETE FROM parents WHERE file_id = ?', [id]);

    return result.changes || 0;
  }

  async getRevision(): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.dbGet('SELECT value FROM metadata WHERE key = ?', ['revision']);
    return row ? row.value : null;
  }

  async updateRevision(revision: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.dbRun('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)', ['revision', revision]);
  }

  async getAllFoldersWithoutRevision(): Promise<string[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.dbAll(`
      SELECT id FROM files 
      WHERE is_directory = 1 AND (revision IS NULL OR revision = '')
    `);

    return rows.map((row) => row.id);
  }

  async updateChildren(_file: GFile, newChildren: GFile[]): Promise<void> {
    // Add or update each child
    for (const child of newChildren) {
      await this.addOrUpdateFile(child);
    }
  }

  async getParents(id: string): Promise<Set<string>> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.dbAll('SELECT parent_id FROM parents WHERE file_id = ?', [id]);
    return new Set(rows.map((row) => row.parent_id));
  }

  private rowToGFile(row: any, parents: any[]): GFile {
    const file = new GFile(row.name);
    file.id = row.id;
    file.revision = row.revision;
    file.trashed = row.trashed === 1;
    file.isDirectory = row.is_directory === 1;
    file.size = row.size;
    file.md5Checksum = row.md5_checksum;
    file.lastModified = row.last_modified;
    file.mimeType = row.mime_type;
    file.exists = row.exists === 1;
    file.parents = new Set(parents.map((p) => p.parent_id));
    return file;
  }

  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db!.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }
}
