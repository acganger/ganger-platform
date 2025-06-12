export { ComplianceRealtimeService, complianceRealtimeService } from './ComplianceRealtimeService';

// Export types for realtime integration
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

export interface RealtimeBroadcastOptions {
  channel?: string;
  department?: string;
  targetRoles?: string[];
  excludeUser?: string;
}