# Build Cloudflare Local MCP
Write-Host "Building Cloudflare Local MCP..." -ForegroundColor Green

Set-Location "Q:\Projects\ganger-platform\mcp-servers\cloudflare-local"

Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
    
    Write-Host "Building TypeScript..." -ForegroundColor Yellow
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Build completed successfully!" -ForegroundColor Green
        Write-Host "MCP ready at: Q:\Projects\ganger-platform\mcp-servers\cloudflare-local\dist\index.js" -ForegroundColor Cyan
    } else {
        Write-Host "Build failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "npm install failed!" -ForegroundColor Red
    exit 1
}