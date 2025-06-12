import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { z } from 'zod';

// Request validation schemas
const QuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  action: z.string().optional(),
  app_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  search: z.string().optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

// Standard API response interface
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET method allowed'
      }
    });
  }

  try {
    const supabase = createSupabaseServerClient();
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    // Validate query parameters
    const queryResult = QuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY_PARAMS',
          message: 'Invalid query parameters',
          details: queryResult.error.issues
        }
      });
      return;
    }

    const { 
      page, 
      limit, 
      action, 
      app_id, 
      user_id, 
      search, 
      date_from, 
      date_to 
    } = queryResult.data!;

    // Check if user has permission to view audit logs
    const { data: userPermissions, error: permError } = await supabase
      .rpc('get_effective_permissions', { 
        p_user_id: user.id
      });

    if (permError) {
      console.error('Permission check error:', permError);
      res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_CHECK_FAILED',
          message: 'Failed to verify permissions'
        }
      });
    }

    // Require admin permission or superadmin role to view audit logs
    const hasAccess = userPermissions?.some((perm: any) => 
      perm.permission_level === 'admin' || 
      perm.role_name === 'superadmin'
    );

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions to view audit logs'
        }
      });
    }

    // Build query
    let query = supabase
      .from('config_change_audit')
      .select(`
        *,
        users (
          email,
          name
        ),
        platform_applications (
          app_name,
          display_name
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (action) {
      query = query.eq('action', action);
    }

    if (app_id) {
      query = query.eq('app_id', app_id);
    }

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (search) {
      // Search in description and user email
      query = query.or(`description.ilike.%${search}%,users.email.ilike.%${search}%`);
    }

    if (date_from) {
      query = query.gte('created_at', `${date_from}T00:00:00.000Z`);
    }

    if (date_to) {
      query = query.lte('created_at', `${date_to}T23:59:59.999Z`);
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('config_change_audit')
      .select('*', { count: 'exact', head: true });

    // Apply same filters to count query
    if (action) countQuery = countQuery.eq('action', action);
    if (app_id) countQuery = countQuery.eq('app_id', app_id);
    if (user_id) countQuery = countQuery.eq('user_id', user_id);
    if (date_from) countQuery = countQuery.gte('created_at', `${date_from}T00:00:00.000Z`);
    if (date_to) countQuery = countQuery.lte('created_at', `${date_to}T23:59:59.999Z`);

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Count query error:', countError);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch audit log count'
        }
      });
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: auditLogs, error: fetchError } = await query;

    if (fetchError) {
      console.error('Audit logs fetch error:', fetchError);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch audit logs'
        }
      });
    }

    const totalPages = Math.ceil((count || 0) / limit);

    // Sanitize sensitive data for non-superadmin users
    const isSuperAdmin = userPermissions?.some((perm: any) => 
      perm.role_name === 'superadmin'
    );

    const sanitizedLogs = auditLogs?.map(log => {
      if (!isSuperAdmin) {
        // Hide sensitive values from non-superadmin users
        const sanitizedLog = { ...log };
        
        if (sanitizedLog.before_value && typeof sanitizedLog.before_value === 'object') {
          sanitizedLog.before_value = sanitizeSensitiveData(sanitizedLog.before_value);
        }
        
        if (sanitizedLog.after_value && typeof sanitizedLog.after_value === 'object') {
          sanitizedLog.after_value = sanitizeSensitiveData(sanitizedLog.after_value);
        }

        // Sanitize IP addresses for privacy
        if (sanitizedLog.ip_address) {
          sanitizedLog.ip_address = sanitizeIpAddress(sanitizedLog.ip_address);
        }

        return sanitizedLog;
      }
      return log;
    });

    res.status(200).json({
      success: true,
      data: sanitizedLogs,
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages
      }
    });

  } catch (error) {
    console.error('Audit logs API error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch audit logs'
      }
    });
  }
}

// Helper function to sanitize sensitive data
function sanitizeSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = { ...data };
  const sensitiveKeys = [
    'password', 'secret', 'key', 'token', 'api_key', 'private_key',
    'client_secret', 'auth_token', 'access_token', 'refresh_token'
  ];

  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitiveKey => 
      key.toLowerCase().includes(sensitiveKey.toLowerCase())
    )) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeSensitiveData(sanitized[key]);
    }
  }

  return sanitized;
}

// Helper function to sanitize IP addresses for privacy
function sanitizeIpAddress(ip: string): string {
  if (!ip) return '';
  
  // For IPv4, show only first two octets
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.*.* `;
    }
  }
  
  // For IPv6, show only first 2 segments
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}::*`;
    }
  }
  
  return 'Hidden';
}