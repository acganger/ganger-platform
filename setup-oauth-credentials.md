# Setup OAuth2 Credentials for Better Google Sheets MCP

## Step 1: Create OAuth2 Credentials in Google Cloud Console

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select project**: `apigatewayproject-451519` (or create new)
3. **Enable Google Sheets API**: 
   - Go to "APIs & Services" > "Library"
   - Search "Google Sheets API" 
   - Click "Enable"

4. **Configure OAuth Consent Screen**:
   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External" 
   - Fill in app information:
     - App name: "Ganger Platform MCP"
     - User support email: your email
     - Developer contact: your email
   - Add scopes:
     - `https://www.googleapis.com/auth/spreadsheets`
     - `https://www.googleapis.com/auth/drive.readonly`
   - Add test users (your email)

5. **Create OAuth Client ID**:
   - Go to "APIs & Services" > "Credentials"
   - Click "+ CREATE CREDENTIALS" > "OAuth client ID"
   - Application type: **Desktop application**
   - Name: "Ganger Platform Sheets MCP"
   - Click "Create"

6. **Download Credentials**:
   - Click download button (JSON icon)
   - Save as `gcp-oauth.keys.json`
   - Copy to `/mnt/q/Projects/ganger-platform/mcp-servers/mkummer-google-sheets-mcp/dist/`

## Step 2: Update .mcp.json Configuration

```json
{
  "mcpServers": {
    "google-sheets": {
      "command": "node",
      "args": ["/mnt/q/Projects/ganger-platform/mcp-servers/mkummer-google-sheets-mcp/dist/index.js"]
    }
  }
}
```

## Step 3: Test the MCP Server

```bash
cd /mnt/q/Projects/ganger-platform/mcp-servers/mkummer-google-sheets-mcp
npm run start
```

## Expected Tools Available:
- `edit_cell` - Edit single cells
- `read_all_from_sheet` - Read entire sheets  
- `edit_row` - Edit entire rows
- `list_sheets` - List all sheets in spreadsheet
- `create_sheet` - Create new sheets
- And many more!

This approach will be much more reliable and easier to use!