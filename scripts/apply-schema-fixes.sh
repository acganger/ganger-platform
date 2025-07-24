#!/bin/bash

# =====================================================
# Apply Schema Fixes Script
# This script applies all schema fixes in the correct order
# =====================================================

set -e  # Exit on error

echo "========================================"
echo "Ganger Platform Schema Fixes Application"
echo "========================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set"
    echo "Please set it to your Supabase database connection string"
    exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "ERROR: psql command not found"
    echo "Please install PostgreSQL client tools"
    exit 1
fi

echo "Starting schema fixes application..."
echo ""

# Function to run a migration
run_migration() {
    local migration_file=$1
    local description=$2
    
    echo "----------------------------------------"
    echo "Applying: $description"
    echo "File: $migration_file"
    
    if [ -f "$migration_file" ]; then
        if psql "$DATABASE_URL" -f "$migration_file" -v ON_ERROR_STOP=1; then
            echo "✓ SUCCESS: $description"
        else
            echo "✗ FAILED: $description"
            echo "Error occurred. Stopping execution."
            exit 1
        fi
    else
        echo "✗ SKIPPED: Migration file not found"
    fi
    echo ""
}

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
MIGRATIONS_DIR="$PROJECT_ROOT/supabase/migrations"

# Phase 1: Critical Fixes
echo "====== PHASE 1: CRITICAL FIXES ======"
run_migration "$MIGRATIONS_DIR/20250723_001_fix_staff_tickets_naming.sql" "Fix staff_tickets table naming"
run_migration "$MIGRATIONS_DIR/20250722_fix_inventory_items_columns.sql" "Fix inventory column names"
run_migration "$MIGRATIONS_DIR/20250723_002_fix_function_search_paths.sql" "Fix function security vulnerabilities"

# Phase 2: Missing Tables
echo ""
echo "====== PHASE 2: MISSING TABLES ======"
run_migration "$MIGRATIONS_DIR/20250723_003_create_staff_tables.sql" "Create staff_* tables"
run_migration "$MIGRATIONS_DIR/011_create_medication_authorization_tables.sql" "Create medication authorization tables"

# Phase 3: Cleanup
echo ""
echo "====== PHASE 3: CLEANUP ======"
run_migration "$MIGRATIONS_DIR/20250723_004_drop_obsolete_tables.sql" "Drop obsolete tables"
run_migration "$MIGRATIONS_DIR/20250723_005_document_future_tables.sql" "Document future feature tables"
run_migration "$MIGRATIONS_DIR/20250723_006_secure_materialized_views.sql" "Secure materialized views"

# Run verification
echo ""
echo "====== VERIFICATION ======"
echo "Running verification script..."
if psql "$DATABASE_URL" -f "$SCRIPT_DIR/verify-schema-fixes.sql"; then
    echo "✓ Verification completed"
else
    echo "✗ Verification failed"
    exit 1
fi

echo ""
echo "========================================"
echo "Schema fixes application completed!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Test your applications to ensure they work with the updated schema"
echo "2. Deploy the TypeScript type updates"
echo "3. Monitor for any errors in your logs"
echo ""
echo "If you encounter issues, you can restore from backup and review the individual migrations."