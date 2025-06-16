# Cloudflare Local MCP

A local Model Context Protocol (MCP) server providing efficient access to Cloudflare services with short tool names (avoiding the 64-character limit issues of remote MCPs).

## Overview

This MCP provides comprehensive access to your Cloudflare account services through optimized, local API calls. It replaces the problematic remote Cloudflare MCPs that generate overly long tool names.

## Features

### ✅ Workers Management
- **`list_workers`** - List all deployed Worker scripts
- **`get_worker`** - Get Worker script details and configuration
- **`delete_worker`** - Remove Worker scripts
- **`deploy_worker`** - Initialize deployment (see limitations below)

### ✅ KV Storage (Full CRUD)
- **`list_kv_ns`** - List all KV namespaces
- **`get_kv_keys`** - List keys in a namespace (with optional prefix filter)
- **`get_kv_value`** - Retrieve value by key
- **`set_kv_value`** - Store value with optional TTL

### ✅ R2 Object Storage
- **`list_r2_buckets`** - List all R2 buckets
- **`create_r2_bucket`** - Create new R2 bucket

### ✅ DNS Management (Full CRUD)
- **`list_dns`** - List DNS records (with optional type/name filters)
- **`create_dns`** - Create new DNS record
- **`update_dns`** - Update existing DNS record
- **`delete_dns`** - Delete DNS record

### ✅ Pages Management
- **`list_pages`** - List all Pages projects
- **`get_page_deploy`** - Get deployment details for a project

### ✅ Zone Management
- **`list_zones`** - List all zones in your account
- **`get_zone_info`** - Get detailed zone information
- **`purge_cache`** - Purge zone cache (all or specific URLs)

### ✅ Additional Services
- **`get_account_info`** - Get account details and settings
- **`list_d1_databases`** - List D1 databases
- **`get_analytics_dash`** - Get dashboard analytics overview

## Installation

1. **Build the MCP:**
   ```powershell
   cd "Q:\Projects\ganger-platform\mcp-servers\cloudflare-local"
   npm install
   npm run build
   ```

2. **Update Claude Desktop config** (`%APPDATA%\Claude\claude_desktop_config.json`):
   ```json
   {
     "mcpServers": {
       "cloudflare-local": {
         "command": "node",
         "args": ["Q:\\Projects\\ganger-platform\\mcp-servers\\cloudflare-local\\dist\\index.js"],
         "env": {
           "CLOUDFLARE_API_TOKEN": "TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf",
           "CLOUDFLARE_ACCOUNT_ID": "68d0160c9915efebbbecfddfd48cddab",
           "CLOUDFLARE_ZONE_ID": "ba76d3d3f41251c49f0365421bd644a5"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop**

## Configuration

### Required Environment Variables
- **`CLOUDFLARE_API_TOKEN`** - Your Cloudflare API token with appropriate permissions
- **`CLOUDFLARE_ACCOUNT_ID`** - Your Cloudflare account ID

### Optional Environment Variables
- **`CLOUDFLARE_ZONE_ID`** - Default zone ID for DNS operations (can be overridden per call)

## Usage Examples

### Workers Management
```
# List all workers
list_workers

# Get worker details
get_worker scriptName: "my-api-worker"

# Delete a worker
delete_worker scriptName: "old-worker"
```

### KV Storage
```
# List namespaces
list_kv_ns

# Get all keys in a namespace
get_kv_keys namespaceId: "abc123" prefix: "user:"

# Get a value
get_kv_value namespaceId: "abc123" key: "user:1234"

# Set a value with TTL
set_kv_value namespaceId: "abc123" key: "session:xyz" value: "active" ttl: 3600
```

### DNS Management
```
# List all DNS records
list_dns

# List only A records
list_dns type: "A"

# Create new A record
create_dns type: "A" name: "api.example.com" content: "192.168.1.100" ttl: 300

# Update existing record
update_dns recordId: "rec123" type: "A" name: "api.example.com" content: "192.168.1.101"

# Delete record
delete_dns recordId: "rec123"
```

### Cache Management
```
# Purge entire cache
purge_cache

# Purge specific URLs
purge_cache urls: ["https://example.com/api/*", "https://example.com/images/*"]
```

## Limitations

### ⚠️ Worker Deployment
The `deploy_worker` tool **cannot upload actual Worker code** due to Cloudflare SDK limitations. For Worker deployments, use:

**Recommended: Wrangler CLI**
```bash
cd your-worker-directory
wrangler deploy
```

**Alternative: Cloudflare Dashboard**
- Navigate to Workers & Pages
- Upload/edit scripts manually

**CI/CD: GitHub Actions**
```yaml
- name: Deploy Worker
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    command: deploy
```

### Zone Requirements
DNS operations require a zone ID. Either:
- Set `CLOUDFLARE_ZONE_ID` environment variable
- Pass `zoneId` parameter to DNS functions
- Use `list_zones` to find your zone IDs

## Troubleshooting

### Build Errors
```powershell
# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Authentication Errors
- Verify your API token has correct permissions
- Check account ID is correct
- Ensure token isn't expired

### Missing Tools in Claude
- Restart Claude Desktop after config changes
- Check config file syntax with JSON validator
- Verify file paths are correct

## Your Token Permissions

Your `ganger-platform-DEPLOY` token has these key permissions:

**Account Level (MichiGanger):**
- Workers Scripts:Edit ✅
- Workers KV Storage:Edit ✅  
- Workers R2 Storage:Edit ✅
- Workers Builds Configuration:Edit ✅
- Workers Pipelines:Edit ✅
- Cloudflare Pages:Edit ✅
- D1:Read ✅
- Account Settings:Read ✅
- Account Analytics:Read ✅
- Logs:Read ✅

**Zone Level (All zones):**
- Zone:Edit ✅
- DNS:Edit ✅
- Zone Settings:Edit ✅
- Workers Routes:Edit ✅
- Analytics:Read ✅
- Logs:Read ✅
- Firewall Services:Read ✅

**Note:** This token provides comprehensive access to most Cloudflare services while maintaining security through read-only access to sensitive areas.

## Comparison with Remote MCPs

| Feature | Remote MCPs | Local MCP |
|---------|-------------|-----------|
| Tool Name Length | >64 chars (causes errors) | 8-16 chars ✅ |
| Response Speed | Slower (proxy) | Faster (direct API) ✅ |
| Reliability | Depends on remote service | Local control ✅ |
| Functionality | Limited by remote server | Full API access ✅ |
| Network Dependency | High | Minimal ✅ |

## Contributing

To add new tools:
1. Add tool definition in `setupToolHandlers()`
2. Add case in switch statement
3. Implement private method
4. Update README
5. Test and rebuild

## License

This MCP is part of the Ganger Platform project.