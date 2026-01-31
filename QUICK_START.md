# Quick Start Guide: MCP Servers

Get up and running with Model Context Protocol (MCP) servers in under 10 minutes.

## What You'll Need

- **For TypeScript servers**: Node.js v18+ ([download](https://nodejs.org/))
- **For Python servers**: Python 3.10+ and uv ([install guide](https://docs.astral.sh/uv/getting-started/installation/))
- **An MCP Client**: Claude Desktop, VS Code with Copilot, or Zed Editor

## Step 1: Choose Your Server

Start with one of these servers based on your needs:

| Server | Best For | Language |
|--------|----------|----------|
| **Memory** | Remembering context across conversations | TypeScript |
| **Filesystem** | Working with local files | TypeScript |
| **Git** | Managing git repositories | Python |
| **Fetch** | Fetching web content | Python |
| **Time** | Time and timezone operations | Python |
| **FTP (gcloud-ftp)** | Google Drive via FTP tools | TypeScript |

**Note**: The FTP server requires the gcloud-ftp adapter and a one-time OAuth setup. See the FTP section in [USAGE_GUIDE.md](USAGE_GUIDE.md#8-ftp-server-gcloud-ftp-bridge).

## Step 2: Test the Server

Before configuring, verify the server works:

### TypeScript Server Example (Memory)

```bash
npx -y @modelcontextprotocol/server-memory
```

### Python Server Example (Git)

```bash
# Install uv if you haven't already
curl -LsSf https://astral.sh/uv/install.sh | sh

# Run the server
uvx mcp-server-git
```

You should see JSON-RPC messages. Press `Ctrl+C` to stop.

## Step 3: Configure Your Client

### For Claude Desktop

1. **Find your config file**:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. **Edit the file** (create if it doesn't exist):

   **Example 1: Memory Server**
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

   **Example 2: Filesystem Server**
   ```json
   {
     "mcpServers": {
       "filesystem": {
         "command": "npx",
         "args": [
           "-y",
           "@modelcontextprotocol/server-filesystem",
           "/Users/yourname/Documents"
         ]
       }
     }
   }
   ```
   
   **Replace** `/Users/yourname/Documents` with your actual documents path.

   **Example 3: Multiple Servers**
   ```json
   {
     "mcpServers": {
       "memory": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-memory"]
       },
       "filesystem": {
         "command": "npx",
         "args": [
           "-y",
           "@modelcontextprotocol/server-filesystem",
           "/Users/yourname/Documents"
         ]
       },
       "git": {
         "command": "uvx",
         "args": ["mcp-server-git"]
       }
     }
   }
   ```

3. **Restart Claude Desktop** completely (quit and relaunch)

### For VS Code

1. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type "MCP: Open User Configuration"
3. Add your server configuration:

```json
{
  "servers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "${workspaceFolder}"
      ]
    }
  }
}
```

4. **Reload VS Code** (Command Palette → "Developer: Reload Window")

### For Zed Editor

1. Open Zed settings (`Zed` → `Settings` or `Cmd+,`)
2. Add to your `settings.json`:

```json
{
  "context_servers": {
    "memory": {
      "command": {
        "path": "npx",
        "args": ["-y", "@modelcontextprotocol/server-memory"]
      }
    }
  }
}
```

3. **Restart Zed**

## Step 4: Verify It Works

### In Claude Desktop

1. Start a new conversation
2. Look for the 🔌 icon or "MCP" indicator showing connected servers
3. Try these example prompts:

   **For Memory Server**:
   ```
   Remember that my favorite color is blue and I prefer Python over JavaScript.
   ```
   
   Then in a new conversation:
   ```
   What's my favorite color?
   ```

   **For Filesystem Server**:
   ```
   List the files in my Documents folder
   ```
   
   **For Git Server**:
   ```
   Show me the git status of my repository
   ```

### In VS Code

1. Open Copilot Chat
2. Type `@workspace` to see available context
3. Try filesystem operations:
   ```
   @workspace List all TypeScript files in this project
   ```

## Step 5: Explore More

Now that you have a working server, try:

1. **Add more servers** to your configuration
2. **Read the full [USAGE_GUIDE.md](USAGE_GUIDE.md)** for advanced features
3. **Explore server-specific documentation** in `src/[server-name]/README.md`
4. **Join the community** on [Discord](https://discord.gg/mcp)

## Common Quick Start Issues

### "Command not found: npx"

**Solution**: Install Node.js from [nodejs.org](https://nodejs.org/)

### "Command not found: uvx"

**Solution**: Install uv:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Then restart your terminal.

### "Server not connecting" in Claude Desktop

**Solutions**:
1. Check your JSON syntax is valid (use a [JSON validator](https://jsonlint.com/))
2. Make sure you used the correct path for your operating system
3. Check the logs:
   - macOS: `~/Library/Logs/Claude/mcp*.log`
   - Windows: `%APPDATA%\Claude\logs\mcp*.log`
4. Try running the server command directly in terminal to see errors

### "Permission denied" errors

**Solution**: Make sure the paths in your config exist and you have read permissions:
```bash
# Check if path exists
ls -la /path/to/directory

# On Windows
dir C:\path\to\directory
```

### "JSON parse error" in config

**Solution**: Common JSON mistakes:
- Missing comma between objects
- Trailing comma after last item (not allowed in JSON)
- Unescaped backslashes in Windows paths (use `\\` or `/`)
- Unclosed brackets or braces

**Correct**:
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

**Wrong** (trailing comma):
```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
  }
}
```

## Platform-Specific Notes

### macOS

- Use `/Users/yourname/` for paths
- No special configuration needed for most servers
- You may need to grant permissions for filesystem access

### Windows

- Use forward slashes `/` or escaped backslashes `\\` in paths
- Example: `"C:/Users/yourname/Documents"` or `"C:\\Users\\yourname\\Documents"`
- Run as administrator if you encounter permission issues

### Linux

- Use `/home/yourname/` for paths
- Ensure execute permissions on installed tools
- May need to add npm global bin to PATH

## Next Steps

### Beginner Path

1. ✅ You are here: Quick Start
2. 📖 Read [USAGE_GUIDE.md](USAGE_GUIDE.md) for comprehensive documentation
3. 🧪 Explore individual server READMEs in `src/[server-name]/`
4. 🎯 Try the example use cases in the Usage Guide

### Advanced Path

1. 🏗️ Read [ARCHITECTURE.md](ARCHITECTURE.md) to understand how MCP works
2. 🔧 Check [DEVELOPMENT.md](DEVELOPMENT.md) for development setup
3. 🚀 Create your own server using the SDK
4. 🤝 Contribute improvements back to the project

## Example Workflows

### Workflow 1: Code Assistant

**Setup**: Filesystem + Git + Memory

**Example conversation**:
```
1. "Read the README.md file and remember the project structure"
2. "What are the main functions in src/index.js?"
3. "Show me the git diff for the last commit"
4. "Create a new branch called feature/new-api"
```

### Workflow 2: Research Assistant

**Setup**: Fetch + Memory

**Example conversation**:
```
1. "Fetch https://example.com/article and summarize it"
2. "Remember that this article discusses topic X"
3. "What have we learned about topic X today?"
```

### Workflow 3: Documentation Writer

**Setup**: Filesystem + Git + Fetch

**Example conversation**:
```
1. "Read the existing docs/README.md"
2. "Fetch https://docs.example.com for reference"
3. "Update the README with a new section about feature Y"
4. "Show me the diff of what you changed"
5. "Commit the changes with message 'docs: add feature Y section'"
```

## Getting Help

- **Documentation**: [Full Usage Guide](USAGE_GUIDE.md)
- **Issues**: [GitHub Issues](https://github.com/modelcontextprotocol/servers/issues)
- **Community**: [Discord Server](https://discord.gg/mcp)
- **Examples**: See `src/[server-name]/README.md` for server-specific examples

## Useful Commands

```bash
# Test TypeScript server
npx -y @modelcontextprotocol/server-memory

# Test Python server
uvx mcp-server-git

# Debug with MCP Inspector
npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-memory

# Check Node.js version
node --version

# Check Python version
python --version

# Check uv version
uv --version

# Validate JSON config
cat config.json | python -m json.tool
```

---

**Congratulations!** You now have MCP servers running. Start exploring and building amazing AI-powered workflows!

For more detailed information, see:
- [USAGE_GUIDE.md](USAGE_GUIDE.md) - Comprehensive documentation
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Detailed problem solving
- [ARCHITECTURE.md](ARCHITECTURE.md) - Understanding MCP internals
