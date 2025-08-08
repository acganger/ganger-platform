/**
 * Simplified Auth Middleware for L10 API Routes
 * Platform compliance: @ganger/auth patterns
 */

import { NextApiRequest, NextApiResponse } from 'next';
// import { createClient } from '@supabase/supabase-js';

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: string;
    email: string;
    role: string;
    department?: string;
    locations?: string[];
    active: boolean;
  };
}

// Standard API response format as required by assignment
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export function createResponse<T>(success: boolean, data?: T, error?: string): APIResponse<T> {
  return {
    success,
    data,
    error,
    timestamp: new Date().toISOString()
  };
}

// Removed unused supabase client

// Simple staff authentication middleware
export function withStaffAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      // Mock user for development - in production this would validate actual auth tokens
      // TODO: Replace with real authentication once @ganger/auth middleware is available
      req.user = {
        id: 'user-id-placeholder',
        email: 'anand@gangerdermatology.com',
        role: 'admin',
        department: 'management',
        locations: ['all'],
        active: true
      };

      await handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json(createResponse(false, null, 'Internal server error'));
    }
  };
}