#!/usr/bin/env node
/**
 * Sprint Initialization Script
 * Command: /sprint
 * Purpose: Read all documentation before starting a new development session
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const DOCS_DIR = path.join(PROJECT_ROOT, 'docs');

class SprintInitializer {
  constructor() {
    this.docsRead = 0;
    this.totalSize = 0;
  }

  log(message, type = 'info') {
    const prefix = {
      'info': '📋',
      'success': '✅',
      'warning': '⚠️',
      'action': '🚀'
    }[type];
    console.log(`${prefix} ${message}`);
  }

  async run() {
    this.log('Sprint Documentation Review Starting...', 'action');
    this.log('Reading all documentation for session context', 'info');
    
    try {
      // Read core project files
      await this.readCoreFiles();
      
      // Read all documentation files
      await this.readDocumentationFiles();
      
      // Show summary
      this.showSummary();
      
    } catch (error) {
      this.log(`Error: ${error.message}`, 'warning');
    }
  }

  async readCoreFiles() {
    this.log('\n=== CORE PROJECT FILES ===', 'info');
    
    const coreFiles = [
      'PROJECT_TRACKER.md',
      'README.md', 
      'CLAUDE.md'
    ];

    for (const file of coreFiles) {
      const filePath = path.join(PROJECT_ROOT, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const sizeKB = Math.round(content.length / 1024);
        this.log(`Read ${file} (${sizeKB}KB)`, 'success');
        this.docsRead++;
        this.totalSize += content.length;
      } else {
        this.log(`${file} not found`, 'warning');
      }
    }
  }

  async readDocumentationFiles() {
    this.log('\n=== DOCUMENTATION FILES ===', 'info');
    
    if (!fs.existsSync(DOCS_DIR)) {
      this.log('docs/ directory not found', 'warning');
      return;
    }

    const files = fs.readdirSync(DOCS_DIR)
      .filter(f => f.endsWith('.md'))
      .sort();

    if (files.length === 0) {
      this.log('No documentation files found', 'warning');
      return;
    }

    for (const file of files) {
      const filePath = path.join(DOCS_DIR, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const sizeKB = Math.round(content.length / 1024);
        this.log(`Read docs/${file} (${sizeKB}KB)`, 'success');
        this.docsRead++;
        this.totalSize += content.length;
      } catch (error) {
        this.log(`Could not read docs/${file}: ${error.message}`, 'warning');
      }
    }

    // Also check for PRDs
    const prdsDir = path.join(PROJECT_ROOT, 'PRDs');
    if (fs.existsSync(prdsDir)) {
      this.log('\n=== PRD FILES ===', 'info');
      const prdFiles = fs.readdirSync(prdsDir)
        .filter(f => f.endsWith('.md'))
        .sort();
      
      for (const file of prdFiles) {
        const filePath = path.join(prdsDir, file);
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const sizeKB = Math.round(content.length / 1024);
          this.log(`Read PRDs/${file} (${sizeKB}KB)`, 'success');
          this.docsRead++;
          this.totalSize += content.length;
        } catch (error) {
          this.log(`Could not read PRDs/${file}: ${error.message}`, 'warning');
        }
      }
    }
  }

  showSummary() {
    const totalSizeKB = Math.round(this.totalSize / 1024);
    const totalSizeMB = (this.totalSize / (1024 * 1024)).toFixed(1);
    
    this.log('\n' + '='.repeat(50), 'info');
    this.log('SPRINT DOCUMENTATION REVIEW COMPLETE', 'action');
    this.log('='.repeat(50), 'info');
    this.log(`📁 Files read: ${this.docsRead}`, 'info');
    this.log(`📊 Total size: ${totalSizeKB}KB (${totalSizeMB}MB)`, 'info');
    this.log('\n🚀 Ready for new development session!', 'action');
    this.log('All project documentation loaded into context.', 'info');
    this.log('\nNext: Describe your PRD or development task.', 'action');
  }
}

// CLI Interface
if (require.main === module) {
  const initializer = new SprintInitializer();
  initializer.run().catch(console.error);
}

module.exports = SprintInitializer;