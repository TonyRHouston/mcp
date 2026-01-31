import { Cache } from '../models/Cache';
import { GoogleDrive } from '../models/GoogleDrive';
import { logger } from '../utils/logger';

/**
 * Service for synchronizing Google Drive changes with the local cache
 */
export class FtpGdriveSynchService {
  private cache: Cache;
  private googleDrive: GoogleDrive;
  private intervalId: NodeJS.Timeout | null = null;
  private running = false;
  private readonly SYNC_INTERVAL_MS = 10000; // 10 seconds

  constructor(cache: Cache, googleDrive: GoogleDrive) {
    this.cache = cache;
    this.googleDrive = googleDrive;
  }

  /**
   * Start the synchronization service
   */
  async start(): Promise<void> {
    if (this.running) {
      logger.warn('Sync service already running');
      return;
    }

    this.running = true;
    logger.info('Starting Google Drive sync service...');

    // Initial sync
    await this.performSync();

    // Schedule periodic syncs
    this.intervalId = setInterval(() => {
      this.performSync().catch((err) => {
        logger.error('Error during sync:', err);
      });
    }, this.SYNC_INTERVAL_MS);

    logger.info('Sync service started successfully');
  }

  /**
   * Stop the synchronization service
   */
  stop(): void {
    if (!this.running) {
      return;
    }

    logger.info('Stopping sync service...');
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.running = false;
    logger.info('Sync service stopped');
  }

  /**
   * Force a synchronization now
   */
  async forceSync(): Promise<void> {
    await this.performSync();
  }

  /**
   * Perform a synchronization
   */
  private async performSync(): Promise<void> {
    try {
      let pageToken = await this.cache.getRevision();

      if (!pageToken) {
        // First sync - get start page token and sync root
        logger.info('First sync - initializing...');
        pageToken = await this.googleDrive.getStartPageToken();
        await this.cache.updateRevision(pageToken);

        // Sync root folder
        const root = await this.googleDrive.getRoot();
        await this.cache.addOrUpdateFile(root);

        logger.info('Initial sync complete');
        return;
      }

      // Get changes since last sync
      const { changes, newStartPageToken } = await this.googleDrive.getChanges(pageToken);

      if (changes.length === 0) {
        logger.debug('No changes detected');
        return;
      }

      logger.info(`Processing ${changes.length} changes...`);

      // Process changes
      for (const change of changes) {
        if (change.removed) {
          // File was deleted
          await this.cache.deleteFile(change.fileId);
          logger.debug(`Deleted file ${change.fileId} from cache`);
        } else if (change.file) {
          // File was added or updated
          await this.cache.addOrUpdateFile(change.file);
          logger.debug(`Updated file ${change.file.name} (${change.fileId}) in cache`);
        }
      }

      // Update revision token
      await this.cache.updateRevision(newStartPageToken);
      logger.info(`Sync complete. Processed ${changes.length} changes.`);
    } catch (error) {
      logger.error('Error during sync:', error);
      throw error;
    }
  }

  /**
   * Check if the service is running
   */
  isRunning(): boolean {
    return this.running;
  }
}
