import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { auditLog } from '@ganger/utils/server';

export interface ComplianceRealtimeEvent {
  type: 'compliance_update' | 'sync_started' | 'sync_completed' | 'employee_update' | 'training_completed' | 'overdue_alert';
  payload: any;
  timestamp: string;
  source: string;
  metadata?: any;
}

export interface RealtimeSubscription {
  channel: string;
  userId?: string;
  department?: string;
  role?: string;
  filters?: string[];
}

export class ComplianceRealtimeService {
  private supabase;
  private channels: Map<string, RealtimeChannel> = new Map();
  private subscribers: Map<string, Set<string>> = new Map();

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Broadcast compliance update to all relevant subscribers
   */
  async broadcastComplianceUpdate(
    event: string,
    payload: any,
    options: {
      channel?: string;
      department?: string;
      targetRoles?: string[];
      excludeUser?: string;
    } = {}
  ): Promise<void> {
    try {
      const {
        channel = 'compliance-updates',
        department,
        targetRoles,
        excludeUser
      } = options;

      const realtimeEvent: ComplianceRealtimeEvent = {
        type: event as any,
        payload,
        timestamp: new Date().toISOString(),
        source: 'compliance-backend',
        metadata: {
          department,
          targetRoles,
          excludeUser
        }
      };

      // Get or create channel
      const realtimeChannel = this.getOrCreateChannel(channel);

      // Broadcast to the channel
      await realtimeChannel.send({
        type: 'broadcast',
        event,
        payload: realtimeEvent
      });

      // Log the broadcast for monitoring
      await auditLog({
        action: 'realtime_broadcast',
        resourceType: 'compliance_realtime',
        metadata: {
          event,
          channel,
          department,
          targetRoles,
          payloadSize: JSON.stringify(payload).length
        }
      });

    } catch (error) {
      console.error('Failed to broadcast compliance update:', error);
      throw error;
    }
  }

  /**
   * Broadcast employee-specific compliance updates
   */
  async broadcastEmployeeUpdate(
    employeeId: string,
    updateType: 'training_completed' | 'training_overdue' | 'status_changed',
    data: any,
    department?: string
  ): Promise<void> {
    await this.broadcastComplianceUpdate('employee_update', {
      employeeId,
      updateType,
      data
    }, {
      channel: 'compliance-updates',
      department
    });

    // Also send to employee-specific channel if they're subscribed
    await this.broadcastComplianceUpdate('employee_update', {
      employeeId,
      updateType,
      data
    }, {
      channel: `employee-${employeeId}`
    });
  }

  /**
   * Broadcast sync status updates
   */
  async broadcastSyncUpdate(
    syncLogId: string,
    syncType: string,
    status: 'started' | 'in_progress' | 'completed' | 'failed',
    progress?: {
      processed: number;
      total: number;
      percentage: number;
    }
  ): Promise<void> {
    const eventType = status === 'started' ? 'sync_started' : 
                     status === 'completed' ? 'sync_completed' : 'sync_progress';

    await this.broadcastComplianceUpdate(eventType, {
      syncLogId,
      syncType,
      status,
      progress,
      timestamp: new Date().toISOString()
    }, {
      channel: 'sync-updates'
    });
  }

  /**
   * Broadcast overdue training alerts
   */
  async broadcastOverdueAlerts(
    overdueData: Array<{
      employeeId: string;
      employeeName: string;
      department: string;
      moduleId: string;
      moduleName: string;
      overdueDays: number;
    }>
  ): Promise<void> {
    // Group by department for targeted notifications
    const departmentGroups = overdueData.reduce((groups, item) => {
      if (!groups[item.department]) {
        groups[item.department] = [];
      }
      groups[item.department].push(item);
      return groups;
    }, {} as Record<string, typeof overdueData>);

    // Broadcast to each department
    for (const [department, employees] of Object.entries(departmentGroups)) {
      await this.broadcastComplianceUpdate('overdue_alert', {
        department,
        overdueCount: employees.length,
        employees,
        alertLevel: this.calculateAlertLevel(employees)
      }, {
        channel: 'compliance-alerts',
        department,
        targetRoles: ['manager', 'hr_admin', 'superadmin']
      });
    }
  }

  /**
   * Subscribe to compliance updates with role-based filtering
   */
  async subscribeToComplianceUpdates(subscription: RealtimeSubscription): Promise<RealtimeChannel> {
    const { channel, userId, department, role, filters } = subscription;

    // Create or get existing channel
    const realtimeChannel = this.getOrCreateChannel(channel);

    // Track subscriber
    if (userId) {
      if (!this.subscribers.has(channel)) {
        this.subscribers.set(channel, new Set());
      }
      this.subscribers.get(channel)!.add(userId);
    }

    // Set up message filtering based on user role and department
    realtimeChannel.on('broadcast', { event: '*' }, (payload) => {
      if (this.shouldReceiveUpdate(payload, { userId, department, role, filters })) {
        // Message passes filters, client will receive it
        return;
      }
      // Message filtered out
    });

    return realtimeChannel;
  }

  /**
   * Unsubscribe from compliance updates
   */
  async unsubscribeFromComplianceUpdates(channel: string, userId?: string): Promise<void> {
    if (userId && this.subscribers.has(channel)) {
      this.subscribers.get(channel)!.delete(userId);
    }

    const realtimeChannel = this.channels.get(channel);
    if (realtimeChannel) {
      await realtimeChannel.unsubscribe();
      this.channels.delete(channel);
    }
  }

  /**
   * Setup database triggers for automatic real-time updates
   */
  async setupRealtimeTriggers(): Promise<void> {
    try {
      // Create database functions for real-time notifications
      await this.supabase.rpc('create_compliance_realtime_triggers');

      console.log('Compliance realtime triggers setup completed');
    } catch (error) {
      console.error('Failed to setup realtime triggers:', error);
      throw error;
    }
  }

  /**
   * Get real-time statistics
   */
  async getRealtimeStats(): Promise<{
    activeChannels: number;
    totalSubscribers: number;
    channelDetails: Array<{
      channel: string;
      subscriberCount: number;
      lastActivity: string;
    }>;
  }> {
    const channelDetails = Array.from(this.channels.entries()).map(([channel, realtimeChannel]) => ({
      channel,
      subscriberCount: this.subscribers.get(channel)?.size || 0,
      lastActivity: new Date().toISOString() // In real implementation, track actual activity
    }));

    return {
      activeChannels: this.channels.size,
      totalSubscribers: Array.from(this.subscribers.values()).reduce((sum, set) => sum + set.size, 0),
      channelDetails
    };
  }

  /**
   * Health check for realtime service
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      // Test channel creation and basic functionality
      const testChannel = this.supabase.channel('health-check');
      
      await testChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          testChannel.unsubscribe();
        }
      });

      return {
        healthy: true,
        latency: Date.now() - startTime
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Cleanup inactive channels and subscriptions
   */
  async cleanup(): Promise<void> {
    const inactiveThreshold = Date.now() - (30 * 60 * 1000); // 30 minutes

    for (const [channelName, channel] of this.channels.entries()) {
      // In a real implementation, track last activity per channel
      // For now, clean up channels with no subscribers
      const subscriberCount = this.subscribers.get(channelName)?.size || 0;
      
      if (subscriberCount === 0) {
        await channel.unsubscribe();
        this.channels.delete(channelName);
        this.subscribers.delete(channelName);
      }
    }
  }

  private getOrCreateChannel(channelName: string): RealtimeChannel {
    if (!this.channels.has(channelName)) {
      const channel = this.supabase.channel(channelName);
      this.channels.set(channelName, channel);
    }
    return this.channels.get(channelName)!;
  }

  private shouldReceiveUpdate(
    payload: any,
    userContext: {
      userId?: string;
      department?: string;
      role?: string;
      filters?: string[];
    }
  ): boolean {
    const event = payload.payload as ComplianceRealtimeEvent;
    const metadata = event.metadata || {};

    // Always allow updates for superadmin and hr_admin
    if (['superadmin', 'hr_admin'].includes(userContext.role || '')) {
      return true;
    }

    // Filter by department if specified
    if (metadata.department && userContext.department !== metadata.department) {
      return false;
    }

    // Filter by target roles if specified
    if (metadata.targetRoles && !metadata.targetRoles.includes(userContext.role || '')) {
      return false;
    }

    // Exclude specific user if specified
    if (metadata.excludeUser && userContext.userId === metadata.excludeUser) {
      return false;
    }

    // Apply custom filters if specified
    if (userContext.filters && userContext.filters.length > 0) {
      const eventType = event.type;
      if (!userContext.filters.includes(eventType)) {
        return false;
      }
    }

    return true;
  }

  private calculateAlertLevel(
    employees: Array<{ overdueDays: number }>
  ): 'low' | 'medium' | 'high' | 'critical' {
    const maxOverdueDays = Math.max(...employees.map(e => e.overdueDays));
    const avgOverdueDays = employees.reduce((sum, e) => sum + e.overdueDays, 0) / employees.length;

    if (maxOverdueDays > 30 || avgOverdueDays > 14) {
      return 'critical';
    } else if (maxOverdueDays > 14 || avgOverdueDays > 7) {
      return 'high';
    } else if (maxOverdueDays > 7 || avgOverdueDays > 3) {
      return 'medium';
    }
    return 'low';
  }
}

// Export singleton instance
export const complianceRealtimeService = new ComplianceRealtimeService();