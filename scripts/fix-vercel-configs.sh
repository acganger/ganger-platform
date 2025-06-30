#!/bin/bash

# Fix all vercel.json files to use simplified install command
echo "Updating vercel.json files to use simplified install command..."

for vercel_file in apps/*/vercel.json; do
  if grep -q "pnpm -F @ganger/auth build" "$vercel_file"; then
    app_name=$(basename $(dirname "$vercel_file"))
    echo "Updating $app_name..."
    
    # Create new vercel.json with simplified command
    cat > "$vercel_file" << EOF
{
  "installCommand": "cd ../.. && NODE_ENV=development pnpm install --no-frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm -F @ganger/${app_name} build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
EOF
  fi
done

echo "Done! Updated all apps with complex install commands."