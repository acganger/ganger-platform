# Git Submodules in Ganger Platform

## Submodules Found (13 total)

These are registered as git submodules (gitlinks) in the repository:

1. **mcp-servers/agent-toolkit**
2. **mcp-servers/cloud-run-mcp**
3. **mcp-servers/github-mcp-server**
4. **mcp-servers/mcp-server-cloudflare**
5. **mcp-servers/mcp-server-gemini**
6. **mcp-servers/mcp-server-synology**
7. **mcp-servers/mcp-servers-official**
8. **mcp-servers/servers-archived**
9. **mcp-servers/supabase-mcp**
10. **mcp-servers/trello**
11. **mcp-servers/twilio-mcp**
12. **mcp-servers/unifi-network**
13. **servers** (additional one at root level)

## What These Are

These appear to be MCP (Model Context Protocol) servers - tools that extend AI capabilities:
- **agent-toolkit**: AI agent tools
- **github-mcp-server**: GitHub integration
- **supabase-mcp**: Database integration
- **twilio-mcp**: SMS/calling integration
- **cloudflare/gemini**: Cloud service integrations
- etc.

## Why They're Causing Deployment Failures

1. **Git tracks these as submodules** (special commit references to other repositories)
2. **Vercel tries to fetch them** during `git clone --recurse-submodules`
3. **Vercel can't access the submodule repositories** (likely private or require authentication)
4. **Build fails** before even reaching the `.vercelignore` stage

## Solution

To fix the deployments, we need to convert these submodules to regular directories:

```bash
# Remove all submodule references
git rm -r --cached mcp-servers/agent-toolkit
git rm -r --cached mcp-servers/cloud-run-mcp
git rm -r --cached mcp-servers/github-mcp-server
git rm -r --cached mcp-servers/mcp-server-cloudflare
git rm -r --cached mcp-servers/mcp-server-gemini
git rm -r --cached mcp-servers/mcp-server-synology
git rm -r --cached mcp-servers/mcp-servers-official
git rm -r --cached mcp-servers/servers-archived
git rm -r --cached mcp-servers/supabase-mcp
git rm -r --cached mcp-servers/trello
git rm -r --cached mcp-servers/twilio-mcp
git rm -r --cached mcp-servers/unifi-network
git rm -r --cached servers

# Add them back as regular directories
git add mcp-servers/
git add servers/

# Commit the change
git commit -m "fix: convert submodules to regular directories for Vercel compatibility"
git push
```

This will stop Vercel from trying to fetch these as submodules, and your deployments should succeed.