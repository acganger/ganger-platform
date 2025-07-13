const fs = require('fs');
const path = require('path');
const glob = require('glob');

describe('Vercel install commands', () => {
  const STANDARD_INSTALL_COMMAND = "cd ../.. && pnpm install --frozen-lockfile=false";
  
  it('should have standardized install commands in all vercel.json files', () => {
    // Find all vercel.json files
    const vercelFiles = glob.sync('apps/*/vercel.json', {
      cwd: path.join(__dirname, '../..'),
      absolute: true
    });
    
    const nonStandardApps = [];
    
    vercelFiles.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf8');
      const config = JSON.parse(content);
      const appName = path.dirname(filePath).split('/').pop();
      
      if (config.installCommand && config.installCommand !== STANDARD_INSTALL_COMMAND) {
        nonStandardApps.push({
          app: appName,
          command: config.installCommand
        });
      }
    });
    
    expect(nonStandardApps).toEqual([]);
  });
  
  it('should not use NODE_ENV in install commands', () => {
    const vercelFiles = glob.sync('**/vercel.json', {
      cwd: path.join(__dirname, '../..'),
      absolute: true,
      ignore: ['**/node_modules/**']
    });
    
    const envBasedCommands = [];
    
    vercelFiles.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf8');
      const config = JSON.parse(content);
      
      if (config.installCommand && config.installCommand.includes('NODE_ENV=')) {
        envBasedCommands.push({
          file: filePath.replace(path.join(__dirname, '../..') + '/', ''),
          command: config.installCommand
        });
      }
    });
    
    expect(envBasedCommands).toEqual([]);
  });
  
  it('should use --frozen-lockfile=false for Vercel compatibility', () => {
    const vercelFiles = glob.sync('apps/*/vercel.json', {
      cwd: path.join(__dirname, '../..'),
      absolute: true
    });
    
    const incorrectLockfileFlags = [];
    
    vercelFiles.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf8');
      const config = JSON.parse(content);
      const appName = path.dirname(filePath).split('/').pop();
      
      if (config.installCommand) {
        if (config.installCommand.includes('--no-frozen-lockfile') || 
            (config.installCommand.includes('pnpm install') && 
             !config.installCommand.includes('--frozen-lockfile=false'))) {
          incorrectLockfileFlags.push({
            app: appName,
            command: config.installCommand
          });
        }
      }
    });
    
    expect(incorrectLockfileFlags).toEqual([]);
  });
});