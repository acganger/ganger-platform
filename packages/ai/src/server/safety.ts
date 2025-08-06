/**
 * @fileoverview HIPAA-compliant safety filtering for AI interactions
 * Detects and handles PHI (Protected Health Information) in medical contexts
 */

import type { SafetyCheckResponse, HIPAAComplianceLevel } from '../shared/types';

/**
 * PHI Detection Patterns
 * Comprehensive patterns for identifying protected health information
 */
const PHI_PATTERNS = {
  ssn: {
    pattern: /\b(?:\d{3}-?\d{2}-?\d{4}|XXX-XX-\d{4})\b/gi,
    replacement: '[SSN REMOVED]',
    severity: 'high'
  },
  phone: {
    pattern: /\b(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})\b/gi,
    replacement: '[PHONE REMOVED]',
    severity: 'medium'
  },
  email: {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
    replacement: '[EMAIL REMOVED]',
    severity: 'medium'
  },
  mrn: {
    pattern: /\b(?:MRN|mrn|Medical Record Number)[:\s#]*([A-Z0-9]{6,12})\b/gi,
    replacement: '[MRN REMOVED]',
    severity: 'high'
  },
  dob: {
    pattern: /\b(?:DOB|dob|Date of Birth|Born)[:\s]*(?:0?[1-9]|1[0-2])[\/\-\.](?:0?[1-9]|[12]\d|3[01])[\/\-\.](?:19|20)\d{2}\b/gi,
    replacement: '[DOB REMOVED]',
    severity: 'high'
  },
  address: {
    pattern: /\b\d+\s+(?:[A-Za-z]+\s+){1,3}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Plaza|Pl)\b/gi,
    replacement: '[ADDRESS REMOVED]',
    severity: 'medium'
  },
  creditCard: {
    pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/gi,
    replacement: '[CARD REMOVED]',
    severity: 'high'
  },
  ipAddress: {
    pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/gi,
    replacement: '[IP REMOVED]',
    severity: 'low'
  },
  patientName: {
    // This is a heuristic - looks for "patient: [name]" patterns
    pattern: /\b(?:patient|pt|Patient|PT)[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)\b/gi,
    replacement: '[PATIENT NAME REMOVED]',
    severity: 'high'
  }
};

/**
 * Medical context keywords that increase PHI risk
 */
const MEDICAL_CONTEXT_KEYWORDS = [
  'diagnosis', 'treatment', 'prescription', 'medication',
  'surgery', 'condition', 'symptoms', 'patient',
  'medical history', 'allergies', 'insurance',
  'provider', 'physician', 'doctor', 'nurse'
];

/**
 * Safety Filter Class
 * Provides comprehensive PHI detection and content safety validation
 */
export class SafetyFilter {
  private complianceLevel: HIPAAComplianceLevel;

  constructor(complianceLevel: HIPAAComplianceLevel = 'standard') {
    this.complianceLevel = complianceLevel;
  }

  /**
   * Perform comprehensive safety check on content
   */
  async checkSafety(content: string, context?: string): Promise<SafetyCheckResponse> {
    const startTime = Date.now();
    
    // Log context for debugging
    if (context) {
      console.debug(`[SafetyFilter] Checking safety with context: ${context}`);
    }

    // Detect PHI
    const phiDetection = this.detectPHI(content);
    
    // Calculate safety score
    const safetyScore = this.calculateSafetyScore(content, phiDetection);
    
    // Determine if content is safe based on compliance level
    const isSafe = this.evaluateSafety(safetyScore, phiDetection);

    // Get recommendations
    const recommendations = this.getRecommendations(phiDetection, safetyScore);

    // Log processing time
    const processingTime = Date.now() - startTime;
    console.debug(`[SafetyFilter] Safety check completed in ${processingTime}ms`);
    
    return {
      success: true,
      data: {
        safe: isSafe,
        score: safetyScore,
        reasons: recommendations,
        containsPHI: phiDetection.found
      }
    };
  }

  /**
   * Detect PHI in content
   */
  detectPHI(content: string): { found: boolean; types: string[]; matches: any[] } {
    const detectedTypes: string[] = [];
    const matches: any[] = [];

    for (const [type, config] of Object.entries(PHI_PATTERNS)) {
      const matchArray = content.match(config.pattern);
      if (matchArray && matchArray.length > 0) {
        detectedTypes.push(type);
        matches.push({
          type,
          count: matchArray.length,
          severity: config.severity
        });
      }
    }

    // Check for medical context
    const hasMedicalContext = MEDICAL_CONTEXT_KEYWORDS.some(keyword => 
      content.toLowerCase().includes(keyword)
    );

    if (hasMedicalContext && detectedTypes.length > 0) {
      // Increase severity if PHI is found in medical context
      matches.forEach(match => {
        if (match.severity === 'medium') match.severity = 'high';
      });
    }

    return {
      found: detectedTypes.length > 0,
      types: detectedTypes,
      matches
    };
  }

  /**
   * Sanitize content by removing PHI
   */
  sanitizePHI(content: string): string {
    let sanitized = content;

    for (const [type, config] of Object.entries(PHI_PATTERNS)) {
      console.debug(`[SafetyFilter] Sanitizing ${type} patterns`);
      sanitized = sanitized.replace(config.pattern, config.replacement);
    }

    return sanitized;
  }

  /**
   * Calculate safety score (0-1, higher is safer)
   */
  private calculateSafetyScore(content: string, phiDetection: any): number {
    let score = 1.0;

    // Deduct points for PHI
    for (const match of phiDetection.matches || []) {
      switch (match.severity) {
        case 'high':
          score -= 0.3 * match.count;
          break;
        case 'medium':
          score -= 0.15 * match.count;
          break;
        case 'low':
          score -= 0.05 * match.count;
          break;
      }
    }

    // Deduct for medical context with PHI
    const hasMedicalContext = MEDICAL_CONTEXT_KEYWORDS.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
    if (hasMedicalContext && phiDetection.found) {
      score -= 0.2;
    }

    // Ensure score stays between 0 and 1
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Evaluate if content is safe based on compliance level
   */
  private evaluateSafety(safetyScore: number, phiDetection: any): boolean {
    switch (this.complianceLevel) {
      case 'none':
        return true; // No compliance required
      case 'standard':
        return safetyScore >= 0.7 && !phiDetection.matches?.some((m: any) => m.severity === 'high');
      case 'strict':
        return safetyScore >= 0.9 && !phiDetection.found;
      case 'audit':
        return safetyScore >= 0.95 && !phiDetection.found;
      default:
        return safetyScore >= 0.7;
    }
  }

  /**
   * Get recommendations based on detection results
   */
  private getRecommendations(phiDetection: any, safetyScore: number): string[] {
    const recommendations: string[] = [];

    if (phiDetection.found) {
      recommendations.push('Remove or mask PHI before processing');
      
      if (phiDetection.types.includes('ssn')) {
        recommendations.push('Never include SSN in AI prompts');
      }
      if (phiDetection.types.includes('mrn')) {
        recommendations.push('Use anonymous identifiers instead of MRN');
      }
      if (phiDetection.types.includes('patientName')) {
        recommendations.push('Use generic terms like "the patient" instead of names');
      }
    }

    if (safetyScore < 0.5) {
      recommendations.push('Consider rephrasing to remove identifying information');
    }

    if (recommendations.length === 0 && safetyScore > 0.9) {
      recommendations.push('Content appears safe for AI processing');
    }

    return recommendations;
  }

  /**
   * Generate a PHI-safe summary of content
   */
  generateSafeSummary(content: string): string {
    const sanitized = this.sanitizePHI(content);
    const words = sanitized.split(/\s+/);
    
    if (words.length <= 20) {
      return sanitized;
    }

    // Return first 20 words with ellipsis
    return words.slice(0, 20).join(' ') + '...';
  }

  /**
   * Check if response contains PHI
   */
  async checkResponse(response: string): Promise<boolean> {
    const phiDetection = this.detectPHI(response);
    return phiDetection.found;
  }
}

/**
 * Singleton instance for easy access
 */
export const defaultSafetyFilter = new SafetyFilter('standard');

/**
 * Convenience function for quick safety checks
 */
export async function checkContentSafety(
  content: string,
  complianceLevel: HIPAAComplianceLevel = 'standard'
): Promise<SafetyCheckResponse> {
  const filter = new SafetyFilter(complianceLevel);
  return filter.checkSafety(content);
}

/**
 * Convenience function for sanitization
 */
export function sanitizeContent(content: string): string {
  return defaultSafetyFilter.sanitizePHI(content);
}