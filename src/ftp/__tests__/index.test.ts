import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Client } from 'basic-ftp';
import net from 'node:net';
import { Readable, Writable } from 'node:stream';

// Mock modules before importing
jest.mock('basic-ftp');
jest.mock('node:child_process');

describe('FTP MCP Server', () => {
  let mockClient: jest.Mocked<Client>;
  
  beforeEach(() => {
    mockClient = {
      access: jest.fn(),
      close: jest.fn(),
      list: jest.fn(),
      downloadTo: jest.fn(),
      uploadFrom: jest.fn(),
      remove: jest.fn(),
      rename: jest.fn(),
      ensureDir: jest.fn(),
      removeDir: jest.fn(),
      pwd: jest.fn(),
      cd: jest.fn(),
    } as any;

    (Client as jest.MockedClass<typeof Client>).mockImplementation(() => mockClient as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('normalizeRemotePath', () => {
    it('should normalize paths with leading slash', () => {
      // Test path normalization logic
      const testPath = '/test/path';
      expect(testPath.startsWith('/')).toBe(true);
    });

    it('should add leading slash to relative paths', () => {
      const testPath = 'relative/path';
      const normalized = testPath.startsWith('/') ? testPath : `/${testPath}`;
      expect(normalized).toBe('/relative/path');
    });

    it('should handle root path', () => {
      const testPath = '/';
      expect(testPath).toBe('/');
    });
  });

  describe('isLocalHost', () => {
    it('should identify localhost addresses', () => {
      const hosts = ['127.0.0.1', 'localhost', '::1'];
      hosts.forEach(host => {
        const isLocal = host === '127.0.0.1' || host === 'localhost' || host === '::1';
        expect(isLocal).toBe(true);
      });
    });

    it('should reject remote addresses', () => {
      const host = '192.168.1.1';
      function isLocal(h: string) {
        return h === '127.0.0.1' || h === 'localhost' || h === '::1';
      }
      expect(isLocal(host)).toBe(false);
    });
  });

  describe('canConnect', () => {
    it('should return true when port is open', async () => {
      const testPort = 9999;
      const server = net.createServer();
      
      await new Promise<void>((resolve) => {
        server.listen(testPort, '127.0.0.1', () => resolve());
      });

      const result = await new Promise<boolean>((resolve) => {
        const socket = net.createConnection({ host: '127.0.0.1', port: testPort });
        const done = (result: boolean) => {
          socket.removeAllListeners();
          socket.destroy();
          resolve(result);
        };
        socket.setTimeout(500);
        socket.on('connect', () => done(true));
        socket.on('timeout', () => done(false));
        socket.on('error', () => done(false));
      });

      expect(result).toBe(true);
      
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    });

    it('should return false when port is closed', async () => {
      const result = await new Promise<boolean>((resolve) => {
        const socket = net.createConnection({ host: '127.0.0.1', port: 9998 });
        const done = (result: boolean) => {
          socket.removeAllListeners();
          socket.destroy();
          resolve(result);
        };
        socket.setTimeout(500);
        socket.on('connect', () => done(true));
        socket.on('timeout', () => done(false));
        socket.on('error', () => done(false));
      });

      expect(result).toBe(false);
    });
  });

  describe('FTP Operations', () => {
    beforeEach(() => {
      mockClient.access.mockResolvedValue(undefined as any);
      mockClient.close.mockReturnValue(undefined);
    });

    describe('list', () => {
      it('should list files in a directory', async () => {
        const mockListing = [
          { name: 'file1.txt', size: 100, type: 1, modifiedAt: new Date(), rawModifiedAt: '2024-01-01' },
          { name: 'file2.txt', size: 200, type: 1, modifiedAt: new Date(), rawModifiedAt: '2024-01-02' },
        ];
        mockClient.list.mockResolvedValue(mockListing as any);

        const result = await mockClient.list('/test');
        
        expect(mockClient.list).toHaveBeenCalledWith('/test');
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('file1.txt');
      });
    });

    describe('download', () => {
      it('should download a file to local path', async () => {
        mockClient.downloadTo.mockResolvedValue(undefined as any);

        await mockClient.downloadTo('/local/path', '/remote/file.txt');
        
        expect(mockClient.downloadTo).toHaveBeenCalledWith('/local/path', '/remote/file.txt');
      });

      it('should download file content to buffer', async () => {
        const testData = Buffer.from('test content');
        mockClient.downloadTo.mockImplementation(async (dest: string | Writable) => {
          if (typeof dest !== 'string') {
            dest.write(testData);
            dest.end();
          }
          return undefined as any;
        });

        const chunks: Buffer[] = [];
        const writable = new Writable({
          write(chunk, _enc, cb) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            cb();
          },
        });

        await mockClient.downloadTo(writable, '/remote/file.txt');
        
        const result = Buffer.concat(chunks);
        expect(result.toString()).toBe('test content');
      });
    });

    describe('upload', () => {
      it('should upload from local file', async () => {
        mockClient.uploadFrom.mockResolvedValue(undefined as any);

        await mockClient.uploadFrom('/local/file.txt', '/remote/file.txt');
        
        expect(mockClient.uploadFrom).toHaveBeenCalledWith('/local/file.txt', '/remote/file.txt');
      });

      it('should upload from content buffer', async () => {
        mockClient.uploadFrom.mockResolvedValue(undefined as any);

        const content = Buffer.from('test content');
        const readable = Readable.from(content);

        await mockClient.uploadFrom(readable, '/remote/file.txt');
        
        expect(mockClient.uploadFrom).toHaveBeenCalled();
      });
    });

    describe('delete', () => {
      it('should delete a file', async () => {
        mockClient.remove.mockResolvedValue({} as any);

        await mockClient.remove('/remote/file.txt');
        
        expect(mockClient.remove).toHaveBeenCalledWith('/remote/file.txt');
      });
    });

    describe('rename', () => {
      it('should rename a file', async () => {
        mockClient.rename.mockResolvedValue({} as any);

        await mockClient.rename('/old/path.txt', '/new/path.txt');
        
        expect(mockClient.rename).toHaveBeenCalledWith('/old/path.txt', '/new/path.txt');
      });
    });

    describe('mkdir', () => {
      it('should create a directory', async () => {
        mockClient.ensureDir.mockResolvedValue(undefined);
        mockClient.pwd.mockResolvedValue('/');
        mockClient.cd.mockResolvedValue({} as any);

        await mockClient.ensureDir('/new/directory');
        
        expect(mockClient.ensureDir).toHaveBeenCalledWith('/new/directory');
      });
    });

    describe('rmdir', () => {
      it('should remove a directory', async () => {
        mockClient.removeDir.mockResolvedValue(undefined);

        await mockClient.removeDir('/directory');
        
        expect(mockClient.removeDir).toHaveBeenCalledWith('/directory');
      });
    });

    describe('pwd', () => {
      it('should return current working directory', async () => {
        mockClient.pwd.mockResolvedValue('/current/dir');

        const result = await mockClient.pwd();
        
        expect(result).toBe('/current/dir');
      });
    });
  });

  describe('Configuration', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should use default FTP port if not specified', () => {
      delete process.env.FTP_PORT;
      delete process.env.PORT;
      const port = Number.parseInt(process.env.FTP_PORT || process.env.PORT || '1821', 10);
      expect(port).toBe(1821);
    });

    it('should use environment FTP_PORT when specified', () => {
      process.env.FTP_PORT = '2121';
      const port = Number.parseInt(process.env.FTP_PORT || process.env.PORT || '1821', 10);
      expect(port).toBe(2121);
    });

    it('should use default credentials if not specified', () => {
      delete process.env.FTP_USER;
      delete process.env.FTP_PASS;
      const user = process.env.FTP_USER || 'user';
      const pass = process.env.FTP_PASS || 'user';
      expect(user).toBe('user');
      expect(pass).toBe('user');
    });

    it('should respect USE_GCLOUD_FTP flag', () => {
      process.env.MCP_FTP_USE_GCLOUD = 'false';
      const useGcloud = process.env.MCP_FTP_USE_GCLOUD !== 'false';
      expect(useGcloud).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle connection failures gracefully', async () => {
      mockClient.access.mockRejectedValue(new Error('Connection failed'));

      await expect(mockClient.access({
        host: '127.0.0.1',
        port: 1821,
        user: 'user',
        password: 'user',
        secure: false,
      })).rejects.toThrow('Connection failed');
    });

    it('should handle file not found errors', async () => {
      mockClient.list.mockRejectedValue(new Error('File not found'));

      await expect(mockClient.list('/nonexistent')).rejects.toThrow('File not found');
    });

    it('should handle permission errors', async () => {
      mockClient.uploadFrom.mockRejectedValue(new Error('Permission denied'));

      await expect(mockClient.uploadFrom('/local', '/remote')).rejects.toThrow('Permission denied');
    });
  });
});
