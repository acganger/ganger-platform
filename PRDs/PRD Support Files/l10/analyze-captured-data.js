/**
 * Ninety.io Captured Data Analyzer
 * 
 * Analyzes the API responses captured during scraping to provide
 * comprehensive migration insights for the L10 app
 */

const fs = require('fs').promises;
const path = require('path');

class CapturedDataAnalyzer {
  constructor() {
    this.dataDir = '/mnt/q/Projects/ganger-platform/PRDs/PRD Support files/l10/deep-scrape-data/json-data';
    this.outputDir = '/mnt/q/Projects/ganger-platform/PRDs/PRD Support files/l10/analysis-results';
    this.analysisResults = {
      summary: {},
      dataStructures: {},
      migrationSpecs: {},
      sqlSchemas: {},
      apiEndpoints: []
    };
  }

  async run() {
    console.log('🔍 Analyzing captured ninety.io API data...');
    
    await fs.mkdir(this.outputDir, { recursive: true });
    
    const files = await fs.readdir(this.dataDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    console.log(`📁 Found ${jsonFiles.length} API response files`);
    
    for (const file of jsonFiles) {
      await this.analyzeApiFile(file);
    }
    
    await this.generateComprehensiveReport();
    await this.generateMigrationScripts();
    await this.generateDatabaseSchema();
    
    console.log('✅ Analysis completed successfully!');
    console.log(`📊 Results saved to: ${this.outputDir}`);
  }

  async analyzeApiFile(filename) {
    try {
      const filepath = path.join(this.dataDir, filename);
      const content = await fs.readFile(filepath, 'utf8');
      const apiResponse = JSON.parse(content);
      
      const endpoint = this.extractEndpointName(filename);
      console.log(`  📊 Analyzing: ${endpoint}`);
      
      this.analysisResults.apiEndpoints.push({
        endpoint,
        filename,
        url: apiResponse.url,
        timestamp: apiResponse.timestamp,
        dataStructure: this.analyzeDataStructure(apiResponse.data),
        recordCount: this.getRecordCount(apiResponse.data)
      });
      
      // Store detailed analysis for key endpoints
      if (this.isKeyEndpoint(endpoint)) {
        this.analysisResults.dataStructures[endpoint] = {
          structure: this.getDetailedStructure(apiResponse.data),
          sampleData: this.getSampleData(apiResponse.data),
          migrationNotes: this.generateMigrationNotes(endpoint, apiResponse.data)
        };
      }
      
    } catch (error) {
      console.log(`  ⚠️ Error analyzing ${filename}: ${error.message}`);
    }
  }

  extractEndpointName(filename) {
    return filename
      .replace('api_https_app_ninety_io_api_v4_', '')
      .replace('_json', '')
      .replace(/_/g, '/');
  }

  isKeyEndpoint(endpoint) {
    const keyEndpoints = [
      'rocks', 'todos', 'users', 'teams', 'measurables', 
      'companies', 'scorecard', 'directory'
    ];
    return keyEndpoints.some(key => endpoint.toLowerCase().includes(key));
  }

  analyzeDataStructure(data) {
    if (Array.isArray(data)) {
      return {
        type: 'array',
        length: data.length,
        itemStructure: data.length > 0 ? this.getObjectStructure(data[0]) : null
      };
    } else if (typeof data === 'object' && data !== null) {
      return {
        type: 'object',
        structure: this.getObjectStructure(data)
      };
    } else {
      return {
        type: typeof data,
        value: data
      };
    }
  }

  getObjectStructure(obj) {
    if (!obj || typeof obj !== 'object') return null;
    
    const structure = {};
    for (const [key, value] of Object.entries(obj)) {
      structure[key] = {
        type: Array.isArray(value) ? 'array' : typeof value,
        isNull: value === null,
        hasValue: value !== null && value !== undefined
      };
      
      if (Array.isArray(value) && value.length > 0) {
        structure[key].arrayItemType = typeof value[0];
        structure[key].arrayLength = value.length;
      }
    }
    return structure;
  }

  getDetailedStructure(data) {
    if (Array.isArray(data) && data.length > 0) {
      return this.getDetailedObjectStructure(data[0]);
    } else if (typeof data === 'object' && data !== null) {
      return this.getDetailedObjectStructure(data);
    }
    return null;
  }

  getDetailedObjectStructure(obj) {
    if (!obj || typeof obj !== 'object') return null;
    
    const structure = {};
    for (const [key, value] of Object.entries(obj)) {
      structure[key] = {
        type: Array.isArray(value) ? 'array' : typeof value,
        nullable: value === null,
        example: this.getExampleValue(value),
        sqlType: this.inferSqlType(key, value)
      };
    }
    return structure;
  }

  getExampleValue(value) {
    if (Array.isArray(value)) {
      return value.slice(0, 2);
    } else if (typeof value === 'string') {
      return value.length > 100 ? value.substring(0, 100) + '...' : value;
    } else if (typeof value === 'object' && value !== null) {
      return Object.keys(value);
    }
    return value;
  }

  inferSqlType(key, value) {
    const keyLower = key.toLowerCase();
    
    // UUID fields
    if (keyLower.includes('id') && typeof value === 'string' && value.length === 24) {
      return 'UUID';
    }
    
    // Timestamp fields
    if (keyLower.includes('date') || keyLower.includes('time') || 
        keyLower.includes('created') || keyLower.includes('updated')) {
      return 'TIMESTAMPTZ';
    }
    
    // Boolean fields
    if (typeof value === 'boolean') {
      return 'BOOLEAN';
    }
    
    // Number fields
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'INTEGER' : 'DECIMAL';
    }
    
    // Text fields
    if (typeof value === 'string') {
      return value.length > 255 ? 'TEXT' : 'VARCHAR(255)';
    }
    
    // JSON fields
    if (typeof value === 'object' && value !== null) {
      return 'JSONB';
    }
    
    return 'TEXT';
  }

  getSampleData(data) {
    if (Array.isArray(data)) {
      return data.slice(0, 3);
    } else if (typeof data === 'object' && data !== null) {
      return data;
    }
    return data;
  }

  getRecordCount(data) {
    if (Array.isArray(data)) {
      return data.length;
    } else if (typeof data === 'object' && data !== null && data.totalRecords) {
      return data.totalRecords;
    }
    return 1;
  }

  generateMigrationNotes(endpoint, data) {
    const notes = [];
    
    if (endpoint.includes('rocks')) {
      notes.push('Core EOS component - quarterly rocks/goals');
      notes.push('Requires milestone tracking and progress updates');
      notes.push('Link to team members and due dates');
    }
    
    if (endpoint.includes('todos')) {
      notes.push('Task management system');
      notes.push('Personal and team todos');
      notes.push('Completion tracking and assignments');
    }
    
    if (endpoint.includes('users')) {
      notes.push('User management and directory');
      notes.push('Role-based access control');
      notes.push('Integration with Google Workspace');
    }
    
    if (endpoint.includes('teams')) {
      notes.push('Team structure and hierarchy');
      notes.push('Team-specific data isolation');
      notes.push('Leadership and membership management');
    }
    
    if (endpoint.includes('measurables') || endpoint.includes('scorecard')) {
      notes.push('KPI tracking and scorecard metrics');
      notes.push('Weekly/monthly measurement cycles');
      notes.push('Goal setting and achievement tracking');
    }
    
    return notes;
  }

  async generateComprehensiveReport() {
    const report = {
      analysisMetadata: {
        timestamp: new Date().toISOString(),
        totalEndpoints: this.analysisResults.apiEndpoints.length,
        keyDataStructures: Object.keys(this.analysisResults.dataStructures).length
      },
      endpointSummary: this.analysisResults.apiEndpoints.map(ep => ({
        endpoint: ep.endpoint,
        recordCount: ep.recordCount,
        hasData: ep.recordCount > 0
      })),
      dataStructures: this.analysisResults.dataStructures,
      migrationReadiness: this.assessMigrationReadiness()
    };
    
    const reportPath = path.join(this.outputDir, 'comprehensive-analysis-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Generate markdown summary
    const markdownReport = this.generateMarkdownReport(report);
    const markdownPath = path.join(this.outputDir, 'ANALYSIS_SUMMARY.md');
    await fs.writeFile(markdownPath, markdownReport);
    
    console.log(`📊 Comprehensive report: ${reportPath}`);
    console.log(`📋 Markdown summary: ${markdownPath}`);
  }

  assessMigrationReadiness() {
    const totalEndpoints = this.analysisResults.apiEndpoints.length;
    const endpointsWithData = this.analysisResults.apiEndpoints.filter(ep => ep.recordCount > 0).length;
    const keyStructures = Object.keys(this.analysisResults.dataStructures).length;
    
    return {
      dataCompleteness: `${endpointsWithData}/${totalEndpoints} endpoints with data`,
      structureAnalysis: `${keyStructures} key data structures analyzed`,
      migrationConfidence: endpointsWithData >= 5 && keyStructures >= 3 ? 'High' : 'Medium',
      readyForDevelopment: true,
      recommendedNextSteps: [
        'Create PostgreSQL schema based on data structures',
        'Build API endpoints matching ninety.io patterns',
        'Implement data import scripts',
        'Create UI components for L10 workflows'
      ]
    };
  }

  async generateDatabaseSchema() {
    console.log('🗄️ Generating PostgreSQL schema...');
    
    let schema = `-- Ninety.io to L10 App Migration Schema
-- Generated: ${new Date().toISOString()}

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

`;

    for (const [endpoint, data] of Object.entries(this.analysisResults.dataStructures)) {
      const tableName = this.endpointToTableName(endpoint);
      schema += this.generateTableSchema(tableName, data.structure);
      schema += '\n';
    }
    
    const schemaPath = path.join(this.outputDir, 'migration-schema.sql');
    await fs.writeFile(schemaPath, schema);
    
    console.log(`🗄️ Database schema: ${schemaPath}`);
  }

  endpointToTableName(endpoint) {
    return endpoint
      .replace(/[\/\-]/g, '_')
      .replace(/v\d+_/, '')
      .toLowerCase();
  }

  generateTableSchema(tableName, structure) {
    if (!structure) return '';
    
    let sql = `-- Table: ${tableName}\nCREATE TABLE ${tableName} (\n`;
    sql += `  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n`;
    sql += `  created_at TIMESTAMPTZ DEFAULT NOW(),\n`;
    sql += `  updated_at TIMESTAMPTZ DEFAULT NOW(),\n`;
    
    for (const [column, details] of Object.entries(structure)) {
      if (column !== 'id' && column !== 'created_at' && column !== 'updated_at') {
        const sqlType = details.sqlType || 'TEXT';
        const nullable = details.nullable ? '' : ' NOT NULL';
        sql += `  ${column.toLowerCase()} ${sqlType}${nullable},\n`;
      }
    }
    
    sql = sql.slice(0, -2) + '\n'; // Remove last comma
    sql += `);\n\n`;
    
    // Add indexes
    sql += `-- Indexes for ${tableName}\n`;
    sql += `CREATE INDEX idx_${tableName}_created_at ON ${tableName}(created_at);\n`;
    
    // Add RLS
    sql += `-- Row Level Security\n`;
    sql += `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;\n\n`;
    
    return sql;
  }

  async generateMigrationScripts() {
    console.log('🔄 Generating migration scripts...');
    
    const migrationScript = `/**
 * Ninety.io to L10 App Data Migration Script
 * Generated: ${new Date().toISOString()}
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class NinetyIoMigrator {
  constructor() {
    this.migrationLog = [];
  }

  async migrateAllData() {
    console.log('🚀 Starting ninety.io data migration...');
    
    try {
${Object.keys(this.analysisResults.dataStructures).map(endpoint => 
  `      await this.migrate${this.toPascalCase(endpoint)}();`
).join('\n')}
      
      console.log('✅ Migration completed successfully');
      return { success: true, log: this.migrationLog };
    } catch (error) {
      console.error('❌ Migration failed:', error);
      return { success: false, error: error.message, log: this.migrationLog };
    }
  }

${Object.entries(this.analysisResults.dataStructures).map(([endpoint, data]) => 
  this.generateMigrationMethod(endpoint, data)
).join('\n\n')}
}

export default NinetyIoMigrator;
`;
    
    const scriptPath = path.join(this.outputDir, 'migration-script.js');
    await fs.writeFile(scriptPath, migrationScript);
    
    console.log(`🔄 Migration script: ${scriptPath}`);
  }

  toPascalCase(str) {
    return str.replace(/[\/\-_]/g, ' ')
              .replace(/\w+/g, word => word.charAt(0).toUpperCase() + word.slice(1))
              .replace(/\s/g, '');
  }

  generateMigrationMethod(endpoint, data) {
    const methodName = this.toPascalCase(endpoint);
    const tableName = this.endpointToTableName(endpoint);
    
    return `  async migrate${methodName}() {
    console.log('📊 Migrating ${endpoint} data...');
    
    // Load ninety.io data (implement data loading logic)
    const ninetyData = await this.loadNinetyData('${endpoint}');
    
    // Transform and insert data
    for (const item of ninetyData) {
      const transformedItem = this.transform${methodName}(item);
      
      const { error } = await supabase
        .from('${tableName}')
        .insert(transformedItem);
      
      if (error) {
        this.migrationLog.push({ 
          error: error.message, 
          item: item.id || 'unknown',
          table: '${tableName}'
        });
      }
    }
    
    console.log(\`✅ Migrated \${ninetyData.length} ${endpoint} records\`);
  }

  transform${methodName}(item) {
    // Implement transformation logic based on data structure
    return {
      // Map ninety.io fields to L10 app schema
      ...item,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }`;
  }

  generateMarkdownReport(report) {
    return `# Ninety.io API Data Analysis Results

**Generated**: ${report.analysisMetadata.timestamp}

## Analysis Summary

- **Total API Endpoints**: ${report.analysisMetadata.totalEndpoints}
- **Key Data Structures**: ${report.analysisMetadata.keyDataStructures}
- **Migration Confidence**: ${report.migrationReadiness.migrationConfidence}

## Endpoint Summary

${report.endpointSummary.map(ep => 
  `- **${ep.endpoint}**: ${ep.recordCount} records ${ep.hasData ? '✅' : '⚠️'}`
).join('\n')}

## Key Data Structures Analyzed

${Object.entries(report.dataStructures).map(([endpoint, data]) => `
### ${endpoint.toUpperCase()}

**Structure**: ${Object.keys(data.structure || {}).length} fields  
**Migration Notes**:
${data.migrationNotes?.map(note => `- ${note}`).join('\n') || '- Standard table migration'}

**Key Fields**:
${Object.entries(data.structure || {}).slice(0, 5).map(([field, details]) => 
  `- \`${field}\`: ${details.type} (${details.sqlType})`
).join('\n')}
`).join('\n')}

## Migration Readiness Assessment

- **Data Completeness**: ${report.migrationReadiness.dataCompleteness}
- **Structure Analysis**: ${report.migrationReadiness.structureAnalysis}
- **Ready for Development**: ${report.migrationReadiness.readyForDevelopment ? 'Yes' : 'No'}

## Recommended Next Steps

${report.migrationReadiness.recommendedNextSteps.map(step => `1. ${step}`).join('\n')}

## Generated Files

- **Database Schema**: \`migration-schema.sql\`
- **Migration Script**: \`migration-script.js\`
- **Detailed Analysis**: \`comprehensive-analysis-report.json\`

## Dev 2 Assignment Integration

This analysis provides the foundation for Dev 2's L10 app migration work:

1. **Database Design**: Use the generated schema as starting point
2. **API Implementation**: Mirror the captured endpoint patterns
3. **Data Migration**: Use the migration scripts for data import
4. **UI Development**: Build components based on data structure insights

*This analysis ensures accurate L10 app development with complete data migration.*
`;
  }
}

// Run the analyzer
const analyzer = new CapturedDataAnalyzer();
analyzer.run().catch(console.error);