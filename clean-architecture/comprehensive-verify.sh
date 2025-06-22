#\!/bin/bash

echo "🔍 COMPREHENSIVE GANGER PLATFORM VERIFICATION"
echo "==========================================="
echo "Started at: $(date)"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test URL and check for dynamic content
test_url() {
    local url=$1
    local name=$2
    
    echo -n "Testing $name... "
    
    # First request
    response1=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
    http_code=$(echo "$response1"  < /dev/null |  tail -n1)
    content1=$(echo "$response1" | head -n-1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "302" ]; then
        # Wait a moment
        sleep 0.5
        
        # Second request to check if content is dynamic
        response2=$(curl -s "$url" 2>/dev/null)
        
        # Check if content contains timestamp or differs between requests
        if [ "$content1" \!= "$response2" ] || echo "$content1" | grep -qE '[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}'; then
            echo -e "${GREEN}✅ OK ($http_code) - DYNAMIC${NC}"
        else
            echo -e "${YELLOW}⚠️  OK ($http_code) - STATIC${NC}"
        fi
    else
        echo -e "${RED}❌ FAILED ($http_code)${NC}"
    fi
}

# Function to test subroutes
test_subroute() {
    local base_url=$1
    local subroute=$2
    local name=$3
    
    test_url "${base_url}${subroute}" "$name"
}

echo "1️⃣ MEDICAL APPS (via staff portal)"
echo "-----------------------------------"
test_url "https://staff.gangerdermatology.com/inventory" "Inventory"
test_subroute "https://staff.gangerdermatology.com/inventory" "/dashboard" "  └─ Dashboard"
test_subroute "https://staff.gangerdermatology.com/inventory" "/scan" "  └─ Scan"
test_subroute "https://staff.gangerdermatology.com/inventory" "/reports" "  └─ Reports"

test_url "https://staff.gangerdermatology.com/handouts" "Handouts"
test_subroute "https://staff.gangerdermatology.com/handouts" "/templates" "  └─ Templates"
test_subroute "https://staff.gangerdermatology.com/handouts" "/generate" "  └─ Generate"

test_url "https://staff.gangerdermatology.com/meds" "Medications"
test_url "https://staff.gangerdermatology.com/kiosk" "Kiosk Admin"
test_subroute "https://staff.gangerdermatology.com/kiosk" "/dashboard" "  └─ Dashboard"
test_subroute "https://staff.gangerdermatology.com/kiosk" "/settings" "  └─ Settings"

echo ""
echo "2️⃣ BUSINESS APPS (dedicated workers)"
echo "------------------------------------"
test_url "https://staff.gangerdermatology.com/l10" "L10"
test_subroute "https://staff.gangerdermatology.com/l10" "/compass" "  └─ Compass"
test_subroute "https://staff.gangerdermatology.com/l10" "/rocks" "  └─ Rocks"
test_subroute "https://staff.gangerdermatology.com/l10" "/scorecard" "  └─ Scorecard"
test_subroute "https://staff.gangerdermatology.com/l10" "/todos" "  └─ Todos"

test_url "https://staff.gangerdermatology.com/compliance" "Compliance"
test_subroute "https://staff.gangerdermatology.com/compliance" "/dashboard" "  └─ Dashboard"
test_subroute "https://staff.gangerdermatology.com/compliance" "/courses" "  └─ Courses"

test_url "https://staff.gangerdermatology.com/staffing" "Staffing"
test_subroute "https://staff.gangerdermatology.com/staffing" "/schedule-builder" "  └─ Schedule"

test_url "https://staff.gangerdermatology.com/socials" "Socials"
test_subroute "https://staff.gangerdermatology.com/socials" "/dashboard" "  └─ Dashboard"

echo ""
echo "3️⃣ CORE PLATFORM APPS"
echo "--------------------"
test_url "https://staff.gangerdermatology.com/" "Staff Portal Root"
test_url "https://staff.gangerdermatology.com/dashboard" "Dashboard"
test_url "https://staff.gangerdermatology.com/config" "Config"
test_subroute "https://staff.gangerdermatology.com/config" "/apps" "  └─ Apps"
test_subroute "https://staff.gangerdermatology.com/config" "/security" "  └─ Security"

test_url "https://staff.gangerdermatology.com/status" "Status"
test_url "https://staff.gangerdermatology.com/admin" "Admin"

echo ""
echo "4️⃣ PATIENT PORTALS (external domains)"
echo "-------------------------------------"
test_url "https://handouts.gangerdermatology.com/" "Handouts Portal"
test_url "https://kiosk.gangerdermatology.com/" "Kiosk Portal"
test_url "https://meds.gangerdermatology.com/" "Meds Portal"
test_url "https://reps.gangerdermatology.com/" "Reps Portal"

echo ""
echo "5️⃣ API ENDPOINTS"
echo "----------------"
test_url "https://api.gangerdermatology.com/" "API Root"
test_url "https://api.gangerdermatology.com/health" "API Health"
test_url "https://staff.gangerdermatology.com/api/v1/health" "Staff API v1"

echo ""
echo "6️⃣ ROUTING VERIFICATION"
echo "-----------------------"
# Test catch-all routing
test_url "https://staff.gangerdermatology.com/nonexistent" "Catch-all Route"
test_url "https://staff.gangerdermatology.com/phones" "Phones (via router)"
test_url "https://staff.gangerdermatology.com/batch" "Batch (via router)"

echo ""
echo "7️⃣ WORKER DEPLOYMENT STATUS"
echo "---------------------------"
export CLOUDFLARE_API_TOKEN="TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf"
workers=$(curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" "https://api.cloudflare.com/client/v4/accounts/68d0160c9915efebbbecfddfd48cddab/workers/scripts" | python3 -c "import json; data=json.load(__import__('sys').stdin); print(len(data.get('result', [])))")
echo "Total Workers Deployed: $workers"

echo ""
echo "📊 VERIFICATION COMPLETE"
echo "======================="
echo "Completed at: $(date)"
