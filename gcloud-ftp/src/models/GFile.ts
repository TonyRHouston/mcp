export enum MimeType {
  GOOGLE_AUDIO = 'application/vnd.google-apps.audio',
  GOOGLE_DOC = 'application/vnd.google-apps.document',
  GOOGLE_DRAW = 'application/vnd.google-apps.drawing',
  GOOGLE_FILE = 'application/vnd.google-apps.file',
  GOOGLE_FOLDER = 'application/vnd.google-apps.folder',
  GOOGLE_FORM = 'application/vnd.google-apps.form',
  GOOGLE_FUSION = 'application/vnd.google-apps.fusiontable',
  GOOGLE_PHOTO = 'application/vnd.google-apps.photo',
  GOOGLE_SLIDE = 'application/vnd.google-apps.presentation',
  GOOGLE_SCRIPT = 'application/vnd.google-apps.script',
  GOOGLE_SITE = 'application/vnd.google-apps.sites',
  GOOGLE_SHEET = 'application/vnd.google-apps.spreadsheet',
  GOOGLE_UNKNOWN = 'application/vnd.google-apps.unknown',
  GOOGLE_VIDEO = 'application/vnd.google-apps.video',
  MS_EXCEL = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  MS_WORD = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

/**
 * Represents a file or directory in Google Drive
 */
export class GFile {
  /** Id of the remote Google Drive file */
  id: string;
  /** Version of the remote Google Drive file */
  revision?: string;
  /** Whether the file is in trash */
  trashed: boolean;
  /** File name */
  name: string;
  /** Whether this is a directory */
  isDirectory: boolean;
  /** Size in bytes reported by Google */
  size: number;
  /** MD5 Checksum or signature of the file */
  md5Checksum?: string;
  /** Last file modification date (Unix timestamp) */
  lastModified: number;
  /** MIME type of the file */
  mimeType?: string;
  /** Set of parent folder IDs this file is in */
  parents: Set<string>;
  /** Whether the file exists */
  exists: boolean;

  constructor(name: string, parents?: Set<string>) {
    this.name = name;
    this.parents = parents || new Set<string>();
    this.trashed = false;
    this.isDirectory = false;
    this.size = 0;
    this.lastModified = Date.now();
    this.exists = true;
    this.id = '';
  }

  isRemovable(): boolean {
    return this.id !== 'root';
  }

  getOwnerName(): string {
    return 'unknown';
  }

  toString(): string {
    return `(${this.id})`;
  }
}

/**
 * Represents a change in Google Drive
 */
export class GChange {
  fileId: string;
  removed: boolean;
  file?: GFile;

  constructor(fileId: string, removed: boolean, file?: GFile) {
    this.fileId = fileId;
    this.removed = removed;
    this.file = file;
  }
}
