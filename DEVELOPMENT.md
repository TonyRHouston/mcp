# Development Guide

Guide for developing, testing, and contributing to MCP servers.

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Project Structure](#project-structure)
3. [Building from Source](#building-from-source)
4. [Testing](#testing)
5. [Creating a New Server](#creating-a-new-server)
6. [Debugging](#debugging)
7. [Code Style and Standards](#code-style-and-standards)
8. [Publishing](#publishing)

## Development Environment Setup

### Prerequisites

1. **Node.js 18+** and **npm**
   ```bash
   node --version  # Should be v18+
   npm --version
   ```

2. **Python 3.10+** and **uv** (for Python servers)
   ```bash
   python --version  # Should be 3.10+
   uv --version
   ```

3. **Git**
   ```bash
   git --version
   ```

4. **Docker** (optional, for container builds)
   ```bash
   docker --version
   ```

### Clone and Setup

```bash
# Clone repository
git clone https://github.com/modelcontextprotocol/servers.git
cd servers

# Install dependencies for all workspaces
npm install

# Build all servers
npm run build
```

### Editor Setup

#### VS Code (Recommended)

Install recommended extensions:
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Python
- Jest

Settings (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

#### Other Editors

- **Vim/Neovim**: Use CoC or LSP
- **Emacs**: Use LSP mode
- **IntelliJ/WebStorm**: Built-in TypeScript support

## Project Structure

```
servers/
├── .github/                 # GitHub Actions workflows
├── scripts/                 # Build and utility scripts
├── src/                     # Server implementations
│   ├── everything/         # Test server (TypeScript)
│   ├── filesystem/         # File operations (TypeScript)
│   ├── memory/             # Knowledge graph (TypeScript)
│   ├── sequentialthinking/ # Problem solving (TypeScript)
│   ├── git/                # Git operations (Python)
│   ├── fetch/              # Web fetching (Python)
│   ├── time/               # Time operations (Python)
│   └── datagen/            # Data generation (Python)
├── package.json            # Root workspace config
├── tsconfig.json           # TypeScript configuration
├── README.md               # Main documentation
├── USAGE_GUIDE.md          # User guide
├── QUICK_START.md          # Quick start guide
├── ARCHITECTURE.md         # Architecture documentation
├── TROUBLESHOOTING.md      # Troubleshooting guide
└── DEVELOPMENT.md          # This file
```

### TypeScript Server Structure

```
src/servername/
├── src/
│   ├── index.ts           # Entry point
│   ├── handlers.ts        # Tool/resource handlers
│   ├── types.ts           # Type definitions
│   └── utils.ts           # Utility functions
├── dist/                  # Compiled output (gitignored)
├── __tests__/             # Jest tests
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript config
├── README.md              # Server documentation
└── Dockerfile             # Container image
```

### Python Server Structure

```
src/servername/
├── src/
│   └── mcp_server_name/
│       ├── __init__.py
│       └── server.py     # Main server code
├── tests/                # Pytest tests
├── pyproject.toml        # Dependencies (uv/pip)
├── uv.lock               # Lock file
├── README.md             # Server documentation
└── Dockerfile            # Container image
```

## Building from Source

### Build All Servers

```bash
# From repository root
npm run build

# Or build and watch for changes
npm run watch
```

### Build Individual Server

**TypeScript**:
```bash
cd src/filesystem
npm run build

# Or watch mode
npm run watch
```

**Python**:
```bash
cd src/git
uv sync --frozen --all-extras --dev

# Or with pip
pip install -e .
```

### Build Docker Images

**Individual server**:
```bash
# From repository root
docker build -t mcp/filesystem -f src/filesystem/Dockerfile .

# Or from server directory
cd src/memory
docker build -t mcp/memory -f Dockerfile ../..
```

**All servers**:
```bash
# Using script (if available)
./scripts/build-all-docker.sh
```

## Testing

### TypeScript Tests

**Run tests** (example: filesystem server):
```bash
cd src/filesystem
npm test

# With coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Specific test file
npm test -- path-validation.test.ts
```

**Test Structure**:
```typescript
// __tests__/example.test.ts
import { describe, it, expect } from "@jest/globals";
import { myFunction } from "../src/utils.js";

describe("myFunction", () => {
  it("should do something", () => {
    expect(myFunction("input")).toBe("expected");
  });

  it("should handle errors", () => {
    expect(() => myFunction(null)).toThrow();
  });
});
```

### Python Tests

**Run tests**:
```bash
cd src/git
uv run pytest

# With coverage
uv run pytest --cov=mcp_server_git --cov-report=html

# Specific test file
uv run pytest tests/test_server.py

# Verbose output
uv run pytest -v
```

**Test Structure**:
```python
# tests/test_example.py
import pytest
from mcp_server_git import my_function

def test_my_function():
    assert my_function("input") == "expected"

def test_my_function_error():
    with pytest.raises(ValueError):
        my_function(None)

@pytest.mark.asyncio
async def test_async_function():
    result = await async_function()
    assert result is not None
```

### Integration Tests

**Using MCP Inspector**:
```bash
# Install inspector
npm install -g @modelcontextprotocol/inspector

# Test TypeScript server
npx @modelcontextprotocol/inspector npm --prefix src/memory start

# Test Python server
npx @modelcontextprotocol/inspector uv --directory src/git run mcp-server-git

# With arguments
npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-filesystem /tmp
```

**Manual Testing**:
```bash
# Run server and pipe test input
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | \
  npx -y @modelcontextprotocol/server-memory
```

## Creating a New Server

### Option 1: From Template (TypeScript)

```bash
# Copy existing server as template
cp -r src/memory src/myserver

# Update package.json
cd src/myserver
# Edit: name, description, bin name

# Update code
# Edit src/index.ts to implement your server

# Build and test
npm run build
npx @modelcontextprotocol/inspector npm start
```

### Option 2: From Template (Python)

```bash
# Copy existing server as template
cp -r src/git src/myserver

# Update pyproject.toml
cd src/myserver
# Edit: name, description

# Update code
# Edit src/mcp_server_myserver/server.py

# Build and test
uv sync
npx @modelcontextprotocol/inspector uv run mcp-server-myserver
```

### Option 3: Using SDK Directly

**TypeScript**:
```bash
mkdir src/myserver
cd src/myserver
npm init -y
npm install @modelcontextprotocol/sdk zod zod-to-json-schema
```

Create `src/index.ts`:
```typescript
#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "myserver",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "my_tool",
      description: "Description of what this tool does",
      inputSchema: {
        type: "object",
        properties: {
          input: {
            type: "string",
            description: "Input parameter",
          },
        },
        required: ["input"],
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "my_tool") {
    const { input } = args as { input: string };
    
    // Your implementation here
    const result = `Processed: ${input}`;

    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
```

**Python**:
```bash
mkdir -p src/myserver/src/mcp_server_myserver
cd src/myserver
uv init --lib
uv add mcp
```

Create `src/mcp_server_myserver/server.py`:
```python
#!/usr/bin/env python
import asyncio
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

server = Server("myserver")

@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="my_tool",
            description="Description of what this tool does",
            inputSchema={
                "type": "object",
                "properties": {
                    "input": {
                        "type": "string",
                        "description": "Input parameter"
                    }
                },
                "required": ["input"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name == "my_tool":
        input_value = arguments["input"]
        result = f"Processed: {input_value}"
        
        return [TextContent(type="text", text=result)]
    
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream)

if __name__ == "__main__":
    asyncio.run(main())
```

### Adding Tools

**Define tool schema**:
```typescript
{
  name: "tool_name",
  description: "Clear description of what it does",
  inputSchema: {
    type: "object",
    properties: {
      param1: {
        type: "string",
        description: "Parameter description"
      },
      param2: {
        type: "number",
        description: "Optional parameter",
      }
    },
    required: ["param1"]  // Only required params
  }
}
```

**Implement handler**:
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "tool_name":
      // Extract and validate arguments
      const { param1, param2 } = args as {
        param1: string;
        param2?: number;
      };

      // Your implementation
      const result = await doSomething(param1, param2);

      // Return result
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});
```

### Adding Resources

```typescript
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// List resources
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "resource://myserver/data",
      name: "My Data",
      description: "Description of this resource",
      mimeType: "application/json"
    }
  ]
}));

// Read resource
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === "resource://myserver/data") {
    const data = await fetchData();
    
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});
```

### Adding Prompts

```typescript
import {
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// List prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [
    {
      name: "my_prompt",
      description: "Description of the prompt",
      arguments: [
        {
          name: "arg1",
          description: "Argument description",
          required: true
        }
      ]
    }
  ]
}));

// Get prompt
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "my_prompt") {
    const { arg1 } = args as { arg1: string };
    
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Your prompt template using ${arg1}`
          }
        }
      ]
    };
  }

  throw new Error(`Unknown prompt: ${name}`);
});
```

## Debugging

### Using MCP Inspector

Best tool for interactive debugging:
```bash
npx @modelcontextprotocol/inspector npm start
```

Features:
- View server capabilities
- Test tools interactively
- See request/response flow
- Debug errors

### Logging

**TypeScript**:
```typescript
// Server-side logging
server.sendLoggingMessage({
  level: "info",
  data: "Log message",
});

// Console.error goes to client logs
console.error("Error details");
```

**Python**:
```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info("Log message")
logger.error("Error details")
```

### Debug Configuration

**VS Code launch.json**:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "program": "${workspaceFolder}/src/myserver/dist/index.js",
      "console": "integratedTerminal"
    }
  ]
}
```

## Code Style and Standards

### TypeScript

**ESLint configuration** (`.eslintrc.json`):
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

**Prettier configuration** (`.prettierrc`):
```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2
}
```

### Python

**Ruff configuration** (`pyproject.toml`):
```toml
[tool.ruff]
line-length = 100
target-version = "py310"

[tool.ruff.lint]
select = ["E", "F", "I", "N", "W"]
```

### General Guidelines

1. **Error Handling**:
   - Always validate inputs
   - Provide clear error messages
   - Use proper error types

2. **Documentation**:
   - Document all public APIs
   - Include examples
   - Keep README up to date

3. **Security**:
   - Validate paths and inputs
   - Avoid command injection
   - Sanitize user data

4. **Testing**:
   - Write tests for new features
   - Maintain test coverage
   - Test error cases

## Publishing

### Pre-publish Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Version bumped
- [ ] Build successful
- [ ] No security vulnerabilities

### Version Bump

**TypeScript**:
```bash
cd src/myserver
npm version patch  # or minor, major
```

**Python**:
```bash
# Edit pyproject.toml
version = "0.1.1"  # Update version
```

### Publish to npm

```bash
cd src/myserver
npm run build
npm publish --access public
```

### Publish to PyPI

```bash
cd src/myserver
uv build
uv publish
```

### Docker Registry

```bash
# Build
docker build -t myserver:latest .

# Tag
docker tag myserver:latest registry/myserver:latest

# Push
docker push registry/myserver:latest
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Update documentation
6. Submit pull request

### Commit Messages

Follow conventional commits:
```
feat: add new tool
fix: correct error handling
docs: update README
test: add unit tests
chore: update dependencies
```

## Resources

- **MCP Specification**: [spec.modelcontextprotocol.io](https://spec.modelcontextprotocol.io)
- **TypeScript SDK Docs**: [github.com/modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk)
- **Python SDK Docs**: [github.com/modelcontextprotocol/python-sdk](https://github.com/modelcontextprotocol/python-sdk)
- **Community Discord**: [discord.gg/mcp](https://discord.gg/mcp)

---

**Last Updated**: January 2026
**Maintained by**: MCP Community
