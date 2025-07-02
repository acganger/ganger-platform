#!/bin/bash

set -e

echo "🚀 Checking for Supabase CLI..."
if ! command -v supabase &> /dev/null; then
  echo "📦 Installing Supabase CLI..."
  npm install -g supabase
else
  echo "✅ Supabase CLI already installed"
fi

echo "📁 Initializing Supabase project..."
supabase init --project-name local-dev || true

echo "🧱 Starting local Supabase stack..."
supabase start

echo "⏳ Waiting for Supabase to spin up..."
sleep 5

CONFIG_PATH="supabase/config.toml"

if [ ! -f "$CONFIG_PATH" ]; then
  echo "❌ Couldn't find config.toml. Something went wrong."
  exit 1
fi

echo "🔐 Extracting anon and service_role keys..."
ANON_KEY=$(grep anon_key "$CONFIG_PATH" | cut -d'"' -f2)
SERVICE_ROLE_KEY=$(grep service_role_key "$CONFIG_PATH" | cut -d'"' -f2)
SUPABASE_URL="http://localhost:54321"

ENV_FILE=".env.local"

echo "🌿 Writing keys to $ENV_FILE"
cat > "$ENV_FILE" <<EOF
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
EOF

echo ""
echo "✅ Supabase local setup complete!"
echo "📍 URL: $SUPABASE_URL"
echo "🔑 ANON KEY: $ANON_KEY"
echo "🔑 SERVICE ROLE KEY: $SERVICE_ROLE_KEY"
echo "📝 Keys saved to $ENV_FILE"
echo "🧪 You can now connect your tools to your local Supabase instance."
