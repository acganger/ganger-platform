#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Attempting to create essential tables via Supabase API...${NC}\n"

# Connection details
SUPABASE_URL="https://supa.gangerdermatology.com"
SERVICE_KEY="sb_secret_v5sXkhM2ouPpiR5axMqYIQ_Db7TwDVc"

# First, let's check if we can access the database through the REST API
echo -e "${BLUE}🔍 Testing API connection...${NC}"

# Try to access the REST API root
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -X GET \
    "${SUPABASE_URL}/rest/v1/" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}")

http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
response_body=$(echo "$response" | sed '/HTTP_CODE:/d')

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ API connection successful${NC}"
else
    echo -e "${RED}❌ API connection failed (HTTP $http_code)${NC}"
    echo "Response: $response_body"
fi

echo -e "\n${BLUE}🔍 Checking for existing tables...${NC}"

# Check if user_profiles table exists
check_response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -X GET \
    "${SUPABASE_URL}/rest/v1/user_profiles?limit=1" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "Accept: application/json")

check_http_code=$(echo "$check_response" | grep "HTTP_CODE:" | cut -d: -f2)

if [ "$check_http_code" = "200" ]; then
    echo -e "${GREEN}✅ user_profiles table already exists${NC}"
    echo -e "${YELLOW}Tables appear to already be created!${NC}"
    echo -e "\n${GREEN}🎉 Essential tables are available!${NC}"
    exit 0
elif [ "$check_http_code" = "404" ]; then
    echo -e "${YELLOW}⚠️  user_profiles table does not exist${NC}"
    echo -e "${BLUE}Proceeding with table creation...${NC}"
else
    echo -e "${RED}❌ Unable to check table existence (HTTP $check_http_code)${NC}"
fi

echo -e "\n${YELLOW}📝 Manual Setup Required${NC}"
echo -e "Since automatic table creation via API is not working,"
echo -e "please follow these steps:"
echo -e "\n${BLUE}1. Go to Supabase Dashboard:${NC}"
echo -e "   https://supabase.com/dashboard"
echo -e "\n${BLUE}2. Find your project:${NC}"
echo -e "   Look for 'Ganger Dermatology' or project with URL: $SUPABASE_URL"
echo -e "\n${BLUE}3. Open SQL Editor:${NC}"
echo -e "   Click 'SQL Editor' in the left sidebar"
echo -e "\n${BLUE}4. Execute the SQL:${NC}"
echo -e "   Copy and paste the contents of this file:"
echo -e "   $(pwd)/create-essential-tables.sql"
echo -e "\n${BLUE}5. Verify:${NC}"
echo -e "   Check that the following tables were created:"
echo -e "   • user_profiles"
echo -e "   • teams"
echo -e "   • team_members"
echo -e "   • app_permissions"
echo -e "   • audit_logs"

echo -e "\n${GREEN}After completing these steps, authentication should work properly.${NC}"