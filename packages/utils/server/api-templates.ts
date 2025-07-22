import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseClient } from '@ganger/auth/server';
import { captureError } from '@ganger/monitoring/sentry';
import { performanceTracker } from '@ganger/monitoring/performance-tracking';
import { cacheManager } from '@ganger/cache';

export interface ApiConfig<TParams = any, TBody = any> {
  // Authentication
  requireAuth?: boolean;
  allowedRoles?: string[];
  
  // Validation
  paramsSchema?: z.ZodSchema<TParams>;
  bodySchema?: z.ZodSchema<TBody>;
  querySchema?: z.ZodSchema<any>;
  
  // Caching
  cache?: {
    enabled: boolean;
    ttl?: number;
    keyGenerator?: (params: TParams, query?: any) => string;
  };
  
  // Rate limiting
  rateLimit?: {
    requests: number;
    window: number; // in seconds
  };
  
  // Performance
  trackPerformance?: boolean;
  slowThreshold?: number; // in ms
}

export interface ApiContext<TParams = any, TBody = any> {
  params: TParams;
  body: TBody;
  query: Record<string, string | string[]>;
  user: any | null;
  supabase: ReturnType<typeof getSupabaseClient>;
}

export type ApiHandler<TParams = any, TBody = any, TResponse = any> = (
  context: ApiContext<TParams, TBody>
) => Promise<TResponse>;

/**
 * Creates a standardized API route handler with built-in features
 */
export function createApiRoute<TParams = any, TBody = any, TResponse = any>(
  config: ApiConfig<TParams, TBody>,
  handler: ApiHandler<TParams, TBody, TResponse>
) {
  return async (
    req: NextRequest,
    context?: { params: TParams }
  ): Promise<NextResponse> => {
    const startTime = performance.now();
    const routeName = req.url;
    
    try {
      // Track performance
      if (config.trackPerformance !== false) {
        performanceTracker.mark(`api-${routeName}-start`);
      }
      
      // Get Supabase client
      const supabase = getSupabaseClient(req);
      
      // Check authentication
      let user = null;
      if (config.requireAuth) {
        const { data: { user: authUser }, error } = await supabase.auth.getUser();
        
        if (error || !authUser) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }
        
        user = authUser;
        
        // Check role permissions
        if (config.allowedRoles && config.allowedRoles.length > 0) {
          const userRole = user.user_metadata?.role || 'user';
          if (!config.allowedRoles.includes(userRole)) {
            return NextResponse.json(
              { error: 'Forbidden' },
              { status: 403 }
            );
          }
        }
      }
      
      // Parse request data
      const params = context?.params || {} as TParams;
      const query = Object.fromEntries(req.nextUrl.searchParams);
      let body = {} as TBody;
      
      if (req.method !== 'GET' && req.method !== 'DELETE') {
        try {
          body = await req.json();
        } catch {
          // Body might be empty or not JSON
        }
      }
      
      // Validate params
      if (config.paramsSchema) {
        const result = config.paramsSchema.safeParse(params);
        if (!result.success) {
          return NextResponse.json(
            { 
              error: 'Invalid parameters',
              details: result.error.flatten()
            },
            { status: 400 }
          );
        }
        params = result.data;
      }
      
      // Validate query
      if (config.querySchema) {
        const result = config.querySchema.safeParse(query);
        if (!result.success) {
          return NextResponse.json(
            { 
              error: 'Invalid query parameters',
              details: result.error.flatten()
            },
            { status: 400 }
          );
        }
      }
      
      // Validate body
      if (config.bodySchema) {
        const result = config.bodySchema.safeParse(body);
        if (!result.success) {
          return NextResponse.json(
            { 
              error: 'Invalid request body',
              details: result.error.flatten()
            },
            { status: 400 }
          );
        }
        body = result.data;
      }
      
      // Check cache
      if (config.cache?.enabled && req.method === 'GET') {
        const cacheKey = config.cache.keyGenerator
          ? config.cache.keyGenerator(params, query)
          : `api:${routeName}:${JSON.stringify({ params, query })}`;
          
        const cachedData = await cacheManager.get(cacheKey);
        if (cachedData) {
          return NextResponse.json({
            success: true,
            data: cachedData,
            cached: true
          });
        }
      }
      
      // Create context
      const apiContext: ApiContext<TParams, TBody> = {
        params,
        body,
        query,
        user,
        supabase
      };
      
      // Call handler
      const result = await handler(apiContext);
      
      // Cache result if configured
      if (config.cache?.enabled && req.method === 'GET' && result) {
        const cacheKey = config.cache.keyGenerator
          ? config.cache.keyGenerator(params, query)
          : `api:${routeName}:${JSON.stringify({ params, query })}`;
          
        await cacheManager.set(cacheKey, result, {
          ttl: config.cache.ttl || 300 // 5 minutes default
        });
      }
      
      // Track performance
      const duration = performance.now() - startTime;
      if (config.trackPerformance !== false) {
        performanceTracker.measure(`api-${routeName}`, `api-${routeName}-start`);
        
        if (duration > (config.slowThreshold || 3000)) {
          captureError(new Error(`Slow API route: ${routeName}`), {
            duration,
            method: req.method,
            params,
            query
          });
        }
      }
      
      // Add performance headers
      const response = NextResponse.json({
        success: true,
        data: result
      });
      
      response.headers.set('X-Response-Time', `${duration}ms`);
      
      return response;
      
    } catch (error) {
      // Track error
      captureError(error as Error, {
        route: routeName,
        method: req.method,
        params: context?.params,
        query: Object.fromEntries(req.nextUrl.searchParams)
      });
      
      // Return error response
      const message = error instanceof Error ? error.message : 'Internal server error';
      const status = (error as any).status || 500;
      
      return NextResponse.json(
        { 
          success: false,
          error: message 
        },
        { status }
      );
    }
  };
}

/**
 * Creates a CRUD API route set
 */
export function createCrudRoutes<T extends { id: string }>(
  table: string,
  config: {
    schemas?: {
      create?: z.ZodSchema<any>;
      update?: z.ZodSchema<any>;
      query?: z.ZodSchema<any>;
    };
    requireAuth?: boolean;
    cache?: boolean;
    softDelete?: boolean;
  } = {}
) {
  return {
    // GET /api/[table]
    list: createApiRoute(
      {
        requireAuth: config.requireAuth,
        querySchema: config.schemas?.query,
        cache: config.cache ? { enabled: true, ttl: 300 } : undefined
      },
      async ({ supabase, query }) => {
        let queryBuilder = supabase.from(table).select('*');
        
        // Apply filters from query
        if (query.filter) {
          const filters = JSON.parse(query.filter as string);
          Object.entries(filters).forEach(([key, value]) => {
            queryBuilder = queryBuilder.eq(key, value);
          });
        }
        
        // Apply pagination
        const page = parseInt(query.page as string) || 1;
        const limit = parseInt(query.limit as string) || 20;
        const offset = (page - 1) * limit;
        
        queryBuilder = queryBuilder.range(offset, offset + limit - 1);
        
        // Apply sorting
        if (query.sort) {
          const [column, direction] = (query.sort as string).split(':');
          queryBuilder = queryBuilder.order(column, { 
            ascending: direction !== 'desc' 
          });
        }
        
        const { data, error, count } = await queryBuilder;
        
        if (error) throw error;
        
        return {
          items: data || [],
          total: count || 0,
          page,
          limit
        };
      }
    ),
    
    // GET /api/[table]/[id]
    get: createApiRoute(
      {
        requireAuth: config.requireAuth,
        paramsSchema: z.object({ id: z.string() }),
        cache: config.cache ? { enabled: true, ttl: 300 } : undefined
      },
      async ({ supabase, params }) => {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('id', params.id)
          .single();
          
        if (error) {
          if (error.code === 'PGRST116') {
            throw Object.assign(new Error('Not found'), { status: 404 });
          }
          throw error;
        }
        
        return data;
      }
    ),
    
    // POST /api/[table]
    create: createApiRoute(
      {
        requireAuth: config.requireAuth,
        bodySchema: config.schemas?.create
      },
      async ({ supabase, body, user }) => {
        const data = {
          ...body,
          created_by: user?.id,
          created_at: new Date().toISOString()
        };
        
        const { data: created, error } = await supabase
          .from(table)
          .insert(data)
          .select()
          .single();
          
        if (error) throw error;
        
        // Invalidate cache
        if (config.cache) {
          await cacheManager.invalidatePattern(`api:*/api/${table}*`);
        }
        
        return created;
      }
    ),
    
    // PATCH /api/[table]/[id]
    update: createApiRoute(
      {
        requireAuth: config.requireAuth,
        paramsSchema: z.object({ id: z.string() }),
        bodySchema: config.schemas?.update
      },
      async ({ supabase, params, body, user }) => {
        const updates = {
          ...body,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        };
        
        const { data: updated, error } = await supabase
          .from(table)
          .update(updates)
          .eq('id', params.id)
          .select()
          .single();
          
        if (error) throw error;
        
        // Invalidate cache
        if (config.cache) {
          await cacheManager.invalidatePattern(`api:*/api/${table}*`);
        }
        
        return updated;
      }
    ),
    
    // DELETE /api/[table]/[id]
    delete: createApiRoute(
      {
        requireAuth: config.requireAuth,
        paramsSchema: z.object({ id: z.string() })
      },
      async ({ supabase, params, user }) => {
        if (config.softDelete) {
          // Soft delete
          const { error } = await supabase
            .from(table)
            .update({
              deleted_at: new Date().toISOString(),
              deleted_by: user?.id
            })
            .eq('id', params.id);
            
          if (error) throw error;
        } else {
          // Hard delete
          const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', params.id);
            
          if (error) throw error;
        }
        
        // Invalidate cache
        if (config.cache) {
          await cacheManager.invalidatePattern(`api:*/api/${table}*`);
        }
        
        return { success: true };
      }
    )
  };
}