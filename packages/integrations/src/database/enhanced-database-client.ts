// Enhanced Database Client with Supabase MCP Integration
// Replaces manual database operations with automated MCP workflows

import { createClient, SupabaseClient } from '@supabase/supabase-js';
// Remove problematic import - define interface locally
interface Database {
  // Basic database interface for compatibility
}
import { SupabaseMCPService, SupabaseMCPConfig, MigrationResult } from './supabase-mcp-service';

export interface EnhancedDatabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceKey: string;
  projectRef: string;
  enableMCP: boolean;
  mcpAccessToken?: string;
}

export interface AutoMigrationConfig {
  enabled: boolean;
  schedule?: string; // Cron-like schedule
  notifyOnFailure?: boolean;
  maxRetries?: number;
}

export interface DatabaseOperation {
  operation_id: string;
  type: 'query' | 'mutation' | 'migration' | 'function';
  success: boolean;
  duration_ms: number;
  timestamp: string;
  error?: string;
}

export class EnhancedDatabaseClient {
  private client: SupabaseClient<Database>;
  private adminClient: SupabaseClient<Database>;
  private mcpService: SupabaseMCPService | null = null;
  private config: EnhancedDatabaseConfig;
  private operationHistory: DatabaseOperation[] = [];
  private autoMigrationConfig: AutoMigrationConfig;

  constructor(config: EnhancedDatabaseConfig, autoMigrationConfig: AutoMigrationConfig = { enabled: false }) {
    this.config = config;
    this.autoMigrationConfig = autoMigrationConfig;
    
    // Initialize standard clients
    this.client = createClient<Database>(config.supabaseUrl, config.supabaseAnonKey);
    this.adminClient = createClient<Database>(config.supabaseUrl, config.supabaseServiceKey);
    
    // Initialize MCP service if enabled
    if (config.enableMCP) {
      this.initializeMCPService();
    }
  }

  // ===========================================
  // MCP SERVICE INITIALIZATION
  // ===========================================

  private async initializeMCPService(): Promise<void> {
    try {
      const mcpConfig: SupabaseMCPConfig = {
        url: this.config.supabaseUrl,
        serviceRoleKey: this.config.supabaseServiceKey,
        anonKey: this.config.supabaseAnonKey,
        projectRef: this.config.projectRef,
        accessToken: this.config.mcpAccessToken
      };
      
      this.mcpService = new SupabaseMCPService(mcpConfig);
      
      // Initialize MCP server connection
      const mcpInitialized = await this.mcpService.initializeMCPServer();
      
      if (mcpInitialized) {
        console.log('✅ Enhanced Database Client with MCP initialized');
        
        // Setup auto-migration if enabled
        if (this.autoMigrationConfig.enabled) {
          await this.setupAutoMigration();
        }
        
        // Setup real-time monitoring
        await this.setupRealtimeMonitoring();
        
      } else {
        console.warn('⚠️ MCP initialization failed, falling back to standard client');
        this.mcpService = null;
      }
    } catch (error) {
      console.error('Error initializing MCP service:', error);
      this.mcpService = null;
    }
  }

  // ===========================================
  // ENHANCED QUERY OPERATIONS
  // ===========================================

  /**
   * Execute query with MCP monitoring and optimization
   */
  async executeQuery<T = any>(
    table: string,
    operation: 'select' | 'insert' | 'update' | 'delete',
    queryBuilder: (query: any) => any,
    options: { useAdmin?: boolean; trackOperation?: boolean } = {}
  ): Promise<{ data: T | null; error: any; operation?: DatabaseOperation }> {
    const startTime = Date.now();
    const operationId = `${operation}_${table}_${Date.now()}`;
    
    try {
      const targetClient = options.useAdmin ? this.adminClient : this.client;
      const query = queryBuilder(targetClient.from(table));
      const result = await query;
      
      const duration = Date.now() - startTime;
      const operation: DatabaseOperation = {
        operation_id: operationId,
        type: 'query',
        success: !result.error,
        duration_ms: duration,
        timestamp: new Date().toISOString(),
        error: result.error?.message
      };
      
      if (options.trackOperation !== false) {
        this.operationHistory.push(operation);
        await this.logOperation(operation);
      }
      
      // If MCP is available, trigger optimization analysis for slow queries
      if (this.mcpService && duration > 1000) {
        await this.analyzeSlowQuery(table, operation, duration);
      }
      
      return {
        data: result.data,
        error: result.error,
        operation
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const operation: DatabaseOperation = {
        operation_id: operationId,
        type: 'query',
        success: false,
        duration_ms: duration,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      this.operationHistory.push(operation);
      await this.logOperation(operation);
      
      return {
        data: null,
        error: error,
        operation
      };
    }
  }

  /**
   * Execute stored procedure with MCP monitoring
   */
  async executeFunction(
    functionName: string,
    params: Record<string, any> = {},
    options: { useAdmin?: boolean; trackOperation?: boolean } = {}
  ): Promise<{ data: any; error: any; operation?: DatabaseOperation }> {
    const startTime = Date.now();
    const operationId = `function_${functionName}_${Date.now()}`;
    
    try {
      const targetClient = options.useAdmin ? this.adminClient : this.client;
      const result = await targetClient.rpc(functionName as any, params as any);
      
      const duration = Date.now() - startTime;
      const operation: DatabaseOperation = {
        operation_id: operationId,
        type: 'function',
        success: !result.error,
        duration_ms: duration,
        timestamp: new Date().toISOString(),
        error: result.error?.message
      };
      
      if (options.trackOperation !== false) {
        this.operationHistory.push(operation);
        await this.logOperation(operation);
      }
      
      return {
        data: result.data,
        error: result.error,
        operation
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const operation: DatabaseOperation = {
        operation_id: operationId,
        type: 'function',
        success: false,
        duration_ms: duration,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      this.operationHistory.push(operation);
      await this.logOperation(operation);
      
      return {
        data: null,
        error: error,
        operation
      };
    }
  }

  // ===========================================
  // AUTOMATED MIGRATION MANAGEMENT
  // ===========================================

  /**
   * Setup automatic migration deployment
   */
  private async setupAutoMigration(): Promise<void> {
    if (!this.mcpService) return;
    
    console.log('🔄 Setting up automated migration deployment...');
    
    // In a real implementation, this would setup a scheduled job
    // For now, we'll run pending migrations immediately
    try {
      const results = await this.mcpService.deployPendingMigrations();
      
      if (results.length > 0) {
        console.log(`✅ Auto-deployed ${results.length} migrations`);
        
        // Notify on any failures
        const failed = results.filter(r => !r.success);
        if (failed.length > 0 && this.autoMigrationConfig.notifyOnFailure) {
          await this.notifyMigrationFailures(failed);
        }
      }
    } catch (error) {
      console.error('Auto-migration setup failed:', error);
    }
  }

  /**
   * Run migration with enhanced error handling and rollback
   */
  async runMigrationWithMCP(sql: string, migrationName: string): Promise<MigrationResult> {
    if (!this.mcpService) {
      throw new Error('MCP service not available for migration');
    }
    
    console.log(`🚀 Running migration with MCP: ${migrationName}`);
    
    try {
      // Pre-migration validation
      await this.validateMigration(sql);
      
      // Execute migration via MCP
      const result = await this.mcpService.runMigration(sql, migrationName);
      
      if (result.success) {
        // Post-migration validation
        await this.validatePostMigration(migrationName);
        
        // Update migration tracking
        await this.updateMigrationStatus(migrationName, 'completed');
        
        console.log(`✅ Migration completed successfully: ${migrationName}`);
      } else {
        console.error(`❌ Migration failed: ${migrationName}`, result.error);
        await this.updateMigrationStatus(migrationName, 'failed', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Migration execution error:', error);
      await this.updateMigrationStatus(migrationName, 'failed', error);
      throw error;
    }
  }

  /**
   * Rollback migration with MCP
   */
  async rollbackMigrationWithMCP(migrationId: string): Promise<MigrationResult> {
    if (!this.mcpService) {
      throw new Error('MCP service not available for rollback');
    }
    
    return await this.mcpService.rollbackMigration(migrationId);
  }

  // ===========================================
  // REAL-TIME MONITORING AND OPTIMIZATION
  // ===========================================

  /**
   * Setup real-time database monitoring
   */
  private async setupRealtimeMonitoring(): Promise<void> {
    if (!this.mcpService) return;
    
    console.log('📡 Setting up real-time database monitoring...');
    
    // Monitor critical tables for changes
    const criticalTables = ['users', 'audit_logs', 'patient_consents', 'notifications'];
    
    for (const table of criticalTables) {
      this.mcpService.subscribeToTable(table, '*', (payload) => {
        this.handleTableChange(table, payload);
      });
    }
  }

  /**
   * Handle table change events
   */
  private async handleTableChange(table: string, payload: any): Promise<void> {
    try {
      // Log the change
      await this.logTableChange(table, payload);
      
      // Trigger specific actions based on table and event
      await this.processTableChangeEvent(table, payload);
      
    } catch (error) {
      console.error(`Error handling table change for ${table}:`, error);
    }
  }

  /**
   * Process table change events for business logic
   */
  private async processTableChangeEvent(table: string, payload: any): Promise<void> {
    switch (table) {
      case 'users':
        if (payload.eventType === 'INSERT') {
          console.log(`📝 New user created: ${payload.new.id}`);
          // Could trigger welcome email, setup process, etc.
        }
        break;
        
      case 'patient_consents':
        if (payload.eventType === 'UPDATE') {
          console.log(`🔄 Patient consent updated: ${payload.new.patient_id}`);
          // Could trigger compliance audit, notification updates, etc.
        }
        break;
        
      case 'audit_logs':
        if (payload.eventType === 'INSERT' && payload.new.action === 'failed_login') {
          console.log(`🚨 Security alert: Failed login attempt`);
          // Could trigger security monitoring, rate limiting, etc.
        }
        break;
    }
  }

  // ===========================================
  // PERFORMANCE ANALYSIS AND OPTIMIZATION
  // ===========================================

  /**
   * Analyze slow queries for optimization
   */
  private async analyzeSlowQuery(
    table: string, 
    operation: DatabaseOperation, 
    duration: number
  ): Promise<void> {
    if (!this.mcpService) return;
    
    try {
      console.log(`🐌 Analyzing slow query: ${table} (${duration}ms)`);
      
      // Get database metrics to understand performance context
      const metrics = await this.mcpService.getDatabaseMetrics();
      
      // Log slow query for analysis
      await (this.adminClient
        .from('performance_logs') as any)
        .insert({
          operation_id: operation.operation_id,
          table_name: table,
          duration_ms: duration,
          database_metrics: metrics,
          timestamp: operation.timestamp
        });
      
      // If query is extremely slow (>5s), consider immediate action
      if (duration > 5000) {
        console.warn(`⚠️ Extremely slow query detected: ${table} (${duration}ms)`);
        await this.alertSlowQuery(table, duration, operation);
      }
      
    } catch (error) {
      console.error('Error analyzing slow query:', error);
    }
  }

  /**
   * Get performance insights
   */
  async getPerformanceInsights(timeRange: { start: Date; end: Date }): Promise<{
    total_operations: number;
    avg_duration_ms: number;
    slow_queries: DatabaseOperation[];
    table_performance: Record<string, { count: number; avg_duration: number }>;
    recommendations: string[];
  }> {
    
    // Filter operations by time range
    const operations = this.operationHistory.filter(op => {
      const opTime = new Date(op.timestamp);
      return opTime >= timeRange.start && opTime <= timeRange.end;
    });
    
    // Calculate metrics
    const totalOperations = operations.length;
    const avgDuration = totalOperations > 0 
      ? operations.reduce((sum, op) => sum + op.duration_ms, 0) / totalOperations 
      : 0;
    
    const slowQueries = operations.filter(op => op.duration_ms > 1000);
    
    // Table performance analysis
    const tablePerformance: Record<string, { count: number; avg_duration: number }> = {};
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (slowQueries.length > totalOperations * 0.1) {
      recommendations.push('Consider adding database indexes for frequently queried columns');
    }
    
    if (avgDuration > 500) {
      recommendations.push('Overall query performance is below optimal - review query patterns');
    }
    
    return {
      total_operations: totalOperations,
      avg_duration_ms: avgDuration,
      slow_queries: slowQueries,
      table_performance: tablePerformance,
      recommendations
    };
  }

  // ===========================================
  // HEALTH CHECK AND DIAGNOSTICS
  // ===========================================

  /**
   * Comprehensive database health check
   */
  async healthCheck(): Promise<{
    database_connection: boolean;
    admin_access: boolean;
    mcp_service: boolean;
    performance_status: 'excellent' | 'good' | 'poor' | 'critical';
    recent_errors: number;
    recommendations: string[];
  }> {
    try {
      // Basic connectivity
      const { error: dbError } = await this.client
        .from('profiles')
        .select('id')
        .limit(1);
      
      const { error: adminError } = await this.adminClient
        .from('audit_logs')
        .select('id')
        .limit(1);
      
      // MCP service health
      const mcpHealthy = this.mcpService 
        ? (await this.mcpService.healthCheck()).overall_healthy 
        : false;
      
      // Performance analysis
      const recentOps = this.operationHistory.slice(-100);
      const avgDuration = recentOps.length > 0 
        ? recentOps.reduce((sum, op) => sum + op.duration_ms, 0) / recentOps.length 
        : 0;
      
      const recentErrors = recentOps.filter(op => !op.success).length;
      
      let performanceStatus: 'excellent' | 'good' | 'poor' | 'critical';
      if (avgDuration < 100) performanceStatus = 'excellent';
      else if (avgDuration < 500) performanceStatus = 'good';
      else if (avgDuration < 1000) performanceStatus = 'poor';
      else performanceStatus = 'critical';
      
      const recommendations: string[] = [];
      if (!mcpHealthy) recommendations.push('Enable MCP service for enhanced automation');
      if (recentErrors > 5) recommendations.push('High error rate detected - review recent operations');
      if (performanceStatus === 'poor' || performanceStatus === 'critical') {
        recommendations.push('Database performance needs optimization');
      }
      
      return {
        database_connection: !dbError,
        admin_access: !adminError,
        mcp_service: mcpHealthy,
        performance_status: performanceStatus,
        recent_errors: recentErrors,
        recommendations
      };
    } catch (error) {
      return {
        database_connection: false,
        admin_access: false,
        mcp_service: false,
        performance_status: 'critical',
        recent_errors: 0,
        recommendations: ['Database connection failed - check configuration']
      };
    }
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  /**
   * Get standard clients for backward compatibility
   */
  getClient(): SupabaseClient<Database> {
    return this.client;
  }

  getAdminClient(): SupabaseClient<Database> {
    return this.adminClient;
  }

  getMCPService(): SupabaseMCPService | null {
    return this.mcpService;
  }

  /**
   * Get operation history
   */
  getOperationHistory(limit?: number): DatabaseOperation[] {
    return limit ? this.operationHistory.slice(-limit) : this.operationHistory;
  }

  // ===========================================
  // PRIVATE HELPER METHODS
  // ===========================================

  private async logOperation(operation: DatabaseOperation): Promise<void> {
    try {
      await (this.adminClient
        .from('performance_logs') as any)
        .insert({
          operation_id: operation.operation_id,
          operation_type: operation.type,
          success: operation.success,
          duration_ms: operation.duration_ms,
          error: operation.error,
          timestamp: operation.timestamp
        });
    } catch (error) {
      // Silent fail for logging
    }
  }

  private async logTableChange(table: string, payload: any): Promise<void> {
    try {
      await (this.adminClient
        .from('audit_logs') as any)
        .insert({
          action: 'table_change',
          resource_type: 'table',
          resource_id: table,
          user_id: 'system_realtime',
          details: {
            event_type: payload.eventType,
            table: table,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        });
    } catch (error) {
      // Silent fail for logging
    }
  }

  private async validateMigration(sql: string): Promise<void> {
    // Basic SQL validation
    if (!sql.trim()) {
      throw new Error('Migration SQL cannot be empty');
    }
    
    // Check for dangerous operations
    const dangerousPatterns = ['DROP TABLE', 'DELETE FROM', 'TRUNCATE'];
    const upperSQL = sql.toUpperCase();
    
    for (const pattern of dangerousPatterns) {
      if (upperSQL.includes(pattern)) {
        console.warn(`⚠️ Potentially dangerous migration operation detected: ${pattern}`);
      }
    }
  }

  private async validatePostMigration(migrationName: string): Promise<void> {
    // Basic post-migration checks
    try {
      const metrics = await this.mcpService?.getDatabaseMetrics();
      if (metrics?.health_status === 'critical') {
        throw new Error('Database health is critical after migration');
      }
    } catch (error) {
      console.warn('Post-migration validation warning:', error);
    }
  }

  private async updateMigrationStatus(
    migrationName: string, 
    status: 'completed' | 'failed', 
    error?: any
  ): Promise<void> {
    try {
      await (this.adminClient
        .from('schema_migrations') as any)
        .upsert({
          name: migrationName,
          applied: status === 'completed',
          applied_at: status === 'completed' ? new Date().toISOString() : null,
          error: error ? (error.message || String(error)) : null
        });
    } catch (logError) {
      console.error('Failed to update migration status:', logError);
    }
  }

  private async notifyMigrationFailures(failures: MigrationResult[]): Promise<void> {
    console.error(`❌ ${failures.length} migrations failed:`, failures);
    // In real implementation, this would send notifications via Slack, email, etc.
  }

  private async alertSlowQuery(table: string, duration: number, operation: DatabaseOperation): Promise<void> {
    console.warn(`🚨 SLOW QUERY ALERT: ${table} took ${duration}ms`);
    // In real implementation, this would trigger monitoring alerts
  }
}