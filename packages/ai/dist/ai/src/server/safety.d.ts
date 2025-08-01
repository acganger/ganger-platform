/**
 * @fileoverview HIPAA-compliant safety filtering pipeline
 * Provides comprehensive content safety and PHI detection for medical applications
 */
import type { SafetyCheckResponse, UseCase, HIPAAComplianceLevel } from '../shared/types';
/**
 * Safety Categories for Content Classification
 */
export declare enum SafetyCategory {
    SAFE = "safe",
    PHI_DETECTED = "phi_detected",
    INAPPROPRIATE_CONTENT = "inappropriate_content",
    POTENTIAL_HARM = "potential_harm",
    PRIVACY_VIOLATION = "privacy_violation",
    SECURITY_RISK = "security_risk"
}
/**
 * Safety Assessment Result
 */
export interface SafetyAssessment {
    category: SafetyCategory;
    score: number;
    confidence: number;
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
export declare class SafetyFilter {
    private sensitivityLevel;
    private enableLogging;
    constructor(config?: {
        sensitivityLevel?: 'low' | 'medium' | 'high' | 'strict';
        enableLogging?: boolean;
    });
    /**
     * Comprehensive safety check for content
     */
    checkSafety(content: string, context?: UseCase, complianceLevel?: HIPAAComplianceLevel): Promise<SafetyCheckResponse>;
    /**
     * Perform comprehensive safety assessment
     */
    private performSafetyAssessment;
    /**
     * Detect PHI in content using pattern matching and context analysis
     */
    private detectPHI;
    /**
     * Detect inappropriate content
     */
    private detectInappropriateContent;
    /**
     * Detect security risks in content
     */
    private detectSecurityRisks;
    /**
     * Detect medical context in content
     */
    private detectMedicalContext;
    /**
     * Calculate overall safety score
     */
    private calculateSafetyScore;
    /**
     * Calculate confidence in the safety assessment
     */
    private calculateConfidence;
    /**
     * Determine primary safety category
     */
    private determinePrimaryCategory;
    /**
     * Determine if content is safe based on assessment and compliance level
     */
    private determineSafety;
    /**
     * Get PHI severity based on type and compliance level
     */
    private getPHISeverity;
    /**
     * Get suggestions for PHI remediation
     */
    private getPHISuggestions;
}
/**
 * Factory function for creating safety filter instances
 */
export declare function createSafetyFilter(config?: {
    sensitivityLevel?: 'low' | 'medium' | 'high' | 'strict';
    enableLogging?: boolean;
}): SafetyFilter;
/**
 * Quick safety check function for simple use cases
 */
export declare function quickSafetyCheck(content: string, context?: UseCase): Promise<{
    safe: boolean;
    score: number;
    containsPHI: boolean;
}>;
//# sourceMappingURL=safety.d.ts.map