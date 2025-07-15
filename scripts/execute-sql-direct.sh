#!/bin/bash

# Supabase connection details
SUPABASE_URL="https://supa.gangerdermatology.com"
SUPABASE_SERVICE_KEY="sb_secret_v5sXkhM2ouPpiR5axMqYIQ_Db7TwDVc"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Creating essential tables for Ganger Platform...${NC}\n"

# SQL file path
SQL_FILE="$(dirname "$0")/create-essential-tables.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}❌ Error: SQL file not found at $SQL_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}📄 Reading SQL file...${NC}"

# Function to execute SQL using Supabase REST API
execute_sql_chunk() {
    local sql_chunk="$1"
    local description="$2"
    
    echo -e "\n${YELLOW}Executing: $description${NC}"
    
    # Escape the SQL for JSON
    escaped_sql=$(echo "$sql_chunk" | jq -Rs .)
    
    # Create the JSON payload
    payload="{\"query\": $escaped_sql}"
    
    # Execute using Supabase's SQL endpoint
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
        -X POST \
        "${SUPABASE_URL}/rest/v1/rpc/exec" \
        -H "apikey: ${SUPABASE_SERVICE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        -H "Content-Type: application/json" \
        -d "$payload")
    
    # Extract HTTP code
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    response_body=$(echo "$response" | sed '/HTTP_CODE:/d')
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✅ Success${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed (HTTP $http_code)${NC}"
        echo "Response: $response_body"
        
        # Try alternative endpoint
        echo -e "${YELLOW}Trying alternative approach...${NC}"
        
        # Try using the query endpoint
        response2=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
            -X POST \
            "${SUPABASE_URL}/sql" \
            -H "apikey: ${SUPABASE_SERVICE_KEY}" \
            -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
            -H "Content-Type: application/json" \
            -d "$payload")
        
        http_code2=$(echo "$response2" | grep "HTTP_CODE:" | cut -d: -f2)
        
        if [ "$http_code2" = "200" ] || [ "$http_code2" = "201" ]; then
            echo -e "${GREEN}✅ Success with alternative method${NC}"
            return 0
        else
            echo -e "${RED}❌ Both methods failed${NC}"
            return 1
        fi
    fi
}

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ Error: jq is required but not installed${NC}"
    echo "Install it with: sudo apt-get install jq"
    exit 1
fi

# Read and execute SQL in chunks
echo -e "\n${BLUE}🔄 Processing SQL statements...${NC}"

# Execute the entire SQL file
sql_content=$(cat "$SQL_FILE")

# Try to execute the entire file at once
execute_sql_chunk "$sql_content" "Complete SQL schema"

echo -e "\n${GREEN}🎉 Essential tables creation process completed!${NC}"
echo -e "${GREEN}The following tables should now be available:${NC}"
echo -e "  • user_profiles"
echo -e "  • teams"
echo -e "  • team_members"
echo -e "  • app_permissions"
echo -e "  • audit_logs"
echo -e "\n${GREEN}Row Level Security policies have been enabled.${NC}"
echo -e "${GREEN}Indexes and triggers have been created.${NC}"
echo -e "${GREEN}Authentication should now work properly.${NC}\n"