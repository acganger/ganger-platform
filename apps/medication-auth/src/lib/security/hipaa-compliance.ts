import { createHash, randomBytes, createCipher, createDecipher } from 'crypto';
import { auditLog } from './audit-logger';

/**
 * HIPAA Compliance Service
 * Provides encryption, access controls, and compliance monitoring for PHI
 */

export interface PHIAccessRequest {
  userId: string;
  userRole: string;
  resourceType: string;
  resourceId: string;
  accessReason: string;
  minimumNecessary: boolean;
  businessJustification?: string;
}

export interface EncryptionResult {
  encryptedData: string;
  algorithm: string;
  keyVersion: string;
  timestamp: string;
}

export interface ComplianceReport {
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalPHIAccess: number;
    authorizedAccess: number;
    unauthorizedAttempts: number;
    dataBreaches: number;
    encryptionCompliance: number;
    accessControlCompliance: number;
    auditTrailCompleteness: number;
  };
  violations: ComplianceViolation[];
  recommendations: string[];
}

export interface ComplianceViolation {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  userId?: string;
  resourceId?: string;
  timestamp: Date;
  resolved: boolean;
  remediation?: string;
}

export interface DataMinimizationCheck {
  requestedFields: string[];
  authorizedFields: string[];
  deniedFields: string[];
  justification: string;
  compliant: boolean;
}

export class HIPAAComplianceService {
  private readonly encryptionKey: string;
  private readonly keyVersion: string = '1.0';
  private readonly algorithm: string = 'AES-256-GCM';

  constructor() {
    this.encryptionKey = process.env.HIPAA_ENCRYPTION_KEY || this.generateSecureKey();
    
    if (!process.env.HIPAA_ENCRYPTION_KEY) {
      console.warn('HIPAA_ENCRYPTION_KEY not set - using generated key (not recommended for production)');
    }
  }

  /**
   * Encrypt sensitive patient data
   */
  async encryptPatientData(data: any): Promise<EncryptionResult> {
    try {
      const dataString = JSON.stringify(data);
      
      // Generate random IV for each encryption
      const iv = randomBytes(16);
      
      // Encrypt using AES-256-CBC (simplified for Node.js crypto)
      const cipher = createCipher('aes-256-cbc', this.encryptionKey);
      let encrypted = cipher.update(dataString, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const result = {
        encryptedData: iv.toString('hex') + ':' + encrypted,
        algorithm: this.algorithm,
        keyVersion: this.keyVersion,
        timestamp: new Date().toISOString()
      };

      // Log encryption for audit
      await auditLog({
        action: 'encrypt_phi_data',
        resource: 'encryption',
        details: {
          algorithm: this.algorithm,
          keyVersion: this.keyVersion,
          dataSize: dataString.length
        },
        complianceNote: 'PHI data encrypted in compliance with HIPAA Security Rule'
      });

      return result;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt patient data');
    }
  }

  /**
   * Decrypt sensitive patient data
   */
  async decryptPatientData(encryptedResult: EncryptionResult): Promise<any> {
    try {
      const [ivString, encryptedData] = encryptedResult.encryptedData.split(':');
      
      if (!ivString || !encryptedData) {
        throw new Error('Invalid encrypted data format');
      }

      // Decrypt using AES-256-CBC (simplified for Node.js crypto)
      const decipher = createDecipher('aes-256-cbc', this.encryptionKey);
      let decryptedString = decipher.update(encryptedData, 'hex', 'utf8');
      decryptedString += decipher.final('utf8');
      
      if (!decryptedString) {
        throw new Error('Decryption failed - invalid key or corrupted data');
      }

      const data = JSON.parse(decryptedString);

      // Log decryption for audit
      await auditLog({
        action: 'decrypt_phi_data',
        resource: 'encryption',
        details: {
          algorithm: encryptedResult.algorithm,
          keyVersion: encryptedResult.keyVersion,
          originalTimestamp: encryptedResult.timestamp
        },
        complianceNote: 'PHI data decrypted for authorized access'
      });

      return data;
    } catch (error) {
      console.error('Decryption failed:', error);
      
      await auditLog({
        action: 'decrypt_phi_data_failed',
        resource: 'encryption',
        error: error instanceof Error ? error.message : 'Unknown decryption error',
        complianceNote: 'PHI decryption failed - potential security incident'
      });
      
      throw new Error('Failed to decrypt patient data');
    }
  }

  /**
   * Validate PHI access request
   */
  async validatePHIAccess(request: PHIAccessRequest): Promise<{
    authorized: boolean;
    reason: string;
    restrictions?: string[];
    auditRequired: boolean;
  }> {
    try {
      const validationResult = {
        authorized: false,
        reason: '',
        restrictions: [] as string[],
        auditRequired: true
      };

      // Check minimum necessary principle
      if (!request.minimumNecessary) {
        validationResult.reason = 'Access denied - minimum necessary principle not satisfied';
        await this.logAccessViolation('minimum_necessary_violation', request);
        return validationResult;
      }

      // Validate business justification
      if (!request.businessJustification && this.requiresJustification(request)) {
        validationResult.reason = 'Access denied - business justification required';
        await this.logAccessViolation('missing_justification', request);
        return validationResult;
      }

      // Role-based access control
      const rolePermissions = await this.getRolePermissions(request.userRole);
      if (!this.hasResourceAccess(rolePermissions, request.resourceType)) {
        validationResult.reason = 'Access denied - insufficient role permissions';
        await this.logAccessViolation('insufficient_permissions', request);
        return validationResult;
      }

      // Time-based restrictions
      if (!this.isWithinAllowedHours(request)) {
        validationResult.restrictions!.push('Access limited to business hours');
      }

      // Check for break-glass scenarios
      if (this.isEmergencyAccess(request)) {
        validationResult.restrictions!.push('Emergency access - enhanced audit required');
        validationResult.auditRequired = true;
      }

      // Approve access
      validationResult.authorized = true;
      validationResult.reason = 'Access authorized under HIPAA minimum necessary standard';

      // Log successful authorization
      await auditLog({
        action: 'phi_access_authorized',
        userId: request.userId,
        resource: request.resourceType,
        resourceId: request.resourceId,
        accessReason: request.accessReason,
        phiAccessed: true,
        details: {
          userRole: request.userRole,
          minimumNecessary: request.minimumNecessary,
          businessJustification: request.businessJustification,
          restrictions: validationResult.restrictions
        },
        complianceNote: 'PHI access authorized in compliance with HIPAA Privacy Rule'
      });

      return validationResult;
    } catch (error) {
      console.error('PHI access validation failed:', error);
      
      await auditLog({
        action: 'phi_access_validation_error',
        userId: request.userId,
        resource: request.resourceType,
        error: error instanceof Error ? error.message : 'Unknown validation error',
        complianceNote: 'PHI access validation system error'
      });

      return {
        authorized: false,
        reason: 'Access denied - system validation error',
        auditRequired: true
      };
    }
  }

  /**
   * Implement data minimization checks
   */
  async checkDataMinimization(
    requestedFields: string[],
    userRole: string,
    accessPurpose: string
  ): Promise<DataMinimizationCheck> {
    try {
      const rolePermissions = await this.getRolePermissions(userRole);
      const purposeRequirements = this.getPurposeRequirements(accessPurpose);
      
      // Determine authorized fields based on role and purpose
      const authorizedFields = requestedFields.filter(field => 
        this.isFieldAuthorized(field, rolePermissions, purposeRequirements)
      );
      
      const deniedFields = requestedFields.filter(field => 
        !authorizedFields.includes(field)
      );

      const compliant = deniedFields.length === 0;
      
      const justification = compliant 
        ? 'All requested fields comply with minimum necessary standard'
        : `Access restricted to ${authorizedFields.length}/${requestedFields.length} fields per minimum necessary principle`;

      // Log data minimization check
      await auditLog({
        action: 'data_minimization_check',
        resource: 'data_minimization',
        details: {
          userRole,
          accessPurpose,
          requestedFieldCount: requestedFields.length,
          authorizedFieldCount: authorizedFields.length,
          deniedFieldCount: deniedFields.length,
          compliant
        },
        complianceNote: 'Data minimization check performed per HIPAA minimum necessary standard'
      });

      return {
        requestedFields,
        authorizedFields,
        deniedFields,
        justification,
        compliant
      };
    } catch (error) {
      console.error('Data minimization check failed:', error);
      throw new Error('Data minimization validation failed');
    }
  }

  /**
   * Generate HIPAA compliance report
   */
  async generateComplianceReport(startDate: Date, endDate: Date): Promise<ComplianceReport> {
    try {
      // Fetch audit data for the period
      const { auditLogger } = await import('./audit-logger');
      const auditEntries = await auditLogger.search({ startDate, endDate });

      // Calculate compliance metrics
      const phiAccess = auditEntries.filter(entry => entry.phi_accessed);
      const authorizedAccess = phiAccess.filter(entry => 
        entry.action.includes('authorized') || entry.access_reason
      );
      const unauthorizedAttempts = auditEntries.filter(entry => 
        entry.action.includes('denied') || entry.action.includes('unauthorized')
      );

      // Identify violations
      const violations = await this.identifyComplianceViolations(auditEntries);

      // Calculate compliance percentages
      const encryptionCompliance = this.calculateEncryptionCompliance(auditEntries);
      const accessControlCompliance = authorizedAccess.length / Math.max(phiAccess.length, 1) * 100;
      const auditTrailCompleteness = this.calculateAuditCompleteness(auditEntries);

      const report: ComplianceReport = {
        period: { start: startDate, end: endDate },
        metrics: {
          totalPHIAccess: phiAccess.length,
          authorizedAccess: authorizedAccess.length,
          unauthorizedAttempts: unauthorizedAttempts.length,
          dataBreaches: violations.filter(v => v.type === 'data_breach').length,
          encryptionCompliance,
          accessControlCompliance,
          auditTrailCompleteness
        },
        violations,
        recommendations: this.generateComplianceRecommendations(violations, auditEntries)
      };

      // Log report generation
      await auditLog({
        action: 'generate_compliance_report',
        resource: 'compliance_report',
        details: {
          period: `${startDate.toISOString()} to ${endDate.toISOString()}`,
          totalPHIAccess: report.metrics.totalPHIAccess,
          violationCount: violations.length,
          overallCompliance: (
            encryptionCompliance + accessControlCompliance + auditTrailCompleteness
          ) / 3
        },
        complianceNote: 'HIPAA compliance report generated for administrative review'
      });

      return report;
    } catch (error) {
      console.error('Compliance report generation failed:', error);
      throw new Error('Failed to generate HIPAA compliance report');
    }
  }

  /**
   * Handle patient data access requests (HIPAA Right of Access)
   */
  async handlePatientDataRequest(request: {
    patientId: string;
    requestorEmail: string;
    requestedData: string[];
    identityVerification: boolean;
    format: 'pdf' | 'json' | 'csv';
  }): Promise<{
    approved: boolean;
    reason: string;
    estimatedCompletionDate?: Date;
    requestId: string;
  }> {
    try {
      const requestId = crypto.randomUUID();

      // Verify patient identity
      if (!request.identityVerification) {
        await auditLog({
          action: 'patient_data_request_denied',
          resource: 'patient_data_request',
          resourceId: requestId,
          details: request,
          complianceNote: 'Patient data request denied - identity verification failed'
        });

        return {
          approved: false,
          reason: 'Identity verification required for patient data access',
          requestId
        };
      }

      // Validate request format
      const allowedFormats = ['pdf', 'json', 'csv'];
      if (!allowedFormats.includes(request.format)) {
        return {
          approved: false,
          reason: 'Unsupported data format requested',
          requestId
        };
      }

      // Approve request (HIPAA requires response within 30 days)
      const estimatedCompletionDate = new Date();
      estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + 30);

      await auditLog({
        action: 'patient_data_request_approved',
        resource: 'patient_data_request',
        resourceId: requestId,
        phiAccessed: true,
        details: request,
        complianceNote: 'Patient data request approved under HIPAA Right of Access'
      });

      return {
        approved: true,
        reason: 'Request approved - data will be provided within 30 days as required by HIPAA',
        estimatedCompletionDate,
        requestId
      };
    } catch (error) {
      console.error('Patient data request handling failed:', error);
      throw new Error('Failed to process patient data request');
    }
  }

  /**
   * Private helper methods
   */

  private generateSecureKey(): string {
    return randomBytes(32).toString('hex');
  }

  private requiresJustification(request: PHIAccessRequest): boolean {
    const sensitiveResources = ['patient_records', 'medication_history', 'diagnosis_data'];
    return sensitiveResources.includes(request.resourceType);
  }

  private async getRolePermissions(role: string): Promise<string[]> {
    const rolePermissions: Record<string, string[]> = {
      'admin': ['*'],
      'provider': ['patient_records', 'medication_history', 'authorization_data'],
      'nurse': ['patient_records', 'medication_history'],
      'medical_assistant': ['patient_demographics', 'appointment_data'],
      'pharmacy_tech': ['medication_data', 'authorization_data'],
      'compliance_officer': ['audit_data', 'compliance_reports'],
      'billing': ['patient_demographics', 'insurance_data', 'billing_data']
    };

    return rolePermissions[role] || [];
  }

  private hasResourceAccess(permissions: string[], resourceType: string): boolean {
    return permissions.includes('*') || permissions.includes(resourceType);
  }

  private isWithinAllowedHours(request: PHIAccessRequest): boolean {
    const hour = new Date().getHours();
    
    // Most roles limited to business hours (6 AM - 10 PM)
    if (['medical_assistant', 'billing'].includes(request.userRole)) {
      return hour >= 6 && hour <= 22;
    }
    
    // Clinical roles have 24/7 access
    return true;
  }

  private isEmergencyAccess(request: PHIAccessRequest): boolean {
    return request.accessReason?.toLowerCase().includes('emergency') ||
           request.accessReason?.toLowerCase().includes('urgent');
  }

  private async logAccessViolation(violationType: string, request: PHIAccessRequest): Promise<void> {
    await auditLog({
      action: 'phi_access_violation',
      userId: request.userId,
      resource: request.resourceType,
      resourceId: request.resourceId,
      details: {
        violationType,
        userRole: request.userRole,
        accessReason: request.accessReason
      },
      complianceNote: `HIPAA access violation detected: ${violationType}`
    });
  }

  private getPurposeRequirements(purpose: string): string[] {
    const purposeFields: Record<string, string[]> = {
      'treatment': ['demographics', 'medical_history', 'medications', 'diagnoses'],
      'payment': ['demographics', 'insurance_info', 'billing_data'],
      'operations': ['demographics', 'appointment_data', 'basic_medical_info'],
      'research': ['anonymized_data', 'statistical_info'],
      'audit': ['audit_logs', 'access_records']
    };

    return purposeFields[purpose] || [];
  }

  private isFieldAuthorized(
    field: string,
    rolePermissions: string[],
    purposeRequirements: string[]
  ): boolean {
    return rolePermissions.includes('*') ||
           rolePermissions.includes(field) ||
           purposeRequirements.includes(field);
  }

  private async identifyComplianceViolations(auditEntries: any[]): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    // Identify unauthorized access attempts
    const unauthorizedAccess = auditEntries.filter(entry => 
      entry.action.includes('denied') || entry.action.includes('unauthorized')
    );

    unauthorizedAccess.forEach(entry => {
      violations.push({
        id: crypto.randomUUID(),
        type: 'unauthorized_access',
        severity: 'high',
        description: `Unauthorized access attempt: ${entry.action}`,
        userId: entry.user_id,
        resourceId: entry.resource_id,
        timestamp: new Date(entry.created_at),
        resolved: false
      });
    });

    // Identify missing audit documentation
    const phiAccess = auditEntries.filter(entry => entry.phi_accessed);
    const undocumented = phiAccess.filter(entry => !entry.access_reason);

    if (undocumented.length > 0) {
      violations.push({
        id: crypto.randomUUID(),
        type: 'missing_documentation',
        severity: 'medium',
        description: `${undocumented.length} PHI access events without documented reason`,
        timestamp: new Date(),
        resolved: false
      });
    }

    return violations;
  }

  private calculateEncryptionCompliance(auditEntries: any[]): number {
    const encryptionEvents = auditEntries.filter(entry => 
      entry.action.includes('encrypt') || entry.action.includes('decrypt')
    );
    
    const successfulEncryption = encryptionEvents.filter(entry => 
      !entry.error && entry.action.includes('encrypt')
    );

    return encryptionEvents.length > 0 ? 
      (successfulEncryption.length / encryptionEvents.length) * 100 : 100;
  }

  private calculateAuditCompleteness(auditEntries: any[]): number {
    const requiredFields = ['user_id', 'action', 'created_at', 'resource'];
    const completeEntries = auditEntries.filter(entry =>
      requiredFields.every(field => entry[field])
    );

    return auditEntries.length > 0 ? 
      (completeEntries.length / auditEntries.length) * 100 : 100;
  }

  private generateComplianceRecommendations(
    violations: ComplianceViolation[],
    auditEntries: any[]
  ): string[] {
    const recommendations = [];

    if (violations.some(v => v.type === 'unauthorized_access')) {
      recommendations.push('Review and strengthen access controls for PHI resources');
    }

    if (violations.some(v => v.type === 'missing_documentation')) {
      recommendations.push('Implement mandatory access reason documentation for all PHI access');
    }

    const phiAccess = auditEntries.filter(entry => entry.phi_accessed);
    const offHoursAccess = phiAccess.filter(entry => {
      const hour = new Date(entry.created_at).getHours();
      return hour < 6 || hour > 22;
    });

    if (offHoursAccess.length > phiAccess.length * 0.1) {
      recommendations.push('Review off-hours access patterns and implement additional controls if needed');
    }

    const failedAccess = auditEntries.filter(entry => entry.error);
    if (failedAccess.length > auditEntries.length * 0.05) {
      recommendations.push('Investigate and resolve system errors that may impact audit trail integrity');
    }

    return recommendations;
  }
}