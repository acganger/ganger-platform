import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@ganger/auth';
import type { AuthenticatedRequest } from '@ganger/auth';
import { createSupabaseServerClient } from '@ganger/auth';

/**
 * GET /api/analytics/trends
 * Fetch staffing trends and comparative analytics
 */
export default withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { locationId, timeframe = 'week', metric = 'coverage_percentage' } = req.query;
    const user = req.user;

    // Verify permissions (simplified check)
    if (!user || !user.permissions || !user.permissions.includes('read_analytics')) {
      return res.status(403).json({
        error: 'Insufficient permissions to read analytics trends'
      });
    }

    // Calculate date range based on timeframe
    const dateRange = calculateDateRange(timeframe as string);
    const previousRange = calculatePreviousDateRange(timeframe as string);

    // Initialize Supabase client
    const supabase = createSupabaseServerClient();
    
    // For now, provide mock trend data since tables aren't set up
    const currentData = [
      {
        id: '1',
        analytics_date: new Date('2025-01-06'),
        location_id: locationId || 'northfield',
        coverage_percentage: 92.5,
        staff_utilization_rate: 88.0,
        cost_efficiency_score: 85.0,
        overtime_hours: 6.5,
        understaffed_periods: 2,
        overstaffed_periods: 1,
        location: { id: 'northfield', name: 'Northfield' }
      },
      {
        id: '2',
        analytics_date: new Date('2025-01-07'),
        location_id: locationId || 'northfield',
        coverage_percentage: 94.2,
        staff_utilization_rate: 89.5,
        cost_efficiency_score: 87.5,
        overtime_hours: 5.0,
        understaffed_periods: 1,
        overstaffed_periods: 0,
        location: { id: 'northfield', name: 'Northfield' }
      }
    ];

    const previousData = [
      {
        id: '3',
        analytics_date: new Date('2024-12-30'),
        location_id: locationId || 'northfield',
        coverage_percentage: 89.0,
        staff_utilization_rate: 85.0,
        cost_efficiency_score: 82.0,
        overtime_hours: 8.0,
        understaffed_periods: 3,
        overstaffed_periods: 2
      }
    ];

    // Calculate trends
    const trends = calculateTrends(currentData, previousData, metric as string);

    // Generate insights
    const insights = generateTrendInsights(currentData, trends);

    // Calculate performance benchmarks
    const benchmarks = {
      coverage_benchmark: 95.0,
      utilization_benchmark: 85.0,
      efficiency_benchmark: 80.0,
      overtime_threshold: 10.0,
      sample_size: 30
    };

    return res.status(200).json({
      success: true,
      data: {
        timeframe,
        date_range: dateRange,
        current_period: {
          data: currentData,
          summary: calculatePeriodSummary(currentData)
        },
        previous_period: {
          summary: calculatePeriodSummary(previousData)
        },
        trends,
        insights,
        benchmarks
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch analytics trends',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Calculate date range based on timeframe
 */
function calculateDateRange(timeframe: string): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  switch (timeframe) {
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start.setDate(now.getDate() - 7);
  }

  return { start, end };
}

/**
 * Calculate previous period date range for comparison
 */
function calculatePreviousDateRange(timeframe: string): { start: Date; end: Date } {
  const current = calculateDateRange(timeframe);
  const duration = current.end.getTime() - current.start.getTime();
  
  const end = new Date(current.start.getTime() - 1);
  const start = new Date(end.getTime() - duration);

  return { start, end };
}

/**
 * Calculate period summary statistics
 */
function calculatePeriodSummary(data: any[]): Record<string, number> {
  if (data.length === 0) {
    return {
      avg_coverage_percentage: 0,
      avg_staff_utilization: 0,
      avg_cost_efficiency: 0,
      total_overtime_hours: 0,
      total_understaffed_periods: 0,
      total_overstaffed_periods: 0,
      record_count: 0
    };
  }

  const summary = data.reduce((acc, record) => {
    acc.totalCoverage += record.coverage_percentage || 0;
    acc.totalUtilization += record.staff_utilization_rate || 0;
    acc.totalCostEfficiency += record.cost_efficiency_score || 0;
    acc.totalOvertimeHours += record.overtime_hours || 0;
    acc.totalUnderstaffedPeriods += record.understaffed_periods || 0;
    acc.totalOverstaffedPeriods += record.overstaffed_periods || 0;
    return acc;
  }, {
    totalCoverage: 0,
    totalUtilization: 0,
    totalCostEfficiency: 0,
    totalOvertimeHours: 0,
    totalUnderstaffedPeriods: 0,
    totalOverstaffedPeriods: 0
  });

  const count = data.length;

  return {
    avg_coverage_percentage: Math.round((summary.totalCoverage / count) * 100) / 100,
    avg_staff_utilization: Math.round((summary.totalUtilization / count) * 100) / 100,
    avg_cost_efficiency: Math.round((summary.totalCostEfficiency / count) * 100) / 100,
    total_overtime_hours: Math.round(summary.totalOvertimeHours * 100) / 100,
    total_understaffed_periods: summary.totalUnderstaffedPeriods,
    total_overstaffed_periods: summary.totalOverstaffedPeriods,
    record_count: count
  };
}

/**
 * Calculate trends between current and previous periods
 */
function calculateTrends(currentData: any[], previousData: any[], metric: string) {
  const currentSummary = calculatePeriodSummary(currentData);
  const previousSummary = calculatePeriodSummary(previousData);

  const trends: any = {};

  // Calculate percentage change for each metric
  const metrics = [
    'avg_coverage_percentage',
    'avg_staff_utilization',
    'avg_cost_efficiency',
    'total_overtime_hours',
    'total_understaffed_periods',
    'total_overstaffed_periods'
  ];

  metrics.forEach(metricKey => {
    const current = currentSummary[metricKey] || 0;
    const previous = previousSummary[metricKey] || 0;
    
    let change = 0;
    let changePercent = 0;
    
    if (previous !== 0) {
      change = current - previous;
      changePercent = (change / previous) * 100;
    } else if (current > 0) {
      changePercent = 100;
    }

    trends[metricKey] = {
      current,
      previous,
      change: Math.round(change * 100) / 100,
      change_percent: Math.round(changePercent * 100) / 100,
      trend_direction: changePercent > 5 ? 'improving' : changePercent < -5 ? 'declining' : 'stable'
    };
  });

  // Calculate daily trends for the primary metric
  const dailyTrends = calculateDailyTrends(currentData, metric);

  return {
    overall: trends,
    daily: dailyTrends,
    primary_metric: metric
  };
}

/**
 * Calculate daily trends for a specific metric
 */
function calculateDailyTrends(data: any[], metric: string) {
  const dailyData = data.map(record => ({
    date: record.analytics_date,
    value: record[metric] || 0,
    location_id: record.location_id,
    location_name: record.location?.name || 'Unknown'
  }));

  // Group by location if multiple locations
  const groupedData = dailyData.reduce((acc: Record<string, any>, item) => {
    if (!acc[item.location_id]) {
      acc[item.location_id] = {
        location_name: item.location_name,
        data: []
      };
    }
    acc[item.location_id].data.push({
      date: item.date,
      value: item.value
    });
    return acc;
  }, {} as Record<string, any>);

  return groupedData;
}

/**
 * Generate trend insights
 */
function generateTrendInsights(data: any[], trends: any) {
  const insights = [];

  // Coverage insights
  if (trends.overall.avg_coverage_percentage.change_percent < -10) {
    insights.push({
      type: 'warning',
      category: 'coverage',
      message: `Coverage percentage has declined by ${Math.abs(trends.overall.avg_coverage_percentage.change_percent)}% compared to previous period`,
      recommendation: 'Consider reviewing staff scheduling patterns and availability'
    });
  } else if (trends.overall.avg_coverage_percentage.change_percent > 10) {
    insights.push({
      type: 'positive',
      category: 'coverage',
      message: `Coverage percentage has improved by ${trends.overall.avg_coverage_percentage.change_percent}%`,
      recommendation: 'Maintain current staffing strategies'
    });
  }

  // Overtime insights
  if (trends.overall.total_overtime_hours.change_percent > 20) {
    insights.push({
      type: 'warning',
      category: 'cost',
      message: `Overtime hours have increased by ${trends.overall.total_overtime_hours.change_percent}%`,
      recommendation: 'Review staffing levels and consider hiring additional staff'
    });
  }

  return insights;
}