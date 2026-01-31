import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

/**
 * Factory for creating Google Drive API clients
 */
export class GoogleDriveFactory {
  private oauth2Client: OAuth2Client | null = null;
  private drive: drive_v3.Drive | null = null;
  private accountId: string;
  private readonly SCOPES = ['https://www.googleapis.com/auth/drive'];
  private readonly TOKEN_PATH: string;
  private readonly CREDENTIALS_PATH = path.join(process.cwd(), 'client_secrets.json');

  constructor(configuration: Record<string, string>) {
    this.accountId = configuration.account || 'default';
    this.TOKEN_PATH = path.join(process.cwd(), 'cache', `token-${this.accountId}.json`);
  }

  async init(): Promise<void> {
    // Load client secrets
    const credentials = await this.loadCredentials();
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

    this.oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token
    try {
      const token = fs.readFileSync(this.TOKEN_PATH, 'utf-8');
      this.oauth2Client.setCredentials(JSON.parse(token));
    } catch (err) {
      // No token found, need to authorize
      await this.getAccessToken();
    }

    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
  }

  private async loadCredentials(): Promise<any> {
    try {
      const content = fs.readFileSync(this.CREDENTIALS_PATH, 'utf-8');
      const credentials = JSON.parse(content);
      
      // Validate credentials structure
      const config = credentials.installed || credentials.web;
      if (!config) {
        throw new Error(
          'Invalid credentials file: must contain "installed" or "web" property'
        );
      }
      
      if (!config.client_id || !config.client_secret || !config.redirect_uris) {
        throw new Error(
          'Invalid credentials file: missing required fields (client_id, client_secret, or redirect_uris)'
        );
      }
      
      return credentials;
    } catch (err) {
      if (err instanceof Error && err.message.includes('Invalid credentials')) {
        throw err;
      }
      throw new Error(
        'Error loading client secret file. Please ensure client_secrets.json exists in the root directory.'
      );
    }
  }

  private async getAccessToken(): Promise<void> {
    if (!this.oauth2Client) throw new Error('OAuth2 client not initialized');

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.SCOPES,
    });

    console.log('Authorize this app by visiting this url:', authUrl);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const code = await new Promise<string>((resolve) => {
      rl.question('Enter the code from that page here: ', (answer) => {
        rl.close();
        resolve(answer);
      });
    });

    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);

    // Store the token with secure permissions
    const cacheDir = path.dirname(this.TOKEN_PATH);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    fs.writeFileSync(this.TOKEN_PATH, JSON.stringify(tokens), { mode: 0o600 });
    console.log('Token stored to', this.TOKEN_PATH);
  }

  getDrive(): drive_v3.Drive {
    if (!this.drive) {
      throw new Error('Drive not initialized. Call init() first.');
    }
    return this.drive;
  }

  getOAuth2Client(): OAuth2Client {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized. Call init() first.');
    }
    return this.oauth2Client;
  }
}
