import * as winston from 'winston';

/**
 * Logger configuration
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'google-drive-ftp-adapter' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...metadata }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(metadata).length > 0 && metadata.service !== 'google-drive-ftp-adapter') {
            msg += ` ${JSON.stringify(metadata)}`;
          }
          return msg;
        })
      ),
    }),
  ],
});

// Create a stream for Morgan or other logging middleware
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
