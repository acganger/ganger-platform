// Enhanced Communication Hub with Supabase MCP Integration
// Real-time communication monitoring and automated database operations

import { PatientCommunicationHub } from './communication-hub';
import { EnhancedDatabaseClient } from '../database/enhanced-database-client';
import { 
  CommunicationConfig, 
  SMSDeliveryResult,
  HandoutDeliveryMessage,
  AppointmentReminderMessage,
} from './types';

export interface CommunicationAnalytics {
  total_messages_sent: number;
  success_rate: number;
  delivery_rate: number;
  consent_compliance_rate: number;
  average_delivery_time_ms: number;
  messages_by_type: Record<string, number>;
  messages_by_status: Record<string, number>;
  top_failure_reasons: Array<{ reason: string; count: number }>;
  patient_engagement_metrics: {
    unique_patients_contacted: number;
    repeat_communications: number;
    consent_updates: number;
  };
}

export interface RealTimeCommunicationEvent {
  event_id: string;
  event_type: 'message_sent' | 'message_delivered' | 'message_failed' | 'consent_updated' | 'bulk_operation_completed';
  timestamp: string;
  patient_id?: string;
  staff_id?: string;
  message_type?: string;
  success?: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export class EnhancedCommunicationHub extends PatientCommunicationHub {
  private dbClient: EnhancedDatabaseClient;
  private realtimeSubscriptions: string[] = [];
  private eventHandlers: Map<string, (event: RealTimeCommunicationEvent) => void> = new Map();

  constructor(
    config: CommunicationConfig,
    supabaseUrl: string,
    supabaseKey: string,
    mcpEnabled: boolean = true
  ) {
    super(config, supabaseUrl, supabaseKey);
    
    // Initialize enhanced database client with MCP
    this.dbClient = new EnhancedDatabaseClient({
      supabaseUrl,
      supabaseAnonKey: supabaseKey,
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      projectRef: 'pfqtzmxxxhhsxmlddrta',
      enableMCP: mcpEnabled,
      mcpAccessToken: process.env.SUPABASE_ACCESS_TOKEN
    }, {
      enabled: true,
      notifyOnFailure: true,
      maxRetries: 3
    });

    if (mcpEnabled) {
      this.initializeRealtimeMonitoring();
    }
  }

  // ===========================================
  // REAL-TIME MONITORING SETUP
  // ===========================================

  /**
   * Initialize real-time monitoring with Supabase MCP
   */
  private async initializeRealtimeMonitoring(): Promise<void> {
    try {
      const mcpService = this.dbClient.getMCPService();
      if (!mcpService) {
        console.warn('MCP service not available for real-time monitoring');
        return;
      }

      // Monitor communication logs
      const commLogsSub = mcpService.subscribeToTable('communication_logs', '*', (payload) => {
        this.handleCommunicationLogEvent(payload);
      });
      
      // Monitor consent changes
      const consentSub = mcpService.subscribeToTable('patient_communication_consent', '*', (payload) => {
        this.handleConsentChangeEvent(payload);
      });
      
      // Monitor patient contact updates
      const contactSub = mcpService.subscribeToTable('patient_contacts', '*', (payload) => {
        this.handleContactUpdateEvent(payload);
      });

      this.realtimeSubscriptions.push(commLogsSub, consentSub, contactSub);
      
      console.log('✅ Enhanced Communication Hub real-time monitoring initialized');
    } catch (error) {
      console.error('Failed to initialize real-time monitoring:', error);
    }
  }

  // ===========================================
  // ENHANCED COMMUNICATION METHODS
  // ===========================================

  /**
   * Send handout delivery with enhanced tracking
   */
  async sendHandoutDeliveryEnhanced(message: HandoutDeliveryMessage): Promise<SMSDeliveryResult> {
    const startTime = Date.now();
    
    try {
      // Execute the communication with database tracking
      const result = await this.dbClient.executeQuery(
        'communication_logs',
        'insert',
        (query) => query.insert({
          patient_id: message.patient_id,
          message_type: 'handout_delivery',
          channel: 'sms',
          status: 'pending',
          initiated_at: new Date().toISOString(),
          metadata: {
            handout_title: message.handout_title,
            handout_url: message.handout_url,
            provider_name: message.provider_name
          }
        }).select().single(),
        { trackOperation: true }
      );

      if (result.error) {
        throw new Error(`Failed to log communication: ${result.error.message}`);
      }

      const communicationLogId = result.data?.id;

      // Send the actual message
      const deliveryResult = await super.sendHandoutDelivery(message);
      
      // Update the log with result
      await this.dbClient.executeQuery(
        'communication_logs',
        'update',
        (query) => query
          .update({
            status: deliveryResult.success ? 'delivered' : 'failed',
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
            error_message: deliveryResult.error || null,
            external_id: deliveryResult.message_id || null
          })
          .eq('id', communicationLogId),
        { trackOperation: true }
      );

      // Emit real-time event
      this.emitEvent({
        event_id: `handout_${Date.now()}`,
        event_type: deliveryResult.success ? 'message_delivered' : 'message_failed',
        timestamp: new Date().toISOString(),
        patient_id: message.patient_id,
        message_type: 'handout_delivery',
        success: deliveryResult.success,
        error: deliveryResult.error,
        metadata: {
          handout_title: message.handout_title,
          duration_ms: Date.now() - startTime
        }
      });

      return deliveryResult;
    } catch (error) {
      console.error('Enhanced handout delivery failed:', error);
      
      // Emit failure event
      this.emitEvent({
        event_id: `handout_error_${Date.now()}`,
        event_type: 'message_failed',
        timestamp: new Date().toISOString(),
        patient_id: message.patient_id,
        message_type: 'handout_delivery',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Enhanced delivery failed',
        status: 'failed',
        timestamp: new Date()
      };
    }
  }

  /**
   * Send bulk appointment reminders with enhanced tracking
   */
  async sendBulkAppointmentRemindersEnhanced(messages: AppointmentReminderMessage[]): Promise<{
    successful: number;
    failed: number;
    results: Array<{ patient_id: string; success: boolean; error?: string }>;
    analytics: {
      total_processed: number;
      processing_time_ms: number;
      average_time_per_message: number;
    };
  }> {
    const startTime = Date.now();
    
    try {
      // Log bulk operation start
      const { data: bulkLog } = await this.dbClient.executeQuery(
        'bulk_communication_logs',
        'insert',
        (query) => query.insert({
          operation_type: 'bulk_appointment_reminders',
          total_count: messages.length,
          status: 'processing',
          initiated_at: new Date().toISOString(),
          metadata: {
            message_types: ['appointment_reminder'],
            patient_count: messages.length
          }
        }).select().single(),
        { trackOperation: true }
      );

      const bulkLogId = bulkLog?.id;

      // Execute bulk send with original method
      const bulkResult = await super.sendBulkAppointmentReminders(messages);
      
      const processingTime = Date.now() - startTime;
      
      // Update bulk operation log
      await this.dbClient.executeQuery(
        'bulk_communication_logs',
        'update',
        (query) => query
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            processing_time_ms: processingTime,
            successful_count: bulkResult.successful,
            failed_count: bulkResult.failed
          })
          .eq('id', bulkLogId),
        { trackOperation: true }
      );

      // Emit bulk completion event
      this.emitEvent({
        event_id: `bulk_reminders_${Date.now()}`,
        event_type: 'bulk_operation_completed',
        timestamp: new Date().toISOString(),
        message_type: 'appointment_reminder',
        success: bulkResult.successful > 0,
        metadata: {
          total_messages: messages.length,
          successful: bulkResult.successful,
          failed: bulkResult.failed,
          processing_time_ms: processingTime
        }
      });

      return {
        ...bulkResult,
        analytics: {
          total_processed: messages.length,
          processing_time_ms: processingTime,
          average_time_per_message: processingTime / messages.length
        }
      };
    } catch (error) {
      console.error('Enhanced bulk appointment reminders failed:', error);
      throw error;
    }
  }

  // ===========================================
  // COMMUNICATION ANALYTICS WITH MCP
  // ===========================================

  /**
   * Get comprehensive communication analytics
   */
  async getCommunicationAnalyticsEnhanced(
    timeRange: { start: Date; end: Date }
  ): Promise<CommunicationAnalytics> {
    try {
      // Use enhanced database client for complex analytics queries
      const { data: messageStats } = await this.dbClient.executeQuery(
        'communication_logs',
        'select',
        (query) => query
          .select('*')
          .gte('initiated_at', timeRange.start.toISOString())
          .lte('initiated_at', timeRange.end.toISOString()),
        { trackOperation: true }
      );

      const { data: consentStats } = await this.dbClient.executeQuery(
        'patient_communication_consent',
        'select',
        (query) => query
          .select('*')
          .gte('created_at', timeRange.start.toISOString())
          .lte('created_at', timeRange.end.toISOString()),
        { trackOperation: true }
      );

      // Calculate analytics
      const totalMessages = messageStats?.length || 0;
      const successfulMessages = messageStats?.filter((m: any) => m.status === 'delivered').length || 0;
      const failedMessages = messageStats?.filter((m: any) => m.status === 'failed').length || 0;
      
      const successRate = totalMessages > 0 ? (successfulMessages / totalMessages) * 100 : 0;
      const deliveryRate = totalMessages > 0 ? ((totalMessages - failedMessages) / totalMessages) * 100 : 0;
      
      // Calculate consent compliance
      const consentGranted = consentStats?.filter((c: any) => c.consented === true).length || 0;
      const totalConsentRecords = consentStats?.length || 0;
      const consentComplianceRate = totalConsentRecords > 0 ? (consentGranted / totalConsentRecords) * 100 : 100;

      // Calculate average delivery time
      const deliveredMessages = messageStats?.filter((m: any) => m.status === 'delivered' && m.duration_ms) || [];
      const avgDeliveryTime = deliveredMessages.length > 0 
        ? deliveredMessages.reduce((sum: number, m: any) => sum + m.duration_ms, 0) / deliveredMessages.length 
        : 0;

      // Group by message type
      const messagesByType: Record<string, number> = {};
      const messagesByStatus: Record<string, number> = {};
      const failureReasons: Record<string, number> = {};

      messageStats?.forEach((msg: any) => {
        messagesByType[msg.message_type] = (messagesByType[msg.message_type] || 0) + 1;
        messagesByStatus[msg.status] = (messagesByStatus[msg.status] || 0) + 1;
        
        if (msg.error_message) {
          failureReasons[msg.error_message] = (failureReasons[msg.error_message] || 0) + 1;
        }
      });

      // Top failure reasons
      const topFailureReasons = Object.entries(failureReasons)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Patient engagement metrics
      const uniquePatients = new Set(messageStats?.map((m: any) => m.patient_id)).size;
      const repeatCommunications = messageStats?.filter((m: any) => {
        const patientMessages = messageStats.filter((msg: any) => msg.patient_id === m.patient_id);
        return patientMessages.length > 1;
      }).length || 0;

      return {
        total_messages_sent: totalMessages,
        success_rate: successRate,
        delivery_rate: deliveryRate,
        consent_compliance_rate: consentComplianceRate,
        average_delivery_time_ms: avgDeliveryTime,
        messages_by_type: messagesByType,
        messages_by_status: messagesByStatus,
        top_failure_reasons: topFailureReasons,
        patient_engagement_metrics: {
          unique_patients_contacted: uniquePatients,
          repeat_communications: repeatCommunications,
          consent_updates: consentStats?.length || 0
        }
      };
    } catch (error) {
      console.error('Failed to get communication analytics:', error);
      throw error;
    }
  }

  // ===========================================
  // REAL-TIME EVENT HANDLING
  // ===========================================

  /**
   * Handle communication log events
   */
  private handleCommunicationLogEvent(payload: any): void {
    const event: RealTimeCommunicationEvent = {
      event_id: `comm_${payload.new?.id || Date.now()}`,
      event_type: payload.eventType === 'INSERT' ? 'message_sent' : 
                  payload.new?.status === 'delivered' ? 'message_delivered' : 'message_failed',
      timestamp: new Date().toISOString(),
      patient_id: payload.new?.patient_id,
      message_type: payload.new?.message_type,
      success: payload.new?.status === 'delivered',
      error: payload.new?.error_message,
      metadata: payload.new?.metadata
    };

    this.emitEvent(event);
  }

  /**
   * Handle consent change events
   */
  private handleConsentChangeEvent(payload: any): void {
    const event: RealTimeCommunicationEvent = {
      event_id: `consent_${payload.new?.id || Date.now()}`,
      event_type: 'consent_updated',
      timestamp: new Date().toISOString(),
      patient_id: payload.new?.patient_id,
      success: true,
      metadata: {
        consent_type: payload.new?.consent_type,
        consented: payload.new?.consented,
        consent_method: payload.new?.consent_method
      }
    };

    this.emitEvent(event);
  }

  /**
   * Handle contact update events
   */
  private handleContactUpdateEvent(payload: any): void {
    console.log(`📞 Patient contact updated: ${payload.new?.patient_id}`);
    // Additional contact update handling could go here
  }

  /**
   * Emit real-time event to registered handlers
   */
  private emitEvent(event: RealTimeCommunicationEvent): void {
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Event handler error:', error);
      }
    });
  }

  /**
   * Register event handler for real-time events
   */
  onCommunicationEvent(
    handlerId: string, 
    handler: (event: RealTimeCommunicationEvent) => void
  ): void {
    this.eventHandlers.set(handlerId, handler);
  }

  /**
   * Unregister event handler
   */
  offCommunicationEvent(handlerId: string): void {
    this.eventHandlers.delete(handlerId);
  }

  // ===========================================
  // HEALTH CHECK WITH MCP INTEGRATION
  // ===========================================

  /**
   * Enhanced health check with MCP service monitoring
   */
  async enhancedHealthCheck(): Promise<{
    communication_service: boolean;
    database_connection: boolean;
    mcp_service: boolean;
    realtime_monitoring: boolean;
    recent_performance: {
      avg_delivery_time_ms: number;
      success_rate: number;
      error_count: number;
    };
    overall_health: boolean;
  }> {
    try {
      // Get basic communication health
      const baseHealth = await super.healthCheck();
      
      // Get database health
      const dbHealth = await this.dbClient.healthCheck();
      
      // Get recent performance metrics
      const recentOps = this.dbClient.getOperationHistory(50);
      const commOps = recentOps.filter(op => op.operation_id.includes('communication'));
      
      const avgDeliveryTime = commOps.length > 0 
        ? commOps.reduce((sum, op) => sum + op.duration_ms, 0) / commOps.length 
        : 0;
      
      const successRate = commOps.length > 0 
        ? (commOps.filter(op => op.success).length / commOps.length) * 100 
        : 100;
      
      const errorCount = commOps.filter(op => !op.success).length;

      const overallHealth = baseHealth.overall && 
                           dbHealth.database_connection && 
                           dbHealth.mcp_service && 
                           errorCount < 5;

      return {
        communication_service: baseHealth.sms_service,
        database_connection: dbHealth.database_connection,
        mcp_service: dbHealth.mcp_service,
        realtime_monitoring: this.realtimeSubscriptions.length > 0,
        recent_performance: {
          avg_delivery_time_ms: avgDeliveryTime,
          success_rate: successRate,
          error_count: errorCount
        },
        overall_health: overallHealth
      };
    } catch (error) {
      console.error('Enhanced health check failed:', error);
      return {
        communication_service: false,
        database_connection: false,
        mcp_service: false,
        realtime_monitoring: false,
        recent_performance: {
          avg_delivery_time_ms: 0,
          success_rate: 0,
          error_count: 0
        },
        overall_health: false
      };
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      const mcpService = this.dbClient.getMCPService();
      if (mcpService) {
        this.realtimeSubscriptions.forEach(subId => {
          mcpService.unsubscribeFromTable(subId);
        });
      }
      
      this.eventHandlers.clear();
      console.log('✅ Enhanced Communication Hub cleanup completed');
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}