# Example configuration for using Google Drive storage

## Claude Desktop Configuration

Add this to your `claude_desktop_config.json`:

### Using File System (Default)
```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

### Using Google Drive
```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "STORAGE_TYPE": "googledrive",
        "GOOGLE_DRIVE_CREDENTIALS": "{\"type\":\"service_account\",\"project_id\":\"your-project\",\"private_key_id\":\"key-id\",\"private_key\":\"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n\",\"client_email\":\"service-account@your-project.iam.gserviceaccount.com\",\"client_id\":\"123456789\",\"auth_uri\":\"https://accounts.google.com/o/oauth2/auth\",\"token_uri\":\"https://oauth2.googleapis.com/token\",\"auth_provider_x509_cert_url\":\"https://www.googleapis.com/oauth2/v1/certs\",\"client_x509_cert_url\":\"https://www.googleapis.com/robot/v1/metadata/x509/...\"}",
        "GOOGLE_DRIVE_FILENAME": "mcp-memory.json",
        "GOOGLE_DRIVE_FOLDER_ID": "1a2b3c4d5e6f7g8h9i0j"
      }
    }
  }
}
```

## VS Code Configuration

Add this to your `.vscode/mcp.json` or user MCP configuration:

### Using File System (Default)
```json
{
  "servers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

### Using Google Drive
```json
{
  "servers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "STORAGE_TYPE": "googledrive",
        "GOOGLE_DRIVE_CREDENTIALS": "{\"type\":\"service_account\",\"project_id\":\"your-project\",\"private_key_id\":\"key-id\",\"private_key\":\"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n\",\"client_email\":\"service-account@your-project.iam.gserviceaccount.com\",\"client_id\":\"123456789\",\"auth_uri\":\"https://accounts.google.com/o/oauth2/auth\",\"token_uri\":\"https://oauth2.googleapis.com/token\",\"auth_provider_x509_cert_url\":\"https://www.googleapis.com/oauth2/v1/certs\",\"client_x509_cert_url\":\"https://www.googleapis.com/robot/v1/metadata/x509/...\"}",
        "GOOGLE_DRIVE_FILENAME": "mcp-memory.json",
        "GOOGLE_DRIVE_FOLDER_ID": "1a2b3c4d5e6f7g8h9i0j"
      }
    }
  }
}
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `STORAGE_TYPE` | Storage backend type | `filesystem` | No |
| `MEMORY_FILE_PATH` | Path to local JSON file (filesystem only) | `memory.json` | No |
| `GOOGLE_DRIVE_CREDENTIALS` | Google Service Account credentials JSON | - | Yes (for Google Drive) |
| `GOOGLE_DRIVE_FILENAME` | Filename in Google Drive | `mcp-memory.json` | No |
| `GOOGLE_DRIVE_FOLDER_ID` | Folder ID to store files in (required for service accounts) | - | Recommended |

## Important: Service Account Storage Requirements

**Service accounts do not have their own storage quota.** To use Google Drive with a service account, you must:

1. Create a folder in your personal Google Drive or a Shared Drive
2. Share that folder with the service account email (found in your credentials as `client_email`)
3. Get the folder ID and set it in `GOOGLE_DRIVE_FOLDER_ID` environment variable

### How to Get Folder ID

1. Open Google Drive in your browser
2. Navigate to the folder you want to use
3. The folder ID is in the URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
4. Copy the folder ID and use it as `GOOGLE_DRIVE_FOLDER_ID`

### Example with Folder ID

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "STORAGE_TYPE": "googledrive",
        "GOOGLE_DRIVE_CREDENTIALS": "{...}",
        "GOOGLE_DRIVE_FILENAME": "mcp-memory.json",
        "GOOGLE_DRIVE_FOLDER_ID": "1a2b3c4d5e6f7g8h9i0j"
      }
    }
  }
}
```

## Using Alternative Credentials File

If you prefer not to inline the credentials in the config, you can:

1. Save your credentials to a file (e.g., `/path/to/credentials.json`)
2. Read and encode it when starting the server:

**Using a shell script wrapper:**
```bash
#!/bin/bash
export STORAGE_TYPE="googledrive"
export GOOGLE_DRIVE_CREDENTIALS=$(cat /path/to/credentials.json)
npx -y @modelcontextprotocol/server-memory
```

Then reference the script in your config:
```json
{
  "mcpServers": {
    "memory": {
      "command": "/path/to/your-script.sh"
    }
  }
}
```
