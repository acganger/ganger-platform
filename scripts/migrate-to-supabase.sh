#!/bin/bash

# Script to migrate ganger-actions tables to Supabase
# This script should be run after setting up the Supabase environment

echo "🚀 Starting Supabase migration for ganger-actions..."

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Check if required environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Error: Missing required environment variables"
  echo "Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env"
  exit 1
fi

echo "📊 Running migrations..."

# Run the migrations using Supabase CLI or direct SQL
# Note: You'll need to have the Supabase CLI installed or use the Supabase dashboard

# Option 1: Using Supabase CLI (if installed)
if command -v supabase &> /dev/null; then
  echo "Using Supabase CLI..."
  supabase db push --db-url "$DATABASE_URL"
else
  echo "⚠️  Supabase CLI not found. Please run the migrations manually:"
  echo ""
  echo "1. Go to your Supabase dashboard: https://app.supabase.com"
  echo "2. Navigate to SQL Editor"
  echo "3. Run the following migration files in order:"
  echo "   - supabase/migrations/20250107_create_ganger_actions_tables.sql"
  echo "   - supabase/migrations/20250107_migrate_legacy_tickets_data.sql"
  echo ""
  echo "Or install Supabase CLI: npm install -g supabase"
fi

echo ""
echo "📝 Next steps:"
echo "1. Verify tables were created in Supabase dashboard"
echo "2. Import legacy data if needed (see migration script)"
echo "3. Test the application with: npm run dev"
echo ""
echo "✅ Migration preparation complete!"