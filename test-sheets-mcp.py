#!/usr/bin/env python3
"""
Test script to verify Google Sheets MCP functionality
"""
import os
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build

def test_service_account():
    """Test if service account can access Google Sheets API"""
    try:
        # Load service account credentials
        service_account_path = "/mnt/q/Projects/ganger-platform/mcp-servers/google-sheets-mcp/service-account.json"
        
        if not os.path.exists(service_account_path):
            print(f"❌ Service account file not found: {service_account_path}")
            return False
            
        # Load credentials
        credentials = service_account.Credentials.from_service_account_file(
            service_account_path,
            scopes=[
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive.readonly'
            ]
        )
        
        # Test Sheets API access
        service = build('sheets', 'v4', credentials=credentials)
        
        # Try to access the specific spreadsheet
        spreadsheet_id = '1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k'
        
        # Test reading spreadsheet info
        result = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
        
        print(f"✅ Successfully connected to Google Sheets API")
        print(f"✅ Spreadsheet title: {result['properties']['title']}")
        print(f"✅ Service account email: {credentials.service_account_email}")
        
        # Test reading data
        range_name = 'A1:G5'  # Test reading first few cells
        values_result = service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id, 
            range=range_name
        ).execute()
        
        values = values_result.get('values', [])
        print(f"✅ Successfully read {len(values)} rows from spreadsheet")
        
        if values:
            print(f"✅ Header row: {values[0] if values else 'No data'}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        
        if "403" in str(e):
            print("📋 SOLUTION: Share the spreadsheet with the service account:")
            print("   ganger-portal@apigatewayproject-451519.iam.gserviceaccount.com")
        elif "404" in str(e):
            print("📋 SOLUTION: Check spreadsheet ID is correct")
        
        return False

if __name__ == "__main__":
    print("🔍 Testing Google Sheets MCP service account access...")
    test_service_account()