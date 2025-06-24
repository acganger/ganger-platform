#!/bin/bash
# Comprehensive Deployment Verification Script
# Tests all platform endpoints after DNS and routing resolution

set -euo pipefail

echo "🧪 Starting Comprehensive Platform Deployment Verification..."
echo "⏱️  $(date)"
echo ""

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
declare -a FAILED_ENDPOINTS=()

# Function to test endpoint
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    local timeout="${4:-10}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "🔍 Testing $name ($url)... "
    
    local status_code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$url" || echo "000")
    
    if [[ "$status_code" == "$expected_status" ]]; then
        echo "✅ PASS ($status_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo "❌ FAIL (Expected: $expected_status, Got: $status_code)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        FAILED_ENDPOINTS+=("$name: $url (Status: $status_code)")
    fi
}

# Function to test health endpoint
test_health() {
    local name="$1"
    local url="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "💚 Testing $name health... "
    
    local response
    response=$(curl -s --max-time 10 "$url" 2>/dev/null || echo '{"status":"error"}')
    
    local status
    status=$(echo "$response" | jq -r '.status // "unknown"' 2>/dev/null || echo "error")
    
    if [[ "$status" == "healthy" || "$status" == "ok" ]]; then
        echo "✅ HEALTHY"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo "❌ UNHEALTHY (Status: $status)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        FAILED_ENDPOINTS+=("$name Health: $url (Status: $status)")
    fi
}

# Function to check DNS resolution
test_dns() {
    local domain="$1"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "🌐 Testing DNS resolution for $domain... "
    
    if nslookup "$domain" >/dev/null 2>&1; then
        echo "✅ RESOLVED"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo "❌ FAILED"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        FAILED_ENDPOINTS+=("DNS Resolution: $domain")
    fi
}

echo "📡 PHASE 1: DNS Resolution Tests"
echo "================================"

# Test DNS resolution for all domains
test_dns "staff.gangerdermatology.com"
test_dns "handouts.gangerdermatology.com"
test_dns "kiosk.gangerdermatology.com"
test_dns "meds.gangerdermatology.com"
test_dns "reps.gangerdermatology.com"
test_dns "config.gangerdermatology.com"
test_dns "showcase.gangerdermatology.com"
test_dns "integrations.gangerdermatology.com"

echo ""
echo "🏥 PHASE 2: External Patient Interfaces"
echo "======================================="

# Test external domain endpoints (patient interfaces)
test_endpoint "Handouts Patient Interface" "https://handouts.gangerdermatology.com/"
test_endpoint "Kiosk Patient Interface" "https://kiosk.gangerdermatology.com/"
test_endpoint "Medication Patient Interface" "https://meds.gangerdermatology.com/"
test_endpoint "Rep Booking Interface" "https://reps.gangerdermatology.com/"

echo ""
echo "💚 PHASE 3: Health Check Endpoints"
echo "=================================="

# Test health endpoints
test_health "Handouts" "https://handouts.gangerdermatology.com/health"
test_health "Kiosk" "https://kiosk.gangerdermatology.com/health"
test_health "Medication Auth" "https://meds.gangerdermatology.com/health"
test_health "Staff Portal" "https://staff.gangerdermatology.com/health"
test_health "Config Dashboard" "https://config.gangerdermatology.com/health"
test_health "Component Showcase" "https://showcase.gangerdermatology.com/health"
test_health "Integration Status" "https://integrations.gangerdermatology.com/health"

echo ""
echo "👥 PHASE 4: Staff Portal Routes"
echo "==============================="

# Test staff portal main routes
test_endpoint "Staff Portal Home" "https://staff.gangerdermatology.com/"
test_endpoint "Staff Portal Compliance" "https://staff.gangerdermatology.com/compliance/"
test_endpoint "Staff Portal Dashboard" "https://staff.gangerdermatology.com/dashboard/"
test_endpoint "Staff Portal L10" "https://staff.gangerdermatology.com/l10/"
test_endpoint "Staff Portal Socials" "https://staff.gangerdermatology.com/socials/"
test_endpoint "Staff Portal Staffing" "https://staff.gangerdermatology.com/staffing/"

echo ""
echo "🔐 PHASE 5: Security Headers Test"
echo "================================="

# Test security headers
check_security_headers() {
    local url="$1"
    local name="$2"
    
    echo -n "🛡️  Testing security headers for $name... "
    
    local headers
    headers=$(curl -s -I "$url" 2>/dev/null || echo "")
    
    local has_security_headers=false
    
    if echo "$headers" | grep -i "x-frame-options\|content-security-policy\|x-content-type-options" >/dev/null; then
        has_security_headers=true
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [[ "$has_security_headers" == true ]]; then
        echo "✅ SECURE"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo "⚠️  MISSING HEADERS"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        FAILED_ENDPOINTS+=("Security Headers: $name ($url)")
    fi
}

check_security_headers "https://staff.gangerdermatology.com/" "Staff Portal"
check_security_headers "https://handouts.gangerdermatology.com/" "Handouts"
check_security_headers "https://meds.gangerdermatology.com/" "Medication Auth"

echo ""
echo "⚡ PHASE 6: Performance Test"
echo "==========================="

# Test response times
test_performance() {
    local url="$1"
    local name="$2"
    local max_time="${3:-2000}"  # Max 2 seconds
    
    echo -n "⚡ Testing performance for $name... "
    
    local response_time
    response_time=$(curl -o /dev/null -s -w "%{time_total}" --max-time 10 "$url" 2>/dev/null || echo "10.000")
    
    # Convert to milliseconds
    local response_ms
    response_ms=$(echo "$response_time * 1000" | bc 2>/dev/null || echo "10000")
    response_ms=${response_ms%.*}  # Remove decimal part
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [[ "$response_ms" -lt "$max_time" ]]; then
        echo "✅ FAST (${response_ms}ms)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo "⚠️  SLOW (${response_ms}ms > ${max_time}ms)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        FAILED_ENDPOINTS+=("Performance: $name (${response_ms}ms)")
    fi
}

test_performance "https://staff.gangerdermatology.com/" "Staff Portal"
test_performance "https://handouts.gangerdermatology.com/" "Handouts"
test_performance "https://meds.gangerdermatology.com/" "Medication Auth"

echo ""
echo "🎯 VERIFICATION RESULTS"
echo "======================"
echo ""

# Calculate success rate
local success_rate=0
if [[ "$TOTAL_TESTS" -gt 0 ]]; then
    success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
fi

echo "📊 Test Summary:"
echo "  Total Tests: $TOTAL_TESTS"
echo "  Passed: $PASSED_TESTS ✅"
echo "  Failed: $FAILED_TESTS ❌"
echo "  Success Rate: $success_rate%"
echo ""

if [[ "$FAILED_TESTS" -gt 0 ]]; then
    echo "❌ Failed Tests:"
    printf '  %s\n' "${FAILED_ENDPOINTS[@]}"
    echo ""
fi

# Determine overall status
if [[ "$success_rate" -ge 90 ]]; then
    echo "🎉 DEPLOYMENT STATUS: ✅ EXCELLENT ($success_rate% success)"
    exit_code=0
elif [[ "$success_rate" -ge 75 ]]; then
    echo "⚠️  DEPLOYMENT STATUS: 🟡 ACCEPTABLE ($success_rate% success)"
    exit_code=0
else
    echo "🚨 DEPLOYMENT STATUS: ❌ NEEDS ATTENTION ($success_rate% success)"
    exit_code=1
fi

echo ""
echo "📋 Next Actions:"
if [[ "$FAILED_TESTS" -gt 0 ]]; then
    echo "  1. Review failed endpoints listed above"
    echo "  2. Check worker deployments and DNS configuration"
    echo "  3. Verify SSL certificates and security headers"
    echo "  4. Re-run verification after fixes"
else
    echo "  ✅ All systems operational - no action required"
fi

echo ""
echo "📝 Verification completed at $(date)"
echo "💾 Log available for review and troubleshooting"

exit $exit_code