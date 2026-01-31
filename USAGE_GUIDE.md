# Comprehensive MCP Servers Usage Guide

This guide provides detailed instructions for using, configuring, and troubleshooting Model Context Protocol (MCP) servers from this repository.

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Understanding MCP Architecture](#understanding-mcp-architecture)
4. [Installation Methods](#installation-methods)
5. [Configuring MCP Servers](#configuring-mcp-servers)
6. [Available Servers](#available-servers)
7. [Common Use Cases](#common-use-cases)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Configuration](#advanced-configuration)
10. [Development Guide](#development-guide)
11. [FAQ](#faq)

## Introduction

The Model Context Protocol (MCP) is an open standard that enables AI assistants to securely connect to local and remote resources. This repository contains reference implementations of MCP servers that demonstrate the protocol's capabilities and provide useful functionality for AI assistants.

### What is MCP?

MCP is a protocol that allows AI assistants (clients) to:
- Access tools and functions (Tools)
- Retrieve information from data sources (Resources)
- Use pre-configured prompt templates (Prompts)
- Request information about accessible directories (Roots)

### Why Use MCP?

- **Standardized Interface**: One protocol for all integrations
- **Security**: Controlled, sandboxed access to resources
- **Extensibility**: Easy to add new capabilities
- **Language Agnostic**: Works with any programming language
- **Open Source**: Community-driven development

## Prerequisites

### Required Software

#### For TypeScript/JavaScript Servers

1. **Node.js** (v18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

#### For Python Servers

1. **Python** (3.10 or higher)
   - Download from [python.org](https://www.python.org/)
   - Verify installation: `python --version` or `python3 --version`

2. **uv** (recommended) or **pip**
   - Install uv: `curl -LsSf https://astral.sh/uv/install.sh | sh`
   - Verify: `uv --version`
   - Or use pip: `python -m pip --version`

### Optional Tools

- **Docker**: For containerized deployment
- **Git**: For version control and cloning repositories

## Understanding MCP Architecture

### Components

```
┌─────────────────┐         ┌─────────────────┐
│   MCP Client    │         │   MCP Server    │
│  (e.g., Claude) │◄────────┤  (This Repo)    │
│                 │  MCP    │                 │
│                 │ Protocol│                 │
└─────────────────┘         └────────┬────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │    Resources    │
                            │ (Files, APIs,   │
                            │  Databases)     │
                            └─────────────────┘
```

### Protocol Features

1. **Tools**: Functions that the AI can call to perform actions
2. **Resources**: Data sources the AI can read from
3. **Prompts**: Pre-configured templates for common tasks
4. **Roots**: Information about accessible directories
5. **Sampling**: Requesting LLM completions from the client

### Transport Layers

MCP supports multiple transport mechanisms:
- **stdio**: Standard input/output (most common for local servers)
- **HTTP with SSE**: Server-Sent Events over HTTP (deprecated)
- **Streamable HTTP**: Modern HTTP-based transport

## Installation Methods

### Method 1: Direct Execution (Recommended)

#### TypeScript Servers

Use `npx` to run servers without installation:

```bash
# Run memory server
npx -y @modelcontextprotocol/server-memory

# Run filesystem server
npx -y @modelcontextprotocol/server-filesystem /path/to/allowed/directory

# Run everything server (test server)
npx -y @modelcontextprotocol/server-everything
```

#### Python Servers

Use `uvx` for direct execution:

```bash
# Run git server
uvx mcp-server-git

# Run fetch server
uvx mcp-server-fetch

# Run time server
uvx mcp-server-time
```

### Method 2: Global Installation

#### TypeScript Servers

```bash
# Install globally
npm install -g @modelcontextprotocol/server-memory

# Run installed server
mcp-server-memory
```

#### Python Servers

```bash
# With pip
pip install mcp-server-git

# Run installed server
python -m mcp_server_git
```

### Method 3: Docker Containers

```bash
# Run filesystem server with Docker
docker run -i --rm \
  --mount type=bind,src=/path/to/files,dst=/projects \
  mcp/filesystem /projects

# Run memory server with Docker
docker run -i --rm \
  -v claude-memory:/app/dist \
  mcp/memory
```

### Method 4: From Source

```bash
# Clone repository
git clone https://github.com/modelcontextprotocol/servers.git
cd servers

# Install dependencies
npm install

# Build all servers
npm run build

# Run a specific server
cd src/memory
npm start
```

## Configuring MCP Servers

### Claude Desktop Configuration

The most common way to use MCP servers is with Claude Desktop. Configuration is done via a JSON file located at:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

#### Basic Configuration

```json
{
  "mcpServers": {
    "server-name": {
      "command": "command-to-run",
      "args": ["arg1", "arg2"],
      "env": {
        "ENV_VAR": "value"
      }
    }
  }
}
```

#### Example: Multiple Servers

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
        "/Users/username/Documents",
        "/Users/username/Projects"
      ]
    },
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git"]
    }
  }
}
```

### VS Code Configuration

VS Code supports MCP through the Copilot extension. Configuration can be:

1. **User-level**: Open Command Palette → "MCP: Open User Configuration"
2. **Workspace-level**: Create `.vscode/mcp.json` in your project

#### Example VS Code Configuration

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

### Zed Editor Configuration

Add to your Zed `settings.json`:

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

## Available Servers

### 1. Everything Server

**Purpose**: Test server demonstrating all MCP features

**Installation**:
```bash
npx -y @modelcontextprotocol/server-everything
```

**Features**:
- Tools: echo, add, longRunningOperation, sampleLLM, getTinyImage
- Resources: 100 test resources (odd/even numbered)
- Prompts: simple_prompt, complex_prompt, resource_prompt
- Roots support
- Progress notifications
- Sampling capability

**Use Cases**:
- Testing MCP client implementations
- Learning MCP protocol features
- Debugging MCP integrations

**Configuration Example**:
```json
{
  "mcpServers": {
    "everything": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-everything"]
    }
  }
}
```

### 2. Filesystem Server

**Purpose**: Secure file operations with access control

**Installation**:
```bash
npx -y @modelcontextprotocol/server-filesystem /path/to/directory
```

**Features**:
- Tools: read_text_file, read_media_file, write_file, edit_file, create_directory, list_directory, search_files, get_file_info
- Directory access control (via args or Roots protocol)
- Support for multiple allowed directories
- Pattern-based file searching
- Git-style diff output for edits

**Use Cases**:
- File content analysis
- Code editing and refactoring
- Document processing
- Directory structure exploration

**Configuration Example**:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/username/Documents",
        "/Users/username/Projects"
      ]
    }
  }
}
```

**Security Note**: The server only allows operations within explicitly specified directories.

### 3. Git Server

**Purpose**: Git repository interaction and automation

**Installation**:
```bash
uvx mcp-server-git
```

**Features**:
- Tools: git_status, git_diff, git_commit, git_add, git_log, git_create_branch, git_checkout, git_show, git_init
- Read git history and diffs
- Create and switch branches
- Stage and commit changes
- Repository initialization

**Use Cases**:
- Automated code reviews
- Commit message generation
- Branch management
- Git history analysis

**Configuration Example**:
```json
{
  "mcpServers": {
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git", "--repository", "/path/to/repo"]
    }
  }
}
```

### 4. Memory Server

**Purpose**: Knowledge graph-based persistent memory

**Installation**:
```bash
npx -y @modelcontextprotocol/server-memory
```

**Features**:
- Tools: create_entities, create_relations, add_observations, delete_entities, delete_observations, read_graph, search_nodes, open_nodes
- Persistent storage of information
- Entity-relationship modeling
- Graph-based querying

**Use Cases**:
- Maintaining user preferences across conversations
- Tracking project context
- Building knowledge bases
- Remembering conversation history

**Configuration Example**:
```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "MEMORY_FILE_PATH": "/path/to/custom/memory.json"
      }
    }
  }
}
```

**System Prompt Suggestion**:
```
Follow these steps for each interaction:
1. Always begin by saying "Remembering..." and retrieve relevant information
2. While conversing, note new information about identity, behaviors, preferences, goals, and relationships
3. Update memory with new entities, relations, and observations
```

### 5. Fetch Server

**Purpose**: Web content fetching and conversion

**Installation**:
```bash
uvx mcp-server-fetch
```

**Features**:
- Tools: fetch (with markdown conversion)
- HTML to markdown conversion
- Pagination support via start_index
- User-agent customization
- robots.txt compliance

**Use Cases**:
- Web scraping for AI analysis
- Documentation retrieval
- Content extraction
- Research automation

**Configuration Example**:
```json
{
  "mcpServers": {
    "fetch": {
      "command": "uvx",
      "args": [
        "mcp-server-fetch",
        "--user-agent=MyBot/1.0",
        "--ignore-robots-txt"
      ]
    }
  }
}
```

**Security Warning**: Can access local/internal IP addresses. Use with caution.

### 6. Time Server

**Purpose**: Time and timezone operations

**Installation**:
```bash
uvx mcp-server-time
```

**Features**:
- Tools: get_current_time, convert_time
- IANA timezone support
- Automatic system timezone detection
- DST (Daylight Saving Time) awareness

**Use Cases**:
- Scheduling across timezones
- Time calculations
- Date/time conversions
- Meeting coordination

**Configuration Example**:
```json
{
  "mcpServers": {
    "time": {
      "command": "uvx",
      "args": ["mcp-server-time", "--local-timezone=America/New_York"]
    }
  }
}
```

### 7. Sequential Thinking Server

**Purpose**: Structured problem-solving through thought sequences

**Installation**:
```bash
npx -y @modelcontextprotocol/server-sequential-thinking
```

**Features**:
- Tools: sequential_thinking
- Step-by-step reasoning
- Thought revision and branching
- Dynamic thought count adjustment

**Use Cases**:
- Complex problem decomposition
- Multi-step planning
- Iterative problem solving
- Thought process documentation

**Configuration Example**:
```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "env": {
        "DISABLE_THOUGHT_LOGGING": "false"
      }
    }
  }
}
```

### 8. FTP Server (gcloud-ftp Bridge)

**Purpose**: FTP tools backed by the gcloud-ftp Google Drive adapter

**Installation**:
```bash
npx -y @modelcontextprotocol/server-ftp
```

**Prerequisites**:
- Build `gcloud-ftp` so `dist/index.js` exists
- Place `client_secrets.json` in the gcloud-ftp root and complete OAuth once
 - Full test checklist: [FTP_FULL_TEST.md](FTP_FULL_TEST.md)

**One-time Authorization (gcloud-ftp)**:
1. `cd /absolute/path/to/gcloud-ftp`
2. `npm install`
3. `npm run build`
4. `node dist/index.js`
5. Open the printed URL, approve access, paste the code into the prompt
6. Confirm a token file was created at `cache/token-<account>.json`, then stop the server

**Features**:
- Tools: ftp_list, ftp_download, ftp_upload, ftp_delete, ftp_rename, ftp_mkdir, ftp_rmdir, ftp_stat, ftp_pwd
- Auto-starts the local gcloud-ftp process when needed
- Uses standard FTP credentials (default: user/user)

**Use Cases**:
- Access Google Drive through FTP via MCP tools
- Automate uploads/downloads and directory management
- Integrate Drive-backed workflows into IDE/CLI agents

**Configuration Examples**:

**VS Code** (`.vscode/mcp.json`)
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

**Codex CLI** (`~/.codex/config.toml`)
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

**Copilot CLI** (`~/.copilot/mcp-config.json`)
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

## Common Use Cases

### Use Case 1: Local Development Assistant

**Goal**: Help with coding tasks in a local project

**Setup**:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/me/myproject"]
    },
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git", "--repository", "/Users/me/myproject"]
    }
  }
}
```

**Capabilities**:
- Read and edit project files
- View git diffs and history
- Create commits with AI-generated messages
- Search for specific code patterns

### Use Case 2: Research Assistant

**Goal**: Web research with memory

**Setup**:
```json
{
  "mcpServers": {
    "fetch": {
      "command": "uvx",
      "args": ["mcp-server-fetch"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

**Capabilities**:
- Fetch and analyze web pages
- Store research findings in knowledge graph
- Track relationships between concepts
- Retrieve relevant information across sessions

### Use Case 3: Documentation Writer

**Goal**: Create and maintain project documentation

**Setup**:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/me/docs"]
    },
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git", "--repository", "/Users/me/docs"]
    },
    "fetch": {
      "command": "uvx",
      "args": ["mcp-server-fetch"]
    }
  }
}
```

**Capabilities**:
- Read existing documentation
- Edit and create new docs
- Research external resources
- Commit documentation changes

### Use Case 4: Scheduling Assistant

**Goal**: Manage schedules across timezones

**Setup**:
```json
{
  "mcpServers": {
    "time": {
      "command": "uvx",
      "args": ["mcp-server-time"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

**Capabilities**:
- Convert times between zones
- Remember user's timezone preferences
- Calculate meeting times
- Track participant locations

## Troubleshooting

### Common Issues and Solutions

#### Issue: Server Not Starting

**Symptoms**:
- Error message in Claude Desktop logs
- Server shows as "disconnected" in client

**Solutions**:

1. **Check command availability**:
   ```bash
   # For npx servers
   which npx
   node --version
   
   # For uvx servers
   which uvx
   uv --version
   ```

2. **Verify installation**:
   ```bash
   # Test server directly
   npx -y @modelcontextprotocol/server-memory
   # Should output server communication
   ```

3. **Check logs**:
   - **macOS**: `~/Library/Logs/Claude/mcp*.log`
   - **Windows**: `%APPDATA%\Claude\logs\mcp*.log`

4. **Validate JSON configuration**:
   - Use a JSON validator
   - Check for trailing commas
   - Ensure proper escaping of paths

#### Issue: Permission Denied

**Symptoms**:
- "Access denied" errors
- "Path not allowed" messages

**Solutions**:

1. **Filesystem Server**: Ensure paths are explicitly allowed
   ```json
   {
     "args": ["-y", "@modelcontextprotocol/server-filesystem", "/correct/path"]
   }
   ```

2. **Check file permissions**:
   ```bash
   ls -la /path/to/file
   chmod +r /path/to/file  # Add read permission
   ```

3. **On Windows**: Use proper path format
   ```json
   "args": ["C:\\Users\\username\\Documents"]
   ```

#### Issue: Server Crashes Repeatedly

**Symptoms**:
- Server restarts continuously
- Connection drops frequently

**Solutions**:

1. **Check Node.js/Python version**:
   ```bash
   node --version  # Should be v18+
   python --version  # Should be 3.10+
   ```

2. **Update dependencies**:
   ```bash
   npm install -g npm
   pip install --upgrade pip
   ```

3. **Look for error messages** in logs
4. **Try running server standalone** to see error output

#### Issue: Tools Not Appearing

**Symptoms**:
- Server connected but no tools available
- Some tools missing

**Solutions**:

1. **Restart the client** (e.g., Claude Desktop)
2. **Check server initialization** in logs
3. **Verify protocol compatibility** - ensure client and server versions match
4. **Check tool availability** - some tools may be conditionally enabled

#### Issue: Slow Performance

**Symptoms**:
- Long response times
- Timeouts

**Solutions**:

1. **For Filesystem Server**:
   - Limit allowed directories to relevant paths
   - Use specific paths instead of broad directories
   - Avoid network-mounted drives

2. **For Fetch Server**:
   - Use smaller max_length values
   - Enable pagination with start_index

3. **For Git Server**:
   - Specify repository explicitly
   - Use shallow clones for large repos

#### Issue: Docker Container Problems

**Symptoms**:
- Container fails to start
- Cannot access mounted volumes

**Solutions**:

1. **Check Docker installation**:
   ```bash
   docker --version
   docker run hello-world
   ```

2. **Verify mount paths** exist:
   ```bash
   ls -la /path/to/mount
   ```

3. **Check Docker logs**:
   ```bash
   docker logs <container-id>
   ```

4. **Use absolute paths** in mount configuration

### Debugging Tools

#### MCP Inspector

The MCP Inspector is a valuable debugging tool:

```bash
# Install
npm install -g @modelcontextprotocol/inspector

# Use with npx server
npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-memory

# Use with uvx server
npx @modelcontextprotocol/inspector uvx mcp-server-git
```

**Features**:
- Interactive tool testing
- Request/response inspection
- Server capability exploration
- Real-time debugging

#### Enabling Debug Logs

For detailed debugging:

1. **Set environment variable**:
   ```json
   {
     "env": {
       "DEBUG": "*"
     }
   }
   ```

2. **Check server-specific logging options**
   - Sequential Thinking: `DISABLE_THOUGHT_LOGGING`
   - Others may have similar options

## Advanced Configuration

### Environment Variables

Many servers support environment variable configuration:

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "MEMORY_FILE_PATH": "/custom/path/memory.json",
        "DEBUG": "mcp:*"
      }
    }
  }
}
```

### Custom Transport Configuration

#### HTTP with SSE (Deprecated)

```bash
cd src/everything
npm run start:sse
```

Configure client to connect to `http://localhost:3000/sse`

#### Streamable HTTP

```bash
cd src/everything
npm run start:streamableHttp
```

Configure client to connect to the HTTP endpoint

### Proxy Configuration

For servers behind a proxy:

```json
{
  "mcpServers": {
    "fetch": {
      "command": "uvx",
      "args": ["mcp-server-fetch", "--proxy-url=http://proxy:8080"],
      "env": {
        "HTTP_PROXY": "http://proxy:8080",
        "HTTPS_PROXY": "http://proxy:8080"
      }
    }
  }
}
```

### Security Best Practices

1. **Filesystem Access**:
   - Use minimal necessary paths
   - Consider read-only mounts with Docker
   - Avoid system directories

2. **Git Operations**:
   - Use dedicated repositories for AI
   - Don't expose production repos directly
   - Review commits before pushing

3. **Web Fetching**:
   - Be aware of SSRF risks with fetch server
   - Consider network isolation
   - Use allowlist for domains if possible

4. **Memory Storage**:
   - Encrypt sensitive data at rest
   - Use custom memory file paths
   - Regularly audit stored information

## Development Guide

### Setting Up Development Environment

1. **Clone the repository**:
   ```bash
   git clone https://github.com/modelcontextprotocol/servers.git
   cd servers
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build all servers**:
   ```bash
   npm run build
   ```

4. **Watch mode for development**:
   ```bash
   npm run watch
   ```

### Project Structure

```
servers/
├── src/
│   ├── everything/       # Test/demo server
│   ├── filesystem/       # File operations
│   ├── git/             # Git integration
│   ├── memory/          # Knowledge graph
│   ├── fetch/           # Web fetching
│   ├── time/            # Time operations
│   └── sequentialthinking/  # Problem solving
├── package.json         # Workspace configuration
├── tsconfig.json        # TypeScript config
└── README.md           # Main documentation
```

### Adding a New Tool to a Server

Example: Adding a new tool to the memory server:

1. **Define the tool**:
   ```typescript
   server.setRequestHandler(ListToolsRequestSchema, async () => ({
     tools: [
       // ... existing tools
       {
         name: "my_new_tool",
         description: "Description of what it does",
         inputSchema: {
           type: "object",
           properties: {
             param1: {
               type: "string",
               description: "First parameter"
             }
           },
           required: ["param1"]
         }
       }
     ]
   }));
   ```

2. **Implement the handler**:
   ```typescript
   server.setRequestHandler(CallToolRequestSchema, async (request) => {
     if (request.params.name === "my_new_tool") {
       const { param1 } = request.params.arguments;
       // Implementation
       return {
         content: [
           {
             type: "text",
             text: `Result: ${param1}`
           }
         ]
       };
     }
   });
   ```

3. **Test the tool**:
   ```bash
   npm run build
   npx @modelcontextprotocol/inspector npm start
   ```

### Running Tests

For servers with test suites (e.g., filesystem):

```bash
cd src/filesystem
npm test
npm test -- --coverage  # With coverage
```

### Building Docker Images

```bash
# Build specific server
cd src/memory
docker build -t mcp/memory -f Dockerfile ../..

# Build from root
docker build -t mcp/filesystem -f src/filesystem/Dockerfile .
```

### Publishing to npm

```bash
# Build all
npm run build

# Publish all workspaces
npm run publish-all
```

## FAQ

### General Questions

**Q: What's the difference between Tools, Resources, and Prompts?**

A: 
- **Tools** are functions the AI can call to perform actions (e.g., write_file, git_commit)
- **Resources** are data sources the AI can read from (e.g., file contents, API responses)
- **Prompts** are pre-configured templates for common tasks

**Q: Can I use multiple MCP servers simultaneously?**

A: Yes! Configure multiple servers in your client's config file. They'll all be available to the AI.

**Q: Which servers are TypeScript vs Python?**

A: 
- TypeScript: everything, filesystem, memory, sequential-thinking
- Python: git, fetch, time, datagen

**Q: Do I need to restart my client after changing server configuration?**

A: Yes, most clients require a restart to pick up configuration changes.

### Technical Questions

**Q: How do I pass arguments with spaces in paths?**

A: Use array format in JSON:
```json
"args": ["--path", "/Users/My Name/Documents"]
```

**Q: Can servers communicate with each other?**

A: No, servers operate independently. The client coordinates between them.

**Q: How do I debug a server that's not working?**

A: 
1. Check client logs
2. Run server standalone to see output
3. Use MCP Inspector
4. Add DEBUG environment variable

**Q: What happens if two servers provide tools with the same name?**

A: The client will namespace them or may show both. Behavior depends on the client implementation.

**Q: Can I create a server in a language other than TypeScript or Python?**

A: Yes! MCP has SDKs for many languages including Go, Rust, C#, Java, Kotlin, PHP, Ruby, and Swift.

### Security Questions

**Q: Are MCP servers safe to use?**

A: MCP servers run with the same permissions as your user account. Only use servers from trusted sources and configure appropriate restrictions.

**Q: Can AI access my entire filesystem?**

A: Only if you configure it that way. The filesystem server only accesses explicitly allowed directories.

**Q: What data do servers store?**

A: 
- Memory server: Stores knowledge graph in JSON file
- Others: Generally stateless, some may cache temporarily

**Q: Can servers access the internet?**

A: The fetch server can. Others typically don't unless they're specifically designed for that purpose.

### Performance Questions

**Q: Why is my server slow?**

A: 
- Large directory structures (filesystem)
- Network latency (fetch)
- Large git repositories (git)
- Try limiting scope or using specific paths

**Q: How many servers can I run at once?**

A: No hard limit, but each server consumes resources. Start with a few essential servers.

**Q: Do servers run continuously?**

A: Typically yes, while the client is running. They idle when not in use.

## Additional Resources

### Official Documentation

- **MCP Website**: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **Protocol Specification**: [spec.modelcontextprotocol.io](https://spec.modelcontextprotocol.io)
- **GitHub Repository**: [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)

### Community

- **Discord**: [MCP Community Discord](https://discord.gg/mcp)
- **GitHub Discussions**: [Ask questions and share ideas](https://github.com/modelcontextprotocol/servers/discussions)

### Related Projects

- **Claude Desktop**: Official client from Anthropic
- **VS Code Extension**: GitHub Copilot with MCP support
- **Zed Editor**: Native MCP support
- **Community Servers**: Hundreds of third-party MCP servers (see main README)

### Video Tutorials

- Introduction to MCP: [YouTube Playlist](#)
- Building Your First Server: [YouTube Video](#)
- Advanced MCP Techniques: [YouTube Series](#)

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

---

**Last Updated**: January 2026
**Version**: 1.0
**Maintainers**: MCP Community

For questions or issues, please [open an issue](https://github.com/modelcontextprotocol/servers/issues) on GitHub.
