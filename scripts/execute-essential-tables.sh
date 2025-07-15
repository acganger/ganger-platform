#!/bin/bash

# Supabase connection details
SUPABASE_URL="https://supa.gangerdermatology.com"
SUPABASE_SERVICE_KEY="sb_secret_v5sXkhM2ouPpiR5axMqYIQ_Db7TwDVc"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting essential tables creation...${NC}\n"

# Read the SQL file
SQL_FILE="$(dirname "$0")/create-essential-tables.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}❌ Error: SQL file not found at $SQL_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}📄 Found SQL file${NC}"

# Function to execute SQL via Supabase REST API
execute_sql() {
    local sql="$1"
    local description="$2"
    
    echo -e "\n${YELLOW}Executing: $description${NC}"
    
    # Try using the management API endpoint
    response=$(curl -s -X POST \
        "${SUPABASE_URL}/rest/v1/rpc" \
        -H "apikey: ${SUPABASE_SERVICE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=representation" \
        -d "{\"query\": \"${sql}\"}")
    
    # Check if successful
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Success${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed${NC}"
        echo "Response: $response"
        return 1
    fi
}

# Split SQL file into individual statements and execute
echo -e "\n${GREEN}🔄 Processing SQL statements...${NC}"

# Read the entire SQL file
sql_content=$(<"$SQL_FILE")

# Process major SQL blocks
echo -e "\n${YELLOW}1. Creating extensions...${NC}"
execute_sql "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"; CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";" "Extensions"

echo -e "\n${YELLOW}2. Creating tables...${NC}"
execute_sql "$(cat "$SQL_FILE" | sed -n '/-- Create user_profiles table/,/-- Enable Row Level Security/p' | grep -v '-- Enable Row Level Security')" "Tables"

echo -e "\n${YELLOW}3. Enabling Row Level Security...${NC}"
execute_sql "$(cat "$SQL_FILE" | sed -n '/-- Enable Row Level Security/,/-- RLS Policies for user_profiles/p' | grep -v '-- RLS Policies')" "RLS"

echo -e "\n${YELLOW}4. Creating RLS policies...${NC}"
execute_sql "$(cat "$SQL_FILE" | sed -n '/-- RLS Policies for user_profiles/,/-- Create indexes for performance/p' | grep -v '-- Create indexes')" "RLS Policies"

echo -e "\n${YELLOW}5. Creating indexes...${NC}"
execute_sql "$(cat "$SQL_FILE" | sed -n '/-- Create indexes for performance/,/-- Function to handle new user creation/p' | grep -v '-- Function to handle')" "Indexes"

echo -e "\n${YELLOW}6. Creating functions and triggers...${NC}"
execute_sql "$(cat "$SQL_FILE" | sed -n '/-- Function to handle new user creation/,/-- Grant permissions/p' | grep -v '-- Grant permissions')" "Functions"

echo -e "\n${YELLOW}7. Granting permissions...${NC}"
execute_sql "$(cat "$SQL_FILE" | sed -n '/-- Grant permissions/,/-- Insert a default team/p' | grep -v '-- Insert a default')" "Permissions"

echo -e "\n${YELLOW}8. Inserting default data...${NC}"
execute_sql "INSERT INTO public.teams (name, description) VALUES ('Ganger Dermatology', 'Main organization team') ON CONFLICT (name) DO NOTHING;" "Default Team"

echo -e "\n${GREEN}🎉 Essential tables creation process completed!${NC}"
echo -e "${GREEN}Authentication should now work.${NC}"
echo -e "${GREEN}Run additional migration files for app-specific tables.${NC}\n"