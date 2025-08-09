#!/bin/bash

# Fix the analysis-engine.ts file properly
FILE="/q/Projects/ganger-platform/apps/ai-purchasing-agent/src/lib/ai-engine/analysis-engine.ts"

# Fix analyzeVendor method references
sed -i 's/_vendor: VendorConfiguration/vendor: VendorConfiguration/g' "$FILE"
sed -i 's/_context: AnalysisContext/context: AnalysisContext/g' "$FILE"

# Fix variable names in methods that were incorrectly renamed
sed -i 's/__vendor/__vendor/g' "$FILE"
sed -i 's/__context/__context/g' "$FILE"

# Fix score reference
sed -i 's/_score: number/score: number/g' "$FILE"
sed -i 's/_factors: VendorAnalysis/factors: VendorAnalysis/g' "$FILE"

echo "Fixed analysis-engine.ts"