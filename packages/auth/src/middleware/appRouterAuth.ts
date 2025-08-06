// API Authentication Middleware for App Router (Next.js 13+)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export interface AuthUser {
  id: string
  email: string
  role: string
  department?: string
  locations?: string[]
  active: boolean
}

export interface AuthMiddlewareOptions {
  roles?: string[]
  permissions?: string[]
  requireHIPAA?: boolean
}

// Create authenticated handler type
export type AuthenticatedHandler = (
  request: NextRequest,
  context: { user: AuthUser; params?: any }
) => Promise<NextResponse> | NextResponse

// Get Supabase client for server-side operations
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing')
  }

  return createClient(supabaseUrl, supabaseKey)
}

// Extract token from request
function extractToken(request: NextRequest): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Check cookies
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get('sb-auth-token')
  if (sessionCookie) {
    return sessionCookie.value
  }

  return null
}

// Base authentication wrapper for App Router
export function withAuth(
  handler: AuthenticatedHandler,
  options?: AuthMiddlewareOptions
) {
  return async (request: NextRequest, context?: any) => {
    try {
      const token = extractToken(request)
      
      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      const supabase = getSupabaseClient()

      // Verify the JWT token
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        )
      }

      // Get full user data
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .eq('is_active', true)
        .single()

      if (userError || !userData) {
        return NextResponse.json(
          { error: 'User not found or inactive' },
          { status: 401 }
        )
      }

      const authUser: AuthUser = {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        department: userData.department,
        locations: userData.locations || [],
        active: userData.is_active
      }

      // Check role authorization if specified
      if (options?.roles && !options.roles.includes(userData.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      // HIPAA compliance logging
      if (options?.requireHIPAA) {
        await supabase.from('audit_logs').insert({
          user_id: userData.id,
          action: 'api_access',
          resource_type: 'protected_endpoint',
          resource_id: request.url,
          metadata: {
            ip_address: request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown',
            user_agent: request.headers.get('user-agent'),
            timestamp: new Date().toISOString()
          }
        })
      }

      // Call the handler with authenticated context
      return await handler(request, { user: authUser, params: context?.params })
      
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Role-specific middleware helpers
export function withStaffAuth(handler: AuthenticatedHandler) {
  return withAuth(handler, { roles: ['staff', 'manager', 'admin', 'superadmin'] })
}

export function withManagerAuth(handler: AuthenticatedHandler) {
  return withAuth(handler, { roles: ['manager', 'admin', 'superadmin'] })
}

export function withAdminAuth(handler: AuthenticatedHandler) {
  return withAuth(handler, { roles: ['admin', 'superadmin'] })
}

export function withSuperAdminAuth(handler: AuthenticatedHandler) {
  return withAuth(handler, { roles: ['superadmin'] })
}

export function withHIPAACompliance(handler: AuthenticatedHandler) {
  return withAuth(handler, { requireHIPAA: true })
}

// Helper to create authenticated API routes
export function createAuthenticatedRoute(
  handlers: {
    GET?: AuthenticatedHandler
    POST?: AuthenticatedHandler
    PUT?: AuthenticatedHandler
    PATCH?: AuthenticatedHandler
    DELETE?: AuthenticatedHandler
  },
  options?: AuthMiddlewareOptions
) {
  const authenticatedHandlers: any = {}

  for (const [method, handler] of Object.entries(handlers)) {
    if (handler) {
      authenticatedHandlers[method] = withAuth(handler, options)
    }
  }

  return authenticatedHandlers
}