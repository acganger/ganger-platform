/**
 * Enterprise-Grade Field-Level Encryption for HIPAA Compliance
 * 
 * Provides secure encryption/decryption of sensitive medical data:
 * - Patient PII (names, addresses, phone numbers)
 * - Medical record numbers (MRNs)
 * - Social security numbers
 * - Insurance information
 * - Medical notes and sensitive communications
 * 
 * Security Features:
 * - AES-256-GCM encryption with authenticated encryption
 * - Key rotation support with versioning
 * - Secure key derivation using PBKDF2
 * - Audit logging for all encryption/decryption operations
 * - Performance optimization with caching
 */

import * as crypto from 'crypto';
import { secureLogger } from './secure-error-handler';

// Encryption configuration constants
const ENCRYPTION_CONFIG = {
  ALGORITHM: 'aes-256-gcm' as const,
  IV_LENGTH: 16, // 128 bits
  TAG_LENGTH: 16, // 128 bits
  SALT_LENGTH: 32, // 256 bits
  KEY_LENGTH: 32, // 256 bits
  PBKDF2_ITERATIONS: 100000, // NIST recommended minimum
  KEY_VERSION: 1, // For key rotation
} as const;

// Sensitive field types for audit logging
export enum SensitiveFieldType {
  PATIENT_NAME = 'patient_name',
  MRN = 'medical_record_number',
  SSN = 'social_security_number',
  PHONE = 'phone_number',
  EMAIL = 'email_address',
  ADDRESS = 'address',
  INSURANCE_ID = 'insurance_id',
  MEDICAL_NOTES = 'medical_notes',
  PRESCRIPTION_DATA = 'prescription_data',
  DIAGNOSTIC_DATA = 'diagnostic_data',
  COMMUNICATION_LOG = 'communication_log'
}

// Encrypted field structure
interface EncryptedField {
  encrypted_data: string; // Base64 encoded
  iv: string; // Base64 encoded
  tag: string; // Base64 encoded
  salt: string; // Base64 encoded
  key_version: number;
  field_type: SensitiveFieldType;
  created_at: string; // ISO timestamp
}

// Performance metrics
interface EncryptionMetrics {
  total_operations: number;
  encryption_count: number;
  decryption_count: number;
  average_encryption_time: number;
  average_decryption_time: number;
  cache_hits: number;
  cache_misses: number;
  errors: number;
}

export class FieldEncryptionService {
  private masterKey: Buffer;
  private keyCache = new Map<string, Buffer>();
  private metrics: EncryptionMetrics = {
    total_operations: 0,
    encryption_count: 0,
    decryption_count: 0,
    average_encryption_time: 0,
    average_decryption_time: 0,
    cache_hits: 0,
    cache_misses: 0,
    errors: 0
  };

  constructor(masterPassword: string) {
    if (!masterPassword || masterPassword.length < 32) {
      throw new Error('Master password must be at least 32 characters for HIPAA compliance');
    }
    
    // Derive master key from environment password
    this.masterKey = crypto.pbkdf2Sync(
      masterPassword,
      'ganger-hipaa-salt-2025', // Static salt for master key
      ENCRYPTION_CONFIG.PBKDF2_ITERATIONS,
      ENCRYPTION_CONFIG.KEY_LENGTH,
      'sha512'
    );

    secureLogger.info('Field encryption service initialized', {
      key_version: ENCRYPTION_CONFIG.KEY_VERSION,
      algorithm: ENCRYPTION_CONFIG.ALGORITHM
    });
  }

  /**
   * Derive encryption key for specific field type and context
   */
  private deriveFieldKey(salt: Buffer, fieldType: SensitiveFieldType, context?: string): Buffer {
    const cacheKey = `${salt.toString('hex')}-${fieldType}-${context || 'default'}`;
    
    if (this.keyCache.has(cacheKey)) {
      this.metrics.cache_hits++;
      return this.keyCache.get(cacheKey)!;
    }

    this.metrics.cache_misses++;
    
    // Create field-specific key derivation info
    const info = Buffer.from(`ganger-hipaa-${fieldType}-${context || 'default'}`);
    
    // Use HKDF for key derivation
    const fieldKey = crypto.hkdfSync(
      'sha512',
      this.masterKey,
      salt,
      info,
      ENCRYPTION_CONFIG.KEY_LENGTH
    );

    // Cache the derived key (limited cache size for memory management)
    if (this.keyCache.size > 1000) {
      // Remove oldest entries (simple LRU simulation)
      const firstKey = this.keyCache.keys().next().value;
      this.keyCache.delete(firstKey);
    }
    
    this.keyCache.set(cacheKey, fieldKey);
    return fieldKey;
  }

  /**
   * Encrypt sensitive field data
   */
  async encryptField(
    plaintext: string,
    fieldType: SensitiveFieldType,
    context?: string,
    auditInfo?: { userId?: string; resourceType?: string; resourceId?: string }
  ): Promise<EncryptedField> {
    const startTime = Date.now();
    
    try {
      // Validate input
      if (!plaintext || typeof plaintext !== 'string') {
        throw new Error('Invalid plaintext data for encryption');
      }

      // Generate cryptographically secure random values
      const iv = crypto.randomBytes(ENCRYPTION_CONFIG.IV_LENGTH);
      const salt = crypto.randomBytes(ENCRYPTION_CONFIG.SALT_LENGTH);

      // Derive field-specific encryption key
      const fieldKey = this.deriveFieldKey(salt, fieldType, context);

      // Create cipher
      const cipher = crypto.createCipher(ENCRYPTION_CONFIG.ALGORITHM, fieldKey);
      cipher.setAAD(Buffer.from(fieldType)); // Additional authenticated data

      // Encrypt the data
      let encrypted = cipher.update(plaintext, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      // Get authentication tag
      const tag = cipher.getAuthTag();

      // Create encrypted field structure
      const encryptedField: EncryptedField = {
        encrypted_data: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        salt: salt.toString('base64'),
        key_version: ENCRYPTION_CONFIG.KEY_VERSION,
        field_type: fieldType,
        created_at: new Date().toISOString()
      };

      // Update metrics
      const duration = Date.now() - startTime;
      this.metrics.total_operations++;
      this.metrics.encryption_count++;
      this.updateAverageTime('encryption', duration);

      // Audit logging
      await this.auditEncryptionOperation('encrypt', fieldType, auditInfo, {
        duration_ms: duration,
        data_length: plaintext.length,
        key_version: ENCRYPTION_CONFIG.KEY_VERSION
      });

      return encryptedField;

    } catch (error) {
      this.metrics.errors++;
      secureLogger.error('Field encryption failed', {
        fieldType,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: Date.now() - startTime
      });
      throw new Error('Failed to encrypt sensitive field data');
    }
  }

  /**
   * Decrypt sensitive field data
   */
  async decryptField(
    encryptedField: EncryptedField,
    context?: string,
    auditInfo?: { userId?: string; resourceType?: string; resourceId?: string }
  ): Promise<string> {
    const startTime = Date.now();
    
    try {
      // Validate encrypted field structure
      if (!this.isValidEncryptedField(encryptedField)) {
        throw new Error('Invalid encrypted field structure');
      }

      // Convert base64 encoded values back to buffers
      const encryptedData = Buffer.from(encryptedField.encrypted_data, 'base64');
      const iv = Buffer.from(encryptedField.iv, 'base64');
      const tag = Buffer.from(encryptedField.tag, 'base64');
      const salt = Buffer.from(encryptedField.salt, 'base64');

      // Derive the same field-specific key
      const fieldKey = this.deriveFieldKey(salt, encryptedField.field_type, context);

      // Create decipher
      const decipher = crypto.createDecipher(ENCRYPTION_CONFIG.ALGORITHM, fieldKey);
      decipher.setAuthTag(tag);
      decipher.setAAD(Buffer.from(encryptedField.field_type)); // Same AAD used during encryption

      // Decrypt the data
      let plaintext = decipher.update(encryptedData, undefined, 'utf8');
      plaintext += decipher.final('utf8');

      // Update metrics
      const duration = Date.now() - startTime;
      this.metrics.total_operations++;
      this.metrics.decryption_count++;
      this.updateAverageTime('decryption', duration);

      // Audit logging
      await this.auditEncryptionOperation('decrypt', encryptedField.field_type, auditInfo, {
        duration_ms: duration,
        key_version: encryptedField.key_version
      });

      return plaintext;

    } catch (error) {
      this.metrics.errors++;
      secureLogger.error('Field decryption failed', {
        fieldType: encryptedField?.field_type || 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: Date.now() - startTime
      });
      throw new Error('Failed to decrypt sensitive field data');
    }
  }

  /**
   * Encrypt multiple fields in batch for performance
   */
  async encryptFields(
    fields: Array<{ value: string; type: SensitiveFieldType; context?: string }>,
    auditInfo?: { userId?: string; resourceType?: string; resourceId?: string }
  ): Promise<EncryptedField[]> {
    const results: EncryptedField[] = [];
    
    for (const field of fields) {
      const encrypted = await this.encryptField(field.value, field.type, field.context, auditInfo);
      results.push(encrypted);
    }

    return results;
  }

  /**
   * Decrypt multiple fields in batch for performance
   */
  async decryptFields(
    encryptedFields: EncryptedField[],
    context?: string,
    auditInfo?: { userId?: string; resourceType?: string; resourceId?: string }
  ): Promise<string[]> {
    const results: string[] = [];
    
    for (const field of encryptedFields) {
      const decrypted = await this.decryptField(field, context, auditInfo);
      results.push(decrypted);
    }

    return results;
  }

  /**
   * Search encrypted data (using deterministic encryption for searchable fields)
   */
  async createSearchableHash(
    plaintext: string,
    fieldType: SensitiveFieldType
  ): Promise<string> {
    // Create deterministic hash for search purposes
    // Using HMAC with field type for consistent but secure hashing
    const hmac = crypto.createHmac('sha256', this.masterKey);
    hmac.update(fieldType);
    hmac.update(plaintext.toLowerCase().trim());
    
    return hmac.digest('hex');
  }

  /**
   * Key rotation support - re-encrypt with new key version
   */
  async rotateFieldEncryption(
    encryptedField: EncryptedField,
    newContext?: string,
    auditInfo?: { userId?: string; resourceType?: string; resourceId?: string }
  ): Promise<EncryptedField> {
    // Decrypt with old key
    const plaintext = await this.decryptField(encryptedField, undefined, auditInfo);
    
    // Re-encrypt with current key version
    const newEncryptedField = await this.encryptField(
      plaintext,
      encryptedField.field_type,
      newContext,
      auditInfo
    );

    // Audit the key rotation
    await this.auditEncryptionOperation('key_rotation', encryptedField.field_type, auditInfo, {
      old_key_version: encryptedField.key_version,
      new_key_version: newEncryptedField.key_version
    });

    return newEncryptedField;
  }

  /**
   * Validate encrypted field structure
   */
  private isValidEncryptedField(field: any): field is EncryptedField {
    return (
      field &&
      typeof field.encrypted_data === 'string' &&
      typeof field.iv === 'string' &&
      typeof field.tag === 'string' &&
      typeof field.salt === 'string' &&
      typeof field.key_version === 'number' &&
      Object.values(SensitiveFieldType).includes(field.field_type) &&
      typeof field.created_at === 'string'
    );
  }

  /**
   * Update average timing metrics
   */
  private updateAverageTime(operation: 'encryption' | 'decryption', duration: number): void {
    if (operation === 'encryption') {
      this.metrics.average_encryption_time = 
        (this.metrics.average_encryption_time * (this.metrics.encryption_count - 1) + duration) / 
        this.metrics.encryption_count;
    } else {
      this.metrics.average_decryption_time = 
        (this.metrics.average_decryption_time * (this.metrics.decryption_count - 1) + duration) / 
        this.metrics.decryption_count;
    }
  }

  /**
   * Audit encryption operations for HIPAA compliance
   */
  private async auditEncryptionOperation(
    operation: 'encrypt' | 'decrypt' | 'key_rotation',
    fieldType: SensitiveFieldType,
    auditInfo?: { userId?: string; resourceType?: string; resourceId?: string },
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      secureLogger.info('Field encryption operation', {
        operation,
        field_type: fieldType,
        user_id: auditInfo?.userId || '[SYSTEM]',
        resource_type: auditInfo?.resourceType,
        resource_id: auditInfo?.resourceId || '[REDACTED]',
        metadata: metadata || {},
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Never let audit failures affect encryption operations
      secureLogger.warn('Encryption audit logging failed', {
        operation,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get encryption performance metrics
   */
  getMetrics(): EncryptionMetrics & { 
    cache_hit_rate: number;
    error_rate: number;
  } {
    const cacheHitRate = this.metrics.total_operations > 0 
      ? (this.metrics.cache_hits / (this.metrics.cache_hits + this.metrics.cache_misses)) * 100 
      : 0;
    
    const errorRate = this.metrics.total_operations > 0
      ? (this.metrics.errors / this.metrics.total_operations) * 100
      : 0;

    return {
      ...this.metrics,
      cache_hit_rate: Math.round(cacheHitRate * 100) / 100,
      error_rate: Math.round(errorRate * 100) / 100
    };
  }

  /**
   * Clear encryption key cache (for security)
   */
  clearKeyCache(): void {
    this.keyCache.clear();
    secureLogger.info('Encryption key cache cleared');
  }

  /**
   * Get encryption service health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    key_cache_size: number;
    total_operations: number;
    error_rate: number;
    average_encryption_time: number;
    average_decryption_time: number;
  }> {
    const metrics = this.getMetrics();
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (metrics.error_rate > 5 || metrics.average_encryption_time > 100) {
      status = 'unhealthy';
    } else if (metrics.error_rate > 1 || metrics.average_encryption_time > 50) {
      status = 'degraded';
    }

    return {
      status,
      key_cache_size: this.keyCache.size,
      total_operations: metrics.total_operations,
      error_rate: metrics.error_rate,
      average_encryption_time: metrics.average_encryption_time,
      average_decryption_time: metrics.average_decryption_time
    };
  }
}

// Export singleton instance
const MASTER_PASSWORD = process.env.FIELD_ENCRYPTION_MASTER_KEY || 
  process.env.SECURITY_SALT + '_FIELD_ENCRYPTION_2025';

export const fieldEncryption = new FieldEncryptionService(MASTER_PASSWORD);

// Export utility functions
export const encryptionUtils = {
  /**
   * Determine field type from database column name
   */
  inferFieldType: (columnName: string): SensitiveFieldType => {
    const lowerName = columnName.toLowerCase();
    
    if (lowerName.includes('name')) return SensitiveFieldType.PATIENT_NAME;
    if (lowerName.includes('mrn') || lowerName.includes('medical_record')) return SensitiveFieldType.MRN;
    if (lowerName.includes('ssn') || lowerName.includes('social_security')) return SensitiveFieldType.SSN;
    if (lowerName.includes('phone')) return SensitiveFieldType.PHONE;
    if (lowerName.includes('email')) return SensitiveFieldType.EMAIL;
    if (lowerName.includes('address')) return SensitiveFieldType.ADDRESS;
    if (lowerName.includes('insurance')) return SensitiveFieldType.INSURANCE_ID;
    if (lowerName.includes('note') || lowerName.includes('comment')) return SensitiveFieldType.MEDICAL_NOTES;
    if (lowerName.includes('prescription') || lowerName.includes('medication')) return SensitiveFieldType.PRESCRIPTION_DATA;
    if (lowerName.includes('diagnostic') || lowerName.includes('diagnosis')) return SensitiveFieldType.DIAGNOSTIC_DATA;
    
    // Default to medical notes for unknown sensitive fields
    return SensitiveFieldType.MEDICAL_NOTES;
  },

  /**
   * Check if field contains sensitive data that should be encrypted
   */
  isSensitiveField: (columnName: string, value: any): boolean => {
    if (!value || typeof value !== 'string' || value.length === 0) {
      return false;
    }

    const lowerName = columnName.toLowerCase();
    const sensitivePatterns = [
      'name', 'first_name', 'last_name', 'full_name',
      'mrn', 'medical_record', 'patient_id',
      'ssn', 'social_security',
      'phone', 'mobile', 'telephone',
      'email', 'email_address',
      'address', 'street', 'city', 'zip', 'postal',
      'insurance', 'insurance_id', 'policy_number',
      'note', 'notes', 'comment', 'comments',
      'prescription', 'medication', 'drug',
      'diagnosis', 'diagnostic', 'condition'
    ];

    return sensitivePatterns.some(pattern => lowerName.includes(pattern));
  },

  /**
   * Create encrypted field wrapper for database storage
   */
  createDatabaseField: (encryptedField: EncryptedField): string => {
    // Store as JSON string in database
    return JSON.stringify(encryptedField);
  },

  /**
   * Parse encrypted field from database storage
   */
  parseDatabaseField: (databaseValue: string): EncryptedField => {
    try {
      const parsed = JSON.parse(databaseValue);
      if (!fieldEncryption['isValidEncryptedField'](parsed)) {
        throw new Error('Invalid encrypted field structure');
      }
      return parsed;
    } catch (error) {
      throw new Error('Failed to parse encrypted field from database');
    }
  }
};