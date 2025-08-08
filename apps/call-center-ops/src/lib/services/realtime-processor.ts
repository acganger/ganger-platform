// Call Center Operations Dashboard - Real-time Data Processing Service
// Handles real-time data updates, WebSocket connections, and live metrics

import { db } from '@ganger/db';

interface RealtimeEvent {
  type: 'call_started' | 'call_ended' | 'agent_status_changed' | 'metric_updated' | 'alert_triggered';
  timestamp: string;
  data: any;
  agent_email?: string;
  location?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface LiveMetrics {
  active_calls: number;
  available_agents: number;
  current_wait_time: number;
  calls_in_queue: number;
  hourly_call_rate: number;
  location_metrics: LocationMetrics[];
  last_updated: string;
}

interface LocationMetrics {
  location: string;
  active_calls: number;
  available_agents: number;
  busy_agents: number;
  away_agents: number;
  current_queue_length: number;
  avg_wait_time_minutes: number;
  calls_per_hour: number;
}

interface AlertConfig {
  metric: string;
  threshold: number;
  comparison: 'greater_than' | 'less_than' | 'equals';
  severity: 'warning' | 'critical';
  location?: string;
  agent_email?: string;
}

export class RealtimeDataProcessor {
  private metricsCache: Map<string, any> = new Map();
  private alertConfigs: AlertConfig[] = [];
  private activeConnections: Set<any> = new Set();
  
  constructor() {
    this.initializeAlertConfigs();
    this.startMetricsUpdater();
  }
  
  /**
   * Process incoming real-time call events
   */
  async processCallEvent(event: {
    type: 'call_started' | 'call_answered' | 'call_ended' | 'call_transferred';
    call_id: string;
    agent_email: string;
    location: string;
    timestamp: string;
    additional_data?: any;
  }): Promise<void> {
    
    try {
      const realtimeEvent: RealtimeEvent = {
        type: event.type === 'call_started' ? 'call_started' : 'call_ended',
        timestamp: event.timestamp,
        data: {
          call_id: event.call_id,
          agent_email: event.agent_email,
          location: event.location,
          ...event.additional_data
        },
        agent_email: event.agent_email,
        location: event.location,
        priority: 'medium'
      };
      
      // Update active calls tracking
      await this.updateActiveCallsTracking(event);
      
      // Update real-time metrics
      await this.updateLiveMetrics(event.location);
      
      // Check for alerts
      await this.checkMetricAlerts(event.location);
      
      // Broadcast to connected clients
      await this.broadcastEvent(realtimeEvent);
      
      // Log the event
      await this.logRealtimeEvent(realtimeEvent);
      
    } catch (error) {
    }
  }
  
  /**
   * Process agent status changes
   */
  async processAgentStatusChange(event: {
    agent_email: string;
    old_status: string;
    new_status: string;
    location: string;
    timestamp: string;
  }): Promise<void> {
    
    try {
      const realtimeEvent: RealtimeEvent = {
        type: 'agent_status_changed',
        timestamp: event.timestamp,
        data: {
          agent_email: event.agent_email,
          old_status: event.old_status,
          new_status: event.new_status,
          location: event.location
        },
        agent_email: event.agent_email,
        location: event.location,
        priority: event.new_status === 'offline' ? 'high' : 'medium'
      };
      
      // Update agent availability metrics
      await this.updateAgentAvailabilityMetrics(event.location);
      
      // Check for staffing alerts
      await this.checkStaffingAlerts(event.location);
      
      // Broadcast to connected clients
      await this.broadcastEvent(realtimeEvent);
      
      // Log the event
      await this.logRealtimeEvent(realtimeEvent);
      
    } catch (error) {
    }
  }
  
  /**
   * Get current live metrics for dashboard
   */
  async getLiveMetrics(locations?: string[]): Promise<LiveMetrics> {
    try {
      const filterLocations = locations || ['Ann Arbor', 'Wixom', 'Plymouth'];
      
      // Get overall metrics
      const overallMetrics = await this.calculateOverallMetrics(filterLocations);
      
      // Get location-specific metrics
      const locationMetrics = await Promise.all(
        filterLocations.map(location => this.calculateLocationMetrics(location))
      );
      
      const liveMetrics: LiveMetrics = {
        active_calls: overallMetrics.active_calls,
        available_agents: overallMetrics.available_agents,
        current_wait_time: overallMetrics.current_wait_time,
        calls_in_queue: overallMetrics.calls_in_queue,
        hourly_call_rate: overallMetrics.hourly_call_rate,
        location_metrics: locationMetrics,
        last_updated: new Date().toISOString()
      };
      
      // Cache the metrics
      this.metricsCache.set('live_metrics', liveMetrics);
      
      return liveMetrics;
      
    } catch (error) {
      return this.getDefaultMetrics();
    }
  }
  
  /**
   * Calculate real-time performance indicators
   */
  async calculateRealtimeKPIs(location?: string): Promise<{
    calls_per_minute: number;
    average_call_duration: number;
    queue_time_trend: number[];
    agent_utilization: number;
    service_level: number;
    abandonment_rate: number;
  }> {
    
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const kpiQuery = `
      WITH recent_calls AS (
        SELECT 
          call_start_time,
          call_end_time,
          talk_duration_seconds,
          ring_duration_seconds,
          call_status,
          agent_email
        FROM call_center_records
        WHERE call_start_time >= $1
          ${location ? 'AND location = $2' : ''}
      ),
      time_buckets AS (
        SELECT 
          generate_series($1, $2, INTERVAL '5 minutes') as bucket_start
      ),
      calls_per_bucket AS (
        SELECT 
          tb.bucket_start,
          COUNT(rc.call_start_time) as calls_in_bucket,
          AVG(rc.ring_duration_seconds) as avg_queue_time
        FROM time_buckets tb
        LEFT JOIN recent_calls rc ON rc.call_start_time >= tb.bucket_start 
          AND rc.call_start_time < tb.bucket_start + INTERVAL '5 minutes'
        GROUP BY tb.bucket_start
        ORDER BY tb.bucket_start
      )
      SELECT 
        -- Calls per minute (average over last hour)
        ROUND(COUNT(*)::DECIMAL / 60, 2) as calls_per_minute,
        
        -- Average call duration
        ROUND(AVG(talk_duration_seconds), 0) as average_call_duration,
        
        -- Service level (calls answered within 30 seconds)
        ROUND(
          (COUNT(*) FILTER (WHERE ring_duration_seconds <= 30)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 
          2
        ) as service_level,
        
        -- Abandonment rate
        ROUND(
          (COUNT(*) FILTER (WHERE call_status = 'abandoned')::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 
          2
        ) as abandonment_rate,
        
        -- Get queue time trend (array of 5-minute buckets)
        ARRAY(SELECT avg_queue_time FROM calls_per_bucket ORDER BY bucket_start) as queue_time_trend
      FROM recent_calls
    `;
    
    const params = [oneHourAgo.toISOString(), now.toISOString()];
    if (location) params.push(location);
    
    const result = await db.query(kpiQuery, params);
    const kpis = result[0] || {};
    
    // Get agent utilization
    const agentUtilization = await this.calculateAgentUtilization(location, oneHourAgo, now);
    
    return {
      calls_per_minute: parseFloat(kpis.calls_per_minute) || 0,
      average_call_duration: parseInt(kpis.average_call_duration) || 0,
      queue_time_trend: kpis.queue_time_trend || [],
      agent_utilization: agentUtilization,
      service_level: parseFloat(kpis.service_level) || 0,
      abandonment_rate: parseFloat(kpis.abandonment_rate) || 0
    };
  }
  
  /**
   * Monitor and process queue metrics
   */
  async processQueueMetrics(): Promise<void> {
    try {
      const locations = ['Ann Arbor', 'Wixom', 'Plymouth'];
      
      for (const location of locations) {
        // Calculate current queue metrics
        const queueMetrics = await this.calculateQueueMetrics(location);
        
        // Check for queue alerts
        await this.checkQueueAlerts(location, queueMetrics);
        
        // Update cached metrics
        this.metricsCache.set(`queue_metrics_${location}`, queueMetrics);
      }
      
    } catch (error) {
    }
  }
  
  /**
   * Setup WebSocket connection for real-time updates
   */
  setupWebSocketConnection(connection: any, userRole: string, userLocations?: string[]): void {
    this.activeConnections.add(connection);
    
    connection.on('close', () => {
      this.activeConnections.delete(connection);
    });
    
    // Send initial metrics
    this.sendInitialMetrics(connection, userRole, userLocations);
    
    // Setup periodic updates
    const updateInterval = setInterval(() => {
      this.sendMetricsUpdate(connection, userRole, userLocations);
    }, 10000); // Update every 10 seconds
    
    connection.on('close', () => {
      clearInterval(updateInterval);
    });
  }
  
  // Private helper methods
  
  private async updateActiveCallsTracking(event: any): Promise<void> {
    if (event.type === 'call_started') {
      // Add to active calls
      await db.query(`
        INSERT INTO active_calls (
          call_id, agent_email, agent_name, location, caller_number, 
          call_direction, call_start_time, call_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (call_id) DO NOTHING
      `, [
        event.call_id,
        event.agent_email,
        event.additional_data?.agent_name || 'Unknown',
        event.location,
        event.additional_data?.caller_number || 'Unknown',
        event.additional_data?.call_direction || 'inbound',
        event.timestamp,
        'ringing'
      ]);
    } else if (event.type === 'call_ended') {
      // Remove from active calls
      await db.query(
        'DELETE FROM active_calls WHERE call_id = $1',
        [event.call_id]
      );
    }
  }
  
  private async updateLiveMetrics(location: string): Promise<void> {
    const metrics = await this.calculateLocationMetrics(location);
    this.metricsCache.set(`location_metrics_${location}`, metrics);
    
    // Broadcast metrics update
    const updateEvent: RealtimeEvent = {
      type: 'metric_updated',
      timestamp: new Date().toISOString(),
      data: { location, metrics },
      location,
      priority: 'low'
    };
    
    await this.broadcastEvent(updateEvent);
  }
  
  private async calculateOverallMetrics(locations: string[]): Promise<any> {
    const metricsQuery = `
      WITH current_status AS (
        SELECT 
          COUNT(DISTINCT ac.call_id) as active_calls,
          COUNT(DISTINCT acs.agent_email) FILTER (WHERE acs.status = 'available') as available_agents,
          ROUND(AVG(ac.current_queue_time_seconds), 0) as avg_wait_time
        FROM active_calls ac
        FULL OUTER JOIN agent_current_status acs ON acs.location = ac.location
        WHERE ac.location = ANY($1) OR acs.location = ANY($1)
      ),
      hourly_rate AS (
        SELECT 
          COUNT(*) as calls_last_hour
        FROM call_center_records
        WHERE call_start_time >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
          AND location = ANY($1)
      )
      SELECT 
        COALESCE(cs.active_calls, 0) as active_calls,
        COALESCE(cs.available_agents, 0) as available_agents,
        COALESCE(cs.avg_wait_time, 0) as current_wait_time,
        -- Estimate calls in queue (calls started but not answered in last 5 minutes)
        (SELECT COUNT(*) FROM active_calls WHERE call_status = 'ringing' AND call_start_time >= CURRENT_TIMESTAMP - INTERVAL '5 minutes') as calls_in_queue,
        COALESCE(hr.calls_last_hour, 0) as hourly_call_rate
      FROM current_status cs
      CROSS JOIN hourly_rate hr
    `;
    
    const result = await db.query(metricsQuery, [locations]);
    return result[0] || {
      active_calls: 0,
      available_agents: 0,
      current_wait_time: 0,
      calls_in_queue: 0,
      hourly_call_rate: 0
    };
  }
  
  private async calculateLocationMetrics(location: string): Promise<LocationMetrics> {
    const locationQuery = `
      WITH agent_status AS (
        SELECT 
          COUNT(*) FILTER (WHERE status = 'available') as available_agents,
          COUNT(*) FILTER (WHERE status = 'busy') as busy_agents,
          COUNT(*) FILTER (WHERE status = 'away') as away_agents
        FROM agent_current_status
        WHERE location = $1
      ),
      call_metrics AS (
        SELECT 
          COUNT(*) as active_calls,
          COUNT(*) FILTER (WHERE call_status = 'ringing') as queue_length,
          ROUND(AVG(current_queue_time_seconds), 0) as avg_wait_time
        FROM active_calls
        WHERE location = $1
      ),
      hourly_metrics AS (
        SELECT COUNT(*) as calls_last_hour
        FROM call_center_records
        WHERE location = $1 
          AND call_start_time >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
      )
      SELECT 
        $1 as location,
        COALESCE(cm.active_calls, 0) as active_calls,
        COALESCE(ags.available_agents, 0) as available_agents,
        COALESCE(ags.busy_agents, 0) as busy_agents,
        COALESCE(ags.away_agents, 0) as away_agents,
        COALESCE(cm.queue_length, 0) as current_queue_length,
        COALESCE(cm.avg_wait_time, 0) as avg_wait_time_minutes,
        COALESCE(hm.calls_last_hour, 0) as calls_per_hour
      FROM agent_status ags
      CROSS JOIN call_metrics cm
      CROSS JOIN hourly_metrics hm
    `;
    
    const result = await db.query(locationQuery, [location]);
    const metrics = result[0] || {};
    
    return {
      location,
      active_calls: parseInt(metrics.active_calls) || 0,
      available_agents: parseInt(metrics.available_agents) || 0,
      busy_agents: parseInt(metrics.busy_agents) || 0,
      away_agents: parseInt(metrics.away_agents) || 0,
      current_queue_length: parseInt(metrics.current_queue_length) || 0,
      avg_wait_time_minutes: Math.round((parseInt(metrics.avg_wait_time_minutes) || 0) / 60),
      calls_per_hour: parseInt(metrics.calls_per_hour) || 0
    };
  }
  
  private async calculateAgentUtilization(location?: string, _startTime?: Date, _endTime?: Date): Promise<number> {
    const utilizationQuery = `
      SELECT 
        AVG(utilization_percentage) as avg_utilization
      FROM agent_shifts
      WHERE shift_date = CURRENT_DATE
        ${location ? 'AND location = $1' : ''}
        AND shift_status IN ('active', 'completed')
    `;
    
    const params = location ? [location] : [];
    const result = await db.query(utilizationQuery, params);
    
    return parseFloat(result[0]?.avg_utilization) || 0;
  }
  
  private async calculateQueueMetrics(location: string): Promise<any> {
    const queueQuery = `
      SELECT 
        COUNT(*) as calls_in_queue,
        ROUND(AVG(current_queue_time_seconds), 0) as avg_queue_time,
        MAX(current_queue_time_seconds) as max_queue_time,
        COUNT(*) FILTER (WHERE current_queue_time_seconds > 120) as calls_waiting_over_2min
      FROM active_calls
      WHERE location = $1 AND call_status = 'ringing'
    `;
    
    const result = await db.query(queueQuery, [location]);
    return result[0] || {};
  }
  
  private async checkMetricAlerts(location: string): Promise<void> {
    const metrics = await this.calculateLocationMetrics(location);
    
    for (const config of this.alertConfigs) {
      if (config.location && config.location !== location) continue;
      
      let metricValue = 0;
      switch (config.metric) {
        case 'queue_length':
          metricValue = metrics.current_queue_length;
          break;
        case 'wait_time':
          metricValue = metrics.avg_wait_time_minutes;
          break;
        case 'available_agents':
          metricValue = metrics.available_agents;
          break;
      }
      
      const alertTriggered = this.evaluateAlertCondition(metricValue, config);
      
      if (alertTriggered) {
        await this.triggerAlert(config, metricValue, location);
      }
    }
  }
  
  private evaluateAlertCondition(value: number, config: AlertConfig): boolean {
    switch (config.comparison) {
      case 'greater_than':
        return value > config.threshold;
      case 'less_than':
        return value < config.threshold;
      case 'equals':
        return value === config.threshold;
      default:
        return false;
    }
  }
  
  private async triggerAlert(config: AlertConfig, value: number, location: string): Promise<void> {
    const alertEvent: RealtimeEvent = {
      type: 'alert_triggered',
      timestamp: new Date().toISOString(),
      data: {
        metric: config.metric,
        value,
        threshold: config.threshold,
        severity: config.severity,
        location
      },
      location,
      priority: config.severity === 'critical' ? 'critical' : 'high'
    };
    
    await this.broadcastEvent(alertEvent);
    await this.logRealtimeEvent(alertEvent);
  }
  
  private async broadcastEvent(event: RealtimeEvent): Promise<void> {
    // Broadcast to all connected WebSocket clients
    for (const connection of this.activeConnections) {
      try {
        connection.send(JSON.stringify(event));
      } catch (error) {
        this.activeConnections.delete(connection);
      }
    }
  }
  
  private async logRealtimeEvent(event: RealtimeEvent): Promise<void> {
    try {
      await db.query(`
        INSERT INTO realtime_events (
          event_type, event_data, agent_email, location, priority, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        event.type,
        JSON.stringify(event.data),
        event.agent_email,
        event.location,
        event.priority,
        event.timestamp
      ]);
    } catch (error) {
    }
  }
  
  private getDefaultMetrics(): LiveMetrics {
    return {
      active_calls: 0,
      available_agents: 0,
      current_wait_time: 0,
      calls_in_queue: 0,
      hourly_call_rate: 0,
      location_metrics: [
        { location: 'Ann Arbor', active_calls: 0, available_agents: 0, busy_agents: 0, away_agents: 0, current_queue_length: 0, avg_wait_time_minutes: 0, calls_per_hour: 0 },
        { location: 'Wixom', active_calls: 0, available_agents: 0, busy_agents: 0, away_agents: 0, current_queue_length: 0, avg_wait_time_minutes: 0, calls_per_hour: 0 },
        { location: 'Plymouth', active_calls: 0, available_agents: 0, busy_agents: 0, away_agents: 0, current_queue_length: 0, avg_wait_time_minutes: 0, calls_per_hour: 0 }
      ],
      last_updated: new Date().toISOString()
    };
  }
  
  private initializeAlertConfigs(): void {
    this.alertConfigs = [
      { metric: 'queue_length', threshold: 5, comparison: 'greater_than', severity: 'warning' },
      { metric: 'queue_length', threshold: 10, comparison: 'greater_than', severity: 'critical' },
      { metric: 'wait_time', threshold: 2, comparison: 'greater_than', severity: 'warning' },
      { metric: 'wait_time', threshold: 5, comparison: 'greater_than', severity: 'critical' },
      { metric: 'available_agents', threshold: 1, comparison: 'less_than', severity: 'critical' }
    ];
  }
  
  private startMetricsUpdater(): void {
    // Update metrics every 30 seconds
    setInterval(async () => {
      try {
        await this.processQueueMetrics();
        await this.getLiveMetrics(); // This updates the cache
      } catch (error) {
      }
    }, 30000);
  }
  
  private async sendInitialMetrics(connection: any, _userRole: string, userLocations?: string[]): Promise<void> {
    try {
      const metrics = await this.getLiveMetrics(userLocations);
      connection.send(JSON.stringify({
        type: 'initial_metrics',
        data: metrics,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
    }
  }
  
  private async sendMetricsUpdate(connection: any, _userRole: string, userLocations?: string[]): Promise<void> {
    try {
      const metrics = await this.getLiveMetrics(userLocations);
      connection.send(JSON.stringify({
        type: 'metrics_update',
        data: metrics,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
    }
  }
  
  private async updateAgentAvailabilityMetrics(location: string): Promise<void> {
    // This would update cached agent availability metrics
    const metrics = await this.calculateLocationMetrics(location);
    this.metricsCache.set(`agent_availability_${location}`, metrics);
  }
  
  private async checkQueueAlerts(location: string, queueMetrics: any): Promise<void> {
    // Check queue length alerts
    if (queueMetrics.calls_in_queue > 10) {
      await this.triggerAlert(
        { metric: 'queue_length', threshold: 10, comparison: 'greater_than', severity: 'critical' },
        queueMetrics.calls_in_queue,
        location
      );
    } else if (queueMetrics.calls_in_queue > 5) {
      await this.triggerAlert(
        { metric: 'queue_length', threshold: 5, comparison: 'greater_than', severity: 'warning' },
        queueMetrics.calls_in_queue,
        location
      );
    }
    
    // Check wait time alerts
    const avgWaitMinutes = (queueMetrics.avg_queue_time || 0) / 60;
    if (avgWaitMinutes > 5) {
      await this.triggerAlert(
        { metric: 'wait_time', threshold: 5, comparison: 'greater_than', severity: 'critical' },
        avgWaitMinutes,
        location
      );
    } else if (avgWaitMinutes > 2) {
      await this.triggerAlert(
        { metric: 'wait_time', threshold: 2, comparison: 'greater_than', severity: 'warning' },
        avgWaitMinutes,
        location
      );
    }
  }

  private async checkStaffingAlerts(location: string): Promise<void> {
    const metrics = await this.calculateLocationMetrics(location);
    
    // Check if we have minimum staffing
    if (metrics.available_agents < 1) {
      await this.triggerAlert(
        { metric: 'available_agents', threshold: 1, comparison: 'less_than', severity: 'critical' },
        metrics.available_agents,
        location
      );
    }
  }
}

// Export singleton instance
export const realtimeProcessor = new RealtimeDataProcessor();