#!/bin/bash
# Template for deploying any app to the VM

# Usage: ./deploy-app-template.sh app-name port-number base-path
# Example: ./deploy-app-template.sh inventory 3011 /inventory

APP_NAME=$1
PORT=$2
BASE_PATH=$3

if [ -z "$APP_NAME" ] || [ -z "$PORT" ] || [ -z "$BASE_PATH" ]; then
    echo "Usage: $0 <app-name> <port> <base-path>"
    echo "Example: $0 inventory 3011 /inventory"
    exit 1
fi

echo "🚀 Deploying $APP_NAME to VM"
echo "=========================="
echo ""

# Create deployment directory
echo "📁 Creating app directory..."
ssh anand@35.225.189.208 "mkdir -p ~/apps/$APP_NAME"

# Create a simple Next.js app for the given app
cat > temp-deploy-$APP_NAME.sh << EOF
#!/bin/bash
cd ~/apps/$APP_NAME

# Create package.json
cat > package.json << 'PKGJSON'
{
  "name": "$APP_NAME",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev -p $PORT",
    "build": "next build",
    "start": "next start -p $PORT"
  },
  "dependencies": {
    "next": "14.2.29",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
PKGJSON

# Install dependencies
npm install

# Create pages directory
mkdir -p pages/api

# Create main page
cat > pages/index.js << 'INDEXJS'
export default function ${APP_NAME^}() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>${APP_NAME^} App</h1>
      <p>Running on port $PORT at path $BASE_PATH</p>
      <p>Dynamic Next.js app on Ganger VM</p>
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f0f0', borderRadius: '8px' }}>
        <strong>Session Info:</strong>
        <p>Shared session across all apps at staff.gangerdermatology.com</p>
      </div>
    </div>
  );
}
INDEXJS

# Create API health check
cat > pages/api/health.js << 'HEALTHJS'
export default function handler(req, res) {
  res.status(200).json({
    app: '$APP_NAME',
    status: 'healthy',
    port: $PORT,
    path: '$BASE_PATH',
    timestamp: new Date().toISOString()
  });
}
HEALTHJS

# Create next.config.js with basePath
cat > next.config.js << 'NEXTCONFIG'
module.exports = {
  basePath: '$BASE_PATH',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};
NEXTCONFIG

# Build the app
npm run build

# Create PM2 config
cat > ecosystem.config.js << 'PM2CONFIG'
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: $PORT
    }
  }]
};
PM2CONFIG

# Start with PM2
pm2 stop $APP_NAME 2>/dev/null || true
pm2 delete $APP_NAME 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo "✅ $APP_NAME deployed successfully!"
EOF

# Upload and run the deployment script
echo "📤 Uploading deployment script..."
scp temp-deploy-$APP_NAME.sh anand@35.225.189.208:~/
ssh anand@35.225.189.208 "chmod +x temp-deploy-$APP_NAME.sh && ./temp-deploy-$APP_NAME.sh && rm temp-deploy-$APP_NAME.sh"
rm temp-deploy-$APP_NAME.sh

echo ""
echo "✅ $APP_NAME deployed!"
echo "   Port: $PORT"
echo "   Path: $BASE_PATH"
echo "   Will be accessible at: https://staff.gangerdermatology.com$BASE_PATH"