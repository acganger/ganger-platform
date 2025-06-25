#!/usr/bin/env python3

import os
import json
import requests
import sys

# Vercel API configuration
VERCEL_TOKEN = os.environ.get('VERCEL_TOKEN')
TEAM_ID = "team_wpY7PcIsYQNnslNN39o7fWvS"

if not VERCEL_TOKEN:
    print("❌ Error: VERCEL_TOKEN not set")
    sys.exit(1)

# Project IDs
projects = {
    "inventory": "prj_AC868NXvUCZHXUyCyA9AOWRtabu8",
    "handouts": "prj_4Nf2RBXcF7AHiiYbfiSyIzLun3Mf",
    "eos-l10": "prj_tFLTyosnL10AAsFsOaagVgIS2aoi",
    "batch-closeout": "prj_gYrNhjrxXEPg5upvst4opPpiYVGa",
    "compliance-training": "prj_nyXefRjw3vRhQmJBh4jQ38AtuPTd",
    "clinical-staffing": "prj_UXfHT3CiTwBcaf0FAByPj7Keh7dN",
    "config-dashboard": "prj_RfI3tADUf1OFJ2iVyE4eoXdsHapR",
    "integration-status": "prj_p7qMv4639vUURlvAEH9VRU96DrSR",
    "ai-receptionist": "prj_rX2RWwl80vNGkLN6RAFgRaMtZb9z",
    "call-center-ops": "prj_XfvjRr8Vc1aBiDJ8M3dT5HdiGul3",
    "medication-auth": "prj_2ahWES85ADV8axKY2xJmmtCzky6n",
    "pharma-scheduling": "prj_P1mgy6cw0Eemt1OkB7oaPxkQzDXW",
    "checkin-kiosk": "prj_2C6D48SfvOgIUrRAkphZ6H8Ehajk",
    "socials-reviews": "prj_yVy0L8Kr5piNFfeU3pThMUHyNjjL",
    "component-showcase": "prj_u0YlA5N4X4f46ayy4BPfdO4sFpb7",
    "platform-dashboard": "prj_zqa9o0iyrPsm8tURW9tiljBjuIwN",
    "staff": "prj_NF5ig8gWFVupD9CbTtb65osM1Cz7"
}

# Environment variables to set (from .env file)
env_vars = {
    # Database
    "DATABASE_URL": "postgresql://postgres:password@localhost:54322/postgres",
    "DIRECT_URL": "postgresql://postgres:password@localhost:54322/postgres",
    
    # Supabase
    "NEXT_PUBLIC_SUPABASE_URL": "https://pfqtzmxxxhhsxmlddrta.supabase.co",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXR6bXh4eGhoc3htbGRkcnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwOTg1MjQsImV4cCI6MjA2NDY3NDUyNH0.v14_9iozO98QoNQq8JcaI9qMM6KKTlcWMYTkXyCDc5s",
    "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXR6bXh4eGhoc3htbGRkcnRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTA5ODUyNCwiZXhwIjoyMDY0Njc0NTI0fQ.F1sML4ob29QmG_-_zuG5o7mi4k9E2FAew3GDtXuLezo",
    
    # NextAuth
    "NEXTAUTH_URL": "https://staff.gangerdermatology.com",
    "NEXTAUTH_SECRET": "your-nextauth-secret-here",
    
    # Google
    "GOOGLE_CLIENT_ID": "745912643942-ttm6166flfqbsad430k7a5q3n8stvv34.apps.googleusercontent.com",
    "GOOGLE_CLIENT_SECRET": "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",
    
    # Application URLs
    "NEXT_PUBLIC_STAFF_URL": "https://staff.gangerdermatology.com",
    "NEXT_PUBLIC_LUNCH_URL": "https://lunch.gangerdermatology.com",
    "NEXT_PUBLIC_L10_URL": "https://l10.gangerdermatology.com",
    
    # Other required vars
    "NODE_ENV": "production",
    "SECURITY_SALT": "V1ny@C0nstruct10n2025!",
    "HEALTH_CHECK_KEY": "K9x2mP4nQ8wL5vB7"
}

def add_env_var(project_id, key, value):
    """Add an environment variable to a Vercel project"""
    url = f"https://api.vercel.com/v10/projects/{project_id}/env?teamId={TEAM_ID}"
    
    headers = {
        "Authorization": f"Bearer {VERCEL_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Add to all environments
    for target in ["production", "preview", "development"]:
        data = {
            "key": key,
            "value": value,
            "type": "encrypted",
            "target": [target]
        }
        
        try:
            response = requests.post(url, headers=headers, json=data)
            if response.status_code == 201:
                print(f"  ✓ Added {key} to {target}")
            elif response.status_code == 409:
                print(f"  ⚠️  {key} already exists in {target}")
            else:
                print(f"  ❌ Failed to add {key} to {target}: {response.status_code}")
                if response.text:
                    print(f"     Error: {response.text}")
        except Exception as e:
            print(f"  ❌ Error adding {key}: {str(e)}")

def main():
    print("🚀 Adding environment variables to all Vercel projects...")
    print(f"   Total projects: {len(projects)}")
    print(f"   Total env vars: {len(env_vars)}")
    print()
    
    # Process each project
    for app_name, project_id in projects.items():
        print(f"\n📦 Processing {app_name} ({project_id})...")
        
        # Add each environment variable
        for key, value in env_vars.items():
            add_env_var(project_id, key, value)
        
        print(f"✅ Completed {app_name}")
    
    print("\n🎉 All environment variables have been added!")
    print("\n📋 Next steps:")
    print("1. Trigger new deployments: git push origin main")
    print("2. Monitor deployment status in Vercel dashboard")
    print("3. Check build logs if any deployments fail")

if __name__ == "__main__":
    main()