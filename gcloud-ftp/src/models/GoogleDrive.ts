import { drive_v3 } from 'googleapis';
import { GFile, GChange, MimeType } from './GFile';
import { Readable } from 'stream';

/**
 * Wrapper around Google Drive API for file operations
 */
export class GoogleDrive {
  private drive: drive_v3.Drive;

  constructor(drive: drive_v3.Drive) {
    this.drive = drive;
  }

  /**
   * Get the root folder
   */
  async getRoot(): Promise<GFile> {
    const response = await this.drive.files.get({
      fileId: 'root',
      fields: 'id, name, mimeType, modifiedTime, size, trashed',
    });

    return this.apiFileToGFile(response.data);
  }

  /**
   * Get a file by ID
   */
  async getFile(fileId: string): Promise<GFile> {
    const response = await this.drive.files.get({
      fileId,
      fields: 'id, name, mimeType, modifiedTime, size, trashed, parents, md5Checksum',
    });

    return this.apiFileToGFile(response.data);
  }

  /**
   * List files in a folder
   */
  async listFiles(folderId: string): Promise<GFile[]> {
    const response = await this.drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, modifiedTime, size, trashed, parents, md5Checksum)',
      pageSize: 1000,
    });

    return (response.data.files || []).map((file) => this.apiFileToGFile(file));
  }

  /**
   * Get changes since a specific page token
   */
  async getChanges(pageToken: string): Promise<{ changes: GChange[]; newStartPageToken: string }> {
    const response = await this.drive.changes.list({
      pageToken,
      fields:
        'changes(fileId, removed, file(id, name, mimeType, modifiedTime, size, trashed, parents, md5Checksum)), newStartPageToken',
    });

    const changes = (response.data.changes || []).map((change) => {
      const gChange = new GChange(
        change.fileId!,
        change.removed || false,
        change.file ? this.apiFileToGFile(change.file) : undefined
      );
      return gChange;
    });

    return {
      changes,
      newStartPageToken: response.data.newStartPageToken!,
    };
  }

  /**
   * Get the start page token for changes
   */
  async getStartPageToken(): Promise<string> {
    const response = await this.drive.changes.getStartPageToken();
    return response.data.startPageToken!;
  }

  /**
   * Create a folder
   */
  async createFolder(name: string, parentId: string): Promise<GFile> {
    const response = await this.drive.files.create({
      requestBody: {
        name,
        mimeType: MimeType.GOOGLE_FOLDER,
        parents: [parentId],
      },
      fields: 'id, name, mimeType, modifiedTime, size, trashed, parents',
    });

    return this.apiFileToGFile(response.data);
  }

  /**
   * Upload a file
   */
  async uploadFile(
    name: string,
    parentId: string,
    stream: Readable,
    mimeType?: string
  ): Promise<GFile> {
    const response = await this.drive.files.create({
      requestBody: {
        name,
        parents: [parentId],
        mimeType,
      },
      media: {
        body: stream,
      },
      fields: 'id, name, mimeType, modifiedTime, size, trashed, parents, md5Checksum',
    });

    return this.apiFileToGFile(response.data);
  }

  /**
   * Update a file
   */
  async updateFile(fileId: string, stream: Readable): Promise<GFile> {
    const response = await this.drive.files.update({
      fileId,
      media: {
        body: stream,
      },
      fields: 'id, name, mimeType, modifiedTime, size, trashed, parents, md5Checksum',
    });

    return this.apiFileToGFile(response.data);
  }

  /**
   * Download a file
   */
  async downloadFile(fileId: string): Promise<Readable> {
    const response = await this.drive.files.get(
      {
        fileId,
        alt: 'media',
      },
      { responseType: 'stream' }
    );

    return response.data as unknown as Readable;
  }

  /**
   * Rename a file
   */
  async renameFile(fileId: string, newName: string): Promise<GFile> {
    const response = await this.drive.files.update({
      fileId,
      requestBody: {
        name: newName,
      },
      fields: 'id, name, mimeType, modifiedTime, size, trashed, parents, md5Checksum',
    });

    return this.apiFileToGFile(response.data);
  }

  /**
   * Move and/or rename a file
   */
  async moveFile(
    fileId: string,
    newName: string,
    newParentId: string,
    oldParentIds: string[]
  ): Promise<GFile> {
    const response = await this.drive.files.update({
      fileId,
      addParents: newParentId,
      removeParents: oldParentIds.join(','),
      requestBody: {
        name: newName,
      },
      fields: 'id, name, mimeType, modifiedTime, size, trashed, parents, md5Checksum',
    });

    return this.apiFileToGFile(response.data);
  }

  /**
   * Move a file to trash
   */
  async trashFile(fileId: string): Promise<void> {
    await this.drive.files.update({
      fileId,
      requestBody: {
        trashed: true,
      },
    });
  }

  /**
   * Delete a file permanently
   */
  async deleteFile(fileId: string): Promise<void> {
    await this.drive.files.delete({
      fileId,
    });
  }

  /**
   * Convert Google Drive API file to GFile
   */
  private apiFileToGFile(apiFile: drive_v3.Schema$File): GFile {
    const file = new GFile(apiFile.name || '');
    file.id = apiFile.id || '';
    file.mimeType = apiFile.mimeType || undefined;
    file.isDirectory = apiFile.mimeType === MimeType.GOOGLE_FOLDER;
    file.size = apiFile.size ? parseInt(apiFile.size, 10) : 0;
    file.lastModified = apiFile.modifiedTime
      ? new Date(apiFile.modifiedTime).getTime()
      : Date.now();
    file.trashed = apiFile.trashed || false;
    file.md5Checksum = apiFile.md5Checksum || undefined;
    file.parents = new Set(apiFile.parents || []);
    file.exists = true;
    return file;
  }
}
