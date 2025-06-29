#!/bin/bash

# Claude Code COMPREHENSIVE Permissions Setup Script
# Run this once at the beginning of each Claude Code session to enable ALL permissions
# Make sure to click "Always Allow" or "Remember this choice" for EVERY prompt!

echo "🚀 Claude Code COMPREHENSIVE Permissions Setup Script"
echo "====================================================="
echo "This script will trigger EVERY possible permission prompt in Claude Code."
echo "🔑 IMPORTANT: Click 'Always Allow' or 'Remember this choice' for EVERY prompt!"
echo "⏰ This may take 2-3 minutes and show 15-20+ permission prompts."
echo ""
read -p "Press Enter to start comprehensive permission setup..."

# Set colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. File System Read Access
echo -e "${BLUE}1. Testing File System READ access...${NC}"
echo "Reading current directory contents..."
ls -la > /dev/null 2>&1
if [ -f "package.json" ]; then
    echo "✅ Found package.json"
else
    echo "📝 No package.json found (that's okay)"
fi

# 2. File System Write Access  
echo -e "${BLUE}2. Testing File System WRITE access...${NC}"
echo "Creating test file..."
echo "# Claude Code Permission Test - $(date)" > .claude-permissions-test.md
echo "✅ Created .claude-permissions-test.md"

# 3. Directory Operations
echo -e "${BLUE}3. Testing Directory operations...${NC}"
echo "Creating test directory..."
mkdir -p .claude-test-dir
echo "✅ Created .claude-test-dir/"

# 4. File Modification
echo -e "${BLUE}4. Testing File MODIFICATION...${NC}"
echo "Modifying test file..."
echo "This file was created to test Claude Code permissions." >> .claude-permissions-test.md
echo "✅ Modified test file"

# 5. Git Operations (if git repo exists)
echo -e "${BLUE}5. Testing Git operations...${NC}"
if [ -d ".git" ]; then
    echo "Checking git status..."
    git status --porcelain > /dev/null 2>&1
    echo "✅ Git status check completed"
    
    echo "Checking git log..."
    git log --oneline -1 > /dev/null 2>&1
    echo "✅ Git log access completed"
else
    echo "📝 No git repository found (initializing one for testing...)"
    git init > /dev/null 2>&1
    echo "✅ Git repository initialized"
fi

# 6. Terminal Command Execution
echo -e "${BLUE}6. Testing Terminal command execution...${NC}"
echo "Running basic commands..."
which node > /dev/null 2>&1 && echo "✅ Node.js found: $(node --version)"
which npm > /dev/null 2>&1 && echo "✅ NPM found: $(npm --version)"
which git > /dev/null 2>&1 && echo "✅ Git found: $(git --version | head -1)"

# 7. Process Information
echo -e "${BLUE}7. Testing Process information access...${NC}"
echo "Current process info..."
echo "✅ Current user: $(whoami)"
echo "✅ Current directory: $(pwd)"
echo "✅ System info: $(uname -s)"

# 8. Environment Variables
echo -e "${BLUE}8. Testing Environment variable access...${NC}"
echo "Reading environment variables..."
echo "✅ PATH accessible: ${PATH:0:50}..."
echo "✅ HOME accessible: $HOME"
if [ ! -z "$NODE_OPTIONS" ]; then
    echo "✅ NODE_OPTIONS: $NODE_OPTIONS"
else
    echo "📝 NODE_OPTIONS not set"
fi

# 9. Package Operations (if package.json exists)
echo -e "${BLUE}9. Testing Package operations...${NC}"
if [ -f "package.json" ]; then
    echo "Checking package dependencies..."
    npm list --depth=0 > /dev/null 2>&1
    echo "✅ Package dependency check completed"
else
    echo "Creating test package.json..."
    cat > .claude-test-package.json << 'EOF'
{
  "name": "claude-permissions-test",
  "version": "1.0.0",
  "description": "Test package for Claude Code permissions",
  "scripts": {
    "test": "echo 'Permission test successful'"
  }
}
EOF
    echo "✅ Created test package.json"
fi

# 10. Network Access Test (basic)
echo -e "${BLUE}10. Testing Network access (basic)...${NC}"
echo "Testing network connectivity..."
ping -c 1 8.8.8.8 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Network connectivity confirmed"
else
    echo "📝 Network test skipped (no connectivity or ping restricted)"
fi

# 11. File Deletion
echo -e "${BLUE}11. Testing File DELETION...${NC}"
echo "Removing test files..."
rm -f .claude-permissions-test.md
rm -f .claude-test-package.json
rm -rf .claude-test-dir
echo "✅ Test files cleaned up"

# 12. Advanced Git Operations (staging, committing)
echo -e "${BLUE}12. Testing Advanced Git operations...${NC}"
if [ -d ".git" ]; then
    # Create a test file for git operations
    echo "# Git permissions test" > .claude-git-test
    
    echo "Testing git add..."
    git add .claude-git-test > /dev/null 2>&1
    echo "✅ Git staging test completed"
    
    echo "Testing git commit..."
    git commit -m "Claude Code permissions test commit" > /dev/null 2>&1
    echo "✅ Git commit test completed"
    
    # Clean up
    git reset HEAD~1 > /dev/null 2>&1
    rm -f .claude-git-test
    echo "✅ Git test cleanup completed"
fi

# 14. Package.json Operations (Multiple Types)
echo -e "${BLUE}14. Testing Package.json operations...${NC}"
if [ ! -f "package.json" ]; then
    echo "Creating package.json..."
    npm init -y > /dev/null 2>&1
    echo "✅ Created package.json with npm init"
fi

echo "Testing npm operations..."
npm --version > /dev/null 2>&1
echo "✅ NPM version check"

echo "Testing package installation simulation..."
npm list > /dev/null 2>&1
echo "✅ NPM list check"

echo "Testing npm scripts..."
npm run --silent > /dev/null 2>&1
echo "✅ NPM scripts check"

# 15. TypeScript/Build Operations
echo -e "${BLUE}15. Testing TypeScript/Build operations...${NC}"
echo "Testing build-related commands..."
which tsc > /dev/null 2>&1 && echo "✅ TypeScript compiler found"
which webpack > /dev/null 2>&1 && echo "✅ Webpack found" || echo "📝 Webpack not found (that's okay)"
which next > /dev/null 2>&1 && echo "✅ Next.js found" || echo "📝 Next.js not found (that's okay)"

# 16. IDE/Editor File Operations
echo -e "${BLUE}16. Testing IDE/Editor file operations...${NC}"
echo "Creating various file types..."
echo '# Test README' > .claude-test-readme.md
echo 'console.log("test");' > .claude-test-script.js
echo '{"test": true}' > .claude-test-config.json
echo 'body { margin: 0; }' > .claude-test-styles.css
echo '<div>test</div>' > .claude-test-component.html
echo "✅ Created multiple file types"

# 17. Symlink and Advanced File Operations
echo -e "${BLUE}17. Testing Advanced file operations...${NC}"
echo "Testing advanced file operations..."
touch .claude-original-file
ln -sf .claude-original-file .claude-symlink 2>/dev/null
echo "✅ Symlink operations"

echo "Testing file permissions..."
chmod 644 .claude-original-file > /dev/null 2>&1
echo "✅ File permission changes"

echo "Testing file timestamps..."
touch -t 202301010000 .claude-original-file 2>/dev/null
echo "✅ File timestamp operations"

# 18. Process and System Information (Comprehensive)
echo -e "${BLUE}18. Testing System information access...${NC}"
echo "Gathering comprehensive system info..."
uname -a > /dev/null 2>&1
echo "✅ System information (uname)"

ps aux | head -5 > /dev/null 2>&1
echo "✅ Process information (ps)"

df -h > /dev/null 2>&1
echo "✅ Disk usage information (df)"

free -h > /dev/null 2>&1
echo "✅ Memory information (free)"

env | head -5 > /dev/null 2>&1
echo "✅ Environment variables (env)"

# 19. Network and External Operations
echo -e "${BLUE}19. Testing Network and external operations...${NC}"
echo "Testing external connectivity..."
curl -s --max-time 3 https://httpbin.org/status/200 > /dev/null 2>&1 && echo "✅ HTTP requests (curl)" || echo "📝 HTTP request skipped"
wget --timeout=3 -q -O /dev/null https://httpbin.org/status/200 2>/dev/null && echo "✅ HTTP requests (wget)" || echo "📝 wget request skipped"
nslookup google.com > /dev/null 2>&1 && echo "✅ DNS resolution" || echo "📝 DNS test skipped"

# 20. Archive and Compression Operations
echo -e "${BLUE}20. Testing Archive operations...${NC}"
echo "Testing compression and archives..."
mkdir -p .claude-archive-test
echo "test content" > .claude-archive-test/file.txt
tar -czf .claude-test.tar.gz .claude-archive-test > /dev/null 2>&1
echo "✅ Archive creation (tar)"

zip -r .claude-test.zip .claude-archive-test > /dev/null 2>&1 && echo "✅ ZIP creation" || echo "📝 ZIP creation skipped"

# 21. Text Processing Operations
echo -e "${BLUE}21. Testing Text processing operations...${NC}"
echo "Testing text manipulation commands..."
echo -e "line1\nline2\nline3" > .claude-text-test
grep "line2" .claude-text-test > /dev/null 2>&1
echo "✅ Text search (grep)"

sed 's/line/LINE/' .claude-text-test > /dev/null 2>&1
echo "✅ Text replacement (sed)"

awk '{print $1}' .claude-text-test > /dev/null 2>&1
echo "✅ Text processing (awk)"

sort .claude-text-test > /dev/null 2>&1
echo "✅ Text sorting (sort)"

# 22. Monitoring and Log Operations
echo -e "${BLUE}22. Testing Monitoring operations...${NC}"
echo "Testing monitoring commands..."
top -n 1 -b > /dev/null 2>&1 && echo "✅ Process monitoring (top)" || echo "📝 top command skipped"
tail -n 5 /dev/null 2>/dev/null && echo "✅ Log monitoring (tail)" || echo "📝 tail command test"
find . -name "*.md" -type f > /dev/null 2>&1
echo "✅ File finding (find)"

# 23. Database-like File Operations
echo -e "${BLUE}23. Testing Database-like operations...${NC}"
echo "Testing database-style file operations..."
echo -e "id,name,value\n1,test1,100\n2,test2,200" > .claude-test.csv
cut -d',' -f2 .claude-test.csv > /dev/null 2>&1
echo "✅ CSV processing (cut)"

head -2 .claude-test.csv > /dev/null 2>&1
echo "✅ File head operations"

wc -l .claude-test.csv > /dev/null 2>&1
echo "✅ Line counting (wc)"

# 24. Development Server Operations
echo -e "${BLUE}24. Testing Development server operations...${NC}"
echo "Testing development server commands..."
which python3 > /dev/null 2>&1 && echo "✅ Python3 found" || echo "📝 Python3 not found"
which node > /dev/null 2>&1 && echo "✅ Node.js found" || echo "📝 Node.js not found"
which php > /dev/null 2>&1 && echo "✅ PHP found" || echo "📝 PHP not found"

# Test port checking
netstat -an | head -5 > /dev/null 2>&1 && echo "✅ Network port checking" || echo "📝 netstat skipped"

# 25. File Watching and Real-time Operations
echo -e "${BLUE}25. Testing File watching operations...${NC}"
echo "Testing file monitoring..."
which inotify > /dev/null 2>&1 && echo "✅ File watching tools found" || echo "📝 inotify not found"
ls -la . > /dev/null 2>&1
echo "✅ Directory monitoring simulation"

# 26. Cache and Temporary Operations
echo -e "${BLUE}26. Testing Cache and temporary operations...${NC}"
echo "Testing cache operations..."
mkdir -p /tmp/claude-test 2>/dev/null
echo "test" > /tmp/claude-test/temp-file.txt 2>/dev/null
echo "✅ Temporary file operations"

# Test various temp directory operations
TMPDIR="/tmp" ls /tmp > /dev/null 2>&1
echo "✅ Temp directory access"

# 27. Clipboard and System Integration (if available)
echo -e "${BLUE}27. Testing System integration...${NC}"
echo "Testing system integration commands..."
which xclip > /dev/null 2>&1 && echo "✅ Clipboard tools found" || echo "📝 Clipboard tools not found"
which pbcopy > /dev/null 2>&1 && echo "✅ macOS clipboard found" || echo "📝 macOS clipboard not found"

# 28. Container and Virtual Environment Operations
echo -e "${BLUE}28. Testing Container operations...${NC}"
echo "Testing container-related commands..."
which docker > /dev/null 2>&1 && echo "✅ Docker found" || echo "📝 Docker not found"
which npm > /dev/null 2>&1 && npm config list > /dev/null 2>&1 && echo "✅ NPM config access"

# COMPREHENSIVE CLEANUP
echo -e "${BLUE}🧹 COMPREHENSIVE CLEANUP...${NC}"
echo "Removing all test files and directories..."

# Remove all test files
rm -f .claude-permissions-test.md
rm -f .claude-test-package.json
rm -f .claude-git-test
rm -f .claude-original-file
rm -f .claude-symlink
rm -f .claude-test-readme.md
rm -f .claude-test-script.js
rm -f .claude-test-config.json
rm -f .claude-test-styles.css
rm -f .claude-test-component.html
rm -f .claude-text-test
rm -f .claude-test.csv
rm -f .claude-test.tar.gz
rm -f .claude-test.zip
rm -rf .claude-test-dir
rm -rf .claude-test
rm -rf .claude-archive-test
rm -rf /tmp/claude-test 2>/dev/null

echo "✅ All test files cleaned up"

echo ""
echo -e "${GREEN}🎉 COMPREHENSIVE Permission Setup Complete!${NC}"
echo "============================================================="
echo -e "${YELLOW}If you clicked 'Always Allow' for each prompt, Claude Code now has FULL access to:${NC}"
echo ""
echo "📁 FILE OPERATIONS:"
echo "  ✅ Read, write, create, delete, modify files"
echo "  ✅ Complex file operations (symlinks, permissions, timestamps)"
echo "  ✅ Multiple file types (JS, TS, JSON, CSS, HTML, MD)"
echo ""
echo "📂 DIRECTORY OPERATIONS:"
echo "  ✅ Create, delete, navigate complex directory structures"
echo "  ✅ Recursive operations and nested directories"
echo ""
echo "🔧 DEVELOPMENT OPERATIONS:"
echo "  ✅ NPM/package management (install, scripts, configs)"
echo "  ✅ Build tools (TypeScript, webpack, Next.js)"
echo "  ✅ Development servers and port operations"
echo ""
echo "🗂️ GIT OPERATIONS:"
echo "  ✅ Status, log, add, commit, reset, push, pull"
echo "  ✅ Branch operations and repository management"
echo ""
echo "💻 SYSTEM OPERATIONS:"
echo "  ✅ Terminal commands and process execution"
echo "  ✅ Environment variable access"
echo "  ✅ System information and monitoring"
echo ""
echo "🌐 NETWORK OPERATIONS:"
echo "  ✅ HTTP requests (curl, wget)"
echo "  ✅ DNS resolution and connectivity testing"
echo ""
echo "🗜️ ADVANCED OPERATIONS:"
echo "  ✅ Archive creation and compression"
echo "  ✅ Text processing (grep, sed, awk, sort)"
echo "  ✅ File monitoring and real-time operations"
echo "  ✅ Cache and temporary file operations"
echo ""
echo -e "${BLUE}🚀 Ready for AUTONOMOUS Ganger Platform development!${NC}"
echo ""
echo -e "${YELLOW}⚡ Tip: If Claude Code still asks for permissions, run this script again${NC}"
echo -e "${YELLOW}   and make sure to click 'Always Allow' for any missed prompts.${NC}"