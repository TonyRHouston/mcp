import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

/**
 * Configuration manager for the application
 */
export class Configuration {
  private config: Record<string, string>;

  constructor() {
    this.config = {};
    this.load();
  }

  /**
   * Load configuration from multiple sources
   */
  private load(): void {
    // Load from environment variables
    dotenv.config();

    // Load default configuration
    this.config = {
      account: process.env.ACCOUNT || 'default',
      port: process.env.PORT || '1821',
      server: process.env.SERVER || '0.0.0.0',
      'auth.port': process.env.AUTH_PORT || '8093',
      'ftp.anonymous.enabled': process.env.FTP_ANONYMOUS_ENABLED || 'false',
      'ftp.anonymous.home': process.env.FTP_ANONYMOUS_HOME || '',
      'ftp.anonymous.rights': process.env.FTP_ANONYMOUS_RIGHTS || 'pwd|cd|dir',
      'ftp.user': process.env.FTP_USER || 'user',
      'ftp.pass': process.env.FTP_PASS || 'user',
      'ftp.home': process.env.FTP_HOME || '',
      'ftp.rights': process.env.FTP_RIGHTS || 'pwd|cd|dir|put|get|rename|delete|mkdir|rmdir|append',
    };

    // Try to load from configuration.properties file
    this.loadFromFile('configuration.properties');

    // Override with command line args if provided
    this.loadFromCommandLine();
  }

  /**
   * Load configuration from a properties file
   */
  private loadFromFile(filename: string): void {
    const filePath = path.join(process.cwd(), filename);

    if (!fs.existsSync(filePath)) {
      return;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        // Skip comments and empty lines
        if (trimmed.startsWith('#') || trimmed === '') {
          continue;
        }

        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          this.config[key.trim()] = valueParts.join('=').trim();
        }
      }
    } catch (err) {
      console.warn(`Failed to load configuration from ${filename}:`, err);
    }
  }

  /**
   * Load configuration from command line arguments
   */
  private loadFromCommandLine(): void {
    const args = process.argv.slice(2);

    if (args.length === 1 && args[0] !== 'configuration.properties') {
      // Custom properties file
      this.loadFromFile(args[0]);
    } else if (args.length === 2) {
      // Legacy: account and port
      this.config.account = args[0];
      this.config.port = args[1];
    }
  }

  /**
   * Get a configuration value
   */
  get(key: string, defaultValue?: string): string {
    return this.config[key] || defaultValue || '';
  }

  /**
   * Get a configuration value as a number
   */
  getNumber(key: string, defaultValue: number): number {
    const value = this.config[key];
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Get a configuration value as a boolean
   */
  getBoolean(key: string, defaultValue: boolean): boolean {
    const value = this.config[key];
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true' || value === '1';
  }

  /**
   * Get all configuration as a record
   */
  getAll(): Record<string, string> {
    return { ...this.config };
  }

  /**
   * Set a configuration value
   */
  set(key: string, value: string): void {
    this.config[key] = value;
  }
}
