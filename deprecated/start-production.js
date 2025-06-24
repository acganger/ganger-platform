// Production server for running Next.js apps dynamically
const { spawn } = require('child_process');
const path = require('path');

const apps = [
  { name: 'inventory', port: 4001 },
  { name: 'handouts', port: 4002 },
  { name: 'checkin-kiosk', port: 4003 },
  { name: 'medication-auth', port: 4004 }
];

console.log('🚀 Starting Dynamic Next.js Apps...\n');

apps.forEach(app => {
  const appPath = path.join(__dirname, 'apps', app.name);
  
  console.log(`Starting ${app.name} on port ${app.port}...`);
  
  const child = spawn('npm', ['start'], {
    cwd: appPath,
    env: { ...process.env, PORT: app.port },
    stdio: 'inherit'
  });
  
  child.on('error', (err) => {
    console.error(`Failed to start ${app.name}:`, err);
  });
});

console.log('\n✅ All apps starting...');
console.log('Access them at:');
apps.forEach(app => {
  console.log(`- ${app.name}: http://localhost:${app.port}`);
});