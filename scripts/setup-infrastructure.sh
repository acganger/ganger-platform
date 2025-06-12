#!/bin/bash

# Ganger Platform Infrastructure Setup Script
# This script sets up and validates the complete infrastructure stack

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
PROJECT_ROOT=$(pwd)
SUPABASE_URL=${SUPABASE_URL:-""}
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-""}
CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN:-""}

# Check if running from project root
if [ ! -f "package.json" ] || [ ! -d "PRDs" ]; then
    log_error "This script must be run from the project root directory"
    exit 1
fi

log_info "Starting Ganger Platform Infrastructure Setup..."

# 1. Environment Variables Check
check_environment_variables() {
    log_info "Checking environment variables..."
    
    local missing_vars=()
    
    if [ -z "$SUPABASE_URL" ]; then
        missing_vars+=("SUPABASE_URL")
    fi
    
    if [ -z "$SUPABASE_ANON_KEY" ]; then
        missing_vars+=("SUPABASE_ANON_KEY")
    fi
    
    if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        missing_vars+=("SUPABASE_SERVICE_ROLE_KEY")
    fi
    
    if [ -z "$GOOGLE_CLIENT_ID" ]; then
        missing_vars+=("GOOGLE_CLIENT_ID")
    fi
    
    if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
        missing_vars+=("GOOGLE_CLIENT_SECRET")
    fi
    
    if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
        missing_vars+=("CLOUDFLARE_API_TOKEN")
    fi
    
    if [ -z "$CLOUDFLARE_ZONE_ID" ]; then
        missing_vars+=("CLOUDFLARE_ZONE_ID")
    fi
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        log_error "Missing required environment variables:"
        printf '%s\n' "${missing_vars[@]}"
        log_info "Please set these variables and run the script again"
        exit 1
    fi
    
    log_success "All required environment variables are set"
}

# 2. Install Dependencies
install_dependencies() {
    log_info "Installing project dependencies..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install npm and try again."
        exit 1
    fi
    
    # Install root dependencies
    npm install
    
    log_success "Dependencies installed successfully"
}

# 3. Set up Turborepo
setup_turborepo() {
    log_info "Setting up Turborepo configuration..."
    
    if [ ! -f "turbo.json" ]; then
        cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^test"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "type-check": {
      "dependsOn": ["^type-check"]
    }
  }
}
EOF
    fi
    
    log_success "Turborepo configuration created"
}

# 4. Create shared packages structure
setup_shared_packages() {
    log_info "Setting up shared packages structure..."
    
    # Create packages directory structure
    mkdir -p packages/{ui,auth,db,integrations,utils}/src
    
    # Create package.json for each shared package
    create_package_json() {
        local package_name=$1
        local package_path="packages/$package_name"
        
        cat > "$package_path/package.json" << EOF
{
  "name": "@ganger/$package_name",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "lint": "eslint src/",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "typescript": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "eslint": "^8.0.0"
  }
}
EOF
        
        # Create basic index.ts
        touch "$package_path/src/index.ts"
        
        # Create tsconfig.json
        cat > "$package_path/tsconfig.json" << EOF
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules"]
}
EOF
    }
    
    # Create all shared packages
    create_package_json "ui"
    create_package_json "auth"
    create_package_json "db"
    create_package_json "integrations"
    create_package_json "utils"
    
    log_success "Shared packages structure created"
}

# 5. Test Supabase Connection
test_supabase_connection() {
    log_info "Testing Supabase connection..."
    
    # Create a simple test script
    cat > test-supabase.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        // Test basic connectivity by getting auth session
        const { data, error } = await supabase.auth.getSession();
        if (error) {
            console.log('Supabase connection test - auth failed:', error.message);
            return false;
        } else {
            console.log('✅ Supabase connection successful');
            return true;
        }
    } catch (error) {
        console.error('❌ Supabase connection failed:', error.message);
        return false;
    }
}

testConnection().then(success => {
    process.exit(success ? 0 : 1);
});
EOF

    # Install Supabase client for testing
    npm install @supabase/supabase-js --no-save
    
    if node test-supabase.js; then
        log_success "Supabase connection test passed"
    else
        log_error "Supabase connection test failed"
        rm -f test-supabase.js
        exit 1
    fi
    
    # Clean up
    rm -f test-supabase.js
}

# 6. Test Google OAuth Configuration
test_google_oauth() {
    log_info "Testing Google OAuth configuration..."
    
    # Create OAuth test script
    cat > test-oauth.js << 'EOF'
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
    console.error('Missing Google OAuth credentials');
    process.exit(1);
}

// Validate client ID format (should be in format: numbers-letters.apps.googleusercontent.com)
const clientIdRegex = /^[0-9]+-[a-zA-Z0-9]+\.apps\.googleusercontent\.com$/;
if (!clientIdRegex.test(clientId)) {
    console.error('❌ Invalid Google Client ID format');
    process.exit(1);
}

// Validate client secret format (should start with GOCSPX-)
if (!clientSecret.startsWith('GOCSPX-')) {
    console.error('❌ Invalid Google Client Secret format');
    process.exit(1);
}

console.log('✅ Google OAuth credentials format validation passed');
console.log('Client ID:', clientId.substring(0, 20) + '...');
process.exit(0);
EOF

    if node test-oauth.js; then
        log_success "Google OAuth configuration test passed"
    else
        log_error "Google OAuth configuration test failed"
        rm -f test-oauth.js
        exit 1
    fi
    
    # Clean up
    rm -f test-oauth.js
}

# 7. Test Cloudflare API Access
test_cloudflare_api() {
    log_info "Testing Cloudflare API access..."
    
    # Test Cloudflare API connectivity
    if command -v curl &> /dev/null; then
        response=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID")
        
        if [ "$response" = "200" ]; then
            log_success "Cloudflare API access test passed"
        else
            log_error "Cloudflare API access test failed (HTTP $response)"
            exit 1
        fi
    else
        log_warning "curl not available, skipping Cloudflare API test"
    fi
}

# 8. Create GitHub Actions workflow
setup_github_actions() {
    log_info "Setting up GitHub Actions workflow..."
    
    mkdir -p .github/workflows
    
    cat > .github/workflows/ci-cd.yml << 'EOF'
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint
    
    - name: Run type check
      run: npm run type-check
    
    - name: Run tests
      run: npm run test
    
    - name: Build applications
      run: npm run build

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build for staging
      run: npm run build
      env:
        NODE_ENV: staging
    
    - name: Deploy to Cloudflare Workers (Staging)
      run: npm run deploy:staging
      env:
        CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build for production
      run: npm run build
      env:
        NODE_ENV: production
    
    - name: Deploy to Cloudflare Workers (Production)
      run: npm run deploy:production
      env:
        CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
EOF

    log_success "GitHub Actions workflow created"
}

# 9. Create environment template files
create_environment_templates() {
    log_info "Creating environment template files..."
    
    cat > .env.example << 'EOF'
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Cloudflare Configuration
CLOUDFLARE_API_TOKEN=your-cloudflare-token
CLOUDFLARE_ZONE_ID=your-zone-id

# Application URLs
NEXT_PUBLIC_APP_URL=https://app.gangerdermatology.com

# External API Keys
MODMED_API_KEY=your-modmed-api-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
SENDGRID_API_KEY=your-sendgrid-key
EOF

    cat > .env.local.example << 'EOF'
# Local Development Environment
# Copy this file to .env.local and fill in your values

# Supabase Configuration
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key

# Google OAuth Configuration (use test credentials for local dev)
GOOGLE_CLIENT_ID=your-test-google-client-id
GOOGLE_CLIENT_SECRET=your-test-google-client-secret

# Local Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

    log_success "Environment template files created"
}

# 10. Create deployment scripts
create_deployment_scripts() {
    log_info "Creating deployment scripts..."
    
    mkdir -p scripts
    
    cat > scripts/deploy-staging.sh << 'EOF'
#!/bin/bash

# Deploy to staging environment
set -e

echo "🚀 Deploying to staging environment..."

# Build all applications
npm run build

# Deploy each application to staging
# This will be expanded as applications are added

echo "✅ Staging deployment complete"
EOF

    cat > scripts/deploy-production.sh << 'EOF'
#!/bin/bash

# Deploy to production environment
set -e

echo "🚀 Deploying to production environment..."

# Run final checks
npm run test
npm run lint
npm run type-check

# Build all applications
npm run build

# Deploy each application to production
# This will be expanded as applications are added

echo "✅ Production deployment complete"
EOF

    chmod +x scripts/deploy-staging.sh
    chmod +x scripts/deploy-production.sh
    
    log_success "Deployment scripts created"
}

# 11. Update package.json with scripts
update_package_json() {
    log_info "Updating root package.json with build scripts..."
    
    # This would typically use jq or a Node script to modify package.json
    # For now, we'll create a basic package.json if it doesn't exist
    if [ ! -f "package.json" ]; then
        cat > package.json << 'EOF'
{
  "name": "ganger-platform",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "test": "turbo test",
    "type-check": "turbo type-check",
    "deploy:staging": "./scripts/deploy-staging.sh",
    "deploy:production": "./scripts/deploy-production.sh"
  },
  "devDependencies": {
    "turbo": "^1.10.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
EOF
    fi
    
    log_success "Package.json updated"
}

# 12. Create TypeScript configuration
create_typescript_config() {
    log_info "Creating TypeScript configuration..."
    
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@ganger/ui": ["./packages/ui/src"],
      "@ganger/auth": ["./packages/auth/src"],
      "@ganger/db": ["./packages/db/src"],
      "@ganger/integrations": ["./packages/integrations/src"],
      "@ganger/utils": ["./packages/utils/src"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
EOF

    log_success "TypeScript configuration created"
}

# 13. Run final validation
run_final_validation() {
    log_info "Running final infrastructure validation..."
    
    # Check that all required files exist
    local required_files=(
        "package.json"
        "turbo.json"
        "tsconfig.json"
        ".env.example"
        ".github/workflows/ci-cd.yml"
        "scripts/deploy-staging.sh"
        "scripts/deploy-production.sh"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "Required file missing: $file"
            exit 1
        fi
    done
    
    # Check that all shared packages exist
    local required_packages=(
        "packages/ui"
        "packages/auth"
        "packages/db"
        "packages/integrations"
        "packages/utils"
    )
    
    for package in "${required_packages[@]}"; do
        if [ ! -d "$package" ]; then
            log_error "Required package missing: $package"
            exit 1
        fi
    done
    
    log_success "All infrastructure components validated"
}

# Main execution flow
main() {
    log_info "=== Ganger Platform Infrastructure Setup ==="
    
    check_environment_variables
    install_dependencies
    setup_turborepo
    setup_shared_packages
    test_supabase_connection
    test_google_oauth
    test_cloudflare_api
    setup_github_actions
    create_environment_templates
    create_deployment_scripts
    update_package_json
    create_typescript_config
    run_final_validation
    
    log_success "=== Infrastructure setup complete! ==="
    log_info ""
    log_info "Next steps:"
    log_info "1. Copy .env.example to .env.local and fill in your values"
    log_info "2. Run 'npm run dev' to start development"
    log_info "3. Begin application development following DEVELOPMENT_PLAN.md"
    log_info ""
    log_info "Infrastructure is ready for application development! 🚀"
}

# Run main function
main "$@"