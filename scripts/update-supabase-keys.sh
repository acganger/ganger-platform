#!/bin/bash

# Update Supabase API Keys Script
# This script updates all references from the old Supabase keys to the new ones

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Old and new keys
OLD_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXR6bXh4eGhoc3htbGRkcnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwOTg1MjQsImV4cCI6MjA2NDY3NDUyNH0.v14_9iozO98QoNQq8JcaI9qMM6KKTlcWMYTkXyCDc5s"
NEW_ANON_KEY="sb_publishable_q-yj56RH8zrMVH-4cRazWA_PI2pBoeh"

OLD_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXR6bXh4eGhoc3htbGRkcnRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTA5ODUyNCwiZXhwIjoyMDY0Njc0NTI0fQ.F1sML4ob29QmG_-_zuG5o7mi4k9E2FAew3GDtXuLezo"
NEW_SERVICE_KEY="sb_secret_v5sXkhM2ouPpiR5axMqYIQ_Db7TwDVc"

# Additional service key variant found in some files
OLD_SERVICE_KEY_VARIANT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXR6bXh4eGhoc3htbGRkcnRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTA5ODUyNCwiZXhwIjoyMDY0Njc0NTI0fQ.LwGWw4cSQFvT6JdWx-VC9YRDQM0ykdJbUl2o_dXKsoc"

echo -e "${BLUE}🔑 Updating Supabase API keys...${NC}\n"
echo -e "${YELLOW}Old keys:${NC}"
echo -e "   Anon/Public: ${RED}${OLD_ANON_KEY:0:50}...${NC}"
echo -e "   Service Role: ${RED}${OLD_SERVICE_KEY:0:50}...${NC}"
echo -e "\n${YELLOW}New keys:${NC}"
echo -e "   Publishable: ${GREEN}${NEW_ANON_KEY}${NC}"
echo -e "   Secret: ${GREEN}${NEW_SERVICE_KEY}${NC}\n"

# Function to update files
update_file() {
    local file=$1
    local backup_file="${file}.backup-$(date +%Y%m%d-%H%M%S)"
    
    # Create backup
    cp "$file" "$backup_file"
    
    # Update the file
    sed -i "s|$OLD_ANON_KEY|$NEW_ANON_KEY|g" "$file"
    sed -i "s|$OLD_SERVICE_KEY|$NEW_SERVICE_KEY|g" "$file"
    sed -i "s|$OLD_SERVICE_KEY_VARIANT|$NEW_SERVICE_KEY|g" "$file"
    
    # Check if changes were made
    if ! diff -q "$file" "$backup_file" > /dev/null; then
        echo -e "${GREEN}✓${NC} Updated: $file"
        return 0
    else
        # Remove backup if no changes
        rm "$backup_file"
        return 1
    fi
}

# Counters
updated_count=0
total_files=0

# Find and update all files containing the old anon key
echo -e "${BLUE}🔍 Searching for files with old anon/public key...${NC}"
while IFS= read -r file; do
    if [[ -f "$file" ]]; then
        if update_file "$file"; then
            ((updated_count++))
        fi
        ((total_files++))
    fi
done < <(grep -rl "$OLD_ANON_KEY" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=.turbo --exclude="*.backup-*" 2>/dev/null || true)

# Find and update all files containing the old service key
echo -e "\n${BLUE}🔍 Searching for files with old service role key...${NC}"
while IFS= read -r file; do
    if [[ -f "$file" ]] && ! grep -q "$OLD_ANON_KEY" "$file"; then
        # Only process if we haven't already processed this file for anon key
        if update_file "$file"; then
            ((updated_count++))
        fi
        ((total_files++))
    fi
done < <(grep -rl "$OLD_SERVICE_KEY" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=.turbo --exclude="*.backup-*" 2>/dev/null || true)

# Check for the variant service key
echo -e "\n${BLUE}🔍 Searching for files with service key variant...${NC}"
while IFS= read -r file; do
    if [[ -f "$file" ]] && ! grep -q "$OLD_ANON_KEY\|$OLD_SERVICE_KEY" "$file"; then
        if update_file "$file"; then
            ((updated_count++))
        fi
        ((total_files++))
    fi
done < <(grep -rl "$OLD_SERVICE_KEY_VARIANT" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=.turbo --exclude="*.backup-*" 2>/dev/null || true)

# Update environment variable names if needed
echo -e "\n${BLUE}📝 Updating environment variable references...${NC}"

# Update .env file specifically
if [ -f ".env" ]; then
    echo -e "${YELLOW}Updating .env file...${NC}"
    sed -i "s/NEXT_PUBLIC_SUPABASE_ANON_KEY=/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=/g" ".env"
    sed -i "s/SUPABASE_SERVICE_ROLE_KEY=/SUPABASE_SECRET_KEY=/g" ".env"
    echo -e "${GREEN}✓${NC} Updated environment variable names in .env"
fi

# Summary
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ API key update complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "📊 Files updated: ${GREEN}$updated_count${NC}"

# Verify no old keys remain
echo -e "\n${BLUE}🔍 Verifying update completion...${NC}"
remaining_anon=$(grep -r "$OLD_ANON_KEY" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=.turbo --exclude="*.backup-*" 2>/dev/null | wc -l)
remaining_service=$(grep -r "$OLD_SERVICE_KEY" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=.turbo --exclude="*.backup-*" 2>/dev/null | wc -l)
remaining_variant=$(grep -r "$OLD_SERVICE_KEY_VARIANT" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=.turbo --exclude="*.backup-*" 2>/dev/null | wc -l)

if [ "$remaining_anon" -eq 0 ] && [ "$remaining_service" -eq 0 ] && [ "$remaining_variant" -eq 0 ]; then
    echo -e "${GREEN}✅ All API keys have been updated successfully!${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: Some old keys may still remain${NC}"
    [ "$remaining_anon" -gt 0 ] && echo -e "   - Old anon key: $remaining_anon occurrences"
    [ "$remaining_service" -gt 0 ] && echo -e "   - Old service key: $remaining_service occurrences"
    [ "$remaining_variant" -gt 0 ] && echo -e "   - Old service key variant: $remaining_variant occurrences"
fi

# Important notes
echo -e "\n${YELLOW}📌 Important next steps:${NC}"
echo -e "1. Update environment variable names in your code:"
echo -e "   - ${RED}NEXT_PUBLIC_SUPABASE_ANON_KEY${NC} → ${GREEN}NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY${NC}"
echo -e "   - ${RED}SUPABASE_SERVICE_ROLE_KEY${NC} → ${GREEN}SUPABASE_SECRET_KEY${NC}"
echo -e "2. Update these environment variables in Vercel dashboard for all projects"
echo -e "3. Test applications locally with: ${BLUE}pnpm run dev${NC}"
echo -e "4. Commit and push the changes"
echo -e "5. Monitor deployments for any issues"

echo -e "\n${GREEN}✨ API key migration script completed!${NC}"