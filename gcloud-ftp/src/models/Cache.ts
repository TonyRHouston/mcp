import { GFile } from './GFile';

/**
 * Cache interface for storing and retrieving Google Drive file metadata
 */
export interface Cache {
  /**
   * Get a file by its ID
   */
  getFile(id: string): Promise<GFile | null>;

  /**
   * Get all files in a folder
   */
  getFiles(folderId: string): Promise<GFile[]>;

  /**
   * Get a file by its name in a specific parent folder
   * @throws Error if there is more than 1 file with the same name in the specified folder
   */
  getFileByName(parentId: string, filename: string): Promise<GFile | null>;

  /**
   * Add or update a file in the cache
   * @returns Number of rows affected
   */
  addOrUpdateFile(file: GFile): Promise<number>;

  /**
   * Delete a file from the cache
   * @returns Number of rows affected
   */
  deleteFile(id: string): Promise<number>;

  /**
   * Get the current revision token
   */
  getRevision(): Promise<string | null>;

  /**
   * Update the revision token
   */
  updateRevision(revision: string): Promise<void>;

  /**
   * Get all folders that don't have a revision
   */
  getAllFoldersWithoutRevision(): Promise<string[]>;

  /**
   * Update the children of a folder
   */
  updateChildren(file: GFile, newChildren: GFile[]): Promise<void>;

  /**
   * Get all parent IDs for a file
   */
  getParents(id: string): Promise<Set<string>>;
}
