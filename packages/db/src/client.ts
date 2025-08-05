import { createClient } from '@supabase/supabase-js';

// Lazy-loaded clients to avoid build-time issues
let _supabaseClient: any = null;
let _supabaseAdminClient: any = null;

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function getSupabaseKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

function getSupabaseServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

// Client for browser/client-side operations
export function getSupabaseClient() {
  if (_supabaseClient) {
    return _supabaseClient;
  }

  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseKey();

  if (!supabaseUrl || !supabaseKey) {
    // Return mock client for build-time
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'Not available during build' } }),
            limit: () => Promise.resolve({ data: [], error: null })
          }),
          limit: () => Promise.resolve({ data: [], error: null }),
          order: () => Promise.resolve({ data: [], error: null })
        }),
        insert: () => Promise.resolve({ data: null, error: { message: 'Not available during build' } }),
        update: () => ({
          eq: () => Promise.resolve({ data: null, error: { message: 'Not available during build' } })
        }),
        delete: () => ({
          eq: () => Promise.resolve({ data: null, error: { message: 'Not available during build' } })
        })
      }),
      rpc: () => Promise.resolve({ data: null, error: { message: 'Not available during build' } })
    } as any;
  }

  _supabaseClient = createClient(supabaseUrl, supabaseKey);
  return _supabaseClient;
}

// Admin client for server-side operations with elevated permissions
export function getSupabaseAdminClient() {
  if (_supabaseAdminClient) {
    return _supabaseAdminClient;
  }

  const supabaseUrl = getSupabaseUrl();
  const supabaseServiceKey = getSupabaseServiceKey();

  if (!supabaseUrl || !supabaseServiceKey) {
    // Return mock client for build-time
    return {
      auth: {
        admin: {
          createUser: () => Promise.resolve({ data: null, error: { message: 'Not available during build' } }),
          updateUserById: () => Promise.resolve({ data: null, error: { message: 'Not available during build' } }),
          deleteUser: () => Promise.resolve({ data: null, error: { message: 'Not available during build' } }),
        }
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'Not available during build' } }),
            limit: () => Promise.resolve({ data: [], error: null })
          }),
          limit: () => Promise.resolve({ data: [], error: null }),
          order: () => Promise.resolve({ data: [], error: null })
        }),
        insert: () => Promise.resolve({ data: null, error: { message: 'Not available during build' } }),
        update: () => ({
          eq: () => Promise.resolve({ data: null, error: { message: 'Not available during build' } })
        }),
        delete: () => ({
          eq: () => Promise.resolve({ data: null, error: { message: 'Not available during build' } })
        })
      }),
      rpc: () => Promise.resolve({ data: null, error: { message: 'Not available during build' } })
    } as any;
  }

  _supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey);
  return _supabaseAdminClient;
}

// Export getters for backward compatibility
export const supabase = new Proxy({} as any, {
  get(_target, prop) {
    return getSupabaseClient()[prop];
  }
});

export const supabaseAdmin = new Proxy({} as any, {
  get(_target, prop) {
    return getSupabaseAdminClient()[prop];
  }
});

// Database configuration
export const dbConfig = {
  maxConnections: 10,
  connectionTimeout: 30000,
  queryTimeout: 60000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// Connection monitoring state
interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  totalQueries: number;
  slowQueries: number;
  failedQueries: number;
  averageQueryTime: number;
  lastHealthCheck: Date;
  connectionErrors: number;
}

class ConnectionMonitor {
  private metrics: ConnectionMetrics;
  private queryTimes: number[] = [];
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      totalQueries: 0,
      slowQueries: 0,
      failedQueries: 0,
      averageQueryTime: 0,
      lastHealthCheck: new Date(),
      connectionErrors: 0
    };
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🔍 Database connection monitoring started');
    
    // Monitor every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      await this.updateMetrics();
    }, 30000);
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    console.log('🛑 Database connection monitoring stopped');
  }

  async updateMetrics() {
    try {
      // Get database connection stats
      const { data: dbStats, error } = await supabaseAdmin
        .rpc('get_database_stats');

      if (error) {
        this.metrics.connectionErrors++;
        console.warn('Failed to get database stats:', error);
        return;
      }

      if (dbStats) {
        this.metrics.totalConnections = dbStats.numbackends || 0;
        this.metrics.lastHealthCheck = new Date();
      }

      // Check for connection pool exhaustion
      if (this.metrics.totalConnections > dbConfig.maxConnections * 0.8) {
        await this.alertConnectionPoolHigh();
      }

    } catch (error) {
      this.metrics.connectionErrors++;
      console.error('Connection monitoring error:', error);
    }
  }

  trackQuery(queryTime: number, failed: boolean = false) {
    this.metrics.totalQueries++;
    
    if (failed) {
      this.metrics.failedQueries++;
      return;
    }

    this.queryTimes.push(queryTime);
    
    // Keep only last 100 query times for rolling average
    if (this.queryTimes.length > 100) {
      this.queryTimes = this.queryTimes.slice(-100);
    }
    
    this.metrics.averageQueryTime = 
      this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length;

    // Track slow queries (> 1000ms)
    if (queryTime > 1000) {
      this.metrics.slowQueries++;
      console.warn(`🐌 Slow query detected: ${queryTime}ms`);
    }
  }

  async alertConnectionPoolHigh() {
    const utilizationPercent = Math.round(
      (this.metrics.totalConnections / dbConfig.maxConnections) * 100
    );
    
    console.warn(
      `⚠️ High connection pool utilization: ${utilizationPercent}% ` +
      `(${this.metrics.totalConnections}/${dbConfig.maxConnections})`
    );
    
    // In production, this would send alerts to Slack or monitoring system
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 Database Connection Alert: ${utilizationPercent}% pool utilization in ${process.env.NODE_ENV || 'development'}`
          })
        });
      } catch (error) {
        console.error('Failed to send connection alert:', error);
      }
    }
  }

  getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  async healthCheck(): Promise<{
    healthy: boolean;
    metrics: ConnectionMetrics;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    
    // Check connection pool utilization
    const utilization = this.metrics.totalConnections / dbConfig.maxConnections;
    if (utilization > 0.8) {
      warnings.push(`High connection pool utilization: ${Math.round(utilization * 100)}%`);
    }
    
    // Check query performance
    if (this.metrics.averageQueryTime > 500) {
      warnings.push(`High average query time: ${Math.round(this.metrics.averageQueryTime)}ms`);
    }
    
    // Check error rate
    const errorRate = this.metrics.failedQueries / this.metrics.totalQueries;
    if (errorRate > 0.05) {
      warnings.push(`High query error rate: ${Math.round(errorRate * 100)}%`);
    }
    
    // Test basic connectivity
    const isHealthy = await checkDatabaseHealth();
    
    return {
      healthy: isHealthy && warnings.length === 0,
      metrics: this.getMetrics(),
      warnings
    };
  }
}

// Global connection monitor instance
export const connectionMonitor = new ConnectionMonitor();

// Enhanced query wrapper with monitoring
export async function monitoredQuery<T>(
  queryFn: () => Promise<T>,
  queryName?: string
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await queryFn();
    const queryTime = Date.now() - startTime;
    
    connectionMonitor.trackQuery(queryTime, false);
    
    if (queryName && queryTime > 100) {
      console.log(`Query "${queryName}" took ${queryTime}ms`);
    }
    
    return result;
  } catch (error) {
    const queryTime = Date.now() - startTime;
    connectionMonitor.trackQuery(queryTime, true);
    
    console.error(`Query ${queryName || 'unknown'} failed after ${queryTime}ms:`, error);
    throw error;
  }
}

// Simple query wrapper without caching (for monorepo stability)
export async function cachedQuery<T>(
  queryFn: () => Promise<T>,
  _cacheKey: string,
  options: {
    ttl?: number;
    queryName?: string;
    skipCache?: boolean;
  } = {}
): Promise<T> {
  const { queryName } = options;
  
  // For now, just execute the query with monitoring (cache can be added later)
  return await monitoredQuery(queryFn, queryName);
}

// Patient data queries with caching
export async function getPatientCached(patientId: string) {
  return cachedQuery(
    async () => {
      const { data, error } = await supabaseAdmin
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();
      
      if (error) throw error;
      return data;
    },
    `patient:${patientId}`,
    { ttl: 1800, queryName: 'getPatient' }
  );
}

// Location data queries with caching
export async function getLocationCached(locationId: string) {
  return cachedQuery(
    async () => {
      const { data, error } = await supabaseAdmin
        .from('locations')
        .select('*')
        .eq('id', locationId)
        .single();
      
      if (error) throw error;
      return data;
    },
    `location:${locationId}`,
    { ttl: 3600, queryName: 'getLocation' }
  );
}

// Medication list with caching
export async function getMedicationListCached() {
  return cachedQuery(
    async () => {
      const { data, error } = await supabaseAdmin
        .from('medications')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    'medications:list',
    { ttl: 3600, queryName: 'getMedicationList' }
  );
}

// Insurance providers with caching
export async function getInsuranceProvidersCached() {
  return cachedQuery(
    async () => {
      const { data, error } = await supabaseAdmin
        .from('insurance_providers')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    'insurance:providers',
    { ttl: 7200, queryName: 'getInsuranceProviders' }
  );
}

// Inventory by location with caching
export async function getInventoryByLocationCached(locationId: string) {
  return cachedQuery(
    async () => {
      const { data, error } = await supabaseAdmin
        .from('inventory_items')
        .select('*')
        .eq('location_id', locationId)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    `inventory:location:${locationId}`,
    { ttl: 900, queryName: 'getInventoryByLocation' }
  );
}

// User permissions with caching
export async function getUserPermissionsCached(userId: string) {
  return cachedQuery(
    async () => {
      const { data, error } = await supabaseAdmin
        .from('user_permissions')
        .select('permission, resource')
        .eq('user_id', userId)
        .eq('active', true);
      
      if (error) throw error;
      return data;
    },
    `permissions:user:${userId}`,
    { ttl: 3600, queryName: 'getUserPermissions' }
  );
}

// Patient medications with caching
export async function getPatientMedicationsCached(patientId: string) {
  return cachedQuery(
    async () => {
      const { data, error } = await supabaseAdmin
        .from('patient_medications')
        .select(`
          *,
          medication:medications(*)
        `)
        .eq('patient_id', patientId)
        .eq('active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    `medications:patient:${patientId}`,
    { ttl: 1800, queryName: 'getPatientMedications' }
  );
}

// Update operations with cache invalidation
export async function updatePatientWithCacheInvalidation(patientId: string, updates: any) {
  const result = await monitoredQuery(
    async () => {
      const { data, error } = await supabaseAdmin
        .from('patients')
        .update(updates)
        .eq('id', patientId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    'updatePatient'
  );
  
  // TODO: Add cache invalidation when @ganger/cache is implemented
  
  return result;
}

// Location update with cache invalidation
export async function updateLocationWithCacheInvalidation(locationId: string, updates: any) {
  const result = await monitoredQuery(
    async () => {
      const { data, error } = await supabaseAdmin
        .from('locations')
        .update(updates)
        .eq('id', locationId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    'updateLocation'
  );
  
  // TODO: Add cache invalidation when @ganger/cache is implemented
  
  return result;
}

// Inventory update with cache invalidation
export async function updateInventoryWithCacheInvalidation(itemId: string, updates: any, _locationId?: string) {
  const result = await monitoredQuery(
    async () => {
      const { data, error } = await supabaseAdmin
        .from('inventory_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    'updateInventoryItem'
  );
  
  // TODO: Add cache invalidation when @ganger/cache is implemented
  
  return result;
}

// Connection health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    return !error;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Start monitoring when module loads in server environment
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  connectionMonitor.startMonitoring();
}