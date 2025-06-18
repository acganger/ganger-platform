#!/bin/bash

# Ganger Platform - Application Testing Helper Script
# This script provides easy commands to run the comprehensive Puppeteer testing suite

set -e

PROJECT_ROOT="/mnt/q/Projects/ganger-platform"
SCRIPT_PATH="$PROJECT_ROOT/scripts/test-apps-puppeteer.js"
APPTEST_DIR="$PROJECT_ROOT/apptest"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed or not in PATH"
        exit 1
    fi
    
    # Check if npm is available
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed or not in PATH"
        exit 1
    fi
    
    # Check if puppeteer is installed
    if ! node -e "require('puppeteer')" 2>/dev/null; then
        print_error "Puppeteer is not installed. Installing now..."
        cd "$PROJECT_ROOT"
        npm install puppeteer
        if [ $? -eq 0 ]; then
            print_success "Puppeteer installed successfully"
        else
            print_error "Failed to install Puppeteer"
            exit 1
        fi
    fi
    
    # Check if the test script exists
    if [ ! -f "$SCRIPT_PATH" ]; then
        print_error "Test script not found at $SCRIPT_PATH"
        exit 1
    fi
    
    # Test if Puppeteer can launch (check for system dependencies)
    print_status "Testing Puppeteer browser launch..."
    cd "$PROJECT_ROOT"
    if ! timeout 30 node -e "
        const puppeteer = require('puppeteer');
        (async () => {
            try {
                const browser = await puppeteer.launch({
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
                });
                await browser.close();
                console.log('Browser launch test successful');
            } catch (error) {
                console.error('Browser launch failed:', error.message);
                process.exit(1);
            }
        })();
    " 2>/dev/null; then
        print_error "Puppeteer cannot launch browser. Missing system dependencies."
        print_status "To install required dependencies, run:"
        print_status "  $PROJECT_ROOT/scripts/install-puppeteer-deps.sh"
        echo
        print_status "Or install manually for Ubuntu/Debian:"
        print_status "  sudo apt-get update"
        print_status "  sudo apt-get install -y libnss3 libgconf-2-4 libxss1 libappindicator1 libgbm-dev"
        exit 1
    fi
    
    print_success "All prerequisites met"
}

# Function to run all tests
run_all_tests() {
    print_status "Starting comprehensive application testing..."
    echo
    
    cd "$PROJECT_ROOT"
    node "$SCRIPT_PATH"
    
    if [ $? -eq 0 ]; then
        print_success "All tests completed successfully"
        echo
        print_status "Reports generated in: $APPTEST_DIR"
        
        # List generated reports
        if [ -f "$APPTEST_DIR/test-report.html" ]; then
            echo "  📄 HTML Report: $APPTEST_DIR/test-report.html"
        fi
        if [ -f "$APPTEST_DIR/test-report.json" ]; then
            echo "  📄 JSON Report: $APPTEST_DIR/test-report.json"
        fi
        
        echo
        print_status "To view the HTML report, open:"
        echo "  file://$APPTEST_DIR/test-report.html"
        
    else
        print_error "Some tests failed. Check the reports for details."
        exit 1
    fi
}

# Function to test a single application
test_single_app() {
    local app_name="$1"
    
    if [ -z "$app_name" ]; then
        print_error "Please specify an application name"
        echo "Usage: $0 single <app-name>"
        echo
        echo "Available applications:"
        ls "$PROJECT_ROOT/apps" | grep -v "^\." | sort
        exit 1
    fi
    
    if [ ! -d "$PROJECT_ROOT/apps/$app_name" ]; then
        print_error "Application '$app_name' not found"
        echo "Available applications:"
        ls "$PROJECT_ROOT/apps" | grep -v "^\." | sort
        exit 1
    fi
    
    print_status "Testing single application: $app_name"
    
    # Create a temporary test script for single app
    local temp_script="/tmp/test-single-app.js"
    
    cat > "$temp_script" << EOF
const { AppTester } = require('$SCRIPT_PATH');

const tester = new AppTester();
const APPLICATIONS = [
    { name: '$app_name', port: 3001 }
];

// Override the applications list
tester.constructor.prototype.APPLICATIONS = APPLICATIONS;

tester.run()
    .then(summary => {
        const exitCode = summary.failed > 0 ? 1 : 0;
        console.log(\`\\n\${exitCode === 0 ? '✅' : '❌'} Exiting with code \${exitCode}\`);
        process.exit(exitCode);
    })
    .catch(error => {
        console.error('💥 Unhandled error:', error);
        process.exit(1);
    });
EOF
    
    cd "$PROJECT_ROOT"
    node "$temp_script"
    rm "$temp_script"
}

# Function to clean up test results
clean_results() {
    print_status "Cleaning up previous test results..."
    
    if [ -d "$APPTEST_DIR" ]; then
        rm -rf "$APPTEST_DIR"/*
        print_success "Test results cleaned"
    else
        print_warning "No test results directory found"
    fi
}

# Function to show help
show_help() {
    echo "Ganger Platform - Application Testing Helper"
    echo
    echo "Usage: $0 [command] [options]"
    echo
    echo "Commands:"
    echo "  all                Run tests for all applications (default)"
    echo "  single <app-name>  Test a single application"
    echo "  clean              Clean up previous test results"
    echo "  check              Check prerequisites only"
    echo "  list               List available applications"
    echo "  install-deps       Install Puppeteer system dependencies"
    echo "  help               Show this help message"
    echo
    echo "Examples:"
    echo "  $0                    # Run all tests"
    echo "  $0 all                # Run all tests"
    echo "  $0 single inventory   # Test only the inventory app"
    echo "  $0 clean              # Clean up test results"
    echo "  $0 check              # Check if everything is ready"
    echo "  $0 install-deps       # Install Puppeteer system dependencies"
    echo
    echo "Test results will be saved to: $APPTEST_DIR"
}

# Function to list available applications
list_apps() {
    print_status "Available applications for testing:"
    echo
    
    if [ -d "$PROJECT_ROOT/apps" ]; then
        for app in $(ls "$PROJECT_ROOT/apps" | grep -v "^\." | sort); do
            if [ -f "$PROJECT_ROOT/apps/$app/package.json" ]; then
                echo "  ✅ $app"
            else
                echo "  ❌ $app (no package.json)"
            fi
        done
    else
        print_error "Apps directory not found: $PROJECT_ROOT/apps"
    fi
}

# Function to check port availability
check_ports() {
    print_status "Checking port availability..."
    
    local ports=(3001 3002 3003 3004 3005 3006 3007 3008 3009 3010 3011 3012 3013 3014 3015 3016 3017)
    local busy_ports=()
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            busy_ports+=($port)
        fi
    done
    
    if [ ${#busy_ports[@]} -gt 0 ]; then
        print_warning "Some ports are already in use: ${busy_ports[*]}"
        print_status "You may want to stop other services or the testing may fail"
        echo "To kill processes on these ports, run:"
        for port in "${busy_ports[@]}"; do
            echo "  sudo lsof -ti:$port | xargs kill -9"
        done
        echo
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Aborted by user"
            exit 0
        fi
    else
        print_success "All required ports are available"
    fi
}

# Main script logic
main() {
    local command="${1:-all}"
    
    case "$command" in
        "all"|"")
            check_prerequisites
            check_ports
            run_all_tests
            ;;
        "single")
            check_prerequisites
            test_single_app "$2"
            ;;
        "clean")
            clean_results
            ;;
        "check")
            check_prerequisites
            check_ports
            print_success "System is ready for testing"
            ;;
        "list")
            list_apps
            ;;
        "install-deps")
            "$PROJECT_ROOT/scripts/install-puppeteer-deps.sh"
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            echo
            show_help
            exit 1
            ;;
    esac
}

# Run the main function with all arguments
main "$@"