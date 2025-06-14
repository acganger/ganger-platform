# PowerShell 7 script to copy merged Claude Desktop MCP configuration

Write-Host ""
Write-Host "✅ MERGED CLAUDE DESKTOP CONFIGURATION" -ForegroundColor Green
Write-Host ""
Write-Host "This will copy the merged configuration that includes:" -ForegroundColor Yellow
Write-Host "  - All your existing MCP servers (10 servers, removed buggy Google Sheets)" -ForegroundColor White
Write-Host "  - NEW: Puppeteer MCP (browser automation)" -ForegroundColor Cyan
Write-Host "  - NEW: Trello MCP (with your credentials)" -ForegroundColor Cyan
Write-Host "  - NEW: Twilio MCP (from project config)" -ForegroundColor Cyan
Write-Host "  - NEW: Cloudflare Workers MCP (observability & builds)" -ForegroundColor Cyan
Write-Host ""
Write-Host "From: Q:\Projects\ganger-platform\merged-claude-desktop-config.json" -ForegroundColor Gray
Write-Host "To:   C:\Users\anand\AppData\Roaming\Claude\claude_desktop_config.json" -ForegroundColor Gray
Write-Host ""

$confirm = Read-Host "Continue? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Operation cancelled. No changes made." -ForegroundColor Yellow
    exit
}

$sourcePath = "Q:\Projects\ganger-platform\merged-claude-desktop-config.json"
$targetPath = "C:\Users\anand\AppData\Roaming\Claude\claude_desktop_config.json"
$backupPath = "C:\Users\anand\AppData\Roaming\Claude\claude_desktop_config.json.backup"

Write-Host ""
Write-Host "Creating backup of current config..." -ForegroundColor Yellow

if (Test-Path $targetPath) {
    try {
        Copy-Item $targetPath $backupPath -Force
        Write-Host "✅ Backup created: claude_desktop_config.json.backup" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  Warning: Could not create backup: $_" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Copying merged configuration..." -ForegroundColor Yellow

try {
    # Ensure the target directory exists
    $targetDir = Split-Path $targetPath -Parent
    if (!(Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    
    Copy-Item $sourcePath $targetPath -Force
    
    Write-Host ""
    Write-Host "✅ SUCCESS! Merged MCP configuration installed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your Claude Desktop now has 14 MCP servers:" -ForegroundColor White
    Write-Host "  1. Filesystem     8. MySQL Legacy" -ForegroundColor Gray
    Write-Host "  2. Memory         9. Synology" -ForegroundColor Gray  
    Write-Host "  3. Time          10. Twilio" -ForegroundColor Gray
    Write-Host "  4. Fetch         11. Puppeteer " -NoNewline -ForegroundColor Gray
    Write-Host "[NEW]" -ForegroundColor Cyan
    Write-Host "  5. Slack         12. Trello " -NoNewline -ForegroundColor Gray
    Write-Host "[NEW]" -ForegroundColor Cyan
    Write-Host "  6. GitHub        13. Cloudflare Workers " -NoNewline -ForegroundColor Gray
    Write-Host "[NEW]" -ForegroundColor Cyan
    Write-Host "  7. GCP           14. Cloudflare Builds " -NoNewline -ForegroundColor Gray
    Write-Host "[NEW]" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🚀 Cloudflare MCP Features Available:" -ForegroundColor Yellow
    Write-Host "  - Workers observability and monitoring" -ForegroundColor Gray
    Write-Host "  - Workers builds and deployment management" -ForegroundColor Gray
    Write-Host "  - Cloudflare Pages integration" -ForegroundColor Gray
    Write-Host "  - R2 Storage and KV operations" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔄 Please restart Claude Desktop to load the new servers!" -ForegroundColor Yellow
}
catch {
    Write-Host ""
    Write-Host "❌ Error copying configuration file: $_" -ForegroundColor Red
    if (Test-Path $backupPath) {
        Write-Host "Your original config is safely backed up." -ForegroundColor Yellow
    }
}

Write-Host ""
Read-Host "Press Enter to exit"