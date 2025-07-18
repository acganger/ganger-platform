#!/bin/bash

# Restore Supabase Schema
# This script applies all migrations to recreate the database schema

set -e

echo "🔄 Restoring Supabase Schema..."
echo "================================"

# Check for required environment variables
if [ -z "$SUPABASE_DB_URL" ]; then
    echo "❌ Error: SUPABASE_DB_URL environment variable is required"
    echo "Please set it to your Supabase database URL (postgresql://...)"
    exit 1
fi

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$SCRIPT_DIR/.."
MIGRATIONS_DIR="$ROOT_DIR/supabase/migrations"

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo "❌ Error: Migrations directory not found at $MIGRATIONS_DIR"
    exit 1
fi

echo "📁 Found migrations directory: $MIGRATIONS_DIR"
echo ""

# Count migrations
MIGRATION_COUNT=$(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | wc -l)
echo "📊 Found $MIGRATION_COUNT migration files"
echo ""

# Apply migrations in order
echo "🚀 Applying migrations..."
echo "------------------------"

for migration in "$MIGRATIONS_DIR"/*.sql; do
    filename=$(basename "$migration")
    echo -n "  Applying $filename... "
    
    # Apply the migration
    if psql "$SUPABASE_DB_URL" -f "$migration" > /dev/null 2>&1; then
        echo "✅"
    else
        echo "❌"
        echo "  Error applying migration. Running with verbose output:"
        psql "$SUPABASE_DB_URL" -f "$migration"
        exit 1
    fi
done

echo ""
echo "✅ All migrations applied successfully!"
echo ""
echo "📋 Database should now contain:"
echo "  - User management tables"
echo "  - Tickets and forms tables"
echo "  - Inventory management tables"
echo "  - Patient handouts tables"
echo "  - Clinical staffing tables"
echo "  - Call center tables"
echo "  - Compliance training tables"
echo "  - EOS L10 tables"
echo "  - And many more..."
echo ""
echo "🔒 Remember to verify RLS policies are enabled!"