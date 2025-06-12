# Claude Desktop MCP Integration Setup Guide

## 🎯 **Current Status**
You currently have **Claude Code CLI** installed, but to use MCPs effectively, you need **Claude Desktop** application.

## 📥 **Step 1: Install Claude Desktop**

### **Download Claude Desktop**
1. Go to: https://claude.ai/download
2. Download the appropriate version for your system
3. Install Claude Desktop application

### **Verify Installation**
Claude Desktop config location will be:
- **Linux**: `~/.config/Claude/claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

## ⚙️ **Step 2: MCP Configuration Files**

I'll create the exact configuration files you need for your 4 working MCPs.

### **Configuration for Claude Desktop**

**File**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "time": {
      "command": "npx", 
      "args": ["-y", "@modelcontextprotocol/server-time"]
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },
    "google-sheets": {
      "command": "node",
      "args": ["/mnt/q/Projects/ganger-platform/mcp-servers/mkummer-google-sheets-mcp/dist/index.js"]
    }
  }
}
```

## 🔧 **Step 3: Prepare MCP Servers**

### **Official MCPs (Memory, Time, Fetch)**
These will be installed automatically via `npx` when Claude Desktop starts.

### **Google Sheets MCP**
Already built and ready at:
```bash
/mnt/q/Projects/ganger-platform/mcp-servers/mkummer-google-sheets-mcp/dist/index.js
```

## 🧪 **Step 4: Test Configuration**

### **Create Test Configuration Script**