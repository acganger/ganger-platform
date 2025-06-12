#!/usr/bin/env node

// Script to use Google Sheets MCP for setup
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SPREADSHEET_ID = '1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k';

// MCP Server path
const mcpServerPath = join(__dirname, '../mcp-servers/google-sheets-mcp/index.js');

async function sendMCPRequest(tool, args) {
  return new Promise((resolve, reject) => {
    const mcp = spawn('node', [mcpServerPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        GOOGLE_SERVICE_ACCOUNT_PATH: join(__dirname, '../mcp-servers/google-sheets-mcp/service-account.json')
      }
    });

    let stdout = '';
    let stderr = '';

    mcp.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    mcp.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    mcp.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (e) {
          resolve({ stdout, stderr });
        }
      } else {
        reject(new Error(`MCP process failed: ${stderr}`));
      }
    });

    // Send the MCP request
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: tool,
        arguments: args
      }
    };

    mcp.stdin.write(JSON.stringify(request) + '\n');
    mcp.stdin.end();
  });
}

async function setupSheets() {
  console.log('🚀 Setting up Google Sheets using MCP...');
  
  try {
    // First, let's see what tools are available
    const toolsResponse = await sendMCPRequest('list_tools', {});
    console.log('Available tools:', toolsResponse);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Fallback: Manual setup required');
    console.log('Please follow instructions in: _claude_desktop/IMMEDIATE_STEPS.md');
  }
}

setupSheets();