/**
 * HIPAA-compliant error sanitization
 * Removes any potential PII from error messages and metadata
 */

const PII_PATTERNS = [
  // SSN patterns
  /\b\d{3}-\d{2}-\d{4}\b/g,
  /\b\d{9}\b/g,
  
  // Phone numbers
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  /\b\(\d{3}\)\s*\d{3}[-.]?\d{4}\b/g,
  
  // Email addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // Credit card numbers
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  
  // Date of birth (various formats)
  /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](\d{4}|\d{2})\b/g,
  
  // Medical record numbers (assuming 6-10 digits)
  /\bMRN[\s#:]?\d{6,10}\b/gi,
  /\bPatient[\s#:]?\d{6,10}\b/gi,
  
  // Names in common patterns
  /\b(Mr\.|Mrs\.|Ms\.|Dr\.)\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,
];

const SAFE_REPLACEMENT = '[REDACTED]';

/**
 * Sanitize a string by removing potential PII
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') return input;
  
  let sanitized = input;
  for (const pattern of PII_PATTERNS) {
    sanitized = sanitized.replace(pattern, SAFE_REPLACEMENT);
  }
  
  return sanitized;
}

/**
 * Deep sanitize an object by removing potential PII from all string values
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  maxDepth = 5,
  currentDepth = 0
): T {
  if (currentDepth >= maxDepth) return obj;
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized: any = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      // Skip certain keys that might contain PII
      if (isPIIKey(key)) {
        sanitized[key] = SAFE_REPLACEMENT;
        continue;
      }
      
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value, maxDepth, currentDepth + 1);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized as T;
}

/**
 * Check if a key name suggests it contains PII
 */
function isPIIKey(key: string): boolean {
  const piiKeyPatterns = [
    /^(ssn|social)/i,
    /^(dob|dateofbirth|birthdate)/i,
    /^(phone|mobile|cell)/i,
    /^(email|mail)/i,
    /^(address|street|city|zip)/i,
    /^(name|firstname|lastname|fullname)/i,
    /^(patient|mrn|medical)/i,
    /^(credit|card|payment)/i,
    /^(password|pwd|secret)/i,
  ];
  
  return piiKeyPatterns.some(pattern => pattern.test(key));
}

/**
 * Sanitize error stack traces by removing file paths that might contain usernames
 */
export function sanitizeStackTrace(stack?: string): string | undefined {
  if (!stack || process.env.NODE_ENV === 'production') return undefined;
  
  // Remove absolute paths that might contain usernames
  return stack
    .replace(/\/Users\/[^/]+/g, '/Users/[USER]')
    .replace(/\/home\/[^/]+/g, '/home/[USER]')
    .replace(/C:\\Users\\[^\\]+/g, 'C:\\Users\\[USER]');
}

/**
 * Create a HIPAA-compliant error message
 */
export function createSafeErrorMessage(error: Error | unknown): string {
  if (error instanceof Error) {
    return sanitizeString(error.message);
  }
  
  if (typeof error === 'string') {
    return sanitizeString(error);
  }
  
  return 'An unexpected error occurred';
}