#!/bin/bash

# Install Puppeteer Dependencies for WSL/Linux
# This script installs the necessary system dependencies for Puppeteer to work

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_status "Installing Puppeteer dependencies for WSL/Linux..."
echo

# Detect the Linux distribution
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
elif type lsb_release >/dev/null 2>&1; then
    OS=$(lsb_release -si)
    VER=$(lsb_release -sr)
elif [ -f /etc/lsb-release ]; then
    . /etc/lsb-release
    OS=$DISTRIB_ID
    VER=$DISTRIB_RELEASE
elif [ -f /etc/debian_version ]; then
    OS=Debian
    VER=$(cat /etc/debian_version)
else
    OS=$(uname -s)
    VER=$(uname -r)
fi

print_status "Detected OS: $OS $VER"

# Function to install dependencies for Ubuntu/Debian
install_ubuntu_deps() {
    print_status "Installing dependencies for Ubuntu/Debian..."
    
    # Update package list
    sudo apt-get update
    
    # Install required packages for Puppeteer
    sudo apt-get install -y \
        gconf-service \
        libasound2 \
        libatk1.0-0 \
        libc6 \
        libcairo2 \
        libcups2 \
        libdbus-1-3 \
        libexpat1 \
        libfontconfig1 \
        libgcc1 \
        libgconf-2-4 \
        libgdk-pixbuf2.0-0 \
        libglib2.0-0 \
        libgtk-3-0 \
        libnspr4 \
        libpango-1.0-0 \
        libpangocairo-1.0-0 \
        libstdc++6 \
        libx11-6 \
        libx11-xcb1 \
        libxcb1 \
        libxcomposite1 \
        libxcursor1 \
        libxdamage1 \
        libxext6 \
        libxfixes3 \
        libxi6 \
        libxrandr2 \
        libxrender1 \
        libxss1 \
        libxtst6 \
        ca-certificates \
        fonts-liberation \
        libappindicator1 \
        libnss3 \
        lsb-release \
        xdg-utils \
        wget \
        libgbm-dev
    
    print_success "Ubuntu/Debian dependencies installed successfully"
}

# Function to install dependencies for CentOS/RHEL/Fedora
install_centos_deps() {
    print_status "Installing dependencies for CentOS/RHEL/Fedora..."
    
    # Determine package manager
    if command -v dnf &> /dev/null; then
        PKG_MANAGER="dnf"
    elif command -v yum &> /dev/null; then
        PKG_MANAGER="yum"
    else
        print_error "Neither dnf nor yum found. Cannot install dependencies."
        exit 1
    fi
    
    # Install required packages
    sudo $PKG_MANAGER install -y \
        alsa-lib \
        atk \
        cups-libs \
        gtk3 \
        ipa-gothic-fonts \
        libXcomposite \
        libXcursor \
        libXdamage \
        libXext \
        libXi \
        libXrandr \
        libXScrnSaver \
        libXtst \
        pango \
        xorg-x11-fonts-100dpi \
        xorg-x11-fonts-75dpi \
        xorg-x11-fonts-cyrillic \
        xorg-x11-fonts-misc \
        xorg-x11-fonts-Type1 \
        xorg-x11-utils \
        nss \
        libgbm
    
    print_success "CentOS/RHEL/Fedora dependencies installed successfully"
}

# Install dependencies based on the detected OS
case $OS in
    "Ubuntu"*)
        install_ubuntu_deps
        ;;
    "Debian"*)
        install_ubuntu_deps
        ;;
    "CentOS"*)
        install_centos_deps
        ;;
    "Red Hat"*)
        install_centos_deps
        ;;
    "Fedora"*)
        install_centos_deps
        ;;
    *)
        print_warning "Unknown or unsupported OS: $OS"
        print_status "Attempting Ubuntu/Debian installation..."
        install_ubuntu_deps
        ;;
esac

# Test Puppeteer installation
print_status "Testing Puppeteer installation..."

# Create a simple test script
TEST_SCRIPT="/tmp/puppeteer-test.js"
cat > "$TEST_SCRIPT" << 'EOF'
const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    console.log('Creating page...');
    const page = await browser.newPage();
    
    console.log('Navigating to example.com...');
    await page.goto('https://example.com');
    
    const title = await page.title();
    console.log('Page title:', title);
    
    await browser.close();
    console.log('✅ Puppeteer test successful!');
    
  } catch (error) {
    console.error('❌ Puppeteer test failed:', error.message);
    process.exit(1);
  }
})();
EOF

# Run the test from the project root where puppeteer is installed
cd /mnt/q/Projects/ganger-platform
if node "$TEST_SCRIPT"; then
    print_success "Puppeteer is working correctly!"
    rm "$TEST_SCRIPT"
else
    print_error "Puppeteer test failed. Please check the installation."
    rm "$TEST_SCRIPT"
    exit 1
fi

echo
print_success "All dependencies installed successfully!"
print_status "You can now run the application tests:"
echo "  ./scripts/run-app-tests.sh all"
echo "  ./scripts/run-app-tests.sh single <app-name>"
echo