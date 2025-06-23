#!/bin/bash

# Preview what will be deleted before actually cleaning up

echo "🔍 PREVIEW: Files that will be deleted..."
echo "========================================="

echo -e "\n📄 Deployment documentation ($(ls -1 DEPLOY*.md *DEPLOY*.md ROUTING*.md VM_*.md ARCHITECTURE*.md 2>/dev/null | wc -l) files):"
ls -1 DEPLOY*.md *DEPLOY*.md ROUTING*.md VM_*.md ARCHITECTURE*.md 2>/dev/null | head -20

echo -e "\n📜 Deployment scripts ($(ls -1 deploy-*.sh fix-*.sh test-*.sh verify-*.sh 2>/dev/null | wc -l) files):"
ls -1 deploy-*.sh fix-*.sh test-*.sh verify-*.sh 2>/dev/null | head -20

echo -e "\n⚡ Worker/Edge files:"
ls -1d cloudflare-workers/ clean-architecture/ workers/ 2>/dev/null
find apps -name "worker*.js" -o -name "wrangler*" 2>/dev/null | head -10

echo -e "\n📊 Logs and artifacts:"
ls -1 *.log *.txt deployment-*.json turborepo_*.json 2>/dev/null | head -10

echo -e "\n🖼️ Screenshots and archives:"
ls -1 Screenshot*.png *.tar.gz 2>/dev/null

echo -e "\n📱 App-specific deployment files:"
find apps -name "deploy.sh" -o -name "worker.js" -o -name "Dockerfile" -o -name "*.backup" 2>/dev/null | head -20

echo -e "\n========================================="
echo "Total files to be deleted: $(find . -name "deploy-*.sh" -o -name "DEPLOY*.md" -o -name "worker*.js" -o -name "Screenshot*.png" 2>/dev/null | wc -l)"
echo ""
echo "Run ./cleanup-deployment-mess.sh to actually delete these files"