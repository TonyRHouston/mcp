import { Configuration } from './utils/config';
import { logger } from './utils/logger';
import { SQLiteCache } from './models/SQLiteCache';
import { GoogleDriveFactory } from './models/GoogleDriveFactory';
import { GoogleDrive } from './models/GoogleDrive';
import { FtpGdriveSynchService } from './services/FtpGdriveSynchService';
import { FtpServer } from './views/FtpServer';
import * as net from 'net';

/**
 * Main application class for Google Drive FTP Adapter
 */
export class GoogleDriveFtpAdapter {
  private cache: SQLiteCache;
  private googleDrive: GoogleDrive;
  private syncService: FtpGdriveSynchService;
  private ftpServer: FtpServer;
  private googleDriveFactory: GoogleDriveFactory;
  private config: Configuration;

  constructor(config: Configuration) {
    // Initialize components
    logger.info('Initializing Google Drive FTP Adapter...');

    // Initialize cache
    this.cache = new SQLiteCache(config.getAll());

    // Store factory and config for later initialization in start()
    this.googleDriveFactory = new GoogleDriveFactory(config.getAll());
    
    // These will be initialized in start()
    this.googleDrive = null as any;
    this.syncService = null as any;
    this.ftpServer = null as any;
    this.config = config;
  }

  /**
   * Check if a port is available (async)
   */
  private async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          // For other errors, assume port is available
          resolve(true);
        }
      });
      
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      
      server.listen(port, '127.0.0.1');
    });
  }

  /**
   * Start the application
   */
  async start(): Promise<void> {
    try {
      logger.info('Starting application...');

      // Check if port is available
      const port = this.config.getNumber('port', 1821);
      const portAvailable = await this.isPortAvailable(port);
      if (!portAvailable) {
        throw new Error(`Port ${port} is already in use`);
      }

      // Initialize Google Drive first
      await this.googleDriveFactory.init();
      const drive = this.googleDriveFactory.getDrive();
      this.googleDrive = new GoogleDrive(drive);

      // Initialize sync service
      this.syncService = new FtpGdriveSynchService(this.cache, this.googleDrive);

      // Initialize FTP server
      this.ftpServer = new FtpServer(
        this.config,
        this.cache,
        this.googleDrive,
        this.syncService
      );

      // Start sync service
      await this.syncService.start();

      // Start FTP server
      await this.ftpServer.start();

      logger.info('Application started successfully!');
    } catch (error) {
      logger.error('Failed to start application:', error);
      throw error;
    }
  }

  /**
   * Stop the application
   */
  async stop(): Promise<void> {
    logger.info('Stopping application...');

    // Stop FTP server
    await this.ftpServer.stop();

    // Stop sync service
    this.syncService.stop();

    // Close cache
    await this.cache.close();

    logger.info('Application stopped.');
  }
}
