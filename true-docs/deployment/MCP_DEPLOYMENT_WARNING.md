# ⚠️ MCP Servers and Vercel Deployment

## Critical Information

**MCP (Model Context Protocol) servers are local development tools for Claude AI and MUST NOT be included in deployments.**

## What Are MCP Servers?

The `mcp-servers/` directory contains tools that extend Claude's capabilities locally:
- GitHub integration
- Supabase database access
- Twilio SMS/calling
- Cloudflare management
- And many more...

These are **development-time tools** that run on your local machine to help Claude assist you better. They have **no purpose in production deployments**.

## The Problem

If MCP directories are tracked as git submodules, Vercel deployments will fail with:
```
Warning: Failed to fetch one or more git submodules
```

This happens because:
1. Vercel runs `git clone --recurse-submodules`
2. It tries to fetch the submodule repositories
3. These are private/local repositories that Vercel cannot access
4. The build fails before even starting

## The Solution

### 1. Check for Submodules
```bash
# This command shows git submodules (they appear with mode 160000)
git ls-files --stage | grep ^160000
```

### 2. Remove Submodule References
If you see any MCP-related submodules:
```bash
# Remove all MCP submodule references
git rm -r --cached mcp-servers/*
git rm -r --cached servers

# The files remain on your local machine, just no longer tracked as submodules
```

### 3. Ensure Proper Ignoring

**.gitignore** must include:
```
# MCP Servers (local Claude tools only - not needed for deployments)
mcp-servers/
servers/
```

**.vercelignore** must include:
```
# Ignore MCP servers and related packages
mcp-servers/
```

### 4. Commit and Deploy
```bash
git add .gitignore .vercelignore
git commit -m "fix: exclude MCP submodules from deployment"
git push
```

## Prevention

1. **Never add MCP directories as git submodules**
2. **Always keep them in .gitignore**
3. **Check before deploying**: `git ls-files --stage | grep ^160000`

## Quick Fix Script

```bash
#!/bin/bash
# fix-mcp-deployment.sh

# Check for submodules
if git ls-files --stage | grep -q ^160000; then
    echo "Found git submodules, removing..."
    
    # Remove MCP submodules
    git rm -r --cached mcp-servers/* 2>/dev/null || true
    git rm -r --cached servers 2>/dev/null || true
    
    # Ensure .gitignore includes them
    if ! grep -q "mcp-servers/" .gitignore; then
        echo -e "\n# MCP Servers (local Claude tools only)" >> .gitignore
        echo "mcp-servers/" >> .gitignore
        echo "servers/" >> .gitignore
    fi
    
    # Commit
    git add .gitignore
    git commit -m "fix: remove MCP submodules for Vercel deployment"
    
    echo "✅ Fixed! Now run: git push"
else
    echo "✅ No submodules found - ready to deploy!"
fi
```

## Remember

**MCP servers = Local Claude tools = Never deploy to production**

---

*Last Updated: December 2024*  
*Issue Discovered: Git submodules blocking 13/20 app deployments*  
*Resolution: Remove submodule references, add to .gitignore*