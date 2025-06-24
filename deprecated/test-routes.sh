#\!/bin/bash
# Test all app routes systematically

BASE_URL="https://staff.gangerdermatology.com"

# Function to test route
test_route() {
    local path=$1
    local name=$2
    echo "Testing $name ($path)..."
    
    # Check status code
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path")
    
    # Check for dynamic content indicators
    content=$(curl -s "$BASE_URL$path")
    dynamic=$(echo "$content"  < /dev/null |  grep -E "(timestamp|Generated:|Last Updated:|Random|Date:|Time:)" | wc -l)
    
    # Check if it's a 404 page
    is_404=$(echo "$content" | grep -i "404\|not found" | wc -l)
    
    echo "  Status: $status"
    echo "  Dynamic indicators: $dynamic"
    if [ $is_404 -gt 0 ]; then
        echo "  WARNING: Appears to be a 404 page"
    fi
    echo
}

echo "=== Testing Staff Portal Routes ==="
echo

# Test all known routes
test_route "/" "Staff Portal Root"
test_route "/dashboard" "Platform Dashboard"
test_route "/status" "Integration Status"
test_route "/inventory" "Inventory Management"
test_route "/handouts" "Patient Handouts"
test_route "/kiosk" "Check-in Kiosk"
test_route "/meds" "Medication Authorization"
test_route "/l10" "EOS L10"
test_route "/l10/rocks" "L10 Rocks"
test_route "/l10/scorecard" "L10 Scorecard"
test_route "/reps" "Pharma Scheduling"
test_route "/phones" "Call Center (phones)"
test_route "/call-center" "Call Center (alt)"
test_route "/batch" "Batch Closeout"
test_route "/socials" "Social Reviews"
test_route "/staffing" "Clinical Staffing"
test_route "/compliance" "Compliance Training"
test_route "/config" "Configuration"
test_route "/ai-receptionist" "AI Receptionist"
test_route "/showcase" "Component Showcase (short)"
test_route "/component-showcase" "Component Showcase (full)"
test_route "/staff-portal" "Staff Portal App"

echo
echo "=== Testing Subroutes for Apps That Should Have Them ==="
echo

# Test inventory subroutes
echo "-- Inventory Subroutes --"
test_route "/inventory/dashboard" "Inventory Dashboard"
test_route "/inventory/scan" "Inventory Scan"
test_route "/inventory/reports" "Inventory Reports"

# Test handouts subroutes
echo "-- Handouts Subroutes --"
test_route "/handouts/templates" "Handouts Templates"
test_route "/handouts/generate" "Handouts Generate"
test_route "/handouts/history" "Handouts History"

# Test staffing subroutes
echo "-- Staffing Subroutes --"
test_route "/staffing/schedule" "Staffing Schedule"
test_route "/staffing/assignments" "Staffing Assignments"
test_route "/staffing/analytics" "Staffing Analytics"

# Test compliance subroutes
echo "-- Compliance Subroutes --"
test_route "/compliance/dashboard" "Compliance Dashboard"
test_route "/compliance/courses" "Compliance Courses"
test_route "/compliance/reports" "Compliance Reports"

# Test socials subroutes
echo "-- Social Reviews Subroutes --"
test_route "/socials/dashboard" "Socials Dashboard"
test_route "/socials/respond" "Socials Respond"
test_route "/socials/analytics" "Socials Analytics"

echo
echo "=== Testing External Domains ==="
echo

# Test external domains
for domain in "handouts" "kiosk" "meds" "reps"; do
    echo "Testing: $domain.gangerdermatology.com"
    status=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain.gangerdermatology.com")
    echo "  Status: $status"
    echo
done
