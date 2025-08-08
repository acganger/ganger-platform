// Call Center Operations Dashboard - 3CX Integration Service
// Manages integration with 3CX VoIP system for call data and agent monitoring

import { CallCenterRecord, ThreeCXCallRecord, ThreeCXAgentStatus } from '../../types/call-center';
import { db } from '@ganger/db';

interface ThreeCXConfig {
  apiUrl: string;
  apiKey: string;
  webhookSecret: string;
  enabled: boolean;
}

interface CDRSyncOptions {
  startDate: string;
  endDate: string;
  location?: string;
  batchSize?: number;
}

interface AgentStatusSyncOptions {
  forceRefresh?: boolean;
  location?: string;
}

export class ThreeCXIntegrationService {
  private config: ThreeCXConfig;
  
  constructor() {
    this.config = {
      apiUrl: process.env.THREECX_API_URL || 'https://ganger.3cx.us:5001/api',
      apiKey: process.env.THREECX_API_KEY || '',
      webhookSecret: process.env.THREECX_WEBHOOK_SECRET || 'ganger-webhook-secret-2025',
      enabled: process.env.THREECX_INTEGRATION_ENABLED === 'true'
    };
  }
  
  /**
   * Verify webhook signature from 3CX
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config.enabled) {
      return true; // Allow for development/testing
    }
    
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', this.config.webhookSecret)
        .update(payload)
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Fetch Call Detail Records from 3CX API
   */
  async fetchCDRData(options: CDRSyncOptions): Promise<ThreeCXCallRecord[]> {
    if (!this.config.enabled) {
      return this.generateMockCDRData(options);
    }
    
    try {
      const url = new URL(`${this.config.apiUrl}/reports/cdr`);
      url.searchParams.append('start_date', options.startDate);
      url.searchParams.append('end_date', options.endDate);
      url.searchParams.append('limit', (options.batchSize || 1000).toString());
      
      if (options.location) {
        url.searchParams.append('location', options.location);
      }
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`3CX API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.records || [];
      
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Fetch current agent status from 3CX API
   */
  async fetchAgentStatus(options: AgentStatusSyncOptions = {}): Promise<ThreeCXAgentStatus[]> {
    if (!this.config.enabled) {
      return this.generateMockAgentStatusData();
    }
    
    try {
      const url = new URL(`${this.config.apiUrl}/status/agents`);
      
      if (options.location) {
        url.searchParams.append('location', options.location);
      }
      
      if (options.forceRefresh) {
        url.searchParams.append('force_refresh', 'true');
      }
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`3CX API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.agents || [];
      
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Sync historical CDR data to database
   */
  async syncHistoricalCDR(options: CDRSyncOptions): Promise<{ processed: number; skipped: number; errors: number }> {
    const stats = { processed: 0, skipped: 0, errors: 0 };
    
    try {
      
      const cdrRecords = await this.fetchCDRData(options);
      
      for (const cdrRecord of cdrRecords) {
        try {
          // Check if record already exists
          const existing = await db.query(
            'SELECT id FROM call_center_records WHERE call_id = $1',
            [cdrRecord.CallId]
          );
          
          if (existing.length > 0) {
            stats.skipped++;
            continue;
          }
          
          // Convert 3CX record to our format
          const callRecord = await this.convertCDRToCallRecord(cdrRecord);
          
          // Insert into database
          await this.insertCallRecord(callRecord);
          stats.processed++;
          
        } catch (error) {
          stats.errors++;
        }
      }
      
      return stats;
      
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Convert 3CX CDR format to our CallCenterRecord format
   */
  async convertCDRToCallRecord(cdrRecord: ThreeCXCallRecord): Promise<Partial<CallCenterRecord>> {
    // Map agent extension to email
    const agentEmail = await this.getAgentEmailFromExtension(cdrRecord.AgentExtension, cdrRecord.AgentName);
    
    // Map location from queue name
    const location = this.mapLocationFromQueue(cdrRecord.QueueName);
    
    // Calculate timing metrics
    const startTime = new Date(cdrRecord.StartTime);
    const answerTime = cdrRecord.AnswerTime ? new Date(cdrRecord.AnswerTime) : null;
    
    const ringDuration = answerTime ? Math.round((answerTime.getTime() - startTime.getTime()) / 1000) : 0;
    
    // Determine call direction and type
    const callDirection = this.determineCallDirection(cdrRecord.CallerNumber, cdrRecord.CalledNumber);
    const callType = this.inferCallType(cdrRecord.CallType, cdrRecord.QueueName);
    
    return {
      call_id: cdrRecord.CallId,
      location,
      queue_name: cdrRecord.QueueName,
      agent_extension: cdrRecord.AgentExtension,
      agent_email: agentEmail,
      agent_name: cdrRecord.AgentName,
      caller_number: cdrRecord.CallerNumber,
      called_number: cdrRecord.CalledNumber,
      call_direction: callDirection,
      call_type: callType,
      call_start_time: cdrRecord.StartTime,
      call_answer_time: cdrRecord.AnswerTime || undefined,
      call_end_time: cdrRecord.EndTime || undefined,
      ring_duration_seconds: ringDuration,
      talk_duration_seconds: cdrRecord.TalkDuration,
      hold_time_seconds: cdrRecord.HoldDuration,
      call_status: this.mapCallStatus(cdrRecord.CallResult),
      recording_available: !!cdrRecord.Recording,
      recording_url: cdrRecord.Recording || undefined,
      after_call_work_seconds: 0, // To be updated by agents
      transfer_count: 0, // Could be parsed from CallType if available
      call_priority: 'normal',
      appointment_scheduled: false,
      first_call_resolution: false,
      escalation_required: false,
      complaint_call: false,
      follow_up_required: false
    };
  }
  
  /**
   * Insert call record into database
   */
  private async insertCallRecord(callRecord: Partial<CallCenterRecord>): Promise<void> {
    const insertQuery = `
      INSERT INTO call_center_records (
        call_id, location, queue_name, agent_extension, agent_email, agent_name,
        caller_number, called_number, call_direction, call_type,
        call_start_time, call_answer_time, call_end_time,
        ring_duration_seconds, talk_duration_seconds, hold_time_seconds,
        call_status, recording_available, recording_url,
        after_call_work_seconds, transfer_count, call_priority,
        appointment_scheduled, first_call_resolution, escalation_required,
        complaint_call, follow_up_required
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
      )
    `;
    
    const values = [
      callRecord.call_id,
      callRecord.location,
      callRecord.queue_name,
      callRecord.agent_extension,
      callRecord.agent_email,
      callRecord.agent_name,
      callRecord.caller_number,
      callRecord.called_number,
      callRecord.call_direction,
      callRecord.call_type,
      callRecord.call_start_time,
      callRecord.call_answer_time,
      callRecord.call_end_time,
      callRecord.ring_duration_seconds,
      callRecord.talk_duration_seconds,
      callRecord.hold_time_seconds,
      callRecord.call_status,
      callRecord.recording_available,
      callRecord.recording_url,
      callRecord.after_call_work_seconds,
      callRecord.transfer_count,
      callRecord.call_priority,
      callRecord.appointment_scheduled,
      callRecord.first_call_resolution,
      callRecord.escalation_required,
      callRecord.complaint_call,
      callRecord.follow_up_required
    ];
    
    await db.query(insertQuery, values);
  }
  
  /**
   * Helper methods for data mapping
   */
  private async getAgentEmailFromExtension(extension: string, agentName: string): Promise<string> {
    try {
      const result = await db.query(`
        SELECT DISTINCT agent_email 
        FROM agent_shifts 
        WHERE agent_email LIKE '%' || $1 || '%' 
           OR agent_name ILIKE '%' || $2 || '%'
        ORDER BY created_at DESC 
        LIMIT 1
      `, [extension, agentName]);
      
      if (result.length > 0) {
        return result[0].agent_email;
      }
      
      // Generate email from name if not found
      const emailName = agentName.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '.');
      
      return `${emailName}@gangerdermatology.com`;
    } catch (error) {
      return `agent.${extension}@gangerdermatology.com`;
    }
  }
  
  private mapLocationFromQueue(queueName: string): 'Ann Arbor' | 'Wixom' | 'Plymouth' {
    const locationMap: Record<string, 'Ann Arbor' | 'Wixom' | 'Plymouth'> = {
      'aa': 'Ann Arbor',
      'ann_arbor': 'Ann Arbor',
      'annarbor': 'Ann Arbor',
      'wixom': 'Wixom',
      'wx': 'Wixom',
      'plymouth': 'Plymouth',
      'ply': 'Plymouth',
      'plym': 'Plymouth'
    };
    
    const normalized = queueName.toLowerCase().replace(/[^a-z]/g, '');
    return locationMap[normalized] || 'Ann Arbor';
  }
  
  private determineCallDirection(callerNumber: string, calledNumber: string): 'inbound' | 'outbound' {
    const internalExtensions = ['100', '101', '102', '103', '104', '105', '200', '201', '202', '203', '300', '301', '302'];
    const isInternalCaller = internalExtensions.includes(callerNumber);
    const isExternalCalled = !internalExtensions.includes(calledNumber);
    
    return (isInternalCaller && isExternalCalled) ? 'outbound' : 'inbound';
  }
  
  private inferCallType(callType: string, queueName: string): 'appointment' | 'prescription' | 'billing' | 'general' | 'follow_up' | undefined {
    const typeMap: Record<string, 'appointment' | 'prescription' | 'billing' | 'general' | 'follow_up'> = {
      'appointment': 'appointment',
      'scheduling': 'appointment',
      'prescription': 'prescription',
      'rx': 'prescription',
      'billing': 'billing',
      'insurance': 'billing',
      'followup': 'follow_up',
      'follow_up': 'follow_up',
      'general': 'general'
    };
    
    const searchText = `${callType} ${queueName}`.toLowerCase();
    
    for (const [key, value] of Object.entries(typeMap)) {
      if (searchText.includes(key)) {
        return value;
      }
    }
    
    return 'general';
  }
  
  private mapCallStatus(callResult: string): 'completed' | 'missed' | 'abandoned' | 'transferred' | 'voicemail' {
    const statusMap: Record<string, 'completed' | 'missed' | 'abandoned' | 'transferred' | 'voicemail'> = {
      'answered': 'completed',
      'completed': 'completed',
      'success': 'completed',
      'no_answer': 'missed',
      'busy': 'missed',
      'failed': 'missed',
      'timeout': 'missed',
      'abandoned': 'abandoned',
      'hangup': 'abandoned',
      'cancelled': 'abandoned',
      'transferred': 'transferred',
      'transfer': 'transferred',
      'voicemail': 'voicemail',
      'vm': 'voicemail'
    };
    
    const normalized = callResult.toLowerCase().replace(/[^a-z]/g, '');
    return statusMap[normalized] || 'completed';
  }
  
  /**
   * Mock data generators for development/testing
   */
  private generateMockCDRData(options: CDRSyncOptions): ThreeCXCallRecord[] {
    const mockRecords: ThreeCXCallRecord[] = [];
    const startDate = new Date(options.startDate);
    const endDate = new Date(options.endDate);
    const locations = ['Ann Arbor', 'Wixom', 'Plymouth'];
    const agents = [
      { extension: '101', name: 'Sarah Johnson', email: 'sarah.johnson@gangerdermatology.com' },
      { extension: '102', name: 'Mike Chen', email: 'mike.chen@gangerdermatology.com' },
      { extension: '103', name: 'Lisa Rodriguez', email: 'lisa.rodriguez@gangerdermatology.com' }
    ];
    
    const recordCount = Math.min(options.batchSize || 100, 500);
    
    for (let i = 0; i < recordCount; i++) {
      const agent = agents[Math.floor(Math.random() * agents.length)]!;
      const location = locations[Math.floor(Math.random() * locations.length)]!;
      const callTime = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
      const talkDuration = Math.floor(Math.random() * 600) + 30; // 30 seconds to 10 minutes
      const answerTime = new Date(callTime.getTime() + Math.random() * 30000); // Up to 30 seconds ring time
      const endTime = new Date(answerTime.getTime() + talkDuration * 1000);
      
      mockRecords.push({
        CallId: `CDR-${Date.now()}-${i}`,
        CallType: 'Inbound',
        StartTime: callTime.toISOString(),
        EndTime: endTime.toISOString(),
        AnswerTime: answerTime.toISOString(),
        CallerNumber: `+1248${Math.floor(Math.random() * 9000000) + 1000000}`,
        CalledNumber: `+1248${location === 'Ann Arbor' ? '555' : location === 'Wixom' ? '556' : '557'}0100`,
        AgentExtension: agent.extension,
        AgentName: agent.name,
        Duration: Math.floor((endTime.getTime() - callTime.getTime()) / 1000),
        TalkDuration: talkDuration,
        HoldDuration: Math.floor(Math.random() * 60),
        QueueName: location,
        Recording: Math.random() > 0.3 ? `https://recordings.3cx.us/call-${i}.wav` : undefined,
        CallResult: Math.random() > 0.1 ? 'answered' : 'no_answer'
      });
    }
    
    return mockRecords;
  }
  
  private generateMockAgentStatusData(): ThreeCXAgentStatus[] {
    const agents = [
      { extension: '101', name: 'Sarah Johnson', email: 'sarah.johnson@gangerdermatology.com', location: 'Ann Arbor' },
      { extension: '102', name: 'Mike Chen', email: 'mike.chen@gangerdermatology.com', location: 'Wixom' },
      { extension: '103', name: 'Lisa Rodriguez', email: 'lisa.rodriguez@gangerdermatology.com', location: 'Plymouth' },
      { extension: '201', name: 'David Park', email: 'david.park@gangerdermatology.com', location: 'Ann Arbor' },
      { extension: '202', name: 'Emily Davis', email: 'emily.davis@gangerdermatology.com', location: 'Wixom' }
    ];
    
    const statuses: ('Available' | 'Busy' | 'Away' | 'Offline')[] = ['Available', 'Busy', 'Away', 'Offline'];
    
    return agents.map(agent => ({
      Extension: agent.extension,
      Name: agent.name,
      Email: agent.email,
      Status: statuses[Math.floor(Math.random() * statuses.length)]!,
      Queue: agent.location,
      Location: agent.location,
      CurrentCall: Math.random() > 0.7 ? `CALL-${Date.now()}` : undefined,
      LastActivity: new Date(Date.now() - Math.random() * 3600000).toISOString() // Within last hour
    }));
  }
  
  /**
   * Schedule automatic CDR sync (called by background jobs)
   */
  async scheduleAutomaticSync(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0]!;
    
    try {
      
      const stats = await this.syncHistoricalCDR({
        startDate: yesterdayStr,
        endDate: yesterdayStr,
        batchSize: 1000
      });
      
      
      // Log sync results to database
      await db.query(`
        INSERT INTO sync_history (sync_type, sync_date, records_processed, records_skipped, errors_count)
        VALUES ('cdr_sync', $1, $2, $3, $4)
      `, [yesterdayStr, stats.processed, stats.skipped, stats.errors]);
      
    } catch (error) {
      
      // Log error to database
      await db.query(`
        INSERT INTO sync_history (sync_type, sync_date, error_message)
        VALUES ('cdr_sync', $1, $2)
      `, [yesterdayStr, error instanceof Error ? error.message : String(error)]);
    }
  }
}

// Export singleton instance
export const threeCXIntegration = new ThreeCXIntegrationService();