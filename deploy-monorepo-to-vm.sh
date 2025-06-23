#!/bin/bash
# Deploy Ganger Platform Monorepo to VM

echo "🚀 Deploying Ganger Platform Monorepo to VM"
echo "=========================================="
echo ""

# Configuration
VM_IP="35.225.189.208"
VM_USER="anand"
LOCAL_PATH="/mnt/q/Projects/ganger-platform"
REMOTE_PATH="~/ganger-platform"

echo "📦 Syncing monorepo to VM..."
echo "From: $LOCAL_PATH"
echo "To: $VM_USER@$VM_IP:$REMOTE_PATH"
echo ""

# Create remote directory
ssh $VM_USER@$VM_IP "mkdir -p $REMOTE_PATH"

# Sync files (excluding build artifacts and node_modules)
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='dist' \
  --exclude='build' \
  --exclude='.turbo' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='coverage' \
  --exclude='.env.local' \
  $LOCAL_PATH/ \
  $VM_USER@$VM_IP:$REMOTE_PATH/

echo ""
echo "✅ Files synced successfully!"
echo ""
echo "📋 Next steps:"
echo "1. SSH to VM: ssh $VM_USER@$VM_IP"
echo "2. cd $REMOTE_PATH"
echo "3. Run: ./setup-vm-deployment.sh"