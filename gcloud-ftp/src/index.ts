#!/usr/bin/env node

import { Configuration } from './utils/config';
import { logger } from './utils/logger';
import { GoogleDriveFtpAdapter } from './GoogleDriveFtpAdapter';

/**
 * Main entry point for the application
 */
async function main() {
  try {
    logger.info('Google Drive FTP Adapter');
    logger.info('========================');

    // Load configuration
    const config = new Configuration();
    logger.info(`Configuration loaded for account: ${config.get('account', 'default')}`);
    logger.info(`Port: ${config.get('port', '1821')}`);

    // Create and start the application
    const app = new GoogleDriveFtpAdapter(config);

    // Handle shutdown
    const shutdown = async () => {
      logger.info('Shutting down...');
      await app.stop();
      logger.info('Goodbye!');
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Start the application
    await app.start();
  } catch (error) {
    logger.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the application
main();
