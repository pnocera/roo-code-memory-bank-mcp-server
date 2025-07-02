# Quick Setup Guide

This guide will help you get the Roo Code Memory Bank MCP Server running in just a few minutes.

## 🚀 Quick Start (Recommended)

### Step 1: Install from NPM

```bash
npm install -g roo-mcp-server
```

### Step 2: Configure Your MCP Client

#### For Cline (VS Code Extension)

1. Open VS Code
2. Go to Settings → Extensions → Cline
3. Find "MCP Server Settings" or open your `cline_mcp_settings.json`
4. Add this configuration:

```json
{
  "mcpServers": {
    "roo-code-memory-bank-mcp": {
      "command": "roo-mcp-server",
      "args": [],
      "env": {},
      "transportType": "stdio",
      "autoApprove": [
        "initialize_memory_bank",
        "check_memory_bank_status", 
        "read_memory_bank_file",
        "append_memory_bank_entry"
      ],
      "disabled": false,
      "timeout": 60
    }
  }
}
```

#### For Claude Desktop

1. Open Claude Desktop settings
2. Navigate to MCP servers configuration
3. Add the same configuration as above

### Step 3: Test the Installation

1. Restart your MCP client (Cline/Claude Desktop)
2. In a chat, ask your AI assistant to:
   ```
   Check the memory bank status and initialize it if needed
   ```
3. The assistant should use the MCP tools and create a `memory-bank/` directory

## 🔧 Advanced Setup (Build from Source)

### Prerequisites

- Node.js 18+ installed
- Git installed
- NPM or Yarn package manager

### Clone and Build

```bash
# Clone the repository
git clone https://github.com/IncomeStreamSurfer/roo-code-memory-bank-mcp-server.git
cd roo-code-memory-bank-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Test that it works
npm start
```

### Configure with Absolute Path

For source builds, you need to use the absolute path in your MCP configuration:

```json
{
  "mcpServers": {
    "roo-code-memory-bank-mcp": {
      "command": "node",
      "args": [
        "/absolute/path/to/roo-code-memory-bank-mcp-server/dist/index.js"
      ],
      "env": {},
      "transportType": "stdio",
      "autoApprove": [
        "initialize_memory_bank",
        "check_memory_bank_status",
        "read_memory_bank_file", 
        "append_memory_bank_entry"
      ],
      "disabled": false,
      "timeout": 60
    }
  }
}
```

## 🏗️ Project Integration

### For New Projects

1. Navigate to your project directory
2. Ask your AI assistant to initialize the memory bank:
   ```
   Initialize the memory bank for this project
   ```
3. The assistant will create a `memory-bank/` directory with template files

### For Existing Projects

1. Have your project brief or documentation ready
2. Ask your AI assistant:
   ```
   Initialize the memory bank and include this project information: [paste your project description]
   ```

## 📁 Understanding the Memory Bank Structure

After initialization, you'll see this structure:

```
your-project/
├── memory-bank/
│   ├── productContext.md      # High-level project overview
│   ├── activeContext.md       # Current status and active work
│   ├── progress.md           # Progress tracking
│   ├── decisionLog.md        # Architectural decisions
│   └── systemPatterns.md     # Recurring patterns and conventions
└── ... (your project files)
```

## 🔍 Verification Checklist

- [ ] MCP server installed successfully
- [ ] MCP client configuration updated
- [ ] MCP client restarted
- [ ] Memory bank tools working in chat
- [ ] Memory bank directory created
- [ ] Template files populated

## 🐛 Common Issues

### Issue: "Command not found: roo-mcp-server"
**Solution**: Ensure NPM global bin directory is in your PATH
```bash
npm config get prefix
# Add <prefix>/bin to your PATH environment variable
```

### Issue: "Permission denied" on Unix systems
**Solution**: Fix permissions for the executable
```bash
chmod +x $(which roo-mcp-server)
```

### Issue: MCP client can't find the server
**Solution**: 
1. Verify the command path in your configuration
2. Test the command manually in terminal
3. Check MCP client logs for error details

### Issue: Tools not appearing in AI assistant
**Solution**:
1. Restart your MCP client completely
2. Check the `disabled: false` setting
3. Verify the configuration syntax is valid JSON

## 📞 Getting Help

If you encounter issues:

1. **Check the logs**: Most MCP clients show logs in their developer tools
2. **Test manually**: Run `roo-mcp-server` in terminal to check for errors
3. **Verify installation**: Run `npm list -g roo-mcp-server` to confirm installation
4. **Open an issue**: [Report bugs here](https://github.com/IncomeStreamSurfer/roo-code-memory-bank-mcp-server/issues)

## 🎯 Next Steps

Once everything is working:

1. **Explore the tools**: Try each MCP tool to understand their capabilities
2. **Customize templates**: Edit the initial templates in `memory-bank/` files
3. **Set up workflows**: Integrate memory bank usage into your development process
4. **Read the docs**: Check out the [full documentation](../README.md) for advanced usage

## 💡 Pro Tips

- **Auto-approval**: The `autoApprove` setting lets tools run without confirmation
- **Timeout**: Increase timeout for large projects or slow systems
- **Multiple projects**: Each project directory gets its own memory bank
- **Backup**: Consider backing up your `memory-bank/` directories regularly
- **Team usage**: Share memory bank files with your team for consistency

---

**Happy coding with persistent context! 🎉**