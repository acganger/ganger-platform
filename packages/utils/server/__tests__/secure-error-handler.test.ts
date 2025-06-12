/**
 * Test Suite for Secure Error Handling System
 * 
 * Verifies all functions work correctly with comprehensive test coverage
 */

import {
  createValidationError,
  createBusinessRuleError,
  createRateLimitError,
  errorToResponse,
  redactSensitiveData,
  generateRequestId,
  createStructuredError,
  ErrorSeverity,
  ErrorCategory,
  StructuredError,
  ErrorResponse
} from '../secure-error-handler';

// Mock console methods to capture log output
const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});

afterEach(() => {
  consoleSpy.mockClear();
  consoleWarnSpy.mockClear();
  consoleInfoSpy.mockClear();
});

afterAll(() => {
  consoleSpy.mockRestore();
  consoleWarnSpy.mockRestore();
  consoleInfoSpy.mockRestore();
});

describe('Secure Error Handler System', () => {
  
  describe('generateRequestId()', () => {
    it('should generate unique request IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBe(32); // 16 bytes as hex = 32 chars
      expect(id1).toMatch(/^[a-f0-9]{32}$/);
    });
  });

  describe('redactSensitiveData()', () => {
    it('should redact objects with sensitive keys', () => {
      const sensitiveData = {
        username: 'testuser',
        password: 'secret123',
        email: 'test@example.com',
        token: 'abc123',
        normalField: 'normal value',
        patient_id: '12345',
        medical_record: 'sensitive medical info'
      };

      const redacted = redactSensitiveData(sensitiveData);

      expect(redacted.username).toBe('testuser');
      expect(redacted.password).toBe('[REDACTED]');
      expect(redacted.email).toBe('[REDACTED]');
      expect(redacted.token).toBe('[REDACTED]');
      expect(redacted.normalField).toBe('normal value');
      expect(redacted.patient_id).toBe('[REDACTED]');
      expect(redacted.medical_record).toBe('[REDACTED]');
    });

    it('should handle nested objects with depth limit', () => {
      const nestedData = {
        level1: {
          level2: {
            level3: {
              level4: {
                password: 'deep secret',
                data: 'deep data'
              }
            }
          }
        }
      };

      const redacted = redactSensitiveData(nestedData, 3);
      
      expect(redacted.level1.level2.level3).toBe('[REDACTED: MAX_DEPTH]');
    });

    it('should handle arrays by limiting to 10 items', () => {
      const arrayData = Array.from({ length: 15 }, (_, i) => ({ id: i, password: `secret${i}` }));
      
      const redacted = redactSensitiveData(arrayData);
      
      expect(Array.isArray(redacted)).toBe(true);
      expect(redacted.length).toBe(10);
      expect(redacted[0].password).toBe('[REDACTED]');
    });

    it('should handle long strings', () => {
      const longString = 'a'.repeat(60);
      const redacted = redactSensitiveData(longString);
      
      expect(redacted).toBe('[REDACTED: LONG_STRING]');
    });

    it('should handle Error objects', () => {
      const error = new Error('Test error message');
      error.stack = 'Error stack trace';
      
      const redacted = redactSensitiveData(error);
      
      expect(redacted.name).toBe('Error');
      expect(redacted.message).toBe('Test error message');
      expect(redacted.stack).toBe('[REDACTED: STACK_TRACE]');
    });

    it('should handle Date objects', () => {
      const date = new Date('2025-01-11T10:00:00Z');
      const redacted = redactSensitiveData(date);
      
      expect(redacted).toBe('2025-01-11T10:00:00.000Z');
    });

    it('should handle primitive types', () => {
      expect(redactSensitiveData(42)).toBe(42);
      expect(redactSensitiveData(true)).toBe(true);
      expect(redactSensitiveData(null)).toBe(null);
      expect(redactSensitiveData(undefined)).toBe(undefined);
      expect(redactSensitiveData('short string')).toBe('short string');
    });
  });

  describe('createValidationError()', () => {
    it('should create validation error with correct structure', () => {
      const validationErrors = ['Field is required', 'Invalid email format'];
      const requestId = 'test-request-id';
      
      const error = createValidationError(validationErrors, requestId);
      
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Request validation failed');
      expect(error.severity).toBe(ErrorSeverity.LOW);
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.requestId).toBe(requestId);
      expect(error.context.validationErrors).toEqual(validationErrors);
      expect(error.id).toBeDefined();
      expect(error.timestamp).toBeDefined();
    });

    it('should generate request ID if not provided', () => {
      const error = createValidationError(['Test error']);
      
      expect(error.requestId).toBeDefined();
      expect(error.requestId.length).toBe(32);
    });
  });

  describe('createBusinessRuleError()', () => {
    it('should create business rule error with correct structure', () => {
      const rule = 'MAX_APPLICATIONS_PER_SHIFT';
      const details = 'Cannot apply to more than 3 shifts per day';
      const requestId = 'business-rule-test';
      
      const error = createBusinessRuleError(rule, details, requestId);
      
      expect(error.code).toBe('BUSINESS_RULE_VIOLATION');
      expect(error.message).toBe(`Business rule violation: ${rule}`);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.category).toBe(ErrorCategory.BUSINESS_RULE);
      expect(error.requestId).toBe(requestId);
      expect(error.context.rule).toBe(rule);
      expect(error.context.details).toBe(details);
    });
  });

  describe('createRateLimitError()', () => {
    it('should create rate limit error with correct structure', () => {
      const requestId = 'rate-limit-test';
      
      const error = createRateLimitError(requestId);
      
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.message).toBe('Too many requests. Please try again later.');
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.category).toBe(ErrorCategory.SYSTEM);
      expect(error.requestId).toBe(requestId);
      expect(error.context.rateLimitExceeded).toBe(true);
    });
  });

  describe('errorToResponse()', () => {
    it('should convert validation error to client-safe response', () => {
      const validationErrors = ['Name is required', 'Email must be valid'];
      const error = createValidationError(validationErrors, 'test-request');
      
      const response = errorToResponse(error);
      
      expect(response.error.code).toBe('VALIDATION_ERROR');
      expect(response.error.message).toBe('Request validation failed');
      expect(response.error.requestId).toBe('test-request');
      expect(response.error.timestamp).toBeDefined();
      expect(response.error.details?.validationErrors).toEqual(validationErrors);
    });

    it('should convert business rule error to client-safe response', () => {
      const error = createBusinessRuleError('TEST_RULE', 'Test violation', 'business-test');
      
      const response = errorToResponse(error);
      
      expect(response.error.code).toBe('BUSINESS_RULE_VIOLATION');
      expect(response.error.message).toBe('Business rule violation: TEST_RULE');
      expect(response.error.requestId).toBe('business-test');
      expect(response.error.details).toBeUndefined(); // Medium severity, no details
    });

    it('should provide generic message for authentication errors', () => {
      const authError = createStructuredError(
        'AUTH_FAILED',
        'Internal auth details',
        undefined,
        { internalInfo: 'sensitive' }
      );
      
      const response = errorToResponse(authError);
      
      expect(response.error.message).toBe('Authentication failed. Please log in again.');
      expect(response.error.details).toBeUndefined();
    });

    it('should provide generic message for database errors', () => {
      const dbError = createStructuredError(
        'DATABASE_CONNECTION_FAILED',
        'Connection timeout to database server',
        undefined,
        { connectionString: 'postgresql://user:pass@localhost' }
      );
      
      const response = errorToResponse(dbError);
      
      expect(response.error.message).toBe('A database error occurred. Please try again later.');
    });

    it('should provide generic message for system errors', () => {
      const systemError = createStructuredError(
        'UNKNOWN_ERROR',
        'Internal system failure',
        undefined,
        { stackTrace: 'sensitive stack info' }
      );
      
      const response = errorToResponse(systemError);
      
      expect(response.error.message).toBe('An unexpected error occurred. Please try again later.');
    });
  });

  describe('createStructuredError()', () => {
    it('should auto-classify validation errors', () => {
      const error = createStructuredError(
        'VALIDATION_FAILED',
        'Test validation',
        undefined,
        { field: 'email' }
      );
      
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.severity).toBe(ErrorSeverity.LOW);
    });

    it('should auto-classify auth errors', () => {
      const error = createStructuredError(
        'AUTH_TOKEN_INVALID',
        'Invalid token',
        undefined,
        {}
      );
      
      expect(error.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
    });

    it('should auto-classify permission errors', () => {
      const error = createStructuredError(
        'PERMISSION_DENIED',
        'Access denied',
        undefined,
        {}
      );
      
      expect(error.category).toBe(ErrorCategory.AUTHORIZATION);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
    });

    it('should auto-classify database errors', () => {
      const error = createStructuredError(
        'DATABASE_QUERY_FAILED',
        'Query failed',
        undefined,
        {}
      );
      
      expect(error.category).toBe(ErrorCategory.DATABASE);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
    });

    it('should auto-classify external service errors', () => {
      const error = createStructuredError(
        'EXTERNAL_API_FAILED',
        'API call failed',
        undefined,
        {}
      );
      
      expect(error.category).toBe(ErrorCategory.EXTERNAL_SERVICE);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    });

    it('should auto-classify critical errors', () => {
      const error = createStructuredError(
        'CRITICAL_SYSTEM_FAILURE',
        'Critical failure',
        undefined,
        {}
      );
      
      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
    });

    it('should include original error when provided', () => {
      const originalError = new Error('Original error message');
      const error = createStructuredError(
        'WRAPPER_ERROR',
        'Wrapped error',
        originalError,
        {}
      );
      
      expect(error.originalError).toBe(originalError);
    });

    it('should redact sensitive context data', () => {
      const sensitiveContext = {
        userEmail: 'user@example.com',
        password: 'secret123',
        normalData: 'public info'
      };
      
      const error = createStructuredError(
        'TEST_ERROR',
        'Test message',
        undefined,
        sensitiveContext
      );
      
      expect(error.context.normalData).toBe('public info');
      expect(error.context.userEmail).toBe('[REDACTED]');
      expect(error.context.password).toBe('[REDACTED]');
    });

    it('should generate unique IDs and timestamps', () => {
      const error1 = createStructuredError('TEST1', 'Message 1');
      const error2 = createStructuredError('TEST2', 'Message 2');
      
      expect(error1.id).not.toBe(error2.id);
      expect(error1.timestamp).toBeDefined();
      expect(error2.timestamp).toBeDefined();
      expect(new Date(error1.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Integration Tests', () => {
    it('should handle end-to-end validation error flow', () => {
      // Create validation error
      const validationErrors = [
        'Email is required',
        'Phone number must be valid',
        'Date of birth cannot be in the future'
      ];
      const requestId = generateRequestId();
      const validationError = createValidationError(validationErrors, requestId);
      
      // Convert to response
      const response = errorToResponse(validationError);
      
      // Verify complete flow
      expect(response.error.code).toBe('VALIDATION_ERROR');
      expect(response.error.requestId).toBe(requestId);
      expect(response.error.details?.validationErrors).toEqual(validationErrors);
      expect(response.error.message).toBe('Request validation failed');
    });

    it('should handle end-to-end business rule error flow', () => {
      const rule = 'CLINICAL_STAFFING_OVERLAP';
      const details = 'Staff member cannot be assigned to overlapping shifts';
      const requestId = generateRequestId();
      
      const businessError = createBusinessRuleError(rule, details, requestId);
      const response = errorToResponse(businessError);
      
      expect(response.error.code).toBe('BUSINESS_RULE_VIOLATION');
      expect(response.error.message).toBe(`Business rule violation: ${rule}`);
      expect(response.error.requestId).toBe(requestId);
      expect(response.error.details).toBeUndefined(); // Medium severity
    });

    it('should handle sensitive data throughout the entire flow', () => {
      const sensitiveContext = {
        patientSSN: '123-45-6789',
        medicalRecord: 'Patient has diabetes',
        staffEmail: 'nurse@hospital.com',
        authToken: 'bearer-token-123',
        publicInfo: 'General information'
      };
      
      const error = createStructuredError(
        'MEDICAL_DATA_ERROR',
        'Error processing medical data',
        undefined,
        sensitiveContext,
        'user123',
        generateRequestId()
      );
      
      // Verify sensitive data is redacted in structured error
      expect(error.context.publicInfo).toBe('General information');
      expect(error.context.patientSSN).toBe('[REDACTED]'); // Contains 'ssn' pattern
      expect(error.context.medicalRecord).toBe('[REDACTED]'); // Contains 'medical' pattern
      expect(error.context.staffEmail).toBe('[REDACTED]'); // Contains 'email' pattern
      expect(error.context.authToken).toBe('[REDACTED]'); // Contains 'token' pattern
      
      // Convert to response and verify no sensitive data leaks
      const response = errorToResponse(error);
      expect(response.error.message).toBe('An unexpected error occurred. Please try again later.');
      expect(response.error.details).toBeUndefined();
    });
  });
});