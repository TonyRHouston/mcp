# Full Test Plan: FTP MCP Server (gcloud-ftp Bridge)

This document provides an end-to-end test plan for the MCP FTP server wrapper that auto-starts and proxies through `gcloud-ftp`.

## Goals

- Verify `gcloud-ftp` OAuth, startup, and FTP availability
- Verify MCP tool coverage (`ftp_*`) against Google Drive
- Verify integration with VS Code, Codex CLI, and Copilot CLI

## Prerequisites

- Node.js v18+
- `gcloud-ftp` repository available on disk
- OAuth credentials: `client_secrets.json` in the `gcloud-ftp` root
- Network access for Google OAuth (one-time)

## One-Time OAuth Setup (gcloud-ftp)

Run these once to generate a token cache:

```bash
cd /absolute/path/to/gcloud-ftp
npm install
npm run build
node dist/index.js
```

- Open the printed URL, approve access, paste the code into the prompt.
- Confirm token cache exists at `cache/token-<account>.json`.
- Stop the server with `Ctrl+C`.

## Build the MCP FTP Server

From this repo root:

```bash
npm run build --workspace @modelcontextprotocol/server-ftp
```

## End-to-End CLI Test (MCP Inspector)

This verifies the wrapper auto-starts `gcloud-ftp`, connects over FTP, and exposes tools.

### 1) Start with MCP Inspector

```bash
GCLOUD_FTP_ROOT=/absolute/path/to/gcloud-ftp \
FTP_USER=user \
FTP_PASS=user \
FTP_PORT=1821 \
npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-ftp
```

Expected:
- Logs include `FTP MCP server running (host=127.0.0.1 port=1821)`
- If `gcloud-ftp` was not already running, logs include `[gcloud-ftp]` lines

### 2) Tool Calls (Happy Path)

Use the Inspector UI to call tools with these inputs, in order.

1) `ftp_pwd`
```json
{}
```
Expected: `/`

2) `ftp_mkdir`
```json
{ "path": "/mcp-ftp-test", "recursive": true }
```
Expected: `"Directory created."`

3) `ftp_upload` (create a file)
```json
{
  "remotePath": "/mcp-ftp-test/hello.txt",
  "content": "hello from mcp",
  "encoding": "utf8"
}
```
Expected: `"uploadedBytes"` > 0

4) `ftp_list`
```json
{ "path": "/mcp-ftp-test" }
```
Expected: listing includes `hello.txt`

5) `ftp_stat`
```json
{ "remotePath": "/mcp-ftp-test/hello.txt" }
```
Expected: JSON with `name`, `size`, and `type`

6) `ftp_download`
```json
{ "remotePath": "/mcp-ftp-test/hello.txt", "encoding": "utf8" }
```
Expected: `data` contains `hello from mcp`

7) `ftp_rename`
```json
{ "from": "/mcp-ftp-test/hello.txt", "to": "/mcp-ftp-test/hello-renamed.txt" }
```
Expected: `"Renamed."`

8) `ftp_delete`
```json
{ "remotePath": "/mcp-ftp-test/hello-renamed.txt" }
```
Expected: `"Deleted."`

9) `ftp_rmdir`
```json
{ "path": "/mcp-ftp-test", "recursive": true }
```
Expected: `"Directory removed."`

### 3) Auto-Start vs Existing Server

- **Auto-start test**: Ensure `gcloud-ftp` is not running, then start the MCP server and verify `[gcloud-ftp]` logs.
- **Existing server test**: Start `gcloud-ftp` separately (`node dist/index.js`), then start the MCP server and verify it connects without spawning a new process.

## VS Code Integration Test

1) Add this to `.vscode/mcp.json`:
```json
{
  "servers": {
    "gcloud-ftp": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-ftp"],
      "env": {
        "GCLOUD_FTP_ROOT": "/absolute/path/to/gcloud-ftp",
        "FTP_USER": "user",
        "FTP_PASS": "user",
        "FTP_PORT": "1821"
      }
    }
  }
}
```

2) Reload VS Code (Command Palette → "Developer: Reload Window").
3) In Copilot Chat, try:
```
List files in / (use the ftp_list tool)
```
Expected: Tool output with a JSON listing.

## Codex CLI Integration Test

1) Add to `~/.codex/config.toml`:
```toml
[mcp_servers.gcloud_ftp]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-ftp"]

[mcp_servers.gcloud_ftp.env]
GCLOUD_FTP_ROOT = "/absolute/path/to/gcloud-ftp"
FTP_USER = "user"
FTP_PASS = "user"
FTP_PORT = "1821"
```

2) Run Codex CLI and prompt:
```
Use ftp_pwd, then create /mcp-ftp-test and upload hello.txt with content "hello".
```
Expected: Successful tool calls and responses.

## Copilot CLI Integration Test

1) Add to `~/.copilot/mcp-config.json`:
```json
{
  "mcpServers": {
    "gcloud-ftp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-ftp"],
      "env": {
        "GCLOUD_FTP_ROOT": "/absolute/path/to/gcloud-ftp",
        "FTP_USER": "user",
        "FTP_PASS": "user",
        "FTP_PORT": "1821"
      },
      "tools": [
        "ftp_list",
        "ftp_download",
        "ftp_upload",
        "ftp_delete",
        "ftp_rename",
        "ftp_mkdir",
        "ftp_rmdir",
        "ftp_stat",
        "ftp_pwd"
      ]
    }
  }
}
```

2) Run Copilot CLI and prompt:
```
List / and download a small file using ftp_download.
```
Expected: Tool output with file metadata and contents.

## Troubleshooting Quick Checks

- **OAuth prompt stuck**: Ensure token cache exists. The MCP server is non-interactive.
- **Port in use**: Set `FTP_PORT` to a free port and restart.
- **Missing entry**: Build `gcloud-ftp` so `dist/index.js` exists or set `GCLOUD_FTP_ENTRY`.
- **Wrong credentials**: Check `FTP_USER`/`FTP_PASS` in both MCP env and `gcloud-ftp` config.

## Cleanup

- Delete test files/folders created in Drive (e.g., `/mcp-ftp-test`).
- Stop running MCP and `gcloud-ftp` processes.
