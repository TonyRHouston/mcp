# Google Drive FTP Adapter

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-LGPL--3.0-blue.svg)](LICENSE)

![Google Drive Logo](https://raw.github.com/andresoviedo/google-drive-ftp-adapter/master/doc/images/google-drive-logo.png)

## About

Access your Google Drive files through the FTP protocol. Use it with any FTP client: FileZilla, Beyond Compare, command-line FTP, or your favorite file manager.

## Features

- 🚀 **Modern TypeScript/Node.js** implementation
- 📁 **Full FTP Support** - List, upload, download, rename, delete files and folders
- 🔐 **Multi-user Authentication** - Configure multiple FTP users with individual permissions
- 💾 **SQLite Caching** - Fast local index cache with automatic synchronization (every 10 seconds)
- ☁️ **Google Drive API v3** - Latest API for best compatibility
- 📝 **Comprehensive Logging** - Winston-based logging with configurable levels
- ⚙️ **Flexible Configuration** - Environment variables, .env files, or properties files
- 🔄 **Async/Await** - Modern async patterns throughout for better performance

## Screenshots

![Windows Start](https://raw.github.com/andresoviedo/google-drive-ftp-adapter/master/doc/images/screenshot-win32-start.jpg)
![Beyond Compare](https://raw.github.com/andresoviedo/google-drive-ftp-adapter/master/doc/images/screenshot-beyond-compare.jpg)
![FileZilla](https://raw.github.com/andresoviedo/google-drive-ftp-adapter/master/doc/images/screenshot-filezilla.png)

## Requirements

- **Node.js 18 or higher** - [Download](https://nodejs.org/)
- **Google Cloud Project** with Drive API enabled
- **OAuth 2.0 Credentials** (client_secrets.json)

## Quick Start

### 1. Install

```bash
git clone https://github.com/andresoviedo/google-drive-ftp-adapter.git
cd google-drive-ftp-adapter
npm install
npm run build
```

## Documentation

- [Usage Guide](doc/USAGE_GUIDE.md)
- [Operations & Troubleshooting](doc/OPERATIONS.md)

### 2. Setup Google Drive API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Drive API**
4. Create **OAuth 2.0 credentials** (Desktop application type)
5. Download the credentials file and save it as `client_secrets.json` in the project root

### 3. Configure (Optional)

Copy `.env.example` to `.env` and customize settings:

```bash
cp .env.example .env
# Edit .env with your preferred settings
```

Default configuration works out of the box with:
- FTP Port: 1821
- Username: user
- Password: user

### 4. Run

```bash
npm start
```

On first run, your browser will open for Google Drive authorization. Click "Allow" to grant access.

### 5. Connect

Open your FTP client and connect to:
- **Host:** localhost (or your server IP)
- **Port:** 1821
- **Username:** user
- **Password:** user

Or via command line:
```bash
ftp localhost 1821
# Enter: user / user
```

## Configuration

### Environment Variables

The application supports configuration via:
1. Environment variables (recommended)
2. `.env` file
3. `configuration.properties` file
4. Command line arguments

### Main Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `PORT` | 1821 | FTP server port |
| `SERVER` | 0.0.0.0 | Binding address |
| `FTP_USER` | user | FTP username |
| `FTP_PASS` | user | FTP password |
| `FTP_RIGHTS` | pwd\|cd\|dir\|put\|get\|rename\|delete\|mkdir\|rmdir\|append | User permissions |
| `LOG_LEVEL` | info | Log level (error, warn, info, debug) |
| `ACCOUNT` | default | Account identifier for cache |

### Multiple Users

Add multiple users by using numbered variables:

```bash
# User 2
FTP_USER2=admin
FTP_PASS2=admin123
FTP_HOME2=/admin
FTP_RIGHTS2=pwd|cd|dir|put|get|rename|delete|mkdir|rmdir|append

# User 3 (read-only)
FTP_USER3=readonly
FTP_PASS3=readonly123
FTP_RIGHTS3=pwd|cd|dir|get
```

### Permissions

Available FTP rights:
- `pwd` - Print working directory
- `cd` - Change directory
- `dir` - List directory contents
- `put` - Upload files
- `get` - Download files
- `rename` - Rename files/folders
- `delete` - Delete files
- `mkdir` - Create directories
- `rmdir` - Remove directories
- `append` - Append to files

## Development

### Build

```bash
npm run build
```

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Linting

```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

### Format Code

```bash
npm run format
```

### Run Tests

```bash
npm test
```

## Notes

- The adapter **does not sync** files automatically. Use your FTP client to sync files to/from Google Drive
- Google Drive supports repeated filenames in the same folder. These will appear with encoded characters and an ID
- Some file sizes may differ between Google Drive and your local OS
- The cache is automatically synchronized every 10 seconds

## Troubleshooting

### Authentication Failed
The FTP credentials are **not** your Google account credentials. Use the credentials configured in your `.env` or `configuration.properties` file (default: user/user).

### Port Already in Use
Change the `PORT` setting to an available port (e.g., 1822).

### Google Docs Don't Open
Ensure your files have proper extensions (e.g., `document.doc`, `spreadsheet.xls`) so your OS knows which application to use.

### Windows 10 SQLite Error
If you see `UnsatisfiedLinkError` or similar SQLite errors, try running the application or terminal as administrator.

## Architecture

```
src/
├── index.ts                    # Application entry point
├── GoogleDriveFtpAdapter.ts   # Main application class
├── models/                     # Data models
│   ├── Cache.ts               # Cache interface
│   ├── SQLiteCache.ts         # SQLite implementation
│   ├── GFile.ts               # File model
│   ├── GoogleDrive.ts         # Google Drive operations
│   └── GoogleDriveFactory.ts  # Google Drive client factory
├── services/                   # Business logic
│   └── FtpGdriveSynchService.ts # Sync service
├── views/                      # FTP server implementation
│   ├── FtpServer.ts           # FTP server setup
│   └── GDriveFileSystem.ts    # Virtual filesystem
└── utils/                      # Utilities
    ├── config.ts              # Configuration management
    └── logger.ts              # Logging setup
```

## Change Log

### v2.0.0 (2026)
- ✨ Complete rewrite in TypeScript
- ✨ Modern Node.js implementation
- ⚡ Improved async/await throughout
- 🔒 Better error handling and logging
- 🔒 Enhanced security
- 📦 Modern dependencies and tooling
- 📚 Comprehensive documentation

### v1.6.2 (27/10/2018)
- Fixed anonymous user not working

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

This project is licensed under the LGPL-3.0 License. See the [LICENSE](LICENSE) file for details.

## Disclaimer

- Use this application at your own risk
- This application uses the Google Drive API with rate limits (10 requests/second/user)
- When the quota is reached, the application may stop working temporarily

## Contact

[Contact Information](http://www.andresoviedo.org)

## Support

If you find this project helpful, consider buying me a coffee! ☕

[![Donate](https://www.paypalobjects.com/webstatic/en_US/i/btn/png/btn_donate_92x26.png)](https://www.paypal.me/andresoviedo)
