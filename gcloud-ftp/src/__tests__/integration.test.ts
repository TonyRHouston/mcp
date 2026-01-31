import { GDriveFileSystem } from '../views/GDriveFileSystem';
import { Cache } from '../models/Cache';
import { GFile, MimeType } from '../models/GFile';
import { Readable } from 'stream';

class FakeSyncService {
  async forceSync(): Promise<void> {
    return;
  }
}

class FakeCache implements Cache {
  private files = new Map<string, GFile>();
  private children = new Map<string, Set<string>>();
  private revision: string | null = null;

  async getFile(id: string): Promise<GFile | null> {
    return this.files.get(id) || null;
  }

  async getFiles(folderId: string): Promise<GFile[]> {
    const ids = this.children.get(folderId);
    if (!ids) return [];
    return Array.from(ids).map((id) => this.files.get(id)!).filter(Boolean);
  }

  async getFileByName(parentId: string, filename: string): Promise<GFile | null> {
    const children = await this.getFiles(parentId);
    const matches = children.filter((child) => child.name === filename);
    if (matches.length > 1) {
      throw new Error(`Multiple files found with name ${filename} in folder ${parentId}`);
    }
    return matches[0] || null;
  }

  async addOrUpdateFile(file: GFile): Promise<number> {
    const existing = this.files.get(file.id);
    if (existing) {
      for (const parentId of existing.parents) {
        this.children.get(parentId)?.delete(existing.id);
      }
    }

    this.files.set(file.id, file);
    for (const parentId of file.parents) {
      if (!this.children.has(parentId)) {
        this.children.set(parentId, new Set());
      }
      this.children.get(parentId)!.add(file.id);
    }
    return 1;
  }

  async deleteFile(id: string): Promise<number> {
    const file = this.files.get(id);
    if (!file) return 0;
    for (const parentId of file.parents) {
      this.children.get(parentId)?.delete(id);
    }
    this.files.delete(id);
    return 1;
  }

  async getRevision(): Promise<string | null> {
    return this.revision;
  }

  async updateRevision(revision: string): Promise<void> {
    this.revision = revision;
  }

  async getAllFoldersWithoutRevision(): Promise<string[]> {
    return [];
  }

  async updateChildren(_file: GFile, newChildren: GFile[]): Promise<void> {
    for (const child of newChildren) {
      await this.addOrUpdateFile(child);
    }
  }

  async getParents(id: string): Promise<Set<string>> {
    return this.files.get(id)?.parents ?? new Set();
  }
}

class FakeGoogleDrive {
  private files = new Map<string, GFile>();
  private contents = new Map<string, Buffer>();
  private counter = 1;

  seedFile(file: GFile): void {
    this.files.set(file.id, file);
  }

  async createFolder(name: string, parentId: string): Promise<GFile> {
    const folder = new GFile(name);
    folder.id = `id-${this.counter++}`;
    folder.parents = new Set([parentId]);
    folder.isDirectory = true;
    folder.mimeType = MimeType.GOOGLE_FOLDER;
    this.files.set(folder.id, folder);
    return folder;
  }

  async uploadFile(name: string, parentId: string, stream: Readable): Promise<GFile> {
    const file = new GFile(name);
    file.id = `id-${this.counter++}`;
    file.parents = new Set([parentId]);
    const buffer = await this.readStream(stream);
    file.size = buffer.length;
    this.contents.set(file.id, buffer);
    this.files.set(file.id, file);
    return file;
  }

  async updateFile(fileId: string, stream: Readable): Promise<GFile> {
    const file = this.files.get(fileId);
    if (!file) {
      throw new Error('File not found');
    }
    const buffer = await this.readStream(stream);
    file.size = buffer.length;
    file.lastModified = Date.now();
    this.contents.set(fileId, buffer);
    return file;
  }

  async downloadFile(fileId: string): Promise<Readable> {
    const buffer = this.contents.get(fileId) || Buffer.from('');
    return Readable.from(buffer);
  }

  async trashFile(_fileId: string): Promise<void> {
    return;
  }

  async moveFile(fileId: string, newName: string, newParentId: string, _oldParents: string[]): Promise<GFile> {
    const file = this.files.get(fileId);
    if (!file) {
      throw new Error('File not found');
    }
    file.name = newName;
    file.parents = new Set([newParentId]);
    return file;
  }

  private readStream(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
}

const seedEnvironment = () => {
  const cache = new FakeCache();
  const drive = new FakeGoogleDrive();
  const root = new GFile('root');
  root.id = 'root';
  root.isDirectory = true;
  root.mimeType = MimeType.GOOGLE_FOLDER;
  root.parents = new Set();

  const home = new GFile('home');
  home.id = 'home-id';
  home.isDirectory = true;
  home.mimeType = MimeType.GOOGLE_FOLDER;
  home.parents = new Set(['root']);

  const sub = new GFile('sub');
  sub.id = 'sub-id';
  sub.isDirectory = true;
  sub.mimeType = MimeType.GOOGLE_FOLDER;
  sub.parents = new Set(['home-id']);

  cache.addOrUpdateFile(root);
  cache.addOrUpdateFile(home);
  cache.addOrUpdateFile(sub);
  drive.seedFile(root);
  drive.seedFile(home);
  drive.seedFile(sub);

  return { cache, drive };
};

const createFs = (rights: string[]) => {
  const { cache, drive } = seedEnvironment();
  const fs = new GDriveFileSystem({
    cache,
    googleDrive: drive as any,
    syncService: new FakeSyncService() as any,
    homeDir: '/home',
    rights: new Set(rights),
  });
  return { fs, cache };
};

const waitFor = async (fn: () => Promise<boolean>, timeoutMs = 2000): Promise<void> => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await fn()) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error('Timed out waiting for condition');
};

describe('gcloud-ftp integration scaffold', () => {
  it('writes and reads a file within the home directory', async () => {
    const { fs, cache } = createFs(['pwd', 'dir', 'cd', 'put', 'get', 'rename', 'delete', 'mkdir', 'rmdir', 'append']);
    const writeStream = fs.createWriteStream('hello.txt');
    writeStream.write(Buffer.from('hello'));
    writeStream.end();

    await waitFor(async () => {
      const file = await cache.getFileByName('home-id', 'hello.txt');
      return !!file;
    });

    const readStream = fs.createReadStream('hello.txt');
    const data = await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];
      readStream.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      readStream.on('error', reject);
      readStream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });

    expect(data).toBe('hello');
  });

  it('enforces home directory scoping', async () => {
    const { fs } = createFs(['dir']);
    await new Promise<void>((resolve) => {
      fs.readdir('/outside', (err) => {
        expect(err).toBeTruthy();
        resolve();
      });
    });
  });

  it('renames across folders', async () => {
    const { fs, cache } = createFs(['pwd', 'dir', 'cd', 'put', 'get', 'rename', 'delete', 'mkdir', 'rmdir', 'append']);
    const writeStream = fs.createWriteStream('file.txt');
    writeStream.write(Buffer.from('data'));
    writeStream.end();

    await waitFor(async () => {
      const file = await cache.getFileByName('home-id', 'file.txt');
      return !!file;
    });

    await new Promise<void>((resolve, reject) => {
      fs.rename('file.txt', 'sub/renamed.txt', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const moved = await cache.getFileByName('sub-id', 'renamed.txt');
    expect(moved).toBeTruthy();
  });

  it('denies writes without permission', () => {
    const { fs } = createFs(['dir', 'get']);
    expect(() => fs.createWriteStream('blocked.txt')).toThrow('Permission denied');
  });

  it('creates and removes directories', async () => {
    const { fs, cache } = createFs(['pwd', 'dir', 'cd', 'mkdir', 'rmdir']);

    await new Promise<void>((resolve, reject) => {
      fs.mkdir('new-dir', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await waitFor(async () => {
      const dir = await cache.getFileByName('home-id', 'new-dir');
      return !!dir;
    });

    await new Promise<void>((resolve, reject) => {
      fs.rmdir('new-dir', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const removed = await cache.getFileByName('home-id', 'new-dir');
    expect(removed).toBeFalsy();
  });
});
