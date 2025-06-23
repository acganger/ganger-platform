#!/bin/bash
# Verify Clean Architecture Deployment

echo "🔍 Verifying Ganger Platform Deployment"
echo "======================================"
echo

# Function to test a URL
test_url() {
    local URL=$1
    local DESC=$2
    
    echo -n "Testing $DESC... "
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
    
    if [ "$STATUS" = "200" ] || [ "$STATUS" = "302" ]; then
        echo "✅ OK ($STATUS)"
    else
        echo "❌ FAILED ($STATUS)"
    fi
}

echo "🏥 Medical Apps:"
test_url "https://staff.gangerdermatology.com/inventory" "Inventory"
test_url "https://staff.gangerdermatology.com/handouts" "Handouts"
test_url "https://staff.gangerdermatology.com/meds" "Medications"
test_url "https://staff.gangerdermatology.com/kiosk" "Kiosk Admin"
echo

echo "💼 Business Apps:"
test_url "https://staff.gangerdermatology.com/l10" "L10 (should redirect)"
test_url "https://staff.gangerdermatology.com/compliance" "Compliance"
test_url "https://staff.gangerdermatology.com/staffing" "Staffing"
test_url "https://staff.gangerdermatology.com/socials" "Socials"
echo

echo "🏠 Core Platform:"
test_url "https://staff.gangerdermatology.com/" "Dashboard"
test_url "https://staff.gangerdermatology.com/config" "Config"
test_url "https://staff.gangerdermatology.com/status" "Status"
test_url "https://staff.gangerdermatology.com/admin" "Admin"
echo

echo "👥 Patient Portals:"
test_url "https://handouts.gangerdermatology.com/" "Handouts Portal"
test_url "https://kiosk.gangerdermatology.com/" "Kiosk Portal"
test_url "https://meds.gangerdermatology.com/" "Meds Portal"
test_url "https://reps.gangerdermatology.com/" "Reps Portal"
echo

echo "🔌 API Gateway:"
test_url "https://api.gangerdermatology.com/health" "API Health"
test_url "https://staff.gangerdermatology.com/api/v1/health" "API v1 Health"
echo

# Test dynamic content
echo "🎲 Testing Dynamic Content:"
echo -n "Checking for timestamps... "
CONTENT=$(curl -s "https://staff.gangerdermatology.com/inventory")
if echo "$CONTENT" | grep -q "20[0-9][0-9]-[0-9][0-9]-[0-9][0-9]"; then
    echo "✅ Dynamic content confirmed"
else
    echo "❌ Static content detected"
fi

echo
echo "📊 Summary Complete!"