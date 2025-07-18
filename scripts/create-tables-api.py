#!/usr/bin/env python3

import requests
import json
import sys

# Supabase configuration
SUPABASE_URL = "https://supa.gangerdermatology.com"
SERVICE_KEY = "sb_secret_v5sXkhM2ouPpiR5axMqYIQ_Db7TwDVc"

def create_table_via_api(table_name, columns):
    """Create a table using Supabase REST API"""
    url = f"{SUPABASE_URL}/rest/v1/{table_name}"
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    # Try to access the table to see if it exists
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            print(f"✅ Table '{table_name}' already exists")
            return True
        elif response.status_code == 404:
            print(f"❌ Table '{table_name}' doesn't exist, needs manual creation")
            return False
    except Exception as e:
        print(f"❌ Error checking table '{table_name}': {e}")
        return False

def test_connection():
    """Test basic Supabase connection"""
    url = f"{SUPABASE_URL}/rest/v1/"
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}"
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"🔗 Connection test: Status {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def main():
    print("🚀 Testing Supabase Database Creation\n")
    
    # Test connection
    if not test_connection():
        print("❌ Cannot connect to Supabase")
        sys.exit(1)
    
    # Tables we need to check
    essential_tables = [
        "user_profiles",
        "teams", 
        "team_members",
        "app_permissions",
        "audit_logs"
    ]
    
    print("🔍 Checking for essential tables...")
    missing_tables = []
    
    for table in essential_tables:
        if not create_table_via_api(table, []):
            missing_tables.append(table)
    
    if missing_tables:
        print(f"\n❌ Missing tables: {', '.join(missing_tables)}")
        print("\n📋 Manual steps required:")
        print("1. Go to https://supabase.com/dashboard")
        print("2. Open your project (supa.gangerdermatology.com)")
        print("3. Go to SQL Editor")
        print("4. Execute the SQL from scripts/create-essential-tables.sql")
    else:
        print("\n✅ All essential tables exist!")
        print("Authentication should now work.")

if __name__ == "__main__":
    main()