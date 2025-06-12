/**
 * Mock Response Utilities
 * Provides the same interface as @ganger/utils for development
 */

import { NextApiRequest, NextApiResponse } from 'next';

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTEGRATION_ERROR: 'INTEGRATION_ERROR',
  PHI_ACCESS_DENIED: 'PHI_ACCESS_DENIED',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD'
} as const;

export function respondWithSuccess(res: NextApiResponse, data: any, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  });
}

export function respondWithError(
  res: NextApiResponse, 
  error: string, 
  statusCode = 500, 
  code?: string, 
  req?: AuthenticatedRequest, 
  additionalData?: any
) {
  return res.status(statusCode).json({
    success: false,
    error: {
      message: error,
      code: code || ErrorCodes.INTERNAL_ERROR,
      timestamp: new Date().toISOString(),
      ...additionalData
    }
  });
}

export function withStandardErrorHandling(handler: Function) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      return await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);
      
      if (error instanceof Error) {
        return respondWithError(res, error.message, 500, ErrorCodes.INTERNAL_ERROR);
      }
      
      return respondWithError(res, 'An unexpected error occurred', 500, ErrorCodes.INTERNAL_ERROR);
    }
  };
}

// Mock auth utilities
export interface AuthenticatedRequest extends NextApiRequest {
  user: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
    sessionId: string;
  };
}

export function withAuth(handler: Function, options: any = {}) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Mock authentication - always pass for development
    const mockUser = {
      id: 'mock-user-id',
      email: 'admin@gangerdermatology.com',
      role: 'admin',
      permissions: ['*'],
      sessionId: 'mock-session-id'
    };

    (req as AuthenticatedRequest).user = mockUser;
    return handler(req as AuthenticatedRequest, res);
  };
}

export function withStaffAuth(handler: Function) {
  return withAuth(handler, { requiredRole: 'staff' });
}

export function withManagerAuth(handler: Function) {
  return withAuth(handler, { requiredRole: 'manager' });
}

export function withHIPAACompliance(handler: Function, options: any = {}) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // Mock HIPAA compliance checks
    console.log('Mock HIPAA compliance check passed');
    return handler(req, res);
  };
}