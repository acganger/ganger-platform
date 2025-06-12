#!/bin/bash

# Documentation Update Command
# Usage: /updatedocs
# Purpose: Analyze and update project documentation according to DOCUMENTATION_PROTOCOL.md

echo "🚀 Ganger Platform Documentation Updater"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "PROJECT_TRACKER.md" ]; then
    echo "❌ Error: Run this from the project root directory"
    echo "   Expected: Q:/Projects/ganger-platform/"
    exit 1
fi

# Run the documentation analysis
echo "📋 Analyzing documentation structure..."
node scripts/docs/update-docs.js

echo ""
echo "🔧 Additional Actions Available:"
echo ""
echo "1. Update PROJECT_TRACKER.md:"
echo "   code PROJECT_TRACKER.md"
echo ""
echo "2. View Documentation Protocol:"
echo "   code docs/DOCUMENTATION_PROTOCOL.md"
echo ""
echo "3. Check git status for documentation changes:"
echo "   git status docs/"
echo ""
echo "4. Archive old documentation:"
echo "   # Move completed work to docs/_docs_archive/"
echo ""
echo "5. Consolidate duplicate files:"
echo "   # Follow single-source-of-truth principle"
echo ""
echo "✅ Documentation analysis complete!"
