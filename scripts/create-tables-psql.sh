#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Creating essential tables for Ganger Platform...${NC}\n"

# Database connection details (derived from the .env file)
DB_HOST="ccsmbmobaafnwxtcgoyg.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASSWORD="password"

# Try different connection methods
CONNECTION_STRINGS=(
    "postgresql://postgres:password@ccsmbmobaafnwxtcgoyg.supabase.co:5432/postgres"
    "postgresql://postgres.ccsmbmobaafnwxtcgoyg:sb_secret_v5sXkhM2ouPpiR5axMqYIQ_Db7TwDVc@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
    "postgresql://postgres.ccsmbmobaafnwxtcgoyg:sb_secret_v5sXkhM2ouPpiR5axMqYIQ_Db7TwDVc@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
)

# SQL file path
SQL_FILE="$(dirname "$0")/create-essential-tables.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}❌ Error: SQL file not found at $SQL_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}📄 Found SQL file${NC}"

# Function to test connection and execute SQL
execute_with_psql() {
    local connection_string="$1"
    local description="$2"
    
    echo -e "\n${YELLOW}Trying: $description${NC}"
    
    # Test connection first
    if psql "$connection_string" -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Connection successful${NC}"
        
        # Execute the SQL file
        echo -e "${BLUE}🔄 Executing SQL statements...${NC}"
        
        if psql "$connection_string" -f "$SQL_FILE"; then
            echo -e "${GREEN}🎉 SQL executed successfully!${NC}"
            return 0
        else
            echo -e "${RED}❌ SQL execution failed${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Connection failed${NC}"
        return 1
    fi
}

# Try each connection string
for i in "${!CONNECTION_STRINGS[@]}"; do
    connection_string="${CONNECTION_STRINGS[$i]}"
    description="Connection method $((i+1))"
    
    if execute_with_psql "$connection_string" "$description"; then
        echo -e "\n${GREEN}🎉 Essential tables created successfully!${NC}"
        echo -e "${GREEN}The following tables should now be available:${NC}"
        echo -e "  • user_profiles"
        echo -e "  • teams"
        echo -e "  • team_members"
        echo -e "  • app_permissions"
        echo -e "  • audit_logs"
        echo -e "\n${GREEN}Row Level Security policies have been enabled.${NC}"
        echo -e "${GREEN}Indexes and triggers have been created.${NC}"
        echo -e "${GREEN}Authentication should now work properly.${NC}\n"
        exit 0
    fi
done

echo -e "\n${RED}❌ All connection methods failed${NC}"
echo -e "${YELLOW}Manual steps:${NC}"
echo -e "1. Go to your Supabase dashboard"
echo -e "2. Navigate to the SQL editor"
echo -e "3. Copy and paste the contents of:"
echo -e "   ${SQL_FILE}"
echo -e "4. Execute the SQL manually"
exit 1