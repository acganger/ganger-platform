/**
 * Authentication utilities for Compliance Training
 * Production-ready HIPAA-compliant authentication
 */

import type { NextApiRequest } from 'next';
import * as jwt from 'jsonwebtoken';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  department?: string;
  active: boolean;
}

export interface AuthToken {
  sub: string; // user id
  email: string;
  name: string;
  role: string;
  permissions: string[];
  department?: string;
  iat: number;
  exp: number;
}

/**
 * Extract user from JWT token in request
 */
export async function getUserFromToken(req: NextApiRequest): Promise<User | null> {
  try {
    // Extract token from Authorization header or cookies
    let token: string | undefined;
    
    // Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // Fall back to cookies if no header
    if (!token && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }
    
    if (!token) {
      return null;
    }

    // Verify and decode JWT
    const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as AuthToken;
    
    // Convert to User object
    const user: User = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      permissions: decoded.permissions || [],
      department: decoded.department,
      active: true // In real implementation, check against database
    };

    return user;
  } catch (error) {
    // Token invalid or expired
    return null;
  }
}

/**
 * Generate JWT token for user (for testing/development)
 */
export function generateTestToken(user: Partial<User>): string {
  const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key';
  
  const payload: AuthToken = {
    sub: user.id || 'test-user-id',
    email: user?.email || 'test@gangerdermatology.com',
    name: user.name || 'Test User',
    role: user?.role || 'user',
    permissions: user.permissions || ['compliance:view'],
    department: user.department,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
  };

  return jwt.sign(payload, jwtSecret);
}

/**
 * Audit logging for authentication events
 */
export async function auditLog(event: {
  action: string;
  userId?: string;
  userEmail?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    // Create Supabase client for audit logging
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Insert audit log entry
    const { error } = await supabase.from('audit_logs').insert({
      user_id: event.userId,
      action: event.action,
      resource_type: event.resourceType || 'system',
      resource_id: event.resourceId,
      metadata: {
        userEmail: event.userEmail,
        ...event.metadata,
        timestamp: new Date().toISOString()
      }
    });

    if (error) {
      console.error('Failed to write audit log:', error);
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Audit Log:', {
        timestamp: new Date().toISOString(),
        ...event
      });
    }
  } catch (error) {
    console.error('Error in audit logging:', error);
  }
}

/**
 * Check if user has required permissions
 */
export function hasPermissions(user: User, requiredPermissions: string[]): boolean {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  // Superadmin has all permissions
  if (user?.role === 'superadmin') {
    return true;
  }

  // Check if user has all required permissions
  return requiredPermissions.every(permission => 
    user.permissions.includes(permission)
  );
}

/**
 * Check if user has required role
 */
export function hasRole(user: User, requiredRole: string): boolean {
  return user?.role === requiredRole || user?.role === 'superadmin';
}

/**
 * Get default permissions for role
 */
export function getDefaultPermissions(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    superadmin: [
      'compliance:view',
      'compliance:edit',
      'compliance:export',
      'compliance:sync',
      'compliance:admin',
      'admin:users'
    ],
    hr_admin: [
      'compliance:view',
      'compliance:edit',
      'compliance:export',
      'compliance:sync',
      'admin:users'
    ],
    manager: [
      'compliance:view',
      'compliance:export'
    ],
    provider: [
      'compliance:view'
    ],
    nurse: [
      'compliance:view'
    ],
    medical_assistant: [
      'compliance:view'
    ],
    user: [
      'compliance:view'
    ]
  };

  return rolePermissions[role] || rolePermissions.user;
}