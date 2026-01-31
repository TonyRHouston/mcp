# Documentation Index

Complete guide to MCP Servers documentation.

## 🎯 Quick Navigation

### For Users

- **New to MCP?** → Start with [QUICK_START.md](QUICK_START.md)
- **Need detailed instructions?** → See [USAGE_GUIDE.md](USAGE_GUIDE.md)
- **Having problems?** → Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Want to understand how it works?** → Read [ARCHITECTURE.md](ARCHITECTURE.md)

### For Developers

- **Contributing code?** → See [DEVELOPMENT.md](DEVELOPMENT.md)
- **Creating a new server?** → Check [DEVELOPMENT.md#creating-a-new-server](DEVELOPMENT.md#creating-a-new-server)
- **Submitting a PR?** → Read [CONTRIBUTING.md](CONTRIBUTING.md)

## 📚 Documentation Files

### [QUICK_START.md](QUICK_START.md)
**For beginners - Get started in 10 minutes**

- Prerequisites and installation
- Step-by-step configuration
- Testing your first server
- Platform-specific instructions
- Common quick start issues
- Example workflows

**Best for**: First-time users, quick setup

---

### [USAGE_GUIDE.md](USAGE_GUIDE.md)
**Comprehensive user guide - Everything you need to know**

- Introduction to MCP
- Understanding MCP architecture
- All installation methods
- Configuration for all clients (Claude Desktop, VS Code, Zed)
- Detailed documentation for all 8 reference servers
- Common use cases with examples
- Troubleshooting basics
- Advanced configuration
- Development guide
- FAQ

**Best for**: Understanding all features, advanced usage

---

### [FTP_FULL_TEST.md](FTP_FULL_TEST.md)
**End-to-end validation for the gcloud-ftp bridge**

- One-time OAuth steps
- CLI and MCP Inspector tests
- VS Code, Codex CLI, and Copilot CLI checks
- Troubleshooting and cleanup

**Best for**: Full integration testing, release validation

---

### [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
**Problem-solving guide - Fix any issue**

- Diagnostic tools
- Common issues and solutions
- Server-specific problems
- Platform-specific problems
- Performance optimization
- Security best practices
- Advanced debugging

**Best for**: When something isn't working

---

### [ARCHITECTURE.md](ARCHITECTURE.md)
**Technical deep dive - How MCP works**

- Protocol overview
- Core concepts (Tools, Resources, Prompts, Roots, Sampling)
- Communication flow
- Transport layers
- Server architecture patterns
- Security model
- Implementation details

**Best for**: Understanding internals, advanced development

---

### [DEVELOPMENT.md](DEVELOPMENT.md)
**Developer guide - Build and contribute**

- Development environment setup
- Project structure
- Building from source
- Testing strategies
- Creating new servers
- Debugging techniques
- Code standards
- Publishing process

**Best for**: Contributing, creating servers

---

### [README.md](README.md)
**Main repository page**

- Overview of MCP
- Reference servers list
- Third-party servers
- Community resources
- Quick getting started
- Links to all documentation

**Best for**: Repository overview, server discovery

---

### [CONTRIBUTING.md](CONTRIBUTING.md)
**Contribution guidelines**

- How to contribute
- Pull request process
- Code review guidelines
- What we accept/don't accept

**Best for**: Before submitting contributions

## 📖 Learning Paths

### Path 1: Quick Start (15 minutes)
1. Read [QUICK_START.md](QUICK_START.md)
2. Configure one server
3. Test it works
4. Try example prompts

### Path 2: Comprehensive Learning (1-2 hours)
1. [QUICK_START.md](QUICK_START.md) - Setup basics
2. [USAGE_GUIDE.md](USAGE_GUIDE.md) - Learn all features
3. [ARCHITECTURE.md](ARCHITECTURE.md) - Understand how it works
4. [Individual server READMEs](src/) - Deep dive into specific servers

### Path 3: Development Focus (2-3 hours)
1. [ARCHITECTURE.md](ARCHITECTURE.md) - Understand the system
2. [DEVELOPMENT.md](DEVELOPMENT.md) - Setup dev environment
3. [CONTRIBUTING.md](CONTRIBUTING.md) - Learn contribution process
4. Build your first server!

### Path 4: Troubleshooting
1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for your issue
2. Review [USAGE_GUIDE.md#troubleshooting](USAGE_GUIDE.md#troubleshooting)
3. Check server-specific README in `src/[server-name]/`
4. Ask on [Discord](https://discord.gg/mcp) or [GitHub Discussions](https://github.com/modelcontextprotocol/servers/discussions)

## 🔍 Find What You Need

### By Topic

**Installation & Setup**
- [QUICK_START.md](QUICK_START.md) - Quick setup
- [USAGE_GUIDE.md#installation-methods](USAGE_GUIDE.md#installation-methods) - All installation options
- [DEVELOPMENT.md#development-environment-setup](DEVELOPMENT.md#development-environment-setup) - Developer setup

**Configuration**
- [QUICK_START.md#step-3-configure-your-client](QUICK_START.md#step-3-configure-your-client) - Basic config
- [USAGE_GUIDE.md#configuring-mcp-servers](USAGE_GUIDE.md#configuring-mcp-servers) - Detailed config
- [USAGE_GUIDE.md#advanced-configuration](USAGE_GUIDE.md#advanced-configuration) - Advanced options

**Using Servers**
- [USAGE_GUIDE.md#available-servers](USAGE_GUIDE.md#available-servers) - Server documentation
- [USAGE_GUIDE.md#common-use-cases](USAGE_GUIDE.md#common-use-cases) - Usage examples
- Individual server READMEs in `src/[server-name]/README.md`

**Troubleshooting**
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Complete troubleshooting guide
- [QUICK_START.md#common-quick-start-issues](QUICK_START.md#common-quick-start-issues) - Quick fixes
- [USAGE_GUIDE.md#troubleshooting](USAGE_GUIDE.md#troubleshooting) - Basic troubleshooting

**Development**
- [DEVELOPMENT.md](DEVELOPMENT.md) - Complete developer guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines

**Understanding MCP**
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical details
- [USAGE_GUIDE.md#understanding-mcp-architecture](USAGE_GUIDE.md#understanding-mcp-architecture) - User-friendly overview
- [Official Specification](https://spec.modelcontextprotocol.io) - Protocol spec

### By Role

**I'm a User**
- Start: [QUICK_START.md](QUICK_START.md)
- Learn: [USAGE_GUIDE.md](USAGE_GUIDE.md)
- Problems: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

**I'm a Developer**
- Start: [DEVELOPMENT.md](DEVELOPMENT.md)
- Understand: [ARCHITECTURE.md](ARCHITECTURE.md)
- Contribute: [CONTRIBUTING.md](CONTRIBUTING.md)

**I'm Building a Server**
- Plan: [ARCHITECTURE.md](ARCHITECTURE.md)
- Build: [DEVELOPMENT.md#creating-a-new-server](DEVELOPMENT.md#creating-a-new-server)
- Test: [DEVELOPMENT.md#testing](DEVELOPMENT.md#testing)
- Publish: [DEVELOPMENT.md#publishing](DEVELOPMENT.md#publishing)

**I'm Integrating MCP**
- Understand: [ARCHITECTURE.md](ARCHITECTURE.md)
- Configure: [USAGE_GUIDE.md#configuring-mcp-servers](USAGE_GUIDE.md#configuring-mcp-servers)
- Debug: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## 📊 Documentation Statistics

- **Total Documentation**: ~85,000 characters / ~4,000 lines
- **USAGE_GUIDE.md**: 26KB, 1,183 lines - Most comprehensive
- **TROUBLESHOOTING.md**: 17KB, 912 lines - Most detailed problem-solving
- **ARCHITECTURE.md**: 17KB, 763 lines - Deepest technical content
- **DEVELOPMENT.md**: 17KB, 825 lines - Complete developer guide
- **QUICK_START.md**: 9KB, 381 lines - Fastest path to success

## 🔗 External Resources

- **Official Website**: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **Protocol Spec**: [spec.modelcontextprotocol.io](https://spec.modelcontextprotocol.io)
- **GitHub Repo**: [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)
- **Discord Community**: [discord.gg/mcp](https://discord.gg/mcp)
- **GitHub Discussions**: [github.com/modelcontextprotocol/servers/discussions](https://github.com/modelcontextprotocol/servers/discussions)

## ❓ Still Can't Find What You Need?

1. **Search the documentation**: Use your browser's find feature (`Ctrl/Cmd+F`)
2. **Check the FAQ**: [USAGE_GUIDE.md#faq](USAGE_GUIDE.md#faq)
3. **Review existing issues**: [GitHub Issues](https://github.com/modelcontextprotocol/servers/issues)
4. **Ask the community**: [Discord](https://discord.gg/mcp) or [GitHub Discussions](https://github.com/modelcontextprotocol/servers/discussions)
5. **Report a bug**: [Create an Issue](https://github.com/modelcontextprotocol/servers/issues/new)

## 🎓 Recommended Reading Order

**For New Users:**
1. README.md (5 min) - Overview
2. QUICK_START.md (10 min) - Get running
3. USAGE_GUIDE.md (30 min) - Learn features
4. Server-specific READMEs (as needed)

**For Developers:**
1. README.md (5 min) - Overview
2. ARCHITECTURE.md (30 min) - Understand system
3. DEVELOPMENT.md (45 min) - Setup and build
4. CONTRIBUTING.md (10 min) - Guidelines

**For Troubleshooting:**
1. TROUBLESHOOTING.md - Find your issue
2. Relevant server README - Check specifics
3. USAGE_GUIDE.md - Review configuration
4. Ask community if still stuck

---

**Last Updated**: January 2026
**Maintained by**: MCP Community

This documentation index is designed to help you quickly find the information you need. If you have suggestions for improvement, please [open an issue](https://github.com/modelcontextprotocol/servers/issues) or [submit a PR](https://github.com/modelcontextprotocol/servers/pulls).
