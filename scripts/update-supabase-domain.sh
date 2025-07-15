#!/bin/bash

# Update Supabase Domain Script
# This script updates all references from the old Supabase domain to the new custom domain
# Old domain: https://pfqtzmxxxhhsxmlddrta.supabase.co
# New domain: https://supa.gangerdermatology.com

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Old and new domains
OLD_DOMAIN="https://pfqtzmxxxhhsxmlddrta.supabase.co"
NEW_DOMAIN="https://supa.gangerdermatology.com"
OLD_DOMAIN_ESCAPED="https:\\/\\/pfqtzmxxxhhsxmlddrta\\.supabase\\.co"
NEW_DOMAIN_ESCAPED="https:\\/\\/supa\\.gangerdermatology\\.com"

echo -e "${BLUE}🔄 Updating Supabase domain from:${NC}"
echo -e "   ${RED}$OLD_DOMAIN${NC}"
echo -e "${BLUE}   to:${NC}"
echo -e "   ${GREEN}$NEW_DOMAIN${NC}\n"

# Function to update files
update_file() {
    local file=$1
    local backup_file="${file}.backup-$(date +%Y%m%d-%H%M%S)"
    
    # Create backup
    cp "$file" "$backup_file"
    
    # Update the file
    sed -i "s|$OLD_DOMAIN|$NEW_DOMAIN|g" "$file"
    
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

# Counter for updated files
updated_count=0
total_files=0

# Find and update all files containing the old domain
echo -e "${BLUE}🔍 Searching for files to update...${NC}\n"

# Update .env file first
if [ -f ".env" ] && grep -q "$OLD_DOMAIN" ".env"; then
    echo -e "${YELLOW}📝 Updating .env file...${NC}"
    if update_file ".env"; then
        ((updated_count++))
    fi
    ((total_files++))
fi

# Update JavaScript/TypeScript files
echo -e "\n${YELLOW}📝 Updating JavaScript/TypeScript files...${NC}"
while IFS= read -r -d '' file; do
    if grep -q "$OLD_DOMAIN" "$file"; then
        if update_file "$file"; then
            ((updated_count++))
        fi
        ((total_files++))
    fi
done < <(find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" \) -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/dist/*" -not -path "*/.turbo/*" -print0)

# Update JSON files
echo -e "\n${YELLOW}📝 Updating JSON files...${NC}"
while IFS= read -r -d '' file; do
    if grep -q "$OLD_DOMAIN" "$file"; then
        if update_file "$file"; then
            ((updated_count++))
        fi
        ((total_files++))
    fi
done < <(find . -type f -name "*.json" -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/dist/*" -not -path "*/.turbo/*" -print0)

# Update shell scripts
echo -e "\n${YELLOW}📝 Updating shell scripts...${NC}"
while IFS= read -r -d '' file; do
    if grep -q "$OLD_DOMAIN" "$file"; then
        if update_file "$file"; then
            ((updated_count++))
        fi
        ((total_files++))
    fi
done < <(find . -type f -name "*.sh" -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/dist/*" -not -path "*/.turbo/*" -print0)

# Update environment variable references
echo -e "\n${YELLOW}📝 Updating environment variable names if needed...${NC}"
# Note: We're keeping the environment variable names the same (NEXT_PUBLIC_SUPABASE_URL, etc.)
# Only the values are being updated

# Summary
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Domain update complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "📊 Files updated: ${GREEN}$updated_count${NC} out of ${YELLOW}$total_files${NC} files containing the old domain"

# Verify no old domain references remain
echo -e "\n${BLUE}🔍 Verifying update completion...${NC}"
remaining=$(grep -r "$OLD_DOMAIN" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=.turbo --exclude="*.backup-*" 2>/dev/null | wc -l)

if [ "$remaining" -eq 0 ]; then
    echo -e "${GREEN}✅ All references have been updated successfully!${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: Found $remaining remaining references to the old domain${NC}"
    echo -e "Run the following command to see them:"
    echo -e "${BLUE}grep -r \"$OLD_DOMAIN\" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=.turbo --exclude=\"*.backup-*\"${NC}"
fi

# Reminder about deployment
echo -e "\n${YELLOW}📌 Next steps:${NC}"
echo -e "1. Review the changes made"
echo -e "2. Test the applications locally with: ${BLUE}pnpm run dev${NC}"
echo -e "3. Update environment variables in Vercel dashboard for all projects"
echo -e "4. Commit and push the changes"
echo -e "5. Monitor deployments for any issues"

echo -e "\n${GREEN}✨ Custom domain migration script completed!${NC}"