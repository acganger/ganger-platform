#!/bin/bash

# Resolve all conflicts by keeping our changes (HEAD)
echo "Resolving merge conflicts..."

# List of files with conflicts
files=(
  "apps/eos-l10/src/pages/index.tsx"
  "apps/eos-l10/src/pages/issues/index.tsx"
  "apps/eos-l10/src/pages/meeting/start.tsx"
  "apps/eos-l10/src/pages/rocks/[id].tsx"
  "apps/eos-l10/src/pages/rocks/index.tsx"
  "apps/eos-l10/src/pages/scorecard/index.tsx"
  "apps/eos-l10/src/pages/scorecard/metrics.tsx"
  "apps/eos-l10/src/pages/todos/index.tsx"
)

# For each file, resolve conflicts by keeping ours
for file in "${files[@]}"; do
  echo "Resolving conflicts in $file..."
  # Use git checkout to keep our version
  git checkout --ours "$file"
  # Add the resolved file
  git add "$file"
done

# Add the already resolved Navigation.tsx
git add apps/batch-closeout/src/components/protocol/Navigation.tsx

echo "All conflicts resolved!"