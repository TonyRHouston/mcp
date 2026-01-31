import ftpd = require('ftpd');
import { Configuration } from '../utils/config';
import { Cache } from '../models/Cache';
import { GoogleDrive } from '../models/GoogleDrive';
import { FtpGdriveSynchService } from '../services/FtpGdriveSynchService';
import { logger } from '../utils/logger';
import { GDriveFileSystem } from './GDriveFileSystem';

/**
 * FTP Server implementation for Google Drive
 */
export class FtpServer {
  private config: Configuration;
  private cache: Cache;
  private googleDrive: GoogleDrive;
  private syncService: FtpGdriveSynchService;
  // Type from custom declaration file (ftpd.d.ts)
  private server: any | null = null;

  constructor(
    config: Configuration,
    cache: Cache,
    googleDrive: GoogleDrive,
    syncService: FtpGdriveSynchService
  ) {
    this.config = config;
    this.cache = cache;
    this.googleDrive = googleDrive;
    this.syncService = syncService;
  }

  /**
   * Start the FTP server
   */
  async start(): Promise<void> {
    const port = this.config.getNumber('port', 1821);
    const host = this.config.get('server', '0.0.0.0');
    const url = `ftp://${host}:${port}`;

    const pasvStart = this.config.getNumber('ftp.pasv.port.start', -1);
    const pasvEnd = this.config.getNumber('ftp.pasv.port.end', -1);
    const serverOptions: any = {
      getInitialCwd: () => '/',
      getRoot: () => '/',
    };
    if (pasvStart > 0 && pasvEnd > 0) {
      serverOptions.pasvPortRangeStart = pasvStart;
      serverOptions.pasvPortRangeEnd = pasvEnd;
    }

    this.server = new ftpd.FtpServer(host, serverOptions);

    this.server.on('error', (error: unknown) => {
      logger.error('FTP Server error:', error);
    });

    this.server.on('client:connected', (connection: any) => {
      logger.info(`Client connected: ${connection.socket.remoteAddress}`);

      connection.on('command:pass', (pass: string, success: (username: string, fs?: any) => void, failure: (err: Error) => void) => {
        const username = connection.username || '';
        logger.info(`Login attempt: ${username}`);

        // Check anonymous access
        if (this.config.getBoolean('ftp.anonymous.enabled', false) && username === 'anonymous') {
          logger.info('Anonymous user logged in');
          const fs = new GDriveFileSystem({
            cache: this.cache,
            googleDrive: this.googleDrive,
            syncService: this.syncService,
            homeDir: this.config.get('ftp.anonymous.home', ''),
            rights: this.parseRights(this.config.get('ftp.anonymous.rights', 'pwd|cd|dir')),
          });
          success(username, fs);
          return;
        }

        // Check configured users
        const users = this.getConfiguredUsers();
        const user = users.find((u) => u.username === username && u.password === pass);

        if (user) {
          logger.info(`User ${username} logged in successfully`);
          const fs = new GDriveFileSystem({
            cache: this.cache,
            googleDrive: this.googleDrive,
            syncService: this.syncService,
            homeDir: user.home,
            rights: user.rights,
          });
          success(username, fs);
        } else {
          logger.warn(`Failed login attempt for user: ${username}`);
          failure(new Error('Invalid username or password'));
        }
      });

      connection.on('close', () => {
        logger.info('Client disconnected');
      });
    });

    // Start listening
    this.server.listen(port);
    logger.info(`FTP Server listening on ${url}`);
  }

  /**
   * Stop the FTP server
   */
  async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
      logger.info('FTP Server stopped');
    }
  }

  /**
   * Get configured users from configuration
   */
  private getConfiguredUsers(): Array<{
    username: string;
    password: string;
    home: string;
    rights: Set<string>;
  }> {
    const users: Array<{
      username: string;
      password: string;
      home: string;
      rights: Set<string>;
    }> = [];

    // Primary user
    const username = this.config.get('ftp.user', 'user');
    if (username) {
      users.push({
        username,
        password: this.config.get('ftp.pass', 'user'),
        home: this.config.get('ftp.home', ''),
        rights: this.parseRights(
          this.config.get('ftp.rights', 'pwd|cd|dir|put|get|rename|delete|mkdir|rmdir|append')
        ),
      });
    }

    // Additional users (user2, user3, etc.)
    for (let i = 2; i <= 10; i++) {
      const user = this.config.get(`ftp.user${i}`, '');
      if (user) {
        users.push({
          username: user,
          password: this.config.get(`ftp.pass${i}`, ''),
          home: this.config.get(`ftp.home${i}`, ''),
          rights: this.parseRights(
            this.config.get(`ftp.rights${i}`, 'pwd|cd|dir|put|get|rename|delete|mkdir|rmdir|append')
          ),
        });
      }
    }

    return users;
  }

  /**
   * Parse rights string into a set
   */
  private parseRights(rightsStr: string): Set<string> {
    return new Set(rightsStr.split('|').map((r) => r.trim()));
  }
}
