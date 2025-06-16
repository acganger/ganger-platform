cd Q:\Projects\ganger-platform\mcp-servers\cloudflare-local

# Test if the MCP can start
Write-Host "Testing Cloudflare MCP startup..." -ForegroundColor Yellow

$env:CLOUDFLARE_API_TOKEN = "TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf"
$env:CLOUDFLARE_ACCOUNT_ID = "68d0160c9915efebbbecfddfd48cddab" 
$env:CLOUDFLARE_ZONE_ID = "ba76d3d3f41251c49f0365421bd644a5"

Write-Host "Starting MCP server..." -ForegroundColor Green
node dist/index.js