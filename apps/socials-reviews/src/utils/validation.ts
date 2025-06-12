// Input validation and sanitization utilities
// Use simple sanitization to avoid DOMPurify type issues
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: string;
}

// XSS Protection - Simple sanitization without DOMPurify
export function sanitizeHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

// SQL Injection Protection (for display purposes)
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove on* event handlers
    .trim();
}

// Email validation
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  const sanitized = sanitizeInput(email);
  
  if (!sanitized) {
    errors.push('Email is required');
    return { isValid: false, errors };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    errors.push('Please enter a valid email address');
  }
  
  if (sanitized.length > 254) {
    errors.push('Email address is too long');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitized,
  };
}

// Review response validation
export function validateReviewResponse(response: string): ValidationResult {
  const errors: string[] = [];
  const sanitized = sanitizeHtml(response);
  
  if (!sanitized.trim()) {
    errors.push('Response is required');
    return { isValid: false, errors };
  }
  
  if (sanitized.length < 10) {
    errors.push('Response must be at least 10 characters long');
  }
  
  if (sanitized.length > 1000) {
    errors.push('Response must be less than 1000 characters');
  }
  
  // Check for inappropriate content patterns
  const inappropriatePatterns = [
    /\b(fuck|shit|damn|hell)\b/gi,
    /\b(idiot|stupid|moron)\b/gi,
  ];
  
  for (const pattern of inappropriatePatterns) {
    if (pattern.test(sanitized)) {
      errors.push('Response contains inappropriate language');
      break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitized,
  };
}

// Search query validation
export function validateSearchQuery(query: string): ValidationResult {
  const errors: string[] = [];
  const sanitized = sanitizeInput(query);
  
  if (sanitized.length > 200) {
    errors.push('Search query is too long');
  }
  
  // Prevent SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(;|--|\/\*|\*\/)/g,
  ];
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(sanitized)) {
      errors.push('Invalid search query');
      break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitized,
  };
}

// Content adaptation validation
export function validateAdaptedContent(content: string): ValidationResult {
  const errors: string[] = [];
  const sanitized = sanitizeHtml(content);
  
  if (!sanitized.trim()) {
    errors.push('Content is required');
    return { isValid: false, errors };
  }
  
  if (sanitized.length < 20) {
    errors.push('Content must be at least 20 characters long');
  }
  
  if (sanitized.length > 2000) {
    errors.push('Content must be less than 2000 characters');
  }
  
  // Medical accuracy checks
  const medicalClaims = [
    /\b(cure|guaranteed|miracle|100% effective)\b/gi,
    /\b(FDA approved|medically proven|doctor recommended)\b/gi,
  ];
  
  for (const pattern of medicalClaims) {
    if (pattern.test(sanitized)) {
      errors.push('Content contains unverified medical claims that require review');
      break;
    }
  }
  
  // HIPAA compliance check
  const hipaaPatterns = [
    /\b(\d{3}-\d{2}-\d{4})\b/g, // SSN pattern
    /\b([A-Z]{2}\d{2}-\d{4})\b/g, // Medical record pattern
  ];
  
  for (const pattern of hipaaPatterns) {
    if (pattern.test(sanitized)) {
      errors.push('Content may contain protected health information (PHI)');
      break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitized,
  };
}

// Hashtag validation
export function validateHashtags(hashtags: string[]): ValidationResult {
  const errors: string[] = [];
  const sanitizedHashtags: string[] = [];
  
  for (const hashtag of hashtags) {
    const sanitized = sanitizeInput(hashtag);
    
    if (!sanitized.startsWith('#')) {
      errors.push(`"${hashtag}" must start with #`);
      continue;
    }
    
    if (sanitized.length > 30) {
      errors.push(`"${hashtag}" is too long (max 30 characters)`);
      continue;
    }
    
    if (!/^#[a-zA-Z0-9_]+$/.test(sanitized)) {
      errors.push(`"${hashtag}" contains invalid characters`);
      continue;
    }
    
    sanitizedHashtags.push(sanitized);
  }
  
  if (sanitizedHashtags.length > 30) {
    errors.push('Too many hashtags (max 30)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitizedHashtags.join(' '),
  };
}

// Rate limiting validation
export function validateRateLimit(
  userId: string,
  action: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  // Simple in-memory rate limiting (use Redis in production)
  const now = Date.now();
  const key = `${userId}:${action}`;
  
  if (typeof window === 'undefined') return true; // Skip on server
  
  const storage = window.sessionStorage;
  const data = storage.getItem(key);
  
  if (!data) {
    storage.setItem(key, JSON.stringify({ count: 1, resetTime: now + windowMs }));
    return true;
  }
  
  const parsed = JSON.parse(data);
  
  if (now > parsed.resetTime) {
    storage.setItem(key, JSON.stringify({ count: 1, resetTime: now + windowMs }));
    return true;
  }
  
  if (parsed.count >= maxRequests) {
    return false;
  }
  
  parsed.count++;
  storage.setItem(key, JSON.stringify(parsed));
  return true;
}

// Comprehensive form validation
export function validateForm<T extends Record<string, unknown>>(
  data: T,
  rules: Record<keyof T, (value: unknown) => ValidationResult>
): { isValid: boolean; errors: Record<keyof T, string[]>; sanitizedData: Partial<T> } {
  const errors: Record<keyof T, string[]> = {} as Record<keyof T, string[]>;
  const sanitizedData: Partial<T> = {};
  let isValid = true;
  
  for (const [field, validator] of Object.entries(rules)) {
    const value = data[field as keyof T];
    const result = validator(value);
    
    if (!result.isValid) {
      errors[field as keyof T] = result.errors;
      isValid = false;
    } else {
      sanitizedData[field as keyof T] = result.sanitizedValue as T[keyof T];
    }
  }
  
  return { isValid, errors, sanitizedData };
}