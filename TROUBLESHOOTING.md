# MCP Servers Troubleshooting Guide

Comprehensive troubleshooting guide for Model Context Protocol (MCP) servers.

## Table of Contents

1. [Diagnostic Tools](#diagnostic-tools)
2. [Common Issues](#common-issues)
3. [Server-Specific Issues](#server-specific-issues)
4. [Platform-Specific Issues](#platform-specific-issues)
5. [Performance Issues](#performance-issues)
6. [Security Issues](#security-issues)
7. [Advanced Debugging](#advanced-debugging)

## Diagnostic Tools

### Check Server Health

#### Test Server Directly

Before debugging client configuration, test if the server works:

**TypeScript Servers**:
```bash
# Test memory server
npx -y @modelcontextprotocol/server-memory

# Should output JSON-RPC messages
# Press Ctrl+C to exit
```

**Python Servers**:
```bash
# Test git server
uvx mcp-server-git

# Should output JSON-RPC messages
# Press Ctrl+C to exit
```

If this fails, the problem is with the server installation, not configuration.

#### Check Prerequisites

```bash
# Node.js version (need 18+)
node --version

# npm version
npm --version

# Python version (need 3.10+)
python --version
# or
python3 --version

# uv version
uv --version

# Check if command exists
which npx     # Should show path to npx
which uvx     # Should show path to uvx
```

### View Client Logs

#### Claude Desktop

**macOS**:
```bash
# View latest log
tail -f ~/Library/Logs/Claude/mcp*.log

# View all MCP logs
cat ~/Library/Logs/Claude/mcp*.log

# View logs from today
ls -lt ~/Library/Logs/Claude/mcp*.log | head -5
```

**Windows**:
```powershell
# View latest log
Get-Content "$env:APPDATA\Claude\logs\mcp*.log" -Wait

# View all MCP logs
Get-Content "$env:APPDATA\Claude\logs\mcp*.log"
```

**Linux**:
```bash
tail -f ~/.config/Claude/logs/mcp*.log
```

#### VS Code

Open the Output panel:
1. View → Output (or `Ctrl+Shift+U`)
2. Select "GitHub Copilot" from dropdown
3. Look for MCP-related messages

### MCP Inspector

The MCP Inspector is the best tool for debugging:

```bash
# Install
npm install -g @modelcontextprotocol/inspector

# Test TypeScript server
npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-memory

# Test Python server
npx @modelcontextprotocol/inspector uvx mcp-server-git

# Test with arguments
npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-filesystem /tmp
```

**Features**:
- Interactive tool testing
- View capabilities
- See request/response flow
- Test error handling

### Validate JSON Configuration

```bash
# macOS/Linux
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | python -m json.tool

# Windows
Get-Content "$env:APPDATA\Claude\claude_desktop_config.json" | python -m json.tool

# Or use online validator
# Copy config to https://jsonlint.com/
```

## Common Issues

### Issue: Command Not Found

#### Symptom
```
Error: command not found: npx
Error: command not found: uvx
```

#### Cause
Required tools not installed or not in PATH.

#### Solution

**For npx**:
1. Install Node.js from [nodejs.org](https://nodejs.org/)
2. Verify installation:
   ```bash
   node --version
   npx --version
   ```
3. If still not working, restart terminal or add to PATH:
   ```bash
   # macOS/Linux (add to ~/.bashrc or ~/.zshrc)
   export PATH="$HOME/.npm-global/bin:$PATH"
   
   # Windows (add to system PATH)
   # Node.js installer usually does this automatically
   ```

**For uvx**:
1. Install uv:
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```
2. Restart terminal
3. Verify:
   ```bash
   uv --version
   uvx --version
   ```
4. If still not working:
   ```bash
   # macOS/Linux (add to ~/.bashrc or ~/.zshrc)
   export PATH="$HOME/.cargo/bin:$PATH"
   source ~/.bashrc  # or ~/.zshrc
   ```

### Issue: Server Not Starting

#### Symptom
- Server shows as "disconnected" in client
- No tools appear
- Logs show connection errors

#### Diagnosis
```bash
# Step 1: Test server directly
npx -y @modelcontextprotocol/server-memory

# Step 2: Check logs
tail -f ~/Library/Logs/Claude/mcp*.log

# Step 3: Look for error messages
grep -i error ~/Library/Logs/Claude/mcp*.log
```

#### Common Causes & Solutions

**1. Invalid JSON Configuration**
```json
❌ Wrong (trailing comma):
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
  }
}

✅ Correct:
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

**2. Wrong Path to Config File**

Ensure you're editing the correct file:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

**3. Permissions Issue**
```bash
# Check if config file is readable
ls -la ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Fix permissions if needed
chmod 644 ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**4. Client Not Restarted**

After changing configuration:
1. Completely quit Claude Desktop (Cmd+Q or Ctrl+Q)
2. Relaunch the application
3. Wait 10-15 seconds for servers to initialize

### Issue: Permission Denied

#### Symptom
```
Error: Access denied
Error: EACCES: permission denied
Error: Path not allowed
```

#### Filesystem Server Issues

**Problem**: Trying to access paths not in allowed directories
```json
{
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/me/Documents"]
  }
}
```

**Solution**: Add all directories you need:
```json
{
  "filesystem": {
    "command": "npx",
    "args": [
      "-y",
      "@modelcontextprotocol/server-filesystem",
      "/Users/me/Documents",
      "/Users/me/Projects",
      "/Users/me/Downloads"
    ]
  }
}
```

**Problem**: File permissions

```bash
# Check permissions
ls -la /path/to/file

# Fix read permission
chmod +r /path/to/file

# Fix write permission
chmod +w /path/to/file

# Fix directory permissions
chmod +rx /path/to/directory
```

#### Git Server Issues

**Problem**: Repository not accessible
```bash
# Check if git repo exists
cd /path/to/repo
git status

# If not a git repo
git init

# Check permissions
ls -la /path/to/repo/.git
```

### Issue: Server Crashes Repeatedly

#### Symptom
- Server connects then immediately disconnects
- Logs show server restarting continuously
- Tools appear then disappear

#### Diagnosis

1. **Check system requirements**:
   ```bash
   node --version  # Need v18+
   python --version  # Need 3.10+
   ```

2. **Run server with error output**:
   ```bash
   npx -y @modelcontextprotocol/server-memory 2>&1 | tee server-error.log
   ```

3. **Check for resource issues**:
   ```bash
   # Check available memory
   free -h  # Linux
   vm_stat  # macOS
   
   # Check disk space
   df -h
   ```

#### Common Solutions

**1. Update Dependencies**
```bash
# Clear npm cache
npm cache clean --force

# Update npm
npm install -g npm

# Update specific package
npm install -g @modelcontextprotocol/server-memory@latest
```

**2. Fix Corrupted Installation**
```bash
# Remove global packages
npm uninstall -g @modelcontextprotocol/server-memory

# Clear npx cache
rm -rf ~/.npm/_npx

# Reinstall
npm install -g @modelcontextprotocol/server-memory
```

**3. Check for Conflicting Processes**
```bash
# Find processes using port (if using HTTP transport)
lsof -i :3000

# Kill process if needed
kill -9 <PID>
```

### Issue: Tools Not Appearing

#### Symptom
- Server shows as "connected"
- But no tools visible in client
- Can't use any server functionality

#### Diagnosis

1. **Check server capabilities**:
   ```bash
   npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-memory
   # Look for "tools" in capabilities
   ```

2. **Check initialization logs**:
   ```bash
   grep -A 20 "initialize" ~/Library/Logs/Claude/mcp*.log
   ```

#### Solutions

**1. Server doesn't support tools**

Some servers only provide resources or prompts. Check server documentation.

**2. Client doesn't support tool type**

Some older clients may not support all tool features. Update your client.

**3. Wrong server version**

```bash
# Check installed version
npm list -g @modelcontextprotocol/server-memory

# Update to latest
npm update -g @modelcontextprotocol/server-memory
```

### Issue: Slow Performance

#### Symptom
- Long delays when using tools
- Timeouts
- Client becomes unresponsive

#### Server-Specific Solutions

**Filesystem Server**:
```json
❌ Slow (too broad):
{
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/"]
}

✅ Fast (specific paths):
{
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "/Users/me/Documents/MyProject"
  ]
}
```

**Git Server**:
```bash
# Use shallow clone for large repos
git clone --depth 1 https://github.com/large/repo

# Or limit history
git config core.logAllRefUpdates false
```

**Fetch Server**:
```json
{
  "name": "fetch",
  "arguments": {
    "url": "https://example.com",
    "max_length": 1000  // Smaller content
  }
}
```

## Server-Specific Issues

### Memory Server

#### Issue: Memory Not Persisting

**Problem**: Data lost after restart

**Check**: Memory file location
```bash
# Default location
ls -la ~/.mcp/memory.json

# Or custom location
ls -la $MEMORY_FILE_PATH
```

**Solution**: Set explicit path
```json
{
  "memory": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-memory"],
    "env": {
      "MEMORY_FILE_PATH": "/Users/me/mcp-memory.json"
    }
  }
}
```

#### Issue: Corrupted Memory File

**Symptoms**: Server won't start, JSON parse errors

**Solution**:
```bash
# Backup current file
cp memory.json memory.json.backup

# Validate JSON
cat memory.json | python -m json.tool

# If corrupted, reset
echo '{"entities": [], "relations": []}' > memory.json
```

### Filesystem Server

#### Issue: Can't Access Subdirectories

**Problem**: Parent directory allowed but can't access children

**Solution**: The filesystem server should allow subdirectories automatically. If not:
```json
{
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "/Users/me/Projects"  // All subdirectories included
  ]
}
```

#### Issue: Symbolic Links Not Working

**Problem**: Can't follow symlinks

**Solution**: The filesystem server follows symlinks by default, but target must be in allowed directories:
```bash
# If /home/user/link -> /home/user/target
# Both paths must be allowed:
{
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "/home/user/link",
    "/home/user/target"
  ]
}
```

### Git Server

#### Issue: Repository Not Found

**Symptoms**: "Not a git repository" errors

**Check**:
```bash
# Verify git repo
cd /path/to/repo
git rev-parse --git-dir

# Should output: .git
```

**Solution**: Initialize if needed
```bash
cd /path/to/repo
git init
```

#### Issue: Git Operations Slow

**Problem**: Large repository causes timeouts

**Solutions**:
1. Use shallow clone
2. Limit history in logs:
   ```json
   {
     "name": "git_log",
     "arguments": {
       "max_count": 10  // Limit commits
     }
   }
   ```
3. Reduce diff context:
   ```json
   {
     "name": "git_diff",
     "arguments": {
       "context_lines": 0  // Minimal context
     }
   }
   ```

### Fetch Server

#### Issue: SSRF Security Warnings

**Problem**: Server can access internal IP addresses

**Understand**: This is by design, but be cautious:
```bash
# Fetch can access:
# - Public internet
# - Local network (192.168.x.x)
# - Localhost (127.0.0.1)
```

**Mitigation**:
1. Run in isolated network with Docker
2. Use proxy with filtering
3. Only use with trusted AI clients

#### Issue: robots.txt Blocking

**Problem**: Can't fetch certain sites

**Check**: User-agent configuration
```json
{
  "fetch": {
    "command": "uvx",
    "args": [
      "mcp-server-fetch",
      "--ignore-robots-txt"  // Use with caution
    ]
  }
}
```

## Platform-Specific Issues

### macOS Issues

#### Issue: "App is damaged" Error

**Solution**:
```bash
xattr -d com.apple.quarantine /path/to/app
```

#### Issue: Permission Dialogs

**Solution**: Grant full disk access:
1. System Preferences → Security & Privacy
2. Privacy → Full Disk Access
3. Add Claude or VS Code

### Windows Issues

#### Issue: Path Backslashes

**Problem**:
```json
❌ Wrong:
{"args": ["C:\Users\me\Documents"]}

✅ Correct:
{"args": ["C:/Users/me/Documents"]}
or
{"args": ["C:\\Users\\me\\Documents"]}
```

#### Issue: Permission Errors

**Solution**: Run as administrator or check folder permissions:
1. Right-click folder → Properties
2. Security tab
3. Edit permissions

### Linux Issues

#### Issue: Missing Dependencies

**Solution**:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install nodejs npm python3-pip

# Fedora/RHEL
sudo dnf install nodejs npm python3-pip

# Arch
sudo pacman -S nodejs npm python python-pip
```

#### Issue: PATH Issues

**Solution**:
```bash
# Add to ~/.bashrc or ~/.zshrc
export PATH="$HOME/.local/bin:$PATH"
export PATH="$HOME/.npm-global/bin:$PATH"
export PATH="$HOME/.cargo/bin:$PATH"

# Reload
source ~/.bashrc
```

## Performance Issues

### High CPU Usage

**Diagnosis**:
```bash
# Monitor server processes
top -p $(pgrep -f "mcp-server")

# Or
htop
```

**Solutions**:
1. Limit concurrent operations
2. Reduce logging verbosity
3. Use more specific paths/queries
4. Consider server restart

### High Memory Usage

**Diagnosis**:
```bash
# Check memory usage
ps aux | grep mcp-server
```

**Solutions**:
1. Restart servers periodically
2. Clear caches
3. Limit result sizes
4. Use pagination

### Network Latency

**For remote servers**:
1. Use caching
2. Reduce payload sizes
3. Consider local mirror
4. Check network path

## Security Issues

### Preventing Unauthorized Access

**Filesystem Server**:
```json
{
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "/Users/me/safe-directory"  // Only specific directory
  ]
}
```

**Docker Isolation**:
```bash
docker run -i --rm \
  --read-only \  # Read-only filesystem
  --network none \  # No network access
  --mount type=bind,src=/data,dst=/data,readonly \  # Read-only mount
  mcp/filesystem /data
```

### Protecting Sensitive Data

**Environment Variables**:
```json
{
  "memory": {
    "env": {
      "MEMORY_FILE_PATH": "/secure/location/memory.json"
    }
  }
}
```

**File Permissions**:
```bash
# Restrict config file access
chmod 600 ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Restrict memory file
chmod 600 /path/to/memory.json
```

## Advanced Debugging

### Enable Detailed Logging

**Environment Variable**:
```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "DEBUG": "mcp:*",
        "NODE_DEBUG": "mcp"
      }
    }
  }
}
```

### Network Debugging

**For HTTP transport**:
```bash
# Monitor HTTP traffic
tcpdump -i lo0 -A port 3000

# Or use proxy
mitmproxy -p 8080
```

### Process Debugging

**Attach Debugger**:
```bash
# Find PID
ps aux | grep mcp-server

# Attach with lldb (macOS) or gdb (Linux)
lldb -p <PID>
```

### Custom Error Handling

**Create wrapper script**:
```bash
#!/bin/bash
# mcp-wrapper.sh

set -x  # Enable debug output
exec npx -y @modelcontextprotocol/server-memory "$@" 2>&1 | tee /tmp/mcp-debug.log
```

Use in config:
```json
{
  "command": "bash",
  "args": ["/path/to/mcp-wrapper.sh"]
}
```

## Getting Help

If you've tried these solutions and still have issues:

1. **Check GitHub Issues**: [github.com/modelcontextprotocol/servers/issues](https://github.com/modelcontextprotocol/servers/issues)
2. **Ask on Discord**: [Join MCP Community](https://discord.gg/mcp)
3. **Create Detailed Bug Report**:
   - Server name and version
   - Operating system and version
   - Client name and version
   - Steps to reproduce
   - Error messages from logs
   - Output from diagnostic commands

### Bug Report Template

```markdown
**Environment**:
- OS: macOS 13.0 / Windows 11 / Ubuntu 22.04
- Client: Claude Desktop 1.0.0
- Server: @modelcontextprotocol/server-memory@0.6.0
- Node: v20.0.0
- Python: 3.11.0

**Issue**: 
Brief description of the problem

**Steps to Reproduce**:
1. Configure server with X
2. Try to use tool Y
3. See error Z

**Expected Behavior**:
What should happen

**Actual Behavior**:
What actually happens

**Logs**:
```
Paste relevant log excerpts
```

**Configuration**:
```json
{
  "mcpServers": {
    // Your config
  }
}
```
```

---

**Last Updated**: January 2026
**Maintained by**: MCP Community

For updates to this guide, please [submit a PR](https://github.com/modelcontextprotocol/servers/pulls).
