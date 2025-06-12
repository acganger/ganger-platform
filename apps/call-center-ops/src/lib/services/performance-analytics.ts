// Call Center Operations Dashboard - Performance Analytics Engine
// Advanced analytics and performance calculation service

import { db } from '@ganger/db';
import { 
  AgentPerformanceMetrics, 
  PerformanceTrend, 
  CallVolumeMetrics,
  TeamPerformanceMetrics 
} from '../../types/call-center';

interface AnalyticsOptions {
  startDate: string;
  endDate: string;
  location?: string[];
  agent?: string[];
  granularity?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  includeProjections?: boolean;
  includeBenchmarks?: boolean;
}

interface PerformanceInsights {
  trends: PerformanceTrend[];
  recommendations: string[];
  alerts: PerformanceAlert[];
  benchmarks: PerformanceBenchmark[];
}

interface PerformanceAlert {
  type: 'warning' | 'critical' | 'info';
  category: 'volume' | 'quality' | 'efficiency' | 'attendance';
  message: string;
  agent_email?: string;
  location?: string;
  metric_value: number;
  threshold_value: number;
  created_at: string;
}

interface PerformanceBenchmark {
  metric_name: string;
  location: string;
  current_value: number;
  benchmark_value: number;
  performance_rating: 'excellent' | 'good' | 'fair' | 'poor';
  variance_percentage: number;
}

interface TeamEfficiencyMetrics {
  location: string;
  team_size: number;
  coverage_percentage: number;
  workload_distribution_score: number; // 0-100, higher is better
  cross_training_score: number;
  collaboration_score: number;
  efficiency_trends: PerformanceTrend[];
}

export class PerformanceAnalyticsEngine {
  
  /**
   * Calculate comprehensive agent performance metrics
   */
  async calculateAgentPerformance(
    agentEmail: string, 
    options: AnalyticsOptions
  ): Promise<AgentPerformanceMetrics & { insights: PerformanceInsights }> {
    
    // Get base performance metrics
    const baseMetrics = await this.getBaseAgentMetrics(agentEmail, options);
    
    // Calculate trends and insights
    const insights = await this.generateAgentInsights(agentEmail, options);
    
    // Add goal progress and predictions
    const goalProgress = await this.calculateGoalProgress(agentEmail, options);
    
    return {
      ...baseMetrics,
      ...goalProgress,
      insights
    };
  }
  
  /**
   * Calculate team performance metrics with advanced analytics
   */
  async calculateTeamPerformance(
    options: AnalyticsOptions
  ): Promise<TeamPerformanceMetrics[]> {
    
    const locations = options.location || ['Ann Arbor', 'Wixom', 'Plymouth'];
    const teamMetrics: TeamPerformanceMetrics[] = [];
    
    for (const location of locations) {
      const metrics = await this.getTeamMetricsForLocation(location, options);
      teamMetrics.push(metrics);
    }
    
    return teamMetrics;
  }
  
  /**
   * Calculate call volume metrics with predictive analytics
   */
  async calculateCallVolumeMetrics(
    options: AnalyticsOptions
  ): Promise<CallVolumeMetrics[]> {
    
    const volumeQuery = `
      WITH hourly_calls AS (
        SELECT 
          location,
          DATE(call_start_time) as call_date,
          EXTRACT(HOUR FROM call_start_time) as call_hour,
          COUNT(*) as hourly_volume,
          COUNT(*) FILTER (WHERE call_status = 'completed') as hourly_answered,
          COUNT(*) FILTER (WHERE call_status = 'missed') as hourly_missed,
          COUNT(*) FILTER (WHERE call_status = 'abandoned') as hourly_abandoned,
          ROUND(AVG(ring_duration_seconds), 0) as avg_wait_time
        FROM call_center_records
        WHERE call_start_time BETWEEN $1 AND $2
          ${options.location ? 'AND location = ANY($3)' : ''}
        GROUP BY location, call_date, call_hour
      ),
      daily_aggregates AS (
        SELECT 
          location,
          call_date as period,
          SUM(hourly_volume) as total_calls,
          SUM(hourly_answered) as answered_calls,
          SUM(hourly_missed) as missed_calls,
          SUM(hourly_abandoned) as abandoned_calls,
          ROUND(AVG(avg_wait_time), 0) as average_wait_time,
          MAX(hourly_volume) as peak_hour_volume,
          (ARRAY_AGG(call_hour ORDER BY hourly_volume DESC))[1] as peak_hour
        FROM hourly_calls
        GROUP BY location, call_date
      )
      SELECT 
        location,
        period::text,
        total_calls,
        answered_calls,
        missed_calls,
        abandoned_calls,
        average_wait_time,
        peak_hour_volume,
        CONCAT(peak_hour, ':00') as peak_hour
      FROM daily_aggregates
      ORDER BY location, period
    `;
    
    const params: any[] = [options.startDate + 'T00:00:00Z', options.endDate + 'T23:59:59Z'];
    if (options.location) params.push(options.location);
    
    const results = await db.query(volumeQuery, params);
    
    return results.map((row: any) => ({
      location: row.location,
      period: row.period,
      total_calls: parseInt(row.total_calls),
      answered_calls: parseInt(row.answered_calls),
      missed_calls: parseInt(row.missed_calls),
      abandoned_calls: parseInt(row.abandoned_calls),
      average_wait_time: parseInt(row.average_wait_time) || 0,
      peak_hour_volume: parseInt(row.peak_hour_volume) || 0,
      peak_hour: row.peak_hour || '09:00'
    }));
  }
  
  /**
   * Generate performance trends and forecasting
   */
  async generatePerformanceTrends(
    metric: string,
    options: AnalyticsOptions
  ): Promise<PerformanceTrend[]> {
    
    const granularityMap = {
      'daily': 'DATE(call_start_time)',
      'weekly': 'DATE_TRUNC(\'week\', call_start_time)',
      'monthly': 'DATE_TRUNC(\'month\', call_start_time)',
      'hourly': 'DATE_TRUNC(\'hour\', call_start_time)'
    };
    
    const granularity = options.granularity || 'daily';
    const dateGroup = granularityMap[granularity];
    
    let metricCalculation = '';
    switch (metric) {
      case 'call_volume':
        metricCalculation = 'COUNT(*)';
        break;
      case 'answer_rate':
        metricCalculation = 'ROUND((COUNT(*) FILTER (WHERE call_status = \'completed\')::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2)';
        break;
      case 'average_talk_time':
        metricCalculation = 'ROUND(AVG(talk_duration_seconds), 0)';
        break;
      case 'customer_satisfaction':
        metricCalculation = 'ROUND(AVG(customer_satisfaction_score), 2)';
        break;
      case 'first_call_resolution':
        metricCalculation = 'ROUND((COUNT(*) FILTER (WHERE first_call_resolution = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2)';
        break;
      default:
        metricCalculation = 'COUNT(*)';
    }
    
    const trendQuery = `
      WITH trend_data AS (
        SELECT 
          ${dateGroup} as period,
          ${metricCalculation} as value
        FROM call_center_records
        WHERE call_start_time BETWEEN $1 AND $2
          ${options.location ? 'AND location = ANY($3)' : ''}
          ${options.agent ? 'AND agent_email = ANY($4)' : ''}
        GROUP BY ${dateGroup}
        ORDER BY period
      ),
      trend_with_variance AS (
        SELECT 
          period,
          value,
          LAG(value) OVER (ORDER BY period) as previous_value
        FROM trend_data
      )
      SELECT 
        period::text,
        value,
        COALESCE(value - previous_value, 0) as variance,
        CASE 
          WHEN previous_value IS NULL THEN 'stable'
          WHEN value > previous_value THEN 'up'
          WHEN value < previous_value THEN 'down'
          ELSE 'stable'
        END as trend
      FROM trend_with_variance
    `;
    
    const params: any[] = [options.startDate + 'T00:00:00Z', options.endDate + 'T23:59:59Z'];
    if (options.location) params.push(options.location);
    if (options.agent) params.push(options.agent);
    
    const results = await db.query(trendQuery, params);
    
    return results.map((row: any) => ({
      period: row.period,
      value: parseFloat(row.value) || 0,
      variance: parseFloat(row.variance) || 0,
      trend: row.trend as 'up' | 'down' | 'stable'
    }));
  }
  
  /**
   * Calculate team efficiency metrics
   */
  async calculateTeamEfficiency(
    location: string,
    options: AnalyticsOptions
  ): Promise<TeamEfficiencyMetrics> {
    
    // Get team composition
    const teamComposition = await this.getTeamComposition(location, options);
    
    // Calculate workload distribution
    const workloadDistribution = await this.calculateWorkloadDistribution(location, options);
    
    // Calculate cross-training score
    const crossTrainingScore = await this.calculateCrossTrainingScore(location, options);
    
    // Calculate collaboration score
    const collaborationScore = await this.calculateCollaborationScore(location, options);
    
    // Generate efficiency trends
    const efficiencyTrends = await this.generateEfficiencyTrends(location, options);
    
    return {
      location,
      team_size: teamComposition.active_agents,
      coverage_percentage: teamComposition.coverage_percentage,
      workload_distribution_score: workloadDistribution,
      cross_training_score: crossTrainingScore,
      collaboration_score: collaborationScore,
      efficiency_trends: efficiencyTrends
    };
  }
  
  /**
   * Generate performance alerts and recommendations
   */
  async generatePerformanceAlerts(
    options: AnalyticsOptions
  ): Promise<PerformanceAlert[]> {
    
    const alerts: PerformanceAlert[] = [];
    
    // Check for volume alerts
    const volumeAlerts = await this.checkVolumeAlerts(options);
    alerts.push(...volumeAlerts);
    
    // Check for quality alerts
    const qualityAlerts = await this.checkQualityAlerts(options);
    alerts.push(...qualityAlerts);
    
    // Check for efficiency alerts
    const efficiencyAlerts = await this.checkEfficiencyAlerts(options);
    alerts.push(...efficiencyAlerts);
    
    // Check for attendance alerts
    const attendanceAlerts = await this.checkAttendanceAlerts(options);
    alerts.push(...attendanceAlerts);
    
    return alerts.sort((a, b) => {
      const priority = { 'critical': 3, 'warning': 2, 'info': 1 };
      return priority[b.type] - priority[a.type];
    });
  }
  
  /**
   * Calculate performance benchmarks
   */
  async calculatePerformanceBenchmarks(
    options: AnalyticsOptions
  ): Promise<PerformanceBenchmark[]> {
    
    const benchmarks: PerformanceBenchmark[] = [];
    const locations = options.location || ['Ann Arbor', 'Wixom', 'Plymouth'];
    
    // Industry benchmarks
    const industryBenchmarks = {
      answer_rate: 85.0,
      first_call_resolution: 70.0,
      customer_satisfaction: 4.2,
      average_talk_time: 240,
      calls_per_hour: 15.0,
      utilization_rate: 75.0
    };
    
    for (const location of locations) {
      const locationMetrics = await this.getLocationBenchmarkMetrics(location, options);
      
      for (const [metric, benchmarkValue] of Object.entries(industryBenchmarks)) {
        const currentValue = locationMetrics[metric] || 0;
        const variance = ((currentValue - benchmarkValue) / benchmarkValue) * 100;
        
        let rating: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
        if (variance >= 10) rating = 'excellent';
        else if (variance >= 0) rating = 'good';
        else if (variance >= -10) rating = 'fair';
        
        benchmarks.push({
          metric_name: metric,
          location,
          current_value: currentValue,
          benchmark_value: benchmarkValue,
          performance_rating: rating,
          variance_percentage: Math.round(variance * 100) / 100
        });
      }
    }
    
    return benchmarks;
  }
  
  /**
   * Generate predictive insights
   */
  async generatePredictiveInsights(
    options: AnalyticsOptions
  ): Promise<{
    volume_forecast: PerformanceTrend[];
    staffing_recommendations: string[];
    risk_assessments: PerformanceAlert[];
  }> {
    
    // Simple linear regression for volume forecasting
    const volumeForecast = await this.calculateVolumeForecast(options);
    
    // Staffing recommendations based on predicted volume
    const staffingRecommendations = await this.generateStaffingRecommendations(options);
    
    // Risk assessments for performance degradation
    const riskAssessments = await this.assessPerformanceRisks(options);
    
    return {
      volume_forecast: volumeForecast,
      staffing_recommendations: staffingRecommendations,
      risk_assessments: riskAssessments
    };
  }
  
  // Private helper methods
  
  private async getBaseAgentMetrics(
    agentEmail: string, 
    options: AnalyticsOptions
  ): Promise<AgentPerformanceMetrics> {
    
    const metricsQuery = `
      WITH call_metrics AS (
        SELECT 
          agent_email,
          agent_name,
          location,
          COUNT(*) as total_calls,
          COUNT(*) FILTER (WHERE call_status = 'completed') as calls_answered,
          COUNT(*) FILTER (WHERE call_status = 'missed') as calls_missed,
          ROUND(AVG(talk_duration_seconds), 0) as average_talk_time,
          ROUND(AVG(hold_time_seconds), 0) as average_hold_time,
          ROUND(AVG(customer_satisfaction_score), 2) as customer_satisfaction_average,
          ROUND(AVG(quality_score), 2) as quality_score_average,
          ROUND((COUNT(*) FILTER (WHERE first_call_resolution = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2) as first_call_resolution_rate,
          ROUND((COUNT(*) FILTER (WHERE appointment_scheduled = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2) as appointment_conversion_rate
        FROM call_center_records
        WHERE agent_email = $1 
          AND call_start_time BETWEEN $2 AND $3
        GROUP BY agent_email, agent_name, location
      ),
      shift_metrics AS (
        SELECT 
          AVG(utilization_percentage) as utilization_rate,
          AVG(calls_per_hour) as calls_per_hour,
          COUNT(*) as qa_reviews_count
        FROM agent_shifts
        WHERE agent_email = $1 
          AND shift_date BETWEEN DATE($2) AND DATE($3)
      )
      SELECT 
        cm.*,
        COALESCE(sm.utilization_rate, 0) as utilization_rate,
        COALESCE(sm.calls_per_hour, 0) as calls_per_hour,
        COALESCE(sm.qa_reviews_count, 0) as qa_reviews_count,
        ROUND((cm.calls_answered::DECIMAL / NULLIF(cm.total_calls, 0)) * 100, 2) as answer_rate
      FROM call_metrics cm
      CROSS JOIN shift_metrics sm
    `;
    
    const result = await db.query(metricsQuery, [
      agentEmail, 
      options.startDate + 'T00:00:00Z', 
      options.endDate + 'T23:59:59Z'
    ]);
    
    const metrics = result[0] || {};
    
    return {
      agent_email: agentEmail,
      agent_name: metrics.agent_name || '',
      location: metrics.location || '',
      period_start: options.startDate,
      period_end: options.endDate,
      total_calls: parseInt(metrics.total_calls) || 0,
      calls_answered: parseInt(metrics.calls_answered) || 0,
      calls_missed: parseInt(metrics.calls_missed) || 0,
      answer_rate: parseFloat(metrics.answer_rate) || 0,
      average_talk_time: parseInt(metrics.average_talk_time) || 0,
      average_hold_time: parseInt(metrics.average_hold_time) || 0,
      first_call_resolution_rate: parseFloat(metrics.first_call_resolution_rate) || 0,
      customer_satisfaction_average: parseFloat(metrics.customer_satisfaction_average) || 0,
      quality_score_average: parseFloat(metrics.quality_score_average) || 0,
      utilization_rate: parseFloat(metrics.utilization_rate) || 0,
      calls_per_hour: parseFloat(metrics.calls_per_hour) || 0,
      appointment_conversion_rate: parseFloat(metrics.appointment_conversion_rate) || 0,
      goals_met: 0, // To be calculated in goal progress
      total_goals: 0,
      goal_achievement_rate: 0,
      qa_reviews_count: parseInt(metrics.qa_reviews_count) || 0,
      coaching_sessions: 0, // To be calculated separately
      training_hours: 0,
      improvement_areas: []
    };
  }
  
  private async generateAgentInsights(
    agentEmail: string, 
    options: AnalyticsOptions
  ): Promise<PerformanceInsights> {
    
    // Generate performance trends
    const trends = await this.generatePerformanceTrends('answer_rate', {
      ...options,
      agent: [agentEmail]
    });
    
    // Generate recommendations
    const recommendations = await this.generateAgentRecommendations(agentEmail, options);
    
    // Generate alerts
    const alerts = await this.generateAgentAlerts(agentEmail, options);
    
    // Calculate benchmarks
    const benchmarks = await this.calculateAgentBenchmarks(agentEmail, options);
    
    return {
      trends,
      recommendations,
      alerts,
      benchmarks
    };
  }
  
  private async calculateGoalProgress(
    agentEmail: string,
    options: AnalyticsOptions
  ): Promise<{
    goals_met: number;
    total_goals: number;
    goal_achievement_rate: number;
  }> {
    
    const goalQuery = `
      SELECT 
        COUNT(*) as total_goals,
        COUNT(*) FILTER (WHERE achievement_percentage >= 100) as goals_met,
        ROUND(AVG(achievement_percentage), 2) as avg_achievement
      FROM performance_goals
      WHERE agent_email = $1 
        AND goal_status = 'active'
        AND period_start_date <= $3 
        AND period_end_date >= $2
    `;
    
    const result = await db.query(goalQuery, [
      agentEmail,
      options.startDate,
      options.endDate
    ]);
    
    const goals = result[0] || {};
    
    return {
      goals_met: parseInt(goals.goals_met) || 0,
      total_goals: parseInt(goals.total_goals) || 0,
      goal_achievement_rate: parseFloat(goals.avg_achievement) || 0
    };
  }
  
  // Additional helper methods would be implemented here...
  // For brevity, I'm including placeholders for the remaining private methods
  
  private async getTeamMetricsForLocation(location: string, options: AnalyticsOptions): Promise<TeamPerformanceMetrics> {
    // Implementation for team metrics calculation
    return {} as TeamPerformanceMetrics;
  }
  
  private async getTeamComposition(location: string, options: AnalyticsOptions): Promise<any> {
    // Implementation for team composition analysis
    return { active_agents: 5, coverage_percentage: 85 };
  }
  
  private async calculateWorkloadDistribution(location: string, options: AnalyticsOptions): Promise<number> {
    // Implementation for workload distribution scoring
    return 75;
  }
  
  private async calculateCrossTrainingScore(location: string, options: AnalyticsOptions): Promise<number> {
    // Implementation for cross-training analysis
    return 60;
  }
  
  private async calculateCollaborationScore(location: string, options: AnalyticsOptions): Promise<number> {
    // Implementation for collaboration scoring
    return 80;
  }
  
  private async generateEfficiencyTrends(location: string, options: AnalyticsOptions): Promise<PerformanceTrend[]> {
    // Implementation for efficiency trend calculation
    return [];
  }
  
  private async checkVolumeAlerts(options: AnalyticsOptions): Promise<PerformanceAlert[]> {
    // Implementation for volume-based alerts
    return [];
  }
  
  private async checkQualityAlerts(options: AnalyticsOptions): Promise<PerformanceAlert[]> {
    // Implementation for quality-based alerts
    return [];
  }
  
  private async checkEfficiencyAlerts(options: AnalyticsOptions): Promise<PerformanceAlert[]> {
    // Implementation for efficiency-based alerts
    return [];
  }
  
  private async checkAttendanceAlerts(options: AnalyticsOptions): Promise<PerformanceAlert[]> {
    // Implementation for attendance-based alerts
    return [];
  }
  
  private async getLocationBenchmarkMetrics(location: string, options: AnalyticsOptions): Promise<any> {
    // Implementation for location benchmark calculation
    return {};
  }
  
  private async calculateVolumeForecast(options: AnalyticsOptions): Promise<PerformanceTrend[]> {
    // Implementation for volume forecasting
    return [];
  }
  
  private async generateStaffingRecommendations(options: AnalyticsOptions): Promise<string[]> {
    // Implementation for staffing recommendations
    return [];
  }
  
  private async assessPerformanceRisks(options: AnalyticsOptions): Promise<PerformanceAlert[]> {
    // Implementation for risk assessment
    return [];
  }
  
  private async generateAgentRecommendations(agentEmail: string, options: AnalyticsOptions): Promise<string[]> {
    // Implementation for agent-specific recommendations
    return [];
  }
  
  private async generateAgentAlerts(agentEmail: string, options: AnalyticsOptions): Promise<PerformanceAlert[]> {
    // Implementation for agent-specific alerts
    return [];
  }
  
  private async calculateAgentBenchmarks(agentEmail: string, options: AnalyticsOptions): Promise<PerformanceBenchmark[]> {
    // Implementation for agent benchmark calculation
    return [];
  }
}

// Export singleton instance
export const performanceAnalytics = new PerformanceAnalyticsEngine();