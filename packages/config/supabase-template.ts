// packages/config/supabase-template.ts
/**
 * Standardized Supabase Configuration Template for Ganger Platform
 * Provides consistent client setup across all applications
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@ganger/db';
import { getAppConfig, isDevelopment } from './environment';

/**
 * Supabase client configuration options
 */
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
  enableRealtime?: boolean;
  enableAuth?: boolean;
}

/**
 * Creates a standardized Supabase client for the given app
 * @param appName - The name of the application
 * @param useServiceRole - Whether to use service role key (server-side only)
 * @returns Configured Supabase client
 */
export function createSupabaseClient(
  appName: string, 
  useServiceRole: boolean = false
): SupabaseClient<Database> {
  const config = getAppConfig(appName);
  const supabaseConfig = config.supabase;
  
  // Validate required configuration
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    throw new Error(`Missing Supabase configuration for app: ${appName}`);
  }
  
  // Use service role key if requested and available (server-side only)
  const apiKey = useServiceRole && supabaseConfig.serviceRoleKey 
    ? supabaseConfig.serviceRoleKey 
    : supabaseConfig.anonKey;
  
  // Warn if service role was requested but not available
  if (useServiceRole && !supabaseConfig.serviceRoleKey) {
    console.warn(`Service role key requested for ${appName} but not available, using anon key`);
  }
  
  // Client configuration based on environment and app settings
  const clientConfig = {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    realtime: config.features.enableRealtime ? {
      params: {
        eventsPerSecond: isDevelopment() ? 2 : 10,
      },
      heartbeatIntervalMs: 30000,
      reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 10000),
    } : undefined,
    global: {
      headers: {
        'X-Client-App': appName,
        'X-Client-Version': config.version,
        'X-Client-Environment': process.env.NODE_ENV || 'development',
      },
    },
    db: {
      schema: 'public' as const,
    },
  };
  
  return createClient<Database, 'public', any>(supabaseConfig.url, apiKey, clientConfig);
}

/**
 * Creates a client-side Supabase instance
 * Use this for browser-side operations
 */
export function createClientSupabase(appName: string): SupabaseClient<Database> {
  return createSupabaseClient(appName, false);
}

/**
 * Creates a server-side Supabase instance with service role
 * Use this for server-side operations that require elevated permissions
 */
export function createServerSupabase(appName: string): SupabaseClient<Database> {
  return createSupabaseClient(appName, true);
}

/**
 * Default Supabase client factory for apps
 * Automatically determines client vs server based on environment
 */
export function createAppSupabase(appName: string): SupabaseClient<Database> {
  const isServer = typeof window === 'undefined';
  return createSupabaseClient(appName, isServer);
}

/**
 * Supabase connection health check
 */
export async function checkSupabaseHealth(client: SupabaseClient<Database>): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    // Simple query to test connection
    const { data: _data, error } = await client
      .from('health_check')
      .select('id')
      .limit(1)
      .single();
    
    const latency = Date.now() - startTime;
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is fine for health check
      return {
        healthy: false,
        latency,
        error: error.message,
      };
    }
    
    return {
      healthy: true,
      latency,
    };
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Standard error handler for Supabase operations
 */
export function handleSupabaseError(error: any, operation: string = 'operation'): never {
  console.error(`Supabase ${operation} error:`, error);
  
  // Common error patterns
  if (error?.code === 'PGRST116') {
    throw new Error(`${operation}: Record not found`);
  }
  
  if (error?.code === '23505') {
    throw new Error(`${operation}: Duplicate record`);
  }
  
  if (error?.code === '23503') {
    throw new Error(`${operation}: Referenced record does not exist`);
  }
  
  if (error?.code === 'PGRST301') {
    throw new Error(`${operation}: Insufficient permissions`);
  }
  
  // Generic error
  throw new Error(`${operation} failed: ${error?.message || 'Unknown error'}`);
}

/**
 * Standard pattern for Supabase operations with error handling
 */
export async function withSupabaseErrorHandling<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  operationName: string = 'operation'
): Promise<T> {
  const { data, error } = await operation();
  
  if (error) {
    handleSupabaseError(error, operationName);
  }
  
  if (data === null) {
    throw new Error(`${operationName}: No data returned`);
  }
  
  return data;
}

/**
 * Utility to create a Supabase client with retry logic
 * Note: Complex retry logic temporarily simplified for TypeScript compatibility
 */
export function createResilientSupabaseClient(
  appName: string,
  _maxRetries: number = 3
): SupabaseClient<Database> {
  // For now, return standard client to avoid TypeScript complications
  // TODO: Implement proper retry logic with correct types
  return createSupabaseClient(appName);
}

// Export commonly used patterns
export * from '@supabase/supabase-js';
export type { Database } from '@ganger/db';