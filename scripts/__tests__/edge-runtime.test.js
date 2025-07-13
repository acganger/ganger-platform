const fs = require('fs');
const path = require('path');
const glob = require('glob');

describe('Edge runtime configurations', () => {
  it('should not use experimental-edge runtime', () => {
    const files = glob.sync('apps/**/*.{ts,tsx,js,jsx}', {
      cwd: path.join(__dirname, '../..'),
      absolute: true,
      ignore: ['**/node_modules/**', '**/.next/**']
    });
    
    const experimentalEdgeFiles = [];
    
    files.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (content.includes("export const runtime = 'experimental-edge'")) {
        const relativePath = filePath.replace(path.join(__dirname, '../..') + '/', '');
        experimentalEdgeFiles.push(relativePath);
      }
    });
    
    expect(experimentalEdgeFiles).toEqual([]);
  });
  
  it('should use correct edge runtime syntax for Next.js 14', () => {
    const files = glob.sync('apps/**/*.{ts,tsx,js,jsx}', {
      cwd: path.join(__dirname, '../..'),
      absolute: true,
      ignore: ['**/node_modules/**', '**/.next/**']
    });
    
    const incorrectSyntax = [];
    
    files.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for various incorrect edge runtime patterns
      const incorrectPatterns = [
        /export const config = \{ runtime: ['"]edge['"] \}/,
        /export const config = \{ runtime: ['"]experimental-edge['"] \}/,
        /export const runtime = ["']nodejs["']/  // nodejs runtime should not be explicitly set
      ];
      
      incorrectPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          const relativePath = filePath.replace(path.join(__dirname, '../..') + '/', '');
          incorrectSyntax.push({
            file: relativePath,
            pattern: pattern.toString()
          });
        }
      });
    });
    
    expect(incorrectSyntax).toEqual([]);
  });
  
  it('edge runtime pages should not use Node.js-only modules', () => {
    const files = glob.sync('apps/**/*.{ts,tsx,js,jsx}', {
      cwd: path.join(__dirname, '../..'),
      absolute: true,
      ignore: ['**/node_modules/**', '**/.next/**']
    });
    
    const edgeIncompatible = [];
    
    files.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // If file uses edge runtime
      if (content.includes("export const runtime = 'edge'")) {
        // Check for Node.js-only modules
        const nodeOnlyModules = [
          'fs', 'path', 'child_process', 'crypto', 'os', 'net', 
          'tls', 'cluster', 'dgram', 'dns', 'http2', 'readline'
        ];
        
        nodeOnlyModules.forEach(module => {
          const importPattern = new RegExp(`import.*from ['"]${module}['"]|require\\(['"]${module}['"]\\)`);
          if (importPattern.test(content)) {
            const relativePath = filePath.replace(path.join(__dirname, '../..') + '/', '');
            edgeIncompatible.push({
              file: relativePath,
              module: module
            });
          }
        });
      }
    });
    
    expect(edgeIncompatible).toEqual([]);
  });
});