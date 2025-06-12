#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function testSheetsConnection() {
    try {
        // Load OAuth keys
        const keysPath = './mcp-servers/mkummer-google-sheets-mcp/dist/gcp-oauth.keys.json';
        const keys = JSON.parse(fs.readFileSync(keysPath, 'utf8'));
        
        // Load saved credentials 
        const credentialsPath = './mcp-servers/mkummer-google-sheets-mcp/dist/.gsheets-server-credentials.json';
        const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
        
        // Create auth client
        const auth = new google.auth.OAuth2(
            keys.installed.client_id,
            keys.installed.client_secret,
            keys.installed.redirect_uris[0]
        );
        
        auth.setCredentials({
            access_token: credentials.access_token,
            refresh_token: credentials.refresh_token
        });
        
        // Create sheets client
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Test reading from the Google Sheet
        const spreadsheetId = '1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k';
        const range = 'Master Project Tracker!A1:O5'; // First 5 rows, all columns
        
        console.log('Testing Google Sheets connection...');
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });
        
        const rows = response.data.values;
        if (rows && rows.length) {
            console.log('✅ SUCCESS: Connected to Google Sheets!');
            console.log('📊 Sheet data preview:');
            rows.forEach((row, index) => {
                console.log(`Row ${index + 1}:`, row.slice(0, 5).join(' | ')); // First 5 columns
            });
            
            // Test writing a cell
            console.log('\n🔄 Testing write capability...');
            const testValue = `Test ${new Date().toISOString()}`;
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'Master Project Tracker!P1', // Test cell
                valueInputOption: 'RAW',
                resource: {
                    values: [[testValue]]
                }
            });
            console.log('✅ Write test successful!');
            
        } else {
            console.log('❌ No data found in sheet.');
        }
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

testSheetsConnection();