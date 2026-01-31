# FTP MCP Server

An MCP (Model Context Protocol) server that provides FTP access capabilities to AI assistants. This server acts as a bridge between MCP clients (like Claude) and FTP servers, with built-in support for the Google Drive FTP adapter (`gcloud-ftp`).

## Features

- 🔌 **MCP Tool Interface** - Exposes FTP operations as MCP tools
- ☁️ **Google Drive Integration** - Automatically starts and manages `gcloud-ftp` for Google Drive access
- 📁 **Full FTP Support** - List, download, upload, delete, rename files and directories
- 🔐 **Secure Connection** - Support for both standard and secure FTP
- ⚙️ **Flexible Configuration** - Environment-based configuration with sensible defaults
- 🔄 **Process Management** - Auto-spawns and manages gcloud-ftp subprocess
- 🧪 **Well Tested** - Comprehensive test suite with 24+ tests

## Installation

```bash
cd src/ftp
npm install
npm run build
```

## Prerequisites

To use Google Drive integration (default):
1. Build `gcloud-ftp` first:
   ```bash
   cd ../../gcloud-ftp
   npm install
   npm run build
   ```
2. Set up Google Drive API credentials (see [gcloud-ftp README](../../gcloud-ftp/README.md))

## Configuration

Configure via environment variables:

### FTP Server Connection

| Variable | Default | Description |
|----------|---------|-------------|
| `FTP_HOST` | `127.0.0.1` | FTP server hostname |
| `FTP_PORT` or `PORT` | `1821` | FTP server port |
| `FTP_USER` | `user` | FTP username |
| `FTP_PASS` | `user` | FTP password |
| `FTP_SECURE` | `false` | Enable FTPS (FTP over TLS) |
| `FTP_TIMEOUT` | `10000` | Connection timeout in ms |

### Google Drive FTP Integration

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_FTP_USE_GCLOUD` | `true` | Auto-start gcloud-ftp subprocess |
| `GCLOUD_FTP_ROOT` | `../../gcloud-ftp` | Path to gcloud-ftp directory |
| `GCLOUD_FTP_ENTRY` | `${ROOT}/dist/index.js` | gcloud-ftp entry point |
| `GCLOUD_FTP_STARTUP_TIMEOUT` | `20000` | Startup timeout in ms |

## Usage

### As MCP Server

Run the server in MCP mode (communicates via stdio):

```bash
node dist/index.js
```

### With Claude Desktop

Add to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "ftp": {
      "command": "node",
      "args": ["/path/to/mcp/src/ftp/dist/index.js"],
      "env": {
        "FTP_PORT": "1821",
        "FTP_USER": "user",
        "FTP_PASS": "user"
      }
    }
  }
}
```

### Disable Google Drive Integration

To connect to a standard FTP server instead:

```bash
MCP_FTP_USE_GCLOUD=false FTP_HOST=ftp.example.com FTP_PORT=21 node dist/index.js
```

## Available Tools

The server exposes 9 FTP operations as MCP tools:

### 1. `ftp_list`
List files in a directory.

**Parameters:**
- `path` (optional): Remote directory path (default: current directory)

**Example:**
```json
{
  "name": "ftp_list",
  "arguments": {
    "path": "/documents"
  }
}
```

### 2. `ftp_download`
Download a file from the FTP server.

**Parameters:**
- `remotePath`: Remote file path to download
- `localPath` (optional): Local path to save file (server-side)
- `encoding` (optional): `"base64"` or `"utf8"` (returns content if no localPath)

**Example:**
```json
{
  "name": "ftp_download",
  "arguments": {
    "remotePath": "/documents/report.pdf",
    "encoding": "base64"
  }
}
```

### 3. `ftp_upload`
Upload a file to the FTP server.

**Parameters:**
- `remotePath`: Remote file path destination
- `localPath` (optional): Local file to upload (server-side)
- `content` (optional): File content to upload
- `encoding` (optional): `"base64"` or `"utf8"` for content

**Example:**
```json
{
  "name": "ftp_upload",
  "arguments": {
    "remotePath": "/documents/new.txt",
    "content": "Hello World!",
    "encoding": "utf8"
  }
}
```

### 4. `ftp_delete`
Delete a file.

**Parameters:**
- `remotePath`: File path to delete

### 5. `ftp_rename`
Rename or move a file/directory.

**Parameters:**
- `from`: Existing path
- `to`: New path

### 6. `ftp_mkdir`
Create a directory.

**Parameters:**
- `path`: Directory path to create
- `recursive` (optional): Create parent directories

### 7. `ftp_rmdir`
Remove a directory.

**Parameters:**
- `path`: Directory path to remove
- `recursive` (optional): Remove contents

### 8. `ftp_stat`
Get file/directory metadata.

**Parameters:**
- `remotePath`: Path to inspect

### 9. `ftp_pwd`
Get current working directory.

**Parameters:** None

## Architecture

```
┌─────────────────┐
│  Claude/MCP     │
│     Client      │
└────────┬────────┘
         │ MCP Protocol (stdio)
         │
┌────────▼────────┐
│   FTP MCP       │
│    Server       │
│  (src/ftp)      │
└────────┬────────┘
         │ FTP Protocol
         │ (basic-ftp client)
         │
┌────────▼────────┐        ┌─────────────────┐
│   gcloud-ftp    │───────▶│  Google Drive   │
│   FTP Server    │  API   │      API        │
└─────────────────┘        └─────────────────┘
```

### Process Management

1. **Startup Check**: On first tool call, checks if FTP server is accessible
2. **Auto-Spawn**: If not running and `USE_GCLOUD_FTP=true`, spawns gcloud-ftp subprocess
3. **Health Check**: Waits for FTP port to become available (configurable timeout)
4. **Logging**: Pipes gcloud-ftp output to stderr for debugging
5. **Cleanup**: Gracefully terminates gcloud-ftp on exit signals

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run watch
```

### Run Tests

```bash
npm test
```

### Test Coverage

```bash
npm test:coverage
```

## Testing

The test suite includes:
- Path normalization tests
- Connection detection tests
- All FTP operation tests (list, download, upload, delete, rename, mkdir, rmdir, stat, pwd)
- Configuration tests
- Error handling tests

**Current Coverage:**
- ✅ 24 tests passing
- ✅ All FTP operations covered
- ✅ Error scenarios tested
- ✅ Configuration validation

## Troubleshooting

### gcloud-ftp fails to start

**Error:** `Failed to start gcloud-ftp: Timed out waiting for port...`

**Solutions:**
1. Verify gcloud-ftp is built: `cd ../../gcloud-ftp && npm run build`
2. Check if port is already in use: `lsof -i :1821`
3. Increase startup timeout: `GCLOUD_FTP_STARTUP_TIMEOUT=30000`
4. Check Google Drive credentials are configured

### Connection refused

**Error:** `Connection failed`

**Solutions:**
1. Verify FTP server is running
2. Check firewall settings
3. Validate FTP_HOST and FTP_PORT settings
4. Test connection manually: `ftp localhost 1821`

### Authentication failed

**Error:** `530 Login authentication failed`

**Solutions:**
1. Verify FTP_USER and FTP_PASS are correct
2. These are **not** your Google credentials - use configured FTP credentials
3. Default: user/user

### Port already in use

**Error:** `EADDRINUSE: address already in use`

**Solution:** Change the port:
```bash
FTP_PORT=1822 node dist/index.js
```

## Integration with gcloud-ftp

This server is designed to work seamlessly with `gcloud-ftp`:

1. **Automatic Management**: Spawns gcloud-ftp if not running
2. **Configuration Passing**: Forwards FTP credentials and port settings
3. **Process Lifecycle**: Handles startup, monitoring, and shutdown
4. **Logging Integration**: Captures and forwards gcloud-ftp logs

To use without gcloud-ftp (standard FTP server):

```bash
MCP_FTP_USE_GCLOUD=false FTP_HOST=your-server.com node dist/index.js
```

## Security Considerations

- FTP credentials are passed via environment variables
- Subprocess inherits parent environment (secure in typical usage)
- FTPS (FTP over TLS) is supported via `FTP_SECURE=true`
- Google Drive credentials are managed by gcloud-ftp
- All file paths are normalized to prevent directory traversal

## Performance

- Lightweight wrapper (~450 lines of code)
- Minimal overhead over direct FTP operations
- Efficient binary transfer via streams
- Connection pooling via `withClient` helper
- Automatic connection cleanup

## License

MIT

## Related Projects

- [gcloud-ftp](../../gcloud-ftp) - Google Drive FTP adapter
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk) - Model Context Protocol SDK
- [basic-ftp](https://github.com/patrickjuchli/basic-ftp) - FTP client library

## Contributing

Contributions welcome! Please ensure:
- Tests pass: `npm test`
- Code builds: `npm run build`
- Follow existing code style
- Add tests for new features

## Changelog

### v0.1.0 (2026-01-31)
- ✨ Initial release
- ✅ Full FTP operation support
- ✅ Google Drive integration via gcloud-ftp
- ✅ Comprehensive test suite
- ✅ MCP tool interface
- ✅ Auto-process management
