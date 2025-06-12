/**
 * HIPAA-Compliant Database Middleware for Automatic Field Encryption
 * 
 * Provides transparent encryption/decryption for sensitive fields:
 * - Automatic detection of sensitive data
 * - Transparent encryption on write operations
 * - Transparent decryption on read operations
 * - Audit logging for all sensitive data access
 * - Performance optimization with selective encryption
 */

import { fieldEncryption, encryptionUtils, SensitiveFieldType, EncryptedField } from './field-encryption';
import { secureLogger } from './secure-error-handler';
import { db } from '@ganger/db';

// Configuration for HIPAA middleware
interface HIPAAConfig {
  enableAutoEncryption: boolean;
  enableAuditLogging: boolean;
  encryptionThreshold: number; // Minimum string length to encrypt
  performanceMode: 'strict' | 'balanced' | 'performance';
}

const DEFAULT_HIPAA_CONFIG: HIPAAConfig = {
  enableAutoEncryption: true,
  enableAuditLogging: true,
  encryptionThreshold: 3, // Don't encrypt very short strings
  performanceMode: 'balanced'
};

// Sensitive table configurations
const SENSITIVE_TABLES = new Set([
  'patients',
  'appointments', 
  'staff_members',
  'handout_generations',
  'audit_logs',
  'notifications',
  'medication_authorizations',
  'prescription_data',
  'clinical_notes',
  'patient_communications'
]);

// Field patterns that should always be encrypted
const ALWAYS_ENCRYPT_PATTERNS = [
  /^.*name$/i,
  /^.*mrn$/i,
  /^.*ssn$/i,
  /^.*social_security.*$/i,
  /^.*phone.*$/i,
  /^.*email.*$/i,
  /^.*address.*$/i,
  /^.*insurance.*$/i,
  /^.*note.*$/i,
  /^.*comment.*$/i,
  /^.*prescription.*$/i,
  /^.*diagnosis.*$/i
];

// Field patterns to never encrypt (system fields)
const NEVER_ENCRYPT_PATTERNS = [
  /^id$/i,
  /^.*_id$/i,
  /^created_at$/i,
  /^updated_at$/i,
  /^deleted_at$/i,
  /^version$/i,
  /^status$/i,
  /^type$/i,
  /^category$/i,
  /^priority$/i,
  /^is_.*$/i,
  /^has_.*$/i,
  /^.*_count$/i,
  /^.*_total$/i
];

interface ProcessedQuery {
  sql: string;
  params: any[];
  encryptedFields: Map<string, { originalValue: any; fieldType: SensitiveFieldType }>;
  sensitiveFieldsDetected: boolean;
}

interface AuditContext {
  userId?: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  tableName: string;
  sensitiveFields: string[];
  recordCount: number;
}

export class HIPAADatabaseMiddleware {
  private config: HIPAAConfig;
  private encryptionCache = new Map<string, EncryptedField>();
  private decryptionCache = new Map<string, string>();

  constructor(config: Partial<HIPAAConfig> = {}) {
    this.config = { ...DEFAULT_HIPAA_CONFIG, ...config };
    
    secureLogger.info('HIPAA Database Middleware initialized', {
      config: this.config
    });
  }

  /**
   * Process outgoing query - encrypt sensitive fields before database write
   */
  async processOutgoingQuery(
    sql: string,
    params: any[],
    auditContext?: Partial<AuditContext>
  ): Promise<ProcessedQuery> {
    try {
      const operation = this.extractOperation(sql);
      const tableName = this.extractTableName(sql);
      
      // Skip processing for non-sensitive tables or read operations
      if (!SENSITIVE_TABLES.has(tableName) || operation === 'SELECT') {
        return {
          sql,
          params,
          encryptedFields: new Map(),
          sensitiveFieldsDetected: false
        };
      }

      const processedParams = [...params];
      const encryptedFields = new Map<string, { originalValue: any; fieldType: SensitiveFieldType }>();
      const sensitiveFields: string[] = [];

      // Process parameters for INSERT/UPDATE operations
      if (operation === 'INSERT' || operation === 'UPDATE') {
        for (let i = 0; i < processedParams.length; i++) {
          const param = processedParams[i];
          
          if (typeof param === 'object' && param !== null) {
            // Handle object parameters (common in ORM queries)
            const encryptedObject = await this.encryptObjectFields(param, tableName);
            processedParams[i] = encryptedObject.data;
            
            // Merge encrypted fields
            encryptedObject.encryptedFields.forEach((value, key) => {
              encryptedFields.set(key, value);
              sensitiveFields.push(key);
            });
          } else if (typeof param === 'string' && this.shouldEncryptValue(param, i, sql)) {
            // Handle direct string parameters
            const fieldType = this.inferFieldTypeFromContext(sql, i);
            const encrypted = await fieldEncryption.encryptField(
              param,
              fieldType,
              tableName,
              { 
                userId: auditContext?.userId,
                resourceType: tableName,
                resourceId: 'query_param'
              }
            );
            
            processedParams[i] = encryptionUtils.createDatabaseField(encrypted);
            encryptedFields.set(`param_${i}`, { originalValue: param, fieldType });
            sensitiveFields.push(`param_${i}`);
          }
        }
      }

      // Audit logging
      if (this.config.enableAuditLogging && sensitiveFields.length > 0) {
        await this.auditSensitiveDataAccess({
          userId: auditContext?.userId || '[SYSTEM]',
          operation,
          tableName,
          sensitiveFields,
          recordCount: 1,
          ...auditContext
        });
      }

      return {
        sql,
        params: processedParams,
        encryptedFields,
        sensitiveFieldsDetected: sensitiveFields.length > 0
      };

    } catch (error) {
      secureLogger.error('Failed to process outgoing query', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sql: sql.substring(0, 100) + '...'
      });
      
      // Return original query if encryption fails (fail-open for availability)
      return {
        sql,
        params,
        encryptedFields: new Map(),
        sensitiveFieldsDetected: false
      };
    }
  }

  /**
   * Process incoming results - decrypt sensitive fields after database read
   */
  async processIncomingResults(
    results: any[],
    tableName: string,
    auditContext?: Partial<AuditContext>
  ): Promise<any[]> {
    try {
      // Skip processing for non-sensitive tables
      if (!SENSITIVE_TABLES.has(tableName)) {
        return results;
      }

      const decryptedResults: any[] = [];
      const sensitiveFields: string[] = [];

      for (const row of results) {
        if (typeof row === 'object' && row !== null) {
          const decryptedRow = await this.decryptObjectFields(row, tableName);
          decryptedResults.push(decryptedRow.data);
          
          // Collect sensitive fields for audit
          decryptedRow.decryptedFields.forEach(fieldName => {
            if (!sensitiveFields.includes(fieldName)) {
              sensitiveFields.push(fieldName);
            }
          });
        } else {
          decryptedResults.push(row);
        }
      }

      // Audit logging for read access
      if (this.config.enableAuditLogging && sensitiveFields.length > 0) {
        await this.auditSensitiveDataAccess({
          userId: auditContext?.userId || '[SYSTEM]',
          operation: 'SELECT',
          tableName,
          sensitiveFields,
          recordCount: results.length,
          ...auditContext
        });
      }

      return decryptedResults;

    } catch (error) {
      secureLogger.error('Failed to process incoming results', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tableName,
        recordCount: results.length
      });
      
      // Return original results if decryption fails (fail-open for availability)
      return results;
    }
  }

  /**
   * Encrypt sensitive fields in an object
   */
  private async encryptObjectFields(
    obj: Record<string, any>,
    context: string
  ): Promise<{
    data: Record<string, any>;
    encryptedFields: Map<string, { originalValue: any; fieldType: SensitiveFieldType }>;
  }> {
    const encryptedObj: Record<string, any> = { ...obj };
    const encryptedFields = new Map<string, { originalValue: any; fieldType: SensitiveFieldType }>();

    for (const [key, value] of Object.entries(obj)) {
      if (this.shouldEncryptField(key, value)) {
        try {
          const fieldType = encryptionUtils.inferFieldType(key);
          const encrypted = await fieldEncryption.encryptField(
            String(value),
            fieldType,
            context
          );
          
          encryptedObj[key] = encryptionUtils.createDatabaseField(encrypted);
          encryptedFields.set(key, { originalValue: value, fieldType });
          
        } catch (error) {
          secureLogger.warn('Failed to encrypt field, storing as plaintext', {
            field: key,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    return { data: encryptedObj, encryptedFields };
  }

  /**
   * Decrypt sensitive fields in an object
   */
  private async decryptObjectFields(
    obj: Record<string, any>,
    context: string
  ): Promise<{
    data: Record<string, any>;
    decryptedFields: string[];
  }> {
    const decryptedObj: Record<string, any> = { ...obj };
    const decryptedFields: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
      if (this.isEncryptedField(value)) {
        try {
          const encryptedField = encryptionUtils.parseDatabaseField(value);
          const decrypted = await fieldEncryption.decryptField(encryptedField, context);
          
          decryptedObj[key] = decrypted;
          decryptedFields.push(key);
          
        } catch (error) {
          secureLogger.warn('Failed to decrypt field, returning as-is', {
            field: key,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          // Return original value if decryption fails
          decryptedObj[key] = value;
        }
      }
    }

    return { data: decryptedObj, decryptedFields };
  }

  /**
   * Determine if a field should be encrypted
   */
  private shouldEncryptField(fieldName: string, value: any): boolean {
    // Skip if auto-encryption is disabled
    if (!this.config.enableAutoEncryption) {
      return false;
    }

    // Must be a string with sufficient length
    if (typeof value !== 'string' || value.length < this.config.encryptionThreshold) {
      return false;
    }

    // Never encrypt system fields
    if (NEVER_ENCRYPT_PATTERNS.some(pattern => pattern.test(fieldName))) {
      return false;
    }

    // Always encrypt fields matching sensitive patterns
    if (ALWAYS_ENCRYPT_PATTERNS.some(pattern => pattern.test(fieldName))) {
      return true;
    }

    // Use utility function for additional detection
    return encryptionUtils.isSensitiveField(fieldName, value);
  }

  /**
   * Check if value should be encrypted based on query context
   */
  private shouldEncryptValue(value: string, paramIndex: number, sql: string): boolean {
    if (!this.config.enableAutoEncryption) {
      return false;
    }

    if (typeof value !== 'string' || value.length < this.config.encryptionThreshold) {
      return false;
    }

    // Simple heuristic: encrypt string parameters in INSERT/UPDATE operations
    const operation = this.extractOperation(sql);
    return (operation === 'INSERT' || operation === 'UPDATE') && 
           value.length >= this.config.encryptionThreshold;
  }

  /**
   * Check if a value is an encrypted field
   */
  private isEncryptedField(value: any): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    try {
      const parsed = JSON.parse(value);
      return (
        parsed &&
        typeof parsed === 'object' &&
        'encrypted_data' in parsed &&
        'iv' in parsed &&
        'tag' in parsed &&
        'salt' in parsed &&
        'field_type' in parsed
      );
    } catch {
      return false;
    }
  }

  /**
   * Extract SQL operation type
   */
  private extractOperation(sql: string): 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' {
    const normalizedSql = sql.trim().toUpperCase();
    
    if (normalizedSql.startsWith('SELECT')) return 'SELECT';
    if (normalizedSql.startsWith('INSERT')) return 'INSERT';
    if (normalizedSql.startsWith('UPDATE')) return 'UPDATE';
    if (normalizedSql.startsWith('DELETE')) return 'DELETE';
    
    return 'SELECT'; // Default fallback
  }

  /**
   * Extract table name from SQL
   */
  private extractTableName(sql: string): string {
    const normalizedSql = sql.trim().toUpperCase();
    
    // Simple regex patterns for common SQL operations
    const patterns = [
      /FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/i,
      /INTO\s+([a-zA-Z_][a-zA-Z0-9_]*)/i,
      /UPDATE\s+([a-zA-Z_][a-zA-Z0-9_]*)/i,
      /DELETE\s+FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/i
    ];

    for (const pattern of patterns) {
      const match = sql.match(pattern);
      if (match && match[1]) {
        return match[1].toLowerCase();
      }
    }

    return 'unknown_table';
  }

  /**
   * Infer field type from SQL context
   */
  private inferFieldTypeFromContext(sql: string, paramIndex: number): SensitiveFieldType {
    // Simple heuristic - could be improved with SQL parsing
    const lowerSql = sql.toLowerCase();
    
    if (lowerSql.includes('name')) return SensitiveFieldType.PATIENT_NAME;
    if (lowerSql.includes('mrn')) return SensitiveFieldType.MRN;
    if (lowerSql.includes('phone')) return SensitiveFieldType.PHONE;
    if (lowerSql.includes('email')) return SensitiveFieldType.EMAIL;
    if (lowerSql.includes('address')) return SensitiveFieldType.ADDRESS;
    
    return SensitiveFieldType.MEDICAL_NOTES; // Default
  }

  /**
   * Audit sensitive data access for HIPAA compliance
   */
  private async auditSensitiveDataAccess(context: AuditContext): Promise<void> {
    try {
      secureLogger.info('Sensitive data access audit', {
        user_id: context.userId,
        operation: context.operation,
        table_name: context.tableName,
        sensitive_fields: context.sensitiveFields,
        record_count: context.recordCount,
        timestamp: new Date().toISOString(),
        compliance_audit: true
      });
    } catch (error) {
      secureLogger.error('Failed to audit sensitive data access', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context
      });
    }
  }

  /**
   * Update middleware configuration
   */
  updateConfig(newConfig: Partial<HIPAAConfig>): void {
    this.config = { ...this.config, ...newConfig };
    secureLogger.info('HIPAA middleware configuration updated', {
      config: this.config
    });
  }

  /**
   * Clear encryption caches for security
   */
  clearCaches(): void {
    this.encryptionCache.clear();
    this.decryptionCache.clear();
    fieldEncryption.clearKeyCache();
    secureLogger.info('HIPAA middleware caches cleared');
  }

  /**
   * Get middleware performance metrics
   */
  getMetrics(): {
    encryption_metrics: any;
    cache_sizes: {
      encryption_cache: number;
      decryption_cache: number;
    };
    config: HIPAAConfig;
  } {
    return {
      encryption_metrics: fieldEncryption.getMetrics(),
      cache_sizes: {
        encryption_cache: this.encryptionCache.size,
        decryption_cache: this.decryptionCache.size
      },
      config: this.config
    };
  }
}

// Export singleton instance
export const hipaaMiddleware = new HIPAADatabaseMiddleware();

// Export database wrapper with automatic encryption
export const hipaaDb = {
  /**
   * Execute query with automatic encryption/decryption
   */
  async query(
    sql: string,
    params: any[] = [],
    auditContext?: Partial<AuditContext>
  ): Promise<any[]> {
    // Process outgoing query (encrypt sensitive data)
    const processed = await hipaaMiddleware.processOutgoingQuery(sql, params, auditContext);
    
    // Execute query
    const results = await db.query(processed.sql, processed.params);
    
    // Process incoming results (decrypt sensitive data)
    const tableName = hipaaMiddleware['extractTableName'](sql);
    const decrypted = await hipaaMiddleware.processIncomingResults(results, tableName, auditContext);
    
    return decrypted;
  },

  /**
   * Execute raw query without encryption (for system operations)
   */
  async rawQuery(sql: string, params: any[] = []): Promise<any[]> {
    return await db.query(sql, params);
  },

  /**
   * Encrypt specific field manually
   */
  async encryptField(value: string, fieldType: SensitiveFieldType, context?: string): Promise<string> {
    const encrypted = await fieldEncryption.encryptField(value, fieldType, context);
    return encryptionUtils.createDatabaseField(encrypted);
  },

  /**
   * Decrypt specific field manually
   */
  async decryptField(encryptedValue: string, context?: string): Promise<string> {
    const encryptedField = encryptionUtils.parseDatabaseField(encryptedValue);
    return await fieldEncryption.decryptField(encryptedField, context);
  }
};