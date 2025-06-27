/**
 * @fileoverview HIPAA-compliant safety filtering pipeline
 * Provides comprehensive content safety and PHI detection for medical applications
 */

import { z } from 'zod';
import type {
  SafetyCheckResponse,
  ChatMessage,
  UseCase,
  HIPAAComplianceLevel,
  AIModel
} from '../shared/types';

import { HIPAA_SAFETY_CONFIG, SYSTEM_PROMPTS } from '../shared/constants';

/**
 * PHI Detection Patterns
 * Based on HIPAA Safe Harbor guidelines
 */
const PHI_PATTERNS = {
  // Names - Combined with titles or in specific contexts
  names: /\b(?:mr|mrs|ms|dr|doctor|patient|client)\s+[a-z]{2,}\b/gi,
  
  // Geographic subdivisions smaller than state
  addresses: /\b\d+\s+[a-z\s]+(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr|court|ct|boulevard|blvd)\b/gi,
  
  // Dates (except year) - birth dates, admission dates, etc.
  dates: /\b(?:0?[1-9]|1[0-2])[-\/](?:0?[1-9]|[12]\d|3[01])[-\/](?:19|20)\d{2}\b/g,
  specificDates: /\b(?:birth|born|dob|date of birth|admission|discharge|appointment)\s*:?\s*(?:0?[1-9]|1[0-2])[-\/](?:0?[1-9]|[12]\d|3[01])[-\/](?:19|20)?\d{2,4}\b/gi,
  
  // Telephone numbers
  phone: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
  
  // Fax numbers
  fax: /\bfax\s*:?\s*(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/gi,
  
  // Email addresses
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // Social Security numbers
  ssn: /\b(?!000|666|9\d{2})\d{3}[-.]?(?!00)\d{2}[-.]?(?!0000)\d{4}\b/g,
  
  // Medical record numbers
  mrn: /\b(?:mrn|medical record|patient id|chart number)\s*:?\s*[a-z0-9]+\b/gi,
  
  // Health plan beneficiary numbers
  healthPlan: /\b(?:policy|member|beneficiary|subscriber)\s*(?:number|id|#)\s*:?\s*[a-z0-9]+\b/gi,
  
  // Account numbers
  accountNumbers: /\b(?:account|acct)\s*(?:number|#)\s*:?\s*[a-z0-9]+\b/gi,
  
  // Certificate/license numbers
  certificates: /\b(?:license|certificate|permit)\s*(?:number|#)\s*:?\s*[a-z0-9]+\b/gi,
  
  // Vehicle identifiers
  vehicles: /\b(?:license plate|vin|vehicle identification)\s*:?\s*[a-z0-9]+\b/gi,
  
  // Device identifiers
  devices: /\b(?:device|serial)\s*(?:number|#|id)\s*:?\s*[a-z0-9]+\b/gi,
  
  // Web URLs
  urls: /\bhttps?:\/\/[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s]*)?\b/gi,
  
  // IP addresses
  ipAddresses: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  
  // Biometric identifiers (fingerprints, voiceprints, etc.)
  biometric: /\b(?:fingerprint|voiceprint|retina|iris|biometric)\s*(?:scan|data|id|identifier)\b/gi,
  
  // Full face photographic images
  photos: /\b(?:photo|photograph|image|picture)\s*(?:of|showing)\s*(?:face|patient|individual)\b/gi
};

/**
 * Medical Context Keywords
 * Words that suggest medical/clinical context where PHI is more likely
 */
const MEDICAL_CONTEXT_KEYWORDS = [
  'patient', 'diagnosis', 'treatment', 'medication', 'prescription', 'surgery',
  'clinic', 'hospital', 'doctor', 'physician', 'nurse', 'medical', 'health',
  'condition', 'symptom', 'procedure', 'appointment', 'visit', 'consultation',
  'test', 'lab', 'result', 'chart', 'record', 'history', 'allergy', 'insurance'
];

/**
 * Safety Categories for Content Classification
 */
export enum SafetyCategory {
  SAFE = 'safe',
  PHI_DETECTED = 'phi_detected',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  POTENTIAL_HARM = 'potential_harm',
  PRIVACY_VIOLATION = 'privacy_violation',
  SECURITY_RISK = 'security_risk'
}

/**
 * Safety Assessment Result
 */
export interface SafetyAssessment {
  category: SafetyCategory;
  score: number; // 0-1, where 1 is completely safe
  confidence: number; // 0-1, confidence in the assessment
  violations: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    pattern?: string;
    suggestions?: string[];
  }>;
  containsPHI: boolean;
  phiTypes: string[];
  medicalContext: boolean;
}

/**
 * Advanced Safety Filter Class
 * Provides comprehensive content safety analysis for healthcare applications
 */
export class SafetyFilter {
  private sensitivityLevel: 'low' | 'medium' | 'high' | 'strict';
  private enableLogging: boolean;

  constructor(config: {
    sensitivityLevel?: 'low' | 'medium' | 'high' | 'strict';
    enableLogging?: boolean;
  } = {}) {
    this.sensitivityLevel = config.sensitivityLevel || HIPAA_SAFETY_CONFIG.phiDetectionSensitivity as any;
    this.enableLogging = config.enableLogging || HIPAA_SAFETY_CONFIG.logAllInteractions;
  }

  /**
   * Comprehensive safety check for content
   */
  async checkSafety(
    content: string,
    context: UseCase = 'real_time_chat',
    complianceLevel: HIPAAComplianceLevel = 'standard'
  ): Promise<SafetyCheckResponse> {
    try {
      const assessment = await this.performSafetyAssessment(content, context, complianceLevel);
      
      const isSafe = this.determineSafety(assessment, complianceLevel);
      
      return {
        success: true,
        data: {
          safe: isSafe,
          score: assessment.score,
          containsPHI: assessment.containsPHI,
          reasons: assessment.violations.map(v => v.description)
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAFETY_CHECK_ERROR',
          message: error instanceof Error ? error.message : 'Safety check failed'
        }
      };
    }
  }

  /**
   * Perform comprehensive safety assessment
   */
  private async performSafetyAssessment(
    content: string,
    context: UseCase,
    complianceLevel: HIPAAComplianceLevel
  ): Promise<SafetyAssessment> {
    const violations: SafetyAssessment['violations'] = [];
    let containsPHI = false;
    const phiTypes: string[] = [];
    
    // Check for PHI patterns
    const phiResults = this.detectPHI(content);
    if (phiResults.detected) {
      containsPHI = true;
      phiTypes.push(...phiResults.types);
      
      phiResults.violations.forEach(violation => {
        violations.push({
          type: 'PHI_DETECTED',
          severity: this.getPHISeverity(violation.type, complianceLevel),
          description: `${violation.type} detected: ${violation.description}`,
          pattern: violation.pattern,
          suggestions: this.getPHISuggestions(violation.type)
        });
      });
    }

    // Check for inappropriate content
    const inappropriateResults = this.detectInappropriateContent(content);
    if (inappropriateResults.detected) {
      violations.push(...inappropriateResults.violations.map(v => ({
        type: 'INAPPROPRIATE_CONTENT',
        severity: v.severity,
        description: v.description,
        suggestions: v.suggestions
      })));
    }

    // Check for security risks
    const securityResults = this.detectSecurityRisks(content);
    if (securityResults.detected) {
      violations.push(...securityResults.violations.map(v => ({
        type: 'SECURITY_RISK',
        severity: v.severity,
        description: v.description,
        suggestions: v.suggestions
      })));
    }

    // Determine medical context
    const medicalContext = this.detectMedicalContext(content);

    // Calculate overall safety score
    const score = this.calculateSafetyScore(violations, containsPHI, medicalContext, complianceLevel);

    // Determine primary safety category
    const category = this.determinePrimaryCategory(violations, containsPHI);

    return {
      category,
      score,
      confidence: this.calculateConfidence(violations, content.length),
      violations,
      containsPHI,
      phiTypes,
      medicalContext
    };
  }

  /**
   * Detect PHI in content using pattern matching and context analysis
   */
  private detectPHI(content: string): {
    detected: boolean;
    types: string[];
    violations: Array<{
      type: string;
      description: string;
      pattern: string;
    }>;
  } {
    const violations: Array<{ type: string; description: string; pattern: string }> = [];
    const detectedTypes: string[] = [];

    // Check each PHI pattern
    Object.entries(PHI_PATTERNS).forEach(([type, pattern]) => {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        detectedTypes.push(type);
        violations.push({
          type: type.toUpperCase(),
          description: `Potential ${type.replace(/([A-Z])/g, ' $1').toLowerCase()} detected`,
          pattern: matches[0] // First match as example
        });
      }
    });

    return {
      detected: violations.length > 0,
      types: detectedTypes,
      violations
    };
  }

  /**
   * Detect inappropriate content
   */
  private detectInappropriateContent(content: string): {
    detected: boolean;
    violations: Array<{
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      suggestions: string[];
    }>;
  } {
    const violations: Array<{
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      suggestions: string[];
    }> = [];

    // Profanity and inappropriate language
    const profanityPatterns = [
      /\b(?:damn|hell|crap)\b/gi, // Mild
      /\b(?:fuck|shit|asshole|bitch)\b/gi, // Strong
    ];

    profanityPatterns.forEach((pattern, index) => {
      if (pattern.test(content)) {
        violations.push({
          severity: index === 0 ? 'low' : 'medium',
          description: 'Inappropriate language detected',
          suggestions: ['Use professional language', 'Consider alternative phrasing']
        });
      }
    });

    // Discriminatory language
    const discriminatoryPatterns = [
      /\b(?:race|ethnicity|religion|gender|sexual orientation)\s+(?:based|discrimination)\b/gi
    ];

    discriminatoryPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        violations.push({
          severity: 'high',
          description: 'Potentially discriminatory language detected',
          suggestions: ['Use inclusive language', 'Focus on medical facts only']
        });
      }
    });

    return {
      detected: violations.length > 0,
      violations
    };
  }

  /**
   * Detect security risks in content
   */
  private detectSecurityRisks(content: string): {
    detected: boolean;
    violations: Array<{
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      suggestions: string[];
    }>;
  } {
    const violations: Array<{
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      suggestions: string[];
    }> = [];

    // SQL injection patterns
    const sqlPatterns = [
      /\b(?:SELECT|INSERT|UPDATE|DELETE|DROP|UNION)\s+/gi,
      /\b(?:OR|AND)\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/gi
    ];

    sqlPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        violations.push({
          severity: 'critical',
          description: 'Potential SQL injection attempt detected',
          suggestions: ['Remove SQL-like syntax', 'Use plain language']
        });
      }
    });

    // Script injection patterns
    const scriptPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];

    scriptPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        violations.push({
          severity: 'critical',
          description: 'Potential script injection detected',
          suggestions: ['Remove HTML/JavaScript code', 'Use plain text only']
        });
      }
    });

    return {
      detected: violations.length > 0,
      violations
    };
  }

  /**
   * Detect medical context in content
   */
  private detectMedicalContext(content: string): boolean {
    const medicalKeywordCount = MEDICAL_CONTEXT_KEYWORDS.filter(keyword =>
      new RegExp(`\\b${keyword}\\b`, 'gi').test(content)
    ).length;

    // Consider it medical context if 2+ medical keywords are present
    return medicalKeywordCount >= 2;
  }

  /**
   * Calculate overall safety score
   */
  private calculateSafetyScore(
    violations: SafetyAssessment['violations'],
    containsPHI: boolean,
    medicalContext: boolean,
    complianceLevel: HIPAAComplianceLevel
  ): number {
    let baseScore = 1.0;

    // Deduct points for violations
    violations.forEach(violation => {
      switch (violation.severity) {
        case 'critical':
          baseScore -= 0.4;
          break;
        case 'high':
          baseScore -= 0.3;
          break;
        case 'medium':
          baseScore -= 0.2;
          break;
        case 'low':
          baseScore -= 0.1;
          break;
      }
    });

    // Additional deduction for PHI in medical context
    if (containsPHI && medicalContext) {
      baseScore -= 0.2;
    }

    // Stricter scoring for higher compliance levels
    if (complianceLevel === 'strict' || complianceLevel === 'audit') {
      if (containsPHI) {
        baseScore -= 0.3;
      }
      if (violations.length > 0) {
        baseScore -= 0.1; // Additional penalty for any violations
      }
    }

    return Math.max(0, Math.min(1, baseScore));
  }

  /**
   * Calculate confidence in the safety assessment
   */
  private calculateConfidence(violations: SafetyAssessment['violations'], contentLength: number): number {
    let confidence = 0.8; // Base confidence

    // Higher confidence with more content to analyze
    if (contentLength > 100) confidence += 0.1;
    if (contentLength > 500) confidence += 0.05;

    // Lower confidence with many violations (might be false positives)
    if (violations.length > 5) confidence -= 0.1;
    if (violations.length > 10) confidence -= 0.2;

    return Math.max(0.5, Math.min(1, confidence));
  }

  /**
   * Determine primary safety category
   */
  private determinePrimaryCategory(
    violations: SafetyAssessment['violations'],
    containsPHI: boolean
  ): SafetyCategory {
    if (containsPHI) return SafetyCategory.PHI_DETECTED;
    
    if (violations.some(v => v.severity === 'critical')) {
      if (violations.some(v => v.type === 'SECURITY_RISK')) {
        return SafetyCategory.SECURITY_RISK;
      }
      return SafetyCategory.POTENTIAL_HARM;
    }

    if (violations.some(v => v.type === 'INAPPROPRIATE_CONTENT')) {
      return SafetyCategory.INAPPROPRIATE_CONTENT;
    }

    if (violations.length > 0) return SafetyCategory.PRIVACY_VIOLATION;

    return SafetyCategory.SAFE;
  }

  /**
   * Determine if content is safe based on assessment and compliance level
   */
  private determineSafety(
    assessment: SafetyAssessment,
    complianceLevel: HIPAAComplianceLevel
  ): boolean {
    const thresholds = {
      none: 0.5,
      standard: HIPAA_SAFETY_CONFIG.minimumSafetyScore,
      strict: HIPAA_SAFETY_CONFIG.strictThreshold,
      audit: HIPAA_SAFETY_CONFIG.strictThreshold
    };

    const threshold = thresholds[complianceLevel];

    // Automatic fail conditions
    if (assessment.containsPHI && complianceLevel !== 'none') {
      return false;
    }

    if (assessment.violations.some(v => v.severity === 'critical')) {
      return false;
    }

    return assessment.score >= threshold;
  }

  /**
   * Get PHI severity based on type and compliance level
   */
  private getPHISeverity(
    phiType: string,
    complianceLevel: HIPAAComplianceLevel
  ): 'low' | 'medium' | 'high' | 'critical' {
    const criticalPHI = ['ssn', 'email', 'phone', 'addresses'];
    const highPHI = ['names', 'dates', 'mrn', 'healthPlan'];
    
    if (complianceLevel === 'strict' || complianceLevel === 'audit') {
      return criticalPHI.includes(phiType) ? 'critical' : 'high';
    }

    if (criticalPHI.includes(phiType)) return 'high';
    if (highPHI.includes(phiType)) return 'medium';
    return 'low';
  }

  /**
   * Get suggestions for PHI remediation
   */
  private getPHISuggestions(phiType: string): string[] {
    const suggestions: Record<string, string[]> = {
      names: ['Use "the patient" or "the individual" instead', 'Remove specific names'],
      dates: ['Use relative dates like "last month" or "recently"', 'Remove specific dates'],
      phone: ['Remove phone numbers', 'Use "contact information on file"'],
      email: ['Remove email addresses', 'Refer to "patient portal" instead'],
      ssn: ['Never include SSN in communications', 'Use patient ID instead'],
      addresses: ['Use general area like "local clinic" instead', 'Remove specific addresses'],
      mrn: ['Use "patient record" instead of specific numbers', 'Remove medical record numbers']
    };

    return suggestions[phiType] || ['Remove or mask sensitive information'];
  }
}

/**
 * Factory function for creating safety filter instances
 */
export function createSafetyFilter(config?: {
  sensitivityLevel?: 'low' | 'medium' | 'high' | 'strict';
  enableLogging?: boolean;
}): SafetyFilter {
  return new SafetyFilter(config);
}

/**
 * Quick safety check function for simple use cases
 */
export async function quickSafetyCheck(
  content: string,
  context: UseCase = 'real_time_chat'
): Promise<{ safe: boolean; score: number; containsPHI: boolean }> {
  const filter = createSafetyFilter();
  const result = await filter.checkSafety(content, context);
  
  if (!result.success || !result.data) {
    return { safe: false, score: 0, containsPHI: true };
  }

  return {
    safe: result.data.safe,
    score: result.data.score,
    containsPHI: result.data.containsPHI || false
  };
}