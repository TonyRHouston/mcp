// Storage abstraction layer for the memory server
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export interface Entity {
  name: string;
  entityType: string;
  observations: string[];
}

export interface Relation {
  from: string;
  to: string;
  relationType: string;
}

export interface KnowledgeGraph {
  entities: Entity[];
  relations: Relation[];
}

// Abstract storage backend interface
export interface StorageBackend {
  loadGraph(): Promise<KnowledgeGraph>;
  saveGraph(graph: KnowledgeGraph): Promise<void>;
}

// File system storage implementation (existing behavior)
export class FileSystemStorage implements StorageBackend {
  private filePath: string;

  constructor(filePath?: string) {
    const defaultMemoryPath = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      'memory.json'
    );

    // If filePath is just a filename, put it in the same directory as the script
    this.filePath = filePath
      ? path.isAbsolute(filePath)
        ? filePath
        : path.join(path.dirname(fileURLToPath(import.meta.url)), filePath)
      : defaultMemoryPath;
  }

  async loadGraph(): Promise<KnowledgeGraph> {
    try {
      const data = await fs.readFile(this.filePath, "utf-8");
      const lines = data.split("\n").filter(line => line.trim() !== "");
      return lines.reduce((graph: KnowledgeGraph, line) => {
        const item = JSON.parse(line);
        if (item.type === "entity") graph.entities.push(item as Entity);
        if (item.type === "relation") graph.relations.push(item as Relation);
        return graph;
      }, { entities: [], relations: [] });
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as any).code === "ENOENT") {
        return { entities: [], relations: [] };
      }
      throw error;
    }
  }

  async saveGraph(graph: KnowledgeGraph): Promise<void> {
    const lines = [
      ...graph.entities.map(e => JSON.stringify({ 
        type: "entity", 
        name: e.name, 
        entityType: e.entityType, 
        observations: e.observations 
      })),
      ...graph.relations.map(r => JSON.stringify({ 
        type: "relation", 
        from: r.from, 
        to: r.to, 
        relationType: r.relationType 
      })),
    ];
    await fs.writeFile(this.filePath, lines.join("\n"));
  }
}

// Google Drive storage implementation
export class GoogleDriveStorage implements StorageBackend {
  private fileName: string;
  private credentials: any;
  private driveService: any = null;

  constructor(fileName: string = 'mcp-memory.json', credentials?: string) {
    this.fileName = fileName;
    
    // Credentials can be passed directly or via environment variable
    if (credentials) {
      this.credentials = JSON.parse(credentials);
    } else if (process.env.GOOGLE_DRIVE_CREDENTIALS) {
      this.credentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS);
    } else {
      throw new Error(
        'Google Drive credentials not provided. Set GOOGLE_DRIVE_CREDENTIALS environment variable or pass credentials to constructor.'
      );
    }
  }

  // Initialize Google Drive service (lazy initialization)
  private async initDriveService(): Promise<void> {
    if (this.driveService) return;

    try {
      // Dynamic import of googleapis
      const { google } = await import('googleapis');
      
      const auth = new google.auth.GoogleAuth({
        credentials: this.credentials,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });

      this.driveService = google.drive({ version: 'v3', auth });
    } catch (error) {
      throw new Error(`Failed to initialize Google Drive service: ${error}`);
    }
  }

  // Find the memory file by name
  private async findFile(): Promise<string | null> {
    await this.initDriveService();

    try {
      const response = await this.driveService.files.list({
        q: `name='${this.fileName}' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive',
      });

      const files = response.data.files;
      if (files && files.length > 0) {
        return files[0].id;
      }
      return null;
    } catch (error) {
      throw new Error(`Failed to search for file: ${error}`);
    }
  }

  async loadGraph(): Promise<KnowledgeGraph> {
    await this.initDriveService();

    try {
      const fileId = await this.findFile();
      
      if (!fileId) {
        // File doesn't exist yet, return empty graph
        return { entities: [], relations: [] };
      }

      const response = await this.driveService.files.get({
        fileId: fileId,
        alt: 'media',
      });

      const data = response.data;
      const lines = data.split("\n").filter((line: string) => line.trim() !== "");
      return lines.reduce((graph: KnowledgeGraph, line: string) => {
        const item = JSON.parse(line);
        if (item.type === "entity") graph.entities.push(item as Entity);
        if (item.type === "relation") graph.relations.push(item as Relation);
        return graph;
      }, { entities: [], relations: [] });
    } catch (error) {
      // If file doesn't exist, return empty graph
      if ((error as any).code === 404) {
        return { entities: [], relations: [] };
      }
      throw new Error(`Failed to load graph from Google Drive: ${error}`);
    }
  }

  async saveGraph(graph: KnowledgeGraph): Promise<void> {
    await this.initDriveService();

    try {
      const lines = [
        ...graph.entities.map(e => JSON.stringify({ 
          type: "entity", 
          name: e.name, 
          entityType: e.entityType, 
          observations: e.observations 
        })),
        ...graph.relations.map(r => JSON.stringify({ 
          type: "relation", 
          from: r.from, 
          to: r.to, 
          relationType: r.relationType 
        })),
      ];
      const content = lines.join("\n");

      const fileId = await this.findFile();

      if (fileId) {
        // Update existing file
        await this.driveService.files.update({
          fileId: fileId,
          media: {
            mimeType: 'application/json',
            body: content,
          },
        });
      } else {
        // Create new file
        await this.driveService.files.create({
          requestBody: {
            name: this.fileName,
            mimeType: 'application/json',
          },
          media: {
            mimeType: 'application/json',
            body: content,
          },
        });
      }
    } catch (error) {
      throw new Error(`Failed to save graph to Google Drive: ${error}`);
    }
  }
}

// Factory function to create the appropriate storage backend
export function createStorageBackend(): StorageBackend {
  const storageType = process.env.STORAGE_TYPE || 'filesystem';
  
  switch (storageType.toLowerCase()) {
    case 'googledrive':
    case 'google-drive':
    case 'gdrive':
      const fileName = process.env.GOOGLE_DRIVE_FILENAME || 'mcp-memory.json';
      const credentials = process.env.GOOGLE_DRIVE_CREDENTIALS;
      return new GoogleDriveStorage(fileName, credentials);
    
    case 'filesystem':
    case 'file':
    default:
      const filePath = process.env.MEMORY_FILE_PATH;
      return new FileSystemStorage(filePath);
  }
}
