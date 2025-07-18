#!/bin/bash
# Production start script for EOS L10

# Load environment variables
export NODE_ENV=production
export PORT=3010
export NEXT_PUBLIC_SUPABASE_URL="https://supa.gangerdermatology.com"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_q-yj56RH8zrMVH-4cRazWA_PI2pBoeh"

echo "🚀 Starting EOS L10 on port $PORT..."
npm start
