# Google Drive FTP Adapter (gcloud-ftp) Usage Guide

This guide explains how to install, configure, and use the Google Drive FTP Adapter.
It covers OAuth setup, FTP connection details, multi-user configuration, and common
operational patterns.

## What this package does

The adapter exposes Google Drive as an FTP server. Any FTP client can connect and
perform file operations (list, upload, download, rename, delete, mkdir, rmdir).
The server uses Google Drive API v3 and a local SQLite cache for faster listings.

## Requirements

- Node.js 18+
- Google Cloud project with **Google Drive API** enabled
- OAuth 2.0 **Desktop** credentials (client secrets JSON)

## Installation

From the package directory:

```bash
npm install
npm run build
```

## Google Drive OAuth setup

1. Create or select a Google Cloud project.
2. Enable **Google Drive API**.
3. Create **OAuth 2.0 credentials** (Desktop app).
4. Download the client secrets JSON and save it as:
   ```
   gcloud-ftp/client_secrets.json
   ```

On first run, the server prints an authorization URL. Open it, grant access, and
paste the code back into the terminal. The token is stored locally for future runs.

Token location:
```
gcloud-ftp/cache/token-<ACCOUNT>.json
```

## Quick start

```bash
# From gcloud-ftp/
npm start
```

Default FTP login:
- Host: `localhost`
- Port: `1821`
- User: `user`
- Pass: `user`

### CLI FTP example

```bash
ftp localhost 1821
# user / user
```

## Configuration

Configuration sources (in order):
1. Environment variables / `.env`
2. `configuration.properties`
3. Command-line overrides

### Environment variables

Common variables (see `.env.example`):

| Variable | Purpose | Default |
|---|---|---|
| `ACCOUNT` | Account identifier for cache/token | `default` |
| `PORT` | FTP server port | `1821` |
| `SERVER` | Bind address | `0.0.0.0` |
| `LOG_LEVEL` | Log verbosity | `info` |
| `FTP_USER` / `FTP_PASS` | Primary user credentials | `user` / `user` |
| `FTP_HOME` | Primary user home directory | empty (Drive root) |
| `FTP_RIGHTS` | Primary user rights | full |
| `FTP_ANONYMOUS_ENABLED` | Enable anonymous login | `false` |
| `FTP_ANONYMOUS_HOME` | Anonymous home | empty |
| `FTP_ANONYMOUS_RIGHTS` | Anonymous rights | `pwd|cd|dir` |

### configuration.properties

The properties file supports additional keys that aren’t in `.env`. Example:

```
ftp.pasv.port.start=40000
ftp.pasv.port.end=40100
```

Use a custom properties file:

```bash
node dist/index.js /path/to/config.properties
```

### Multiple users

Add numbered users using either `.env` or `configuration.properties`:

```
FTP_USER2=admin
FTP_PASS2=admin123
FTP_HOME2=/admin
FTP_RIGHTS2=pwd|cd|dir|put|get|rename|delete|mkdir|rmdir|append
```

## Rights and permissions

Supported rights:

- `pwd` - Print working directory
- `cd` - Change directory
- `dir` - List directory contents
- `put` - Upload files
- `get` - Download files
- `rename` - Rename/move files
- `delete` - Delete files
- `mkdir` - Create directories
- `rmdir` - Remove directories
- `append` - Append (treated as overwrite; Drive has no true append)

If a right is missing, the server rejects the operation with “Permission denied”.

## Home directory scoping

`FTP_HOME` (or `FTP_HOME2`, etc.) restricts a user to a subfolder of Drive.
Examples:

- `FTP_HOME=/` → full Drive
- `FTP_HOME=/Projects` → only `/Projects` and its descendants
- `FTP_HOME=Projects` → same as `/Projects`

The adapter prevents path traversal outside the configured home.

## FTP clients

Use any FTP client (FileZilla, Cyberduck, Beyond Compare). For remote access:

- Set `SERVER` to a public IP or DNS name.
- Configure a PASV port range in `configuration.properties`:
  ```
  ftp.pasv.port.start=40000
  ftp.pasv.port.end=40100
  ```
- Open that port range in your firewall.

## Cache behavior

The adapter maintains a local SQLite cache:

```
gcloud-ftp/cache/gdrive-<ACCOUNT>.db
```

The sync service checks for Drive changes every 10 seconds and updates the cache.

## Known limitations

- **Append** is not supported by Drive; append uploads overwrite the file.
- Google Docs (Docs/Sheets/Slides) are stored as files but are not standard
  binary files. Downloads may require export logic (not included).
- Duplicate filenames are allowed by Google Drive; the cache may surface one
  entry, depending on the directory contents.

## Troubleshooting quick list

See `doc/OPERATIONS.md` for full troubleshooting details.

Common issues:
- `client_secrets.json` missing or malformed
- Wrong Google account authorized
- FTP client stuck in PASV mode (set `SERVER` and PASV range)
- Permission denied (rights or home folder scoping)
