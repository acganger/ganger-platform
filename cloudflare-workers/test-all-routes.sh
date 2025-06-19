#!/bin/bash

# Test all routes at staff.gangerdermatology.com
BASE_URL="https://staff.gangerdermatology.com"

echo "🧪 Testing All Routes at staff.gangerdermatology.com"
echo "=================================================="
echo ""

# Function to test a route
test_route() {
    local path=$1
    local name=$2
    echo "Testing $name ($path)..."
    
    # Check if route returns 200 OK
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path")
    
    # Get title from response
    title=$(curl -s "$BASE_URL$path" | grep -o '<title>[^<]*' | sed 's/<title>//' | head -1)
    
    # Check for dynamic content indicators
    dynamic=$(curl -s "$BASE_URL$path" | grep -E "(timestamp|Dynamic|Random)" | wc -l)
    
    if [ "$status" = "200" ]; then
        echo "✅ Status: $status"
        echo "   Title: $title"
        if [ "$dynamic" -gt 0 ]; then
            echo "   Type: Dynamic Content (found $dynamic dynamic indicators)"
        else
            echo "   Type: Static Content"
        fi
    else
        echo "❌ Status: $status"
    fi
    echo ""
}

# Test main routes
test_route "/" "Root/Staff Portal"
test_route "/dashboard" "Platform Dashboard"
test_route "/status" "Integration Status"
test_route "/staffing" "Clinical Staffing"
test_route "/config" "Configuration Dashboard"
test_route "/inventory" "Inventory Management"
test_route "/meds" "Medication Authorization"
test_route "/batch" "Batch Closeout"
test_route "/handouts" "Patient Handouts"
test_route "/kiosk" "Check-in Kiosk"
test_route "/l10" "L10 Leadership"
test_route "/l10/compass" "L10 Compass"
test_route "/compliance" "Compliance Training"
test_route "/ai-receptionist" "AI Receptionist"
test_route "/call-center" "Call Center Ops"
test_route "/reps" "Pharma Scheduling"
test_route "/socials" "Social Reviews"
test_route "/staff-portal" "Staff Portal"
test_route "/component-showcase" "Component Showcase"

echo ""
echo "🏁 Testing Complete!"