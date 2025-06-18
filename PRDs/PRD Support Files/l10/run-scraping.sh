#!/bin/bash

# Ninety.io Comprehensive Scraping Execution Script
# This script sets up the environment and runs the scraping process

set -e  # Exit on any error

# Configuration
PROJECT_ROOT="/mnt/q/Projects/ganger-platform"
SCRAPING_DIR="$PROJECT_ROOT/PRDs/PRD Support files/l10"
MCP_SERVER_DIR="$PROJECT_ROOT/mcp-servers/puppeteer"
LOG_FILE="$SCRAPING_DIR/scraping.log"

echo "🚀 Starting ninety.io comprehensive scraping process..."
echo "📅 Started at: $(date)"
echo "📍 Working directory: $SCRAPING_DIR"
echo "📄 Logging to: $LOG_FILE"

# Create log file
touch "$LOG_FILE"

# Function to log messages
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log "🔍 Checking prerequisites..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    log "❌ Node.js is not installed or not in PATH"
    exit 1
fi

log "✅ Node.js version: $(node --version)"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    log "❌ npm is not installed or not in PATH"
    exit 1
fi

log "✅ npm version: $(npm --version)"

# Ensure output directories exist
log "📁 Creating output directories..."
mkdir -p "$SCRAPING_DIR"/{raw-html,screenshots,json-data,features,navigation}

# Check if MCP server directory exists
if [ ! -d "$MCP_SERVER_DIR" ]; then
    log "❌ Puppeteer MCP server directory not found: $MCP_SERVER_DIR"
    exit 1
fi

# Build the MCP server if needed
log "🔧 Building Puppeteer MCP server..."
cd "$MCP_SERVER_DIR"

if [ ! -d "node_modules" ]; then
    log "📦 Installing MCP server dependencies..."
    npm install 2>&1 | tee -a "$LOG_FILE"
fi

if [ ! -d "dist" ] || [ ! -f "dist/index.js" ]; then
    log "🔨 Building MCP server..."
    npm run build 2>&1 | tee -a "$LOG_FILE"
fi

log "✅ MCP server ready"

# Return to scraping directory
cd "$SCRAPING_DIR"

# Check if puppeteer is available for direct script execution
log "🔍 Checking if puppeteer is available for direct execution..."
if npm list puppeteer --depth=0 &> /dev/null; then
    log "✅ Puppeteer is available locally"
    EXECUTION_METHOD="local"
else
    log "📦 Installing puppeteer locally for script execution..."
    npm init -y > /dev/null 2>&1
    npm install puppeteer 2>&1 | tee -a "$LOG_FILE"
    EXECUTION_METHOD="local"
fi

# Create a simple package.json if it doesn't exist
if [ ! -f "package.json" ]; then
    log "📦 Creating package.json..."
    cat > package.json << EOF
{
  "name": "ninety-io-scraper",
  "version": "1.0.0",
  "description": "Comprehensive scraping of ninety.io EOS platform",
  "main": "ninety-io-scraping-script.js",
  "scripts": {
    "start": "node ninety-io-scraping-script.js"
  },
  "dependencies": {
    "puppeteer": "^23.4.0"
  }
}
EOF
fi

# Verify the scraping script exists
if [ ! -f "ninety-io-scraping-script.js" ]; then
    log "❌ Scraping script not found: ninety-io-scraping-script.js"
    log "Please ensure the scraping script has been created first"
    exit 1
fi

log "✅ All prerequisites satisfied"
log "🎯 Execution method: $EXECUTION_METHOD"

# Display pre-flight checklist
log "📋 Pre-flight checklist:"
log "   ✅ Node.js and npm available"
log "   ✅ Puppeteer MCP server built"
log "   ✅ Output directories created"
log "   ✅ Scraping script ready"
log "   ✅ Dependencies installed"

# Display important notices
echo ""
echo "⚠️  IMPORTANT NOTICES:"
echo "   🔐 Ensure you have access to anand@gangerdermatology.com Google account"
echo "   🌐 Ensure stable internet connection for web scraping"
echo "   ⏰ Expected runtime: 35-55 minutes"
echo "   📱 Browser window will open - do not close it during execution"
echo "   🔍 Monitor progress in the log file: $LOG_FILE"
echo ""

# Ask for confirmation
read -p "🚀 Are you ready to start the scraping process? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "❌ Scraping cancelled by user"
    exit 0
fi

log "🚀 Starting scraping process..."

# Execute the scraping script
if [ "$EXECUTION_METHOD" = "local" ]; then
    log "💻 Executing scraping script locally..."
    node ninety-io-scraping-script.js 2>&1 | tee -a "$LOG_FILE"
    SCRAPING_EXIT_CODE=${PIPESTATUS[0]}
else
    log "❌ No valid execution method available"
    exit 1
fi

# Check execution results
if [ $SCRAPING_EXIT_CODE -eq 0 ]; then
    log "✅ Scraping completed successfully!"
    
    # Display results summary
    log "📊 Results Summary:"
    
    # Count files in each directory
    HTML_COUNT=$(find "$SCRAPING_DIR/raw-html" -name "*.html" 2>/dev/null | wc -l)
    SCREENSHOT_COUNT=$(find "$SCRAPING_DIR/screenshots" -name "*.png" 2>/dev/null | wc -l)
    JSON_COUNT=$(find "$SCRAPING_DIR/json-data" -name "*.json" 2>/dev/null | wc -l)
    
    log "   📄 HTML files captured: $HTML_COUNT"
    log "   📸 Screenshots taken: $SCREENSHOT_COUNT"
    log "   📊 JSON data files: $JSON_COUNT"
    
    # Check for comprehensive report
    if [ -f "$SCRAPING_DIR/json-data/comprehensive-report.json" ]; then
        log "   ✅ Comprehensive report generated"
        
        # Extract key metrics from report if possible
        if command -v jq &> /dev/null; then
            TOTAL_DATA_POINTS=$(jq '.scrapingSession.totalDataPoints' "$SCRAPING_DIR/json-data/comprehensive-report.json" 2>/dev/null || echo "unknown")
            FEATURES_COUNT=$(jq '.features.totalIdentified' "$SCRAPING_DIR/json-data/comprehensive-report.json" 2>/dev/null || echo "unknown")
            log "   📈 Total data points extracted: $TOTAL_DATA_POINTS"
            log "   🔧 Features identified: $FEATURES_COUNT"
        fi
    else
        log "   ⚠️ Comprehensive report not found"
    fi
    
    # Provide next steps
    echo ""
    echo "🎉 SCRAPING COMPLETED SUCCESSFULLY!"
    echo ""
    echo "📁 All data has been saved to: $SCRAPING_DIR"
    echo ""
    echo "🔍 Next Steps:"
    echo "   1. Review the comprehensive report: $SCRAPING_DIR/json-data/comprehensive-report.json"
    echo "   2. Fill out the data analysis template: $SCRAPING_DIR/DATA_ANALYSIS_TEMPLATE.md"
    echo "   3. Compare findings with current L10 app capabilities"
    echo "   4. Plan migration strategy and feature development"
    echo "   5. Update the L10 app PRD with discovered requirements"
    echo ""
    echo "📋 Analysis Commands:"
    echo "   # View comprehensive report"
    echo "   cat '$SCRAPING_DIR/json-data/comprehensive-report.json'"
    echo ""
    echo "   # List all captured data"
    echo "   find '$SCRAPING_DIR' -type f -name '*.json' -o -name '*.html' -o -name '*.png'"
    echo ""
    echo "   # Start data analysis"
    echo "   code '$SCRAPING_DIR/DATA_ANALYSIS_TEMPLATE.md'"
    
else
    log "❌ Scraping failed with exit code: $SCRAPING_EXIT_CODE"
    log "📄 Check the log file for details: $LOG_FILE"
    
    echo ""
    echo "❌ SCRAPING FAILED"
    echo ""
    echo "🔍 Troubleshooting Steps:"
    echo "   1. Check the log file: $LOG_FILE"
    echo "   2. Verify Google account access to ninety.io"
    echo "   3. Ensure stable internet connection"
    echo "   4. Try running the script manually: node ninety-io-scraping-script.js"
    echo "   5. Check for browser compatibility issues"
    
    exit $SCRAPING_EXIT_CODE
fi

log "🏁 Script execution completed at: $(date)"

# Create a simple cleanup script
cat > cleanup-scraping-data.sh << 'EOF'
#!/bin/bash
# Cleanup script for scraping data
# Use this to archive or remove scraped data after analysis

SCRAPING_DIR="/mnt/q/Projects/ganger-platform/PRDs/PRD Support files/l10"
ARCHIVE_NAME="ninety-io-scraped-data-$(date +%Y%m%d-%H%M%S).tar.gz"

echo "🗂️  Creating archive of scraped data..."
tar -czf "$ARCHIVE_NAME" -C "$SCRAPING_DIR" raw-html screenshots json-data

echo "✅ Archive created: $ARCHIVE_NAME"
echo "🗑️  To remove original data after archiving:"
echo "   rm -rf '$SCRAPING_DIR/raw-html' '$SCRAPING_DIR/screenshots' '$SCRAPING_DIR/json-data'"
EOF

chmod +x cleanup-scraping-data.sh
log "🧹 Cleanup script created: cleanup-scraping-data.sh"

echo ""
echo "✨ All done! Happy analyzing! 🚀"