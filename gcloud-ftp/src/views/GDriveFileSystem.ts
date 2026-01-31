import { Cache } from '../models/Cache';
import { GoogleDrive } from '../models/GoogleDrive';
import { FtpGdriveSynchService } from '../services/FtpGdriveSynchService';
import { GFile } from '../models/GFile';
import { logger } from '../utils/logger';
import * as path from 'path';
import { PassThrough, Readable } from 'stream';

interface GDriveFileSystemOptions {
  cache: Cache;
  googleDrive: GoogleDrive;
  syncService: FtpGdriveSynchService;
  homeDir: string;
  rights: Set<string>;
}

/**
 * Custom file system implementation for Google Drive
 */
export class GDriveFileSystem {
  private cache: Cache;
  private googleDrive: GoogleDrive;
  private syncService: FtpGdriveSynchService;
  private rights: Set<string>;
  private rootPath: string;
  private fdCounter = 1000;
  private fdMap: Map<number, string> = new Map();

  constructor(options: GDriveFileSystemOptions) {
    this.cache = options.cache;
    this.googleDrive = options.googleDrive;
    this.syncService = options.syncService;
    this.rights = options.rights;
    this.rootPath = this.normalizeRoot(options.homeDir);
  }

  readdir(dirPath: string, callback: (err: Error | null, files?: string[]) => void): void {
    logger.debug(`READDIR: ${dirPath}`);

    if (!this.hasRight('dir')) {
      callback(new Error('Permission denied'));
      return;
    }

    this.getGFile(dirPath)
      .then(async (gFile) => {
        if (!gFile || !gFile.isDirectory) {
          throw new Error('Directory not found');
        }
        const files = await this.cache.getFiles(gFile.id);
        callback(null, files.map((file) => file.name));
      })
      .catch((error) => {
        logger.error(`Error reading directory ${dirPath}:`, error);
        callback(error as Error);
      });
  }

  stat(filePath: string, callback: (err: Error | null, stats?: any) => void): void {
    logger.debug(`STAT: ${filePath}`);

    if (!this.hasAnyRight(['pwd', 'dir', 'cd'])) {
      callback(new Error('Permission denied'));
      return;
    }

    this.getGFile(filePath)
      .then((gFile) => {
        if (!gFile) {
          throw new Error('File not found');
        }
        const mode = gFile.isDirectory ? 0o40755 : 0o100644;
        callback(null, {
          mode,
          size: gFile.size,
          mtime: new Date(gFile.lastModified),
          isDirectory: () => gFile.isDirectory,
          isFile: () => !gFile.isDirectory,
        });
      })
      .catch((error) => {
        logger.error(`Error stating ${filePath}:`, error);
        callback(error as Error);
      });
  }

  unlink(filePath: string, callback: (err?: Error | null) => void): void {
    logger.debug(`UNLINK: ${filePath}`);

    if (!this.hasRight('delete')) {
      callback(new Error('Permission denied'));
      return;
    }

    this.getGFile(filePath)
      .then(async (gFile) => {
        if (!gFile) {
          throw new Error('File not found');
        }
        await this.googleDrive.trashFile(gFile.id);
        await this.cache.deleteFile(gFile.id);
        await this.syncService.forceSync();
        callback(null);
      })
      .catch((error) => {
        logger.error(`Error deleting ${filePath}:`, error);
        callback(error as Error);
      });
  }

  mkdir(dirPath: string, callback: (err?: Error | null) => void): void {
    logger.debug(`MKDIR: ${dirPath}`);

    if (!this.hasRight('mkdir')) {
      callback(new Error('Permission denied'));
      return;
    }

    this.getParentAndName(dirPath)
      .then(async ({ parent, baseName }) => {
        const newFolder = await this.googleDrive.createFolder(baseName, parent.id);
        await this.cache.addOrUpdateFile(newFolder);
        await this.syncService.forceSync();
        callback(null);
      })
      .catch((error) => {
        logger.error(`Error creating directory ${dirPath}:`, error);
        callback(error as Error);
      });
  }

  rmdir(dirPath: string, callback: (err?: Error | null) => void): void {
    logger.debug(`RMDIR: ${dirPath}`);

    if (!this.hasRight('rmdir')) {
      callback(new Error('Permission denied'));
      return;
    }

    this.getGFile(dirPath)
      .then(async (gFile) => {
        if (!gFile || !gFile.isDirectory) {
          throw new Error('Directory not found');
        }
        await this.googleDrive.trashFile(gFile.id);
        await this.cache.deleteFile(gFile.id);
        await this.syncService.forceSync();
        callback(null);
      })
      .catch((error) => {
        logger.error(`Error removing directory ${dirPath}:`, error);
        callback(error as Error);
      });
  }

  rename(oldPath: string, newPath: string, callback: (err?: Error | null) => void): void {
    logger.debug(`RENAME: ${oldPath} -> ${newPath}`);

    if (!this.hasRight('rename')) {
      callback(new Error('Permission denied'));
      return;
    }

    Promise.all([this.getGFile(oldPath), this.getParentAndName(newPath)])
      .then(async ([gFile, target]) => {
        if (!gFile) {
          throw new Error('File not found');
        }

        const currentParents = Array.from(gFile.parents);
        const updated = await this.googleDrive.moveFile(
          gFile.id,
          target.baseName,
          target.parent.id,
          currentParents
        );
        await this.cache.addOrUpdateFile(updated);
        await this.syncService.forceSync();
        callback(null);
      })
      .catch((error) => {
        logger.error(`Error renaming ${oldPath} -> ${newPath}:`, error);
        callback(error as Error);
      });
  }

  open(filePath: string, _flags: string, _mode: number, callback: (err: Error | null, fd?: number) => void): void {
    try {
      const resolved = this.resolvePath(filePath);
      if (!resolved) {
        callback(new Error('Invalid path'));
        return;
      }

      const fd = this.fdCounter++;
      this.fdMap.set(fd, resolved);
      callback(null, fd);
    } catch (error) {
      callback(error as Error);
    }
  }

  close(fd: number, callback: (err?: Error | null) => void): void {
    this.fdMap.delete(fd);
    callback(null);
  }

  createReadStream(filePath: string): Readable {
    logger.debug(`READ: ${filePath}`);

    if (!this.hasRight('get')) {
      throw new Error('Permission denied');
    }

    const streamPromise = this.getGFile(filePath).then((gFile) => {
      if (!gFile || gFile.isDirectory) {
        throw new Error('Not a file');
      }
      return this.googleDrive.downloadFile(gFile.id);
    });

    const passthrough = new PassThrough();
    streamPromise
      .then((stream) => {
        stream.pipe(passthrough);
      })
      .catch((error) => {
        passthrough.emit('error', error);
      });

    return passthrough;
  }

  createWriteStream(filePath: string, options?: { flags?: string }): PassThrough {
    logger.debug(`WRITE: ${filePath}`);

    if (!this.hasRight('put') && !this.hasRight('append')) {
      throw new Error('Permission denied');
    }

    const writable = new PassThrough();
    const flags = options?.flags || 'w';
    if (flags.includes('a')) {
      logger.warn('Append is not supported; overwriting file instead.');
    }

    this.getParentAndName(filePath)
      .then(async ({ parent, baseName }) => {
        const existingFile = await this.cache.getFileByName(parent.id, baseName);
        const uploadPromise = existingFile
          ? this.googleDrive.updateFile(existingFile.id, writable)
          : this.googleDrive.uploadFile(baseName, parent.id, writable);

        const updated = await uploadPromise;
        await this.cache.addOrUpdateFile(updated);
        await this.syncService.forceSync();
      })
      .catch((error) => {
        writable.emit('error', error);
      });

    return writable;
  }

  // Helper methods

  private normalizeRoot(homeDir: string): string {
    let root = homeDir.trim();
    if (!root) return '/';
    if (!root.startsWith('/')) {
      root = `/${root}`;
    }
    root = path.posix.normalize(root);
    if (root.length > 1 && root.endsWith('/')) {
      root = root.slice(0, -1);
    }
    return root;
  }

  private resolvePath(filePath: string): string {
    const normalized = filePath && filePath.startsWith('/')
      ? path.posix.normalize(filePath)
      : path.posix.normalize(path.posix.join('/', filePath || ''));
    const resolved = this.rootPath === '/'
      ? normalized
      : path.posix.normalize(path.posix.join(this.rootPath, normalized));

    if (this.rootPath !== '/' && resolved !== this.rootPath && !resolved.startsWith(`${this.rootPath}/`)) {
      throw new Error('Permission denied');
    }

    return resolved;
  }

  private async getGFile(filePath: string): Promise<GFile | null> {
    const normalizedPath = this.resolvePath(filePath);
    return this.getGFileByDrivePath(normalizedPath);
  }

  private async getParentAndName(filePath: string): Promise<{ parent: GFile; baseName: string }> {
    const resolved = this.resolvePath(filePath);
    const parentPath = path.posix.dirname(resolved);
    const baseName = path.posix.basename(resolved);

    const parent = await this.getGFileByDrivePath(parentPath);
    if (!parent || !parent.isDirectory) {
      throw new Error('Parent directory not found');
    }
    return { parent, baseName };
  }

  private async getGFileByDrivePath(drivePath: string): Promise<GFile | null> {
    if (drivePath === '/' || drivePath === '.') {
      return await this.cache.getFile('root');
    }

    const parts = drivePath.split('/').filter((p) => p !== '');
    let currentId = 'root';
    let currentFile: GFile | null = null;

    for (const part of parts) {
      currentFile = await this.cache.getFileByName(currentId, part);
      if (!currentFile) {
        return null;
      }
      currentId = currentFile.id;
    }

    return currentFile;
  }

  private hasRight(right: string): boolean {
    return this.rights.has(right);
  }

  private hasAnyRight(rights: string[]): boolean {
    return rights.some((right) => this.rights.has(right));
  }
}
