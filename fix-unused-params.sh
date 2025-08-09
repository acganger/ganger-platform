#!/bin/bash

# Fix all unused parameters in ai-purchasing-agent
cd /q/Projects/ganger-platform

# Find all TypeScript errors about unused parameters
echo "Finding and fixing unused parameters..."

# Fix analysis-engine.ts
sed -i 's/vendor: VendorConfiguration,/_vendor: VendorConfiguration,/g' apps/ai-purchasing-agent/src/lib/ai-engine/analysis-engine.ts
sed -i 's/context: AnalysisContext/_context: AnalysisContext/g' apps/ai-purchasing-agent/src/lib/ai-engine/analysis-engine.ts
sed -i 's/factors: VendorAnalysis/_factors: VendorAnalysis/g' apps/ai-purchasing-agent/src/lib/ai-engine/analysis-engine.ts
sed -i 's/score: number/_score: number/g' apps/ai-purchasing-agent/src/lib/ai-engine/analysis-engine.ts

echo "Fixed unused parameters. Building..."
pnpm -F @ganger/ai-purchasing-agent build