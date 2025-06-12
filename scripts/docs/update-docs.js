#!/usr/bin/env node
/**
 * Enhanced Documentation Update Script
 * Command: /updatedocs
 * Purpose: Session-aware documentation updater with interactive approval
 * Follows DOCUMENTATION_PROTOCOL.md standards
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const DOCS_DIR = path.join(PROJECT_ROOT, 'docs');
const ARCHIVE_DIR = path.join(DOCS_DIR, '_docs_archive');
const PROJECT_TRACKER = path.join(PROJECT_ROOT, 'PROJECT_TRACKER.md');
const PROTOCOL_FILE = path.join(DOCS_DIR, 'DOCUMENTATION_PROTOCOL.md');

class SessionAwareDocumentationUpdater {
  constructor() {
    this.issues = [];
    this.suggestions = [];
    this.sessionChanges = [];
    this.proposedUpdates = [];
    this.workPatterns = {};
    this.documentationMap = new Map();
    this.forbiddenPatterns = null; // Will be loaded from DOCUMENTATION_PROTOCOL.md
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  log(message, type = 'info') {
    const prefix = {
      'info': '📋',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌',
      'action': '🔧',
      'session': '🎯',
      'update': '📝'
    }[type];
    console.log(`${prefix} ${message}`);
  }

  async run() {
    this.log('Enhanced Documentation Update Analysis Starting...', 'info');
    this.log('Following DOCUMENTATION_PROTOCOL.md standards', 'info');
    
    try {
      // Phase 1: Status Check (existing functionality)
      await this.performStatusCheck();
      
      // Phase 2: Session Analysis (new functionality)
      await this.analyzeRecentSession();
      
      // Phase 3: Generate Smart Updates (new functionality)
      await this.generateSessionUpdates();
      
      // Phase 4: Interactive Approval (new functionality)
      await this.interactiveUpdateApproval();
      
      // Phase 5: Apply Updates (new functionality)
      await this.applyApprovedUpdates();
      
    } catch (error) {
      this.log(`Error: ${error.message}`, 'error');
    } finally {
      this.rl.close();
    }
  }

  async performStatusCheck() {
    this.log('\\n=== PHASE 1: DOCUMENTATION STATUS CHECK ===', 'info');
    
    // Run existing status checks
    await this.checkCoreFiles();
    await this.analyzeDocStructure();
    await this.checkProtocolViolations();
    await this.checkProjectTracker();
    await this.generateRecommendations();
    
    this.showStatusSummary();
  }

  async analyzeRecentSession() {
    this.log('\\n=== PHASE 2: SESSION ANALYSIS ===', 'session');
    
    // Analyze recent file changes
    await this.detectRecentChanges();
    
    // Identify work patterns
    await this.identifyWorkPatterns();
    
    // Map changes to documentation areas
    await this.mapChangesToDocs();
  }

  async detectRecentChanges() {
    this.log('Analyzing recent development session...', 'session');
    
    const cutoffHours = 12; // Look back 12 hours
    const cutoffTime = Date.now() - (cutoffHours * 60 * 60 * 1000);
    
    const projectTrackerStats = fs.existsSync(PROJECT_TRACKER) ? 
      fs.statSync(PROJECT_TRACKER) : null;
    
    if (projectTrackerStats) {
      const hoursSinceUpdate = Math.round(
        (Date.now() - projectTrackerStats.mtime.getTime()) / (1000 * 60 * 60)
      );
      this.log(`PROJECT_TRACKER.md last updated ${hoursSinceUpdate} hours ago`, 'session');
    }

    // Check for recent changes in key directories
    const keyDirs = ['apps', 'packages', 'scripts', 'docs'];
    let totalChanges = 0;

    for (const dir of keyDirs) {
      const dirPath = path.join(PROJECT_ROOT, dir);
      if (fs.existsSync(dirPath)) {
        const changes = await this.scanDirectoryForChanges(dirPath, cutoffTime);
        totalChanges += changes.length;
        
        if (changes.length > 0) {
          this.log(`Found ${changes.length} recent changes in ${dir}/`, 'session');
          this.sessionChanges.push(...changes);
        }
      }
    }

    this.log(`Total recent changes detected: ${totalChanges}`, 'session');
  }

  async scanDirectoryForChanges(dirPath, cutoffTime, relativePath = '') {
    const changes = [];
    
    try {
      const entries = fs.readdirSync(dirPath);
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry);
        const relPath = path.join(relativePath, entry);
        
        // Skip node_modules, .git, etc.
        if (entry.startsWith('.') || entry === 'node_modules') continue;
        
        try {
          const stats = fs.statSync(fullPath);
          
          if (stats.mtime.getTime() > cutoffTime) {
            changes.push({
              path: relPath,
              fullPath: fullPath,
              modified: stats.mtime,
              isDirectory: stats.isDirectory(),
              type: this.inferChangeType(relPath)
            });
          }
          
          // Recurse into directories (limit depth)
          if (stats.isDirectory() && relativePath.split('/').length < 3) {
            const subChanges = await this.scanDirectoryForChanges(
              fullPath, 
              cutoffTime, 
              relPath
            );
            changes.push(...subChanges);
          }
        } catch (e) {
          // Skip files we can't access
        }
      }
    } catch (e) {
      // Skip directories we can't access
    }
    
    return changes;
  }

  inferChangeType(filePath) {
    if (filePath.includes('apps/')) {
      return 'APP_DEVELOPMENT';
    }
    
    if (filePath.includes('packages/')) return 'INFRASTRUCTURE_UPDATE';
    if (filePath.includes('scripts/')) return 'TOOLING_UPDATE';
    if (filePath.includes('docs/')) return 'DOCUMENTATION_UPDATE';
    if (filePath.includes('.md')) return 'DOCUMENTATION_UPDATE';
    
    return 'GENERAL_UPDATE';
  }

  async identifyWorkPatterns() {
    this.log('Identifying work patterns from session...', 'session');
    
    const patterns = {};
    
    this.sessionChanges.forEach(change => {
      if (!patterns[change.type]) {
        patterns[change.type] = [];
      }
      patterns[change.type].push(change);
    });
    
    // Analyze patterns
    for (const [type, changes] of Object.entries(patterns)) {
      this.log(`${type}: ${changes.length} files modified`, 'session');
      
      if (type === 'APP_DEVELOPMENT' && changes.length > 0) {
        this.log('  → Application development detected', 'session');
      }
      
      if (type === 'INFRASTRUCTURE_UPDATE' && changes.length > 0) {
        this.log('  → Shared infrastructure updates detected', 'session');
      }
      
      if (type === 'DOCUMENTATION_UPDATE' && changes.length > 0) {
        this.log('  → Documentation updates detected', 'session');
      }
    }
    
    this.workPatterns = patterns;
  }

  async mapChangesToDocs() {
    this.log('Mapping changes to documentation sections...', 'session');
    
    const updateMap = new Map();
    
    // Map work patterns to specific documentation updates
    if (this.workPatterns.APP_DEVELOPMENT) {
      updateMap.set('PROJECT_TRACKER_APPS', {
        section: 'Application Development Status',
        type: 'STATUS_UPDATE',
        priority: 'HIGH',
        reason: 'Application development activity'
      });
    }
    
    if (this.workPatterns.INFRASTRUCTURE_UPDATE) {
      updateMap.set('PROJECT_TRACKER_INFRASTRUCTURE', {
        section: 'Infrastructure Status',
        type: 'TECHNICAL_UPDATE',
        priority: 'MEDIUM',
        reason: 'Shared infrastructure modifications'
      });
    }
    
    if (this.workPatterns.DOCUMENTATION_UPDATE) {
      updateMap.set('PROJECT_TRACKER_DOCS', {
        section: 'Documentation Updates',
        type: 'DOCUMENTATION_UPDATE',
        priority: 'MEDIUM',
        reason: 'Documentation files modified'
      });
    }
    
    // Always suggest timestamp update if session activity detected
    if (this.sessionChanges.length > 0) {
      updateMap.set('PROJECT_TRACKER_TIMESTAMP', {
        section: 'Header timestamp',
        type: 'TIMESTAMP_UPDATE',
        priority: 'MEDIUM',
        reason: 'Session activity detected'
      });
    }
    
    this.documentationMap = updateMap;
    this.log(`Identified ${updateMap.size} potential documentation updates`, 'session');
  }

  async generateSessionUpdates() {
    this.log('\\n=== PHASE 3: GENERATING SMART UPDATES ===', 'update');
    
    for (const [key, mapping] of this.documentationMap.entries()) {
      const update = await this.generateSpecificUpdate(key, mapping);
      if (update) {
        this.proposedUpdates.push(update);
      }
    }
    
    this.log(`Generated ${this.proposedUpdates.length} proposed updates`, 'update');
  }

  async generateSpecificUpdate(key, mapping) {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    switch (key) {
      case 'PROJECT_TRACKER_TIMESTAMP':
        return {
          id: key,
          title: 'Update PROJECT_TRACKER timestamp',
          section: mapping.section,
          priority: mapping.priority,
          type: 'REPLACE',
          searchPattern: /Last Updated: [^\\n]+/,
          replacement: `Last Updated: ${currentDate} - Development Session Update`,
          reason: 'Development session completed',
          preview: `*Last Updated: ${currentDate} - Development Session Update*`
        };
        
      case 'PROJECT_TRACKER_APPS':
        return {
          id: key,
          title: 'Update application development status',
          section: mapping.section,
          priority: mapping.priority,
          type: 'STATUS_UPDATE',
          reason: 'Application development activity detected',
          preview: 'Update PROJECT_TRACKER with recent application development progress'
        };
        
      case 'PROJECT_TRACKER_DOCS':
        return {
          id: key,
          title: 'Update documentation changes',
          section: mapping.section,
          priority: mapping.priority,
          type: 'DOCUMENTATION_UPDATE',
          reason: 'Documentation files have been modified',
          preview: 'Record documentation updates in PROJECT_TRACKER'
        };
        
      default:
        return null;
    }
  }

  async interactiveUpdateApproval() {
    this.log('\\n=== PHASE 4: INTERACTIVE UPDATE APPROVAL ===', 'action');
    
    if (this.proposedUpdates.length === 0) {
      this.log('No updates proposed. Documentation appears current!', 'success');
      return;
    }
    
    this.log('Proposed documentation updates:', 'action');
    
    for (let i = 0; i < this.proposedUpdates.length; i++) {
      const update = this.proposedUpdates[i];
      
      console.log(`\\n${i + 1}. ${update.title}`);
      console.log(`   Priority: ${update.priority}`);
      console.log(`   Reason: ${update.reason}`);
      console.log(`   Preview: ${update.preview}`);
      
      const response = await this.askQuestion(
        `   Apply this update? (y/n/s to skip): `
      );
      
      if (response.toLowerCase() === 'y' || response.toLowerCase() === 'yes') {
        update.approved = true;
        this.log(`   ✅ Approved: ${update.title}`, 'success');
      } else if (response.toLowerCase() === 's' || response.toLowerCase() === 'skip') {
        update.approved = false;
        this.log(`   ⏭️  Skipped: ${update.title}`, 'warning');
      } else {
        update.approved = false;
        this.log(`   ❌ Rejected: ${update.title}`, 'warning');
      }
    }
    
    const approvedCount = this.proposedUpdates.filter(u => u.approved).length;
    this.log(`\\nApproval complete: ${approvedCount}/${this.proposedUpdates.length} updates approved`, 'action');
  }

  async applyApprovedUpdates() {
    this.log('\\n=== PHASE 5: APPLYING UPDATES ===', 'update');
    
    const approvedUpdates = this.proposedUpdates.filter(u => u.approved);
    
    if (approvedUpdates.length === 0) {
      this.log('No updates to apply.', 'info');
      return;
    }
    
    for (const update of approvedUpdates) {
      try {
        await this.applyUpdate(update);
        this.log(`✅ Applied: ${update.title}`, 'success');
      } catch (error) {
        this.log(`❌ Failed to apply: ${update.title} - ${error.message}`, 'error');
      }
    }
    
    this.log(`\\n🎉 Documentation update complete!`, 'success');
    this.log(`Applied ${approvedUpdates.length} updates to PROJECT_TRACKER.md`, 'success');
  }

  async applyUpdate(update) {
    if (!fs.existsSync(PROJECT_TRACKER)) {
      throw new Error('PROJECT_TRACKER.md not found');
    }
    
    let content = fs.readFileSync(PROJECT_TRACKER, 'utf8');
    
    switch (update.type) {
      case 'REPLACE':
        if (update.searchPattern && update.replacement) {
          content = content.replace(update.searchPattern, update.replacement);
        }
        break;
        
      case 'STATUS_UPDATE':
      case 'DOCUMENTATION_UPDATE':
        // For now, just update the timestamp as these require more complex logic
        const timestampPattern = /Last Updated: [^\\n]+/;
        const currentDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        content = content.replace(
          timestampPattern, 
          `Last Updated: ${currentDate} - ${update.reason}`
        );
        break;
    }
    
    fs.writeFileSync(PROJECT_TRACKER, content, 'utf8');
  }

  async askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  // === DOCUMENTATION_PROTOCOL.md INTEGRATION ===
  
  async validateProtocolCompliance() {
    try {
      const protocolContent = fs.readFileSync(PROTOCOL_FILE, 'utf8');
      
      // Extract forbidden patterns from DOCUMENTATION_PROTOCOL.md
      const forbiddenSection = protocolContent.match(/### \\*\\*DO NOT CREATE:\\*\\*([\\s\\S]*?)### \\*\\*DO NOT DUPLICATE:\\*\\*/)?.[1];
      if (forbiddenSection) {
        const patterns = forbiddenSection
          .split('\\n')
          .filter(line => line.includes('.md') || line.includes('_STATUS') || line.includes('_NOTES'))
          .map(line => line.replace(/[^a-zA-Z0-9_\\.\\-]/g, '').trim())
          .filter(pattern => pattern.length > 0);
        
        this.log(`Loaded ${patterns.length} forbidden patterns from DOCUMENTATION_PROTOCOL.md`, 'info');
        this.forbiddenPatterns = patterns;
      }
      
      // Check for protocol-required files
      const requiredFiles = ['SETUP.md', 'NEW_APPLICATION_DEVELOPMENT_STANDARDS.md', 'SYSTEM_ARCHITECTURE.md'];
      requiredFiles.forEach(file => {
        const filePath = path.join(DOCS_DIR, file);
        if (!fs.existsSync(filePath)) {
          this.suggestions.push(`Protocol recommends creating docs/${file}`);
        }
      });
      
    } catch (error) {
      this.log(`Warning: Could not validate protocol compliance: ${error.message}`, 'warning');
    }
  }

  // === EXISTING STATUS CHECK METHODS ===
  
  async checkCoreFiles() {
    this.log('\\nChecking core documentation files...', 'info');
    
    const coreFiles = [
      { path: PROJECT_TRACKER, name: 'PROJECT_TRACKER.md', required: true },
      { path: PROTOCOL_FILE, name: 'DOCUMENTATION_PROTOCOL.md', required: true },
      { path: path.join(PROJECT_ROOT, 'README.md'), name: 'README.md', required: true },
      { path: path.join(PROJECT_ROOT, 'CLAUDE.md'), name: 'CLAUDE.md', required: true }
    ];

    for (const file of coreFiles) {
      if (fs.existsSync(file.path)) {
        this.log(`${file.name} exists`, 'success');
      } else {
        this.log(`${file.name} missing`, 'error');
        this.issues.push(`Missing required file: ${file.name}`);
      }
    }

    // Check DOCUMENTATION_PROTOCOL.md compliance
    if (fs.existsSync(PROTOCOL_FILE)) {
      this.log('Validating DOCUMENTATION_PROTOCOL.md compliance...', 'info');
      await this.validateProtocolCompliance();
    }
  }

  async analyzeDocStructure() {
    this.log('\\nAnalyzing documentation structure...', 'info');
    
    if (!fs.existsSync(DOCS_DIR)) {
      this.issues.push('docs/ directory missing');
      return;
    }

    const docFiles = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md'));
    this.log(`Found ${docFiles.length} documentation files`, 'info');

    // Check for expected files according to protocol
    const expectedFiles = [
      'SETUP.md',
      'NEW_APPLICATION_DEVELOPMENT_STANDARDS.md',
      'SYSTEM_ARCHITECTURE.md', 
      'AUTHENTICATION_STANDARDS.md',
      'DEPLOYMENT.md',
      'DOCUMENTATION_PROTOCOL.md'
    ];

    expectedFiles.forEach(file => {
      if (docFiles.includes(file)) {
        this.log(`✓ ${file}`, 'success');
      } else {
        this.log(`✗ ${file} missing`, 'warning');
        this.suggestions.push(`Consider creating ${file} if needed`);
      }
    });

    // Check for archive directory
    if (fs.existsSync(ARCHIVE_DIR)) {
      const archiveFiles = fs.readdirSync(ARCHIVE_DIR).filter(f => f.endsWith('.md'));
      this.log(`Archive contains ${archiveFiles.length} files`, 'info');
    } else {
      this.suggestions.push('Consider creating docs/_docs_archive/ for completed work');
    }
  }

  async checkProtocolViolations() {
    this.log('\\nChecking for protocol violations...', 'info');
    
    if (!fs.existsSync(DOCS_DIR)) return;

    const docFiles = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md'));
    
    // Use forbidden patterns from DOCUMENTATION_PROTOCOL.md if loaded, otherwise use defaults
    const defaultForbiddenPatterns = [
      '_STATUS.md',
      '_NOTES.md', 
      '_PROGRESS.md',
      'DEVELOPMENT_STATUS.md',
      'INFRASTRUCTURE_NOTES.md',
      'README_DEVELOPMENT.md',
      'PROGRESS_UPDATE.md',
      'STATUS_REPORT.md'
    ];
    
    const forbiddenPatterns = this.forbiddenPatterns || defaultForbiddenPatterns;
    this.log(`Checking against ${forbiddenPatterns.length} forbidden patterns`, 'info');

    docFiles.forEach(file => {
      forbiddenPatterns.forEach(pattern => {
        if (file.includes(pattern.replace('.md', '')) || file === pattern) {
          this.issues.push(`Protocol violation: ${file} matches forbidden pattern ${pattern}`);
        }
      });
    });

    // Check for duplicate development files
    const developmentFiles = docFiles.filter(f => 
      f.includes('DEVELOPMENT') || f.includes('PROCESS') || f.includes('PLAN')
    );

    if (developmentFiles.length > 1) {
      this.issues.push(`Multiple development files found: ${developmentFiles.join(', ')}. Should consolidate into NEW_APPLICATION_DEVELOPMENT_STANDARDS.md`);
    }
  }

  async checkProjectTracker() {
    this.log('\\nChecking PROJECT_TRACKER.md status...', 'info');
    
    if (!fs.existsSync(PROJECT_TRACKER)) {
      this.issues.push('PROJECT_TRACKER.md missing from root directory');
      return;
    }

    const stats = fs.statSync(PROJECT_TRACKER);
    const daysSinceUpdate = Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24));
    
    this.log(`Last updated: ${daysSinceUpdate} days ago`, daysSinceUpdate > 7 ? 'warning' : 'success');
    
    if (daysSinceUpdate > 7) {
      this.suggestions.push('PROJECT_TRACKER.md may need updating (last updated >7 days ago)');
    }

    // Check file size (should have substantial content)
    const sizeKB = Math.round(stats.size / 1024);
    this.log(`File size: ${sizeKB}KB`, sizeKB > 10 ? 'success' : 'warning');
    
    if (sizeKB < 5) {
      this.suggestions.push('PROJECT_TRACKER.md seems light on content');
    }
  }

  async generateRecommendations() {
    this.log('\\nGenerating recommendations...', 'info');

    // Check for outdated status files that should be archived
    if (fs.existsSync(DOCS_DIR)) {
      const docFiles = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md'));
      
      const statusKeywords = ['STATUS', 'SUMMARY', 'COMPLETE', 'IMPLEMENTATION', 'ANALYSIS'];
      const potentialArchives = docFiles.filter(file => 
        statusKeywords.some(keyword => file.includes(keyword))
      );

      if (potentialArchives.length > 0) {
        this.suggestions.push(`Consider archiving completion records: ${potentialArchives.join(', ')}`);
      }
    }

    // Check for missing essential docs
    const essentialDocs = [
      { file: 'SETUP.md', purpose: 'Development environment setup' },
      { file: 'DEPLOYMENT.md', purpose: 'Production deployment procedures' },
      { file: 'SYSTEM_ARCHITECTURE.md', purpose: 'Current architecture overview' }
    ];

    essentialDocs.forEach(doc => {
      if (!fs.existsSync(path.join(DOCS_DIR, doc.file))) {
        this.suggestions.push(`Create ${doc.file} for ${doc.purpose}`);
      }
    });
  }

  showStatusSummary() {
    this.log('\\nStatus Check Summary:', 'info');
    
    if (this.issues.length === 0) {
      this.log('✅ No critical issues found', 'success');
    } else {
      this.log(`Found ${this.issues.length} issues:`, 'error');
      this.issues.forEach(issue => this.log(`  • ${issue}`, 'error'));
    }
    
    if (this.suggestions.length > 0) {
      this.log(`${this.suggestions.length} suggestions:`, 'warning');
      this.suggestions.forEach(suggestion => this.log(`  • ${suggestion}`, 'warning'));
    }
  }

  // Legacy method for backwards compatibility
  showSummary() {
    this.showStatusSummary();
    
    // Original summary content for reference
    const totalChecks = 10;
    const issueCount = this.issues.length;
    const score = Math.max(0, Math.round((totalChecks - issueCount) / totalChecks * 100));
    
    this.log(`\\nDocumentation Protocol Compliance: ${score}%`, score >= 90 ? 'success' : score >= 70 ? 'warning' : 'error');

    this.log('\\n📋 To manually update PROJECT_TRACKER.md:', 'action');
    this.log('  1. Open PROJECT_TRACKER.md', 'action');  
    this.log('  2. Update current status sections', 'action');
    this.log('  3. Add timestamp to changes', 'action');
    this.log('  4. Follow single-source-of-truth principle', 'action');
  }
}

// CLI Interface
if (require.main === module) {
  const updater = new SessionAwareDocumentationUpdater();
  updater.run().catch(console.error);
}

module.exports = SessionAwareDocumentationUpdater;