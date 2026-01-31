# FTP MCP Integration Guide

This guide explains how the FTP MCP server integrates with gcloud-ftp to provide Google Drive access via the Model Context Protocol.

## System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      Claude Desktop                           │
│                    (MCP Client)                               │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            │ MCP Protocol (stdio)
                            │ JSON-RPC over stdin/stdout
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                  FTP MCP Server                               │
│                  (src/ftp)                                    │
│                                                               │
│  • Exposes 9 FTP tools via MCP                               │
│  • Manages gcloud-ftp subprocess                             │
│  • Validates inputs with Zod schemas                         │
│  • Handles binary/text encoding                              │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            │ FTP Protocol (TCP)
                            │ Commands: LIST, RETR, STOR, etc.
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                  gcloud-ftp Server                            │
│              (Google Drive FTP Adapter)                       │
│                                                               │
│  • FTP server on port 1821                                   │
│  • Virtual filesystem backed by SQLite cache                 │
│  • Translates FTP commands → Google Drive API calls          │
│  • Handles authentication & permissions                      │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            │ HTTPS/OAuth 2.0
                            │ Google Drive API v3
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                    Google Drive                               │
│                                                               │
│  • Cloud storage for files and folders                       │
│  • Access controlled by Google account                       │
│  • Rate limited (10 req/sec/user)                           │
└───────────────────────────────────────────────────────────────┘
```

## Data Flow

### Upload Flow (Claude → Google Drive)

1. **User Request**: "Upload this report to my Google Drive"
2. **MCP Tool Call**: Claude calls `ftp_upload` with content
3. **FTP Command**: MCP server sends `STOR /report.pdf` to gcloud-ftp
4. **Cache Update**: gcloud-ftp writes to SQLite cache
5. **API Call**: gcloud-ftp uploads to Google Drive API
6. **Response**: Success message back through the chain

### Download Flow (Google Drive → Claude)

1. **User Request**: "Show me the contents of report.pdf"
2. **MCP Tool Call**: Claude calls `ftp_download` with path
3. **FTP Command**: MCP server sends `RETR /report.pdf` to gcloud-ftp
4. **Cache Lookup**: gcloud-ftp checks SQLite cache for metadata
5. **API Call**: gcloud-ftp downloads from Google Drive API
6. **Encoding**: MCP server encodes as base64/utf8
7. **Response**: Content returned to Claude

## Setup Steps

### 1. Build Both Components

```bash
# Build gcloud-ftp first
cd gcloud-ftp
npm install
npm run build

# Build FTP MCP server
cd ../src/ftp
npm install
npm run build
```

### 2. Configure Google Drive API

Follow the [gcloud-ftp setup guide](../../gcloud-ftp/README.md):

1. Create a Google Cloud project
2. Enable Google Drive API
3. Create OAuth 2.0 credentials (Desktop app)
4. Download as `client_secrets.json` in gcloud-ftp directory
5. Run gcloud-ftp once to authorize: `cd gcloud-ftp && npm start`
6. Authorize in browser when prompted
7. Token will be saved for future use

### 3. Configure Claude Desktop

Edit your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "ftp-gdrive": {
      "command": "node",
      "args": ["/absolute/path/to/mcp/src/ftp/dist/index.js"],
      "env": {
        "FTP_PORT": "1821",
        "FTP_USER": "user",
        "FTP_PASS": "user",
        "MCP_FTP_USE_GCLOUD": "true",
        "GCLOUD_FTP_ROOT": "/absolute/path/to/mcp/gcloud-ftp"
      }
    }
  }
}
```

**Important:** Use absolute paths, not relative paths!

### 4. Restart Claude Desktop

Fully quit and restart Claude Desktop to load the new MCP server.

## Usage Examples

### List Files

**Prompt:** "Show me what files are in my Google Drive"

**Tool Call:**
```json
{
  "name": "ftp_list",
  "arguments": {
    "path": "/"
  }
}
```

**Response:**
```json
[
  {
    "name": "Documents",
    "size": 0,
    "type": 2,
    "modifiedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "name": "report.pdf",
    "size": 524288,
    "type": 1,
    "modifiedAt": "2024-01-20T14:22:00.000Z"
  }
]
```

### Upload a File

**Prompt:** "Create a file called hello.txt with 'Hello World' in my Google Drive"

**Tool Call:**
```json
{
  "name": "ftp_upload",
  "arguments": {
    "remotePath": "/hello.txt",
    "content": "Hello World",
    "encoding": "utf8"
  }
}
```

**Response:**
```json
{
  "uploadedBytes": 11
}
```

### Download a File

**Prompt:** "Show me the contents of hello.txt"

**Tool Call:**
```json
{
  "name": "ftp_download",
  "arguments": {
    "remotePath": "/hello.txt",
    "encoding": "utf8"
  }
}
```

**Response:**
```json
{
  "path": "/hello.txt",
  "bytes": 11,
  "encoding": "utf8",
  "data": "Hello World"
}
```

### Create a Folder

**Prompt:** "Create a folder called Projects in my Google Drive"

**Tool Call:**
```json
{
  "name": "ftp_mkdir",
  "arguments": {
    "path": "/Projects"
  }
}
```

### Rename a File

**Prompt:** "Rename hello.txt to greeting.txt"

**Tool Call:**
```json
{
  "name": "ftp_rename",
  "arguments": {
    "from": "/hello.txt",
    "to": "/greeting.txt"
  }
}
```

## Process Management

### Automatic Startup

When the FTP MCP server receives its first tool call:

1. **Check**: Is FTP server already running on port 1821?
2. **Spawn**: If not, start gcloud-ftp subprocess
3. **Wait**: Poll port until it's ready (up to 20 seconds)
4. **Connect**: Establish FTP connection
5. **Execute**: Perform the requested operation

### Health Monitoring

The gcloud-ftp subprocess is monitored via:

- **Exit Detection**: If gcloud-ftp exits unexpectedly, MCP server reports error
- **Port Polling**: Checks if FTP port is accepting connections
- **Log Forwarding**: gcloud-ftp output is captured and logged

### Graceful Shutdown

On MCP server exit (SIGINT/SIGTERM):

1. Close active FTP connections
2. Send SIGTERM to gcloud-ftp subprocess
3. Wait for clean exit
4. Release resources

## Troubleshooting

### "Failed to start gcloud-ftp"

**Symptoms:**
```
Failed to start gcloud-ftp: Timed out waiting for gcloud-ftp to listen on 127.0.0.1:1821
```

**Possible Causes:**

1. **gcloud-ftp not built:**
   ```bash
   cd gcloud-ftp && npm run build
   ```

2. **Missing Google credentials:**
   - Ensure `client_secrets.json` exists in gcloud-ftp directory
   - Run `cd gcloud-ftp && npm start` once to authorize

3. **Port already in use:**
   ```bash
   # Check what's using port 1821
   lsof -i :1821
   # Kill the process or change port
   ```

4. **Increase timeout:**
   ```json
   "env": {
     "GCLOUD_FTP_STARTUP_TIMEOUT": "30000"
   }
   ```

### "Connection refused"

**Symptoms:**
```
FTP operation failed: Error: connect ECONNREFUSED 127.0.0.1:1821
```

**Solution:**
- gcloud-ftp failed to start or crashed
- Check logs: Set `MCP_FTP_DEBUG=true` in config
- Try starting gcloud-ftp manually to see errors

### "530 Login authentication failed"

**Symptoms:**
```
530 Login authentication failed
```

**Solution:**
- FTP credentials are wrong (not your Google password!)
- Default: user/user
- Check `FTP_USER` and `FTP_PASS` in config

### "Permission denied"

**Symptoms:**
```
Error: Permission denied
```

**Solution:**
- Google Drive API not authorized
- Re-authorize: Delete token file in gcloud-ftp and run `npm start`
- Check Google API quota limits

## Performance Considerations

### Caching

gcloud-ftp uses SQLite caching to minimize API calls:

- **Metadata Cache**: File/folder info cached locally
- **Sync Interval**: Cache updates every 10 seconds
- **First Access**: Slower due to cache population
- **Subsequent Access**: Fast, served from cache

### Rate Limits

Google Drive API limits:
- **10 requests/second/user**
- Large file operations may be slower
- Bulk operations are batched automatically

### Connection Pooling

- FTP connections are opened per operation
- Automatically closed after completion
- No persistent connections maintained

## Security

### Credential Storage

- **Google OAuth**: Tokens stored in gcloud-ftp directory
- **FTP Credentials**: Passed via environment variables
- **No Secrets in Code**: All credentials externalized

### Access Control

- **Google Account**: Controls Drive access
- **FTP Permissions**: Configurable via `FTP_RIGHTS`
- **Home Directory**: Can be restricted via `FTP_HOME`

### Network Security

- **Local Only**: gcloud-ftp binds to 127.0.0.1 by default
- **FTPS Support**: Enable with `FTP_SECURE=true`
- **Firewall**: Port 1821 only accessible locally

## Testing

### Unit Tests

```bash
# Test FTP MCP server
cd src/ftp
npm test

# Test gcloud-ftp
cd ../../gcloud-ftp
npm test
```

### Integration Test

1. **Start manually:**
   ```bash
   cd gcloud-ftp
   npm start
   ```

2. **Test with FTP client:**
   ```bash
   ftp localhost 1821
   # Enter: user / user
   > ls
   > get filename.txt
   ```

3. **Test with MCP:**
   - Configure Claude Desktop
   - Ask Claude to list files
   - Verify response

### Debug Mode

Enable debug logging:

```json
"env": {
  "MCP_FTP_DEBUG": "true"
}
```

Output includes:
- Connection attempts
- FTP commands sent
- Process lifecycle events
- Error details

## Advanced Configuration

### Multiple Users

Configure in gcloud-ftp via environment:

```bash
FTP_USER2=admin
FTP_PASS2=secret
FTP_HOME2=/admin
FTP_RIGHTS2=pwd|cd|dir|put|get|rename|delete|mkdir|rmdir
```

### Read-Only Mode

Limit permissions:

```bash
FTP_RIGHTS=pwd|cd|dir|get
```

### Custom Port

Change FTP port:

```json
"env": {
  "FTP_PORT": "2121"
}
```

### Disable Auto-Start

Use external FTP server:

```json
"env": {
  "MCP_FTP_USE_GCLOUD": "false",
  "FTP_HOST": "ftp.example.com",
  "FTP_PORT": "21"
}
```

## Comparison with Other Approaches

### vs. Direct Google Drive API

**FTP MCP Approach:**
- ✅ Works with any FTP client
- ✅ Familiar FTP commands
- ✅ Can use standard FTP tools
- ❌ Requires running server
- ❌ Not true real-time sync

**Direct API:**
- ✅ No server needed
- ✅ Real-time updates
- ✅ More features (search, sharing)
- ❌ More complex integration
- ❌ Requires API client implementation

### vs. Google Drive Desktop Client

**FTP MCP Approach:**
- ✅ Works in server environments
- ✅ Programmatic access
- ✅ Cross-platform
- ❌ Requires setup

**Desktop Client:**
- ✅ Automatic sync
- ✅ Native file system integration
- ✅ Simpler for end users
- ❌ Not available on servers
- ❌ Harder to automate

## Future Improvements

Potential enhancements:

1. **Connection Pooling**: Reuse FTP connections
2. **Parallel Operations**: Batch multiple operations
3. **Progress Reporting**: For large file transfers
4. **Retry Logic**: Auto-retry failed operations
5. **Metrics**: Operation timing and success rates
6. **Health Endpoint**: HTTP health check for monitoring

## Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [gcloud-ftp README](../../gcloud-ftp/README.md)
- [Google Drive API](https://developers.google.com/drive/api/v3/about-sdk)
- [FTP Protocol RFC 959](https://tools.ietf.org/html/rfc959)

## Support

For issues:
1. Check this troubleshooting guide
2. Enable debug mode (`MCP_FTP_DEBUG=true`)
3. Review logs for error details
4. Test components individually
5. Open an issue with full error logs
