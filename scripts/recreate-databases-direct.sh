#!/bin/bash

# Direct Database Recreation Script for Supabase
# Uses SQL execution endpoints to recreate all tables

set -e

# Configuration
SUPABASE_URL="https://supa.gangerdermatology.com"
SUPABASE_SERVICE_KEY="sb_secret_v5sXkhM2ouPpiR5axMqYIQ_Db7TwDVc"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${MAGENTA}🚀 Starting Supabase Database Recreation${NC}"
echo -e "${MAGENTA}=====================================${NC}\n"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MIGRATIONS_DIR="$SCRIPT_DIR/../supabase/migrations"

# Function to execute SQL via Supabase
execute_sql() {
    local sql_file=$1
    local filename=$(basename "$sql_file")
    
    echo -e "${BLUE}📄 Processing ${filename}...${NC}"
    
    # Read SQL content
    sql_content=$(cat "$sql_file")
    
    # Skip empty files
    if [ -z "$(echo "$sql_content" | tr -d '[:space:]')" ]; then
        echo -e "${YELLOW}  ⏭️  Skipping empty file${NC}"
        return 0
    fi
    
    # Escape the SQL for JSON
    escaped_sql=$(echo "$sql_content" | jq -Rs .)
    
    # Try to execute via different endpoints
    # Method 1: Direct SQL execution
    response=$(curl -s -X POST \
        "${SUPABASE_URL}/rest/v1/rpc" \
        -H "apikey: ${SUPABASE_SERVICE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=minimal" \
        -d "{\"query\": ${escaped_sql}}" 2>/dev/null || echo "failed")
    
    if [ "$response" != "failed" ] && [ -z "$(echo "$response" | grep -i error)" ]; then
        echo -e "${GREEN}  ✅ Success${NC}"
        return 0
    fi
    
    # Method 2: Try as a function call
    response=$(curl -s -X POST \
        "${SUPABASE_URL}/rest/v1/rpc/query" \
        -H "apikey: ${SUPABASE_SERVICE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"query\": ${escaped_sql}}" 2>/dev/null || echo "failed")
    
    if [ "$response" != "failed" ] && [ -z "$(echo "$response" | grep -i error)" ]; then
        echo -e "${GREEN}  ✅ Success${NC}"
        return 0
    fi
    
    # If both methods failed
    echo -e "${YELLOW}  ⚠️  Could not execute via API (this might be normal)${NC}"
    return 1
}

# Create a combined SQL file for manual execution
COMBINED_SQL="$SCRIPT_DIR/combined-migrations.sql"
echo -e "${BLUE}📝 Creating combined migration file...${NC}"

cat > "$COMBINED_SQL" << 'EOF'
-- Combined Supabase Migrations for Ganger Platform
-- Generated on $(date)
-- Execute this in Supabase SQL Editor if automated execution fails

BEGIN;

EOF

# Process all migration files
successful=0
failed=0
total=0

for sql_file in $(ls -1 "$MIGRATIONS_DIR"/*.sql | sort); do
    ((total++))
    
    # Try to execute via API
    if execute_sql "$sql_file"; then
        ((successful++))
    else
        ((failed++))
    fi
    
    # Add to combined file regardless
    echo -e "\n-- Migration: $(basename "$sql_file")" >> "$COMBINED_SQL"
    echo -e "-- ==========================================\n" >> "$COMBINED_SQL"
    cat "$sql_file" >> "$COMBINED_SQL"
    echo -e "\n" >> "$COMBINED_SQL"
done

# Close transaction in combined file
echo "COMMIT;" >> "$COMBINED_SQL"

# Summary
echo -e "\n${MAGENTA}=====================================${NC}"
echo -e "${MAGENTA}📊 Migration Summary:${NC}"
echo -e "${GREEN}  ✅ Successful API executions: ${successful}${NC}"
echo -e "${YELLOW}  ⚠️  Failed API executions: ${failed}${NC}"
echo -e "${BLUE}  📄 Total migration files: ${total}${NC}"
echo -e "${MAGENTA}=====================================${NC}\n"

if [ $failed -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Some migrations couldn't be executed via API.${NC}"
    echo -e "${YELLOW}This is often due to Supabase security restrictions.${NC}\n"
    echo -e "${BLUE}📋 Manual execution required:${NC}"
    echo -e "1. Go to your Supabase Dashboard"
    echo -e "2. Navigate to SQL Editor"
    echo -e "3. Copy and paste the contents of:"
    echo -e "   ${GREEN}${COMBINED_SQL}${NC}"
    echo -e "4. Execute the SQL"
    echo -e "\nThis file contains all migrations in the correct order."
fi

# Create a simpler core tables SQL for immediate use
CORE_SQL="$SCRIPT_DIR/core-tables-quick.sql"
cat > "$CORE_SQL" << 'EOF'
-- Core Tables for Ganger Platform
-- Quick setup for authentication to work

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create auth schema if not exists
CREATE SCHEMA IF NOT EXISTS auth;

-- Basic user profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'staff',
    location TEXT,
    position TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create basic RLS policy
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.user_profiles
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- Create basic function to handle new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
EOF

echo -e "\n${GREEN}✨ Created quick setup file:${NC}"
echo -e "   ${BLUE}${CORE_SQL}${NC}"
echo -e "\nThis contains the minimum tables needed for authentication."
echo -e "Execute this first if you need to get the platform working quickly."

echo -e "\n${BLUE}🔗 Useful Supabase Dashboard Links:${NC}"
echo -e "   SQL Editor: ${SUPABASE_URL}/sql"
echo -e "   Table Editor: ${SUPABASE_URL}/table-editor"
echo -e "   Auth Users: ${SUPABASE_URL}/auth/users"

echo -e "\n${GREEN}✅ Script complete!${NC}"