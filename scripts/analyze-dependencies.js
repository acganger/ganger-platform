#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Collect all dependencies from all apps and packages
const allDependencies = {};
const allDevDependencies = {};
const packageVersions = {};

// Function to merge dependencies
function mergeDeps(target, source, packageName) {
  Object.entries(source || {}).forEach(([dep, version]) => {
    if (!target[dep]) {
      target[dep] = version;
      packageVersions[dep] = { [packageName]: version };
    } else if (target[dep] !== version) {
      // Track version conflicts
      if (!packageVersions[dep]) packageVersions[dep] = {};
      packageVersions[dep][packageName] = version;
      
      // Use the newer version (simple heuristic)
      if (version > target[dep]) {
        console.log(`Version conflict for ${dep}: ${target[dep]} vs ${version} (using ${version})`);
        target[dep] = version;
      }
    }
  });
}

// Read all package.json files
const appsDir = path.join(__dirname, '..', 'apps');
const packagesDir = path.join(__dirname, '..', 'packages');

// Process apps
fs.readdirSync(appsDir).forEach(app => {
  const pkgPath = path.join(appsDir, app, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    console.log(`Processing app: ${app}`);
    mergeDeps(allDependencies, pkg.dependencies, `apps/${app}`);
    mergeDeps(allDevDependencies, pkg.devDependencies, `apps/${app}`);
  }
});

// Process packages
fs.readdirSync(packagesDir).forEach(pkg => {
  const pkgPath = path.join(packagesDir, pkg, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    console.log(`Processing package: ${pkg}`);
    mergeDeps(allDependencies, pkgJson.dependencies, `packages/${pkg}`);
    mergeDeps(allDevDependencies, pkgJson.devDependencies, `packages/${pkg}`);
  }
});

// Sort dependencies
const sortedDeps = Object.keys(allDependencies).sort().reduce((obj, key) => {
  obj[key] = allDependencies[key];
  return obj;
}, {});

const sortedDevDeps = Object.keys(allDevDependencies).sort().reduce((obj, key) => {
  obj[key] = allDevDependencies[key];
  return obj;
}, {});

// Output results
console.log('\n=== Unified Dependencies ===');
console.log(JSON.stringify(sortedDeps, null, 2));
console.log('\n=== Unified Dev Dependencies ===');
console.log(JSON.stringify(sortedDevDeps, null, 2));

// Check for conflicts
console.log('\n=== Version Conflicts ===');
Object.entries(packageVersions).forEach(([dep, versions]) => {
  const uniqueVersions = [...new Set(Object.values(versions))];
  if (uniqueVersions.length > 1) {
    console.log(`${dep}:`);
    Object.entries(versions).forEach(([pkg, ver]) => {
      console.log(`  ${pkg}: ${ver}`);
    });
  }
});

// Write unified package.json template
const unifiedPackage = {
  dependencies: sortedDeps,
  devDependencies: sortedDevDeps
};

fs.writeFileSync(
  path.join(__dirname, '..', 'unified-dependencies.json'),
  JSON.stringify(unifiedPackage, null, 2)
);

console.log('\n✅ Unified dependencies written to unified-dependencies.json');