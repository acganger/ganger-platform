import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { AuthorizationAnalyticsService } from '../../../lib/analytics/analytics-service';
import { withAuth } from '../../../lib/auth/middleware';
import { auditLog } from '../../../lib/security/audit-logger';
import { addDays, addWeeks, addMonths } from 'date-fns';

const dashboardRequestSchema = z.object({
  timeframe: z.enum(['7d', '30d', '90d', '6m', '1y']).optional().default('30d'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  providerId: z.string().uuid().optional(),
  includeProjections: z.string().transform(val => val === 'true').optional().default('false'),
  includeComparisons: z.string().transform(val => val === 'true').optional().default('false')
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const userId = (req as any).user?.id;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    return await handleGetDashboard(req, res, userId);
  } catch (error) {
    
    await auditLog({
      action: 'analytics_dashboard_error',
      userId,
      resource: 'analytics_dashboard',
      error: error instanceof Error ? error.message : 'Unknown error',
      ipAddress: req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    return res.status(500).json({ 
      error: 'Analytics dashboard failed',
      message: process.env.NODE_ENV === 'development' ? error : 'An unexpected error occurred'
    });
  }
}

async function handleGetDashboard(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const validation = dashboardRequestSchema.safeParse(req.query);
  
  if (!validation.success) {
    return res.status(400).json({
      error: 'Invalid request parameters',
      details: validation.error.errors
    });
  }

  const {
    timeframe,
    startDate,
    endDate,
    providerId,
    includeProjections,
    includeComparisons
  } = validation.data;

  try {
    const analyticsService = new AuthorizationAnalyticsService();

    // Calculate date range
    let dateRange: { start: Date; end: Date };
    
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    } else {
      const now = new Date();
      switch (timeframe) {
        case '7d':
          dateRange = { start: addDays(now, -7), end: now };
          break;
        case '30d':
          dateRange = { start: addDays(now, -30), end: now };
          break;
        case '90d':
          dateRange = { start: addDays(now, -90), end: now };
          break;
        case '6m':
          dateRange = { start: addMonths(now, -6), end: now };
          break;
        case '1y':
          dateRange = { start: addMonths(now, -12), end: now };
          break;
        default:
          dateRange = { start: addDays(now, -30), end: now };
      }
    }

    // Generate dashboard analytics
    const dashboardData = await analyticsService.generateDashboardAnalytics(dateRange);

    // Add provider-specific insights if requested
    let providerInsights = null;
    if (providerId) {
      providerInsights = await analyticsService.generateProviderInsights(providerId, dateRange);
    }

    // Add comparison data if requested
    let comparisonData = null;
    if (includeComparisons) {
      const previousPeriodRange = calculatePreviousPeriod(dateRange);
      comparisonData = await generateComparisonMetrics(
        analyticsService,
        dateRange,
        previousPeriodRange
      );
    }

    // Add projections if requested
    let projections = null;
    if (includeProjections) {
      projections = await generateProjections(dashboardData, dateRange);
    }

    // Calculate key insights and recommendations
    const insights = generateDashboardInsights(dashboardData);
    const recommendations = generateActionableRecommendations(dashboardData);

    // Log dashboard access
    await auditLog({
      action: 'view_analytics_dashboard',
      userId,
      resource: 'analytics_dashboard',
      details: {
        timeframe,
        dateRange,
        providerId,
        includeProjections,
        includeComparisons,
        totalAuthorizations: dashboardData.overview.totalAuthorizations
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        ...dashboardData,
        providerInsights,
        comparisons: comparisonData,
        projections,
        insights,
        recommendations,
        metadata: {
          timeframe,
          dateRange,
          generatedAt: new Date().toISOString(),
          providerId,
          totalDataPoints: dashboardData.overview.totalAuthorizations,
          version: '1.0.0'
        }
      }
    });
  } catch (error) {
    throw error;
  }
}

function calculatePreviousPeriod(currentRange: { start: Date; end: Date }): { start: Date; end: Date } {
  const periodLength = currentRange.end.getTime() - currentRange.start.getTime();
  
  return {
    start: new Date(currentRange.start.getTime() - periodLength),
    end: new Date(currentRange.start.getTime())
  };
}

async function generateComparisonMetrics(
  analyticsService: AuthorizationAnalyticsService,
  currentPeriod: { start: Date; end: Date },
  previousPeriod: { start: Date; end: Date }
) {
  try {
    const [currentData, previousData] = await Promise.all([
      analyticsService.generateDashboardAnalytics(currentPeriod),
      analyticsService.generateDashboardAnalytics(previousPeriod)
    ]);

    return {
      totalAuthorizations: {
        current: currentData.overview.totalAuthorizations,
        previous: previousData.overview.totalAuthorizations,
        change: calculatePercentageChange(
          previousData.overview.totalAuthorizations,
          currentData.overview.totalAuthorizations
        )
      },
      approvalRate: {
        current: currentData.overview.approvalRate,
        previous: previousData.overview.approvalRate,
        change: currentData.overview.approvalRate - previousData.overview.approvalRate
      },
      processingTime: {
        current: currentData.overview.averageProcessingTime,
        previous: previousData.overview.averageProcessingTime,
        change: calculatePercentageChange(
          previousData.overview.averageProcessingTime,
          currentData.overview.averageProcessingTime
        )
      },
      costSavings: {
        current: currentData.overview.costSavings,
        previous: previousData.overview.costSavings,
        change: calculatePercentageChange(
          previousData.overview.costSavings,
          currentData.overview.costSavings
        )
      },
      aiAccuracy: {
        current: currentData.overview.aiAccuracyRate,
        previous: previousData.overview.aiAccuracyRate,
        change: currentData.overview.aiAccuracyRate - previousData.overview.aiAccuracyRate
      }
    };
  } catch (error) {
    return null;
  }
}

function calculatePercentageChange(previous: number, current: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

async function generateProjections(dashboardData: any, dateRange: { start: Date; end: Date }) {
  const daysInPeriod = (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24);
  const dailyAverage = dashboardData.overview.totalAuthorizations / daysInPeriod;
  
  // Simple linear projections based on current trends
  return {
    nextMonth: {
      estimatedAuthorizations: Math.round(dailyAverage * 30),
      estimatedCostSavings: Math.round((dashboardData.overview.costSavings / daysInPeriod) * 30),
      confidenceLevel: 'medium'
    },
    nextQuarter: {
      estimatedAuthorizations: Math.round(dailyAverage * 90),
      estimatedCostSavings: Math.round((dashboardData.overview.costSavings / daysInPeriod) * 90),
      confidenceLevel: 'low'
    },
    methodology: 'Linear projection based on current period averages',
    assumptions: [
      'Current submission patterns continue',
      'No significant operational changes',
      'Seasonal variations not accounted for'
    ]
  };
}

function generateDashboardInsights(dashboardData: any): string[] {
  const insights = [];
  
  // Approval rate insights
  if (dashboardData.overview.approvalRate > 85) {
    insights.push('Excellent approval rate indicates strong clinical documentation and appropriate medication selection');
  } else if (dashboardData.overview.approvalRate < 65) {
    insights.push('Below-average approval rate suggests opportunities for improved documentation or medication selection');
  }
  
  // AI accuracy insights
  if (dashboardData.overview.aiAccuracyRate > 90) {
    insights.push('High AI accuracy rate demonstrates effective automation and reliable recommendations');
  } else if (dashboardData.overview.aiAccuracyRate < 75) {
    insights.push('AI accuracy could be improved through additional training data and model refinement');
  }
  
  // Processing time insights
  if (dashboardData.overview.averageProcessingTime < 24) {
    insights.push('Fast processing times indicate efficient workflow and good insurance provider relationships');
  } else if (dashboardData.overview.averageProcessingTime > 72) {
    insights.push('Extended processing times may indicate workflow bottlenecks or insurance provider delays');
  }
  
  // Cost savings insights
  if (dashboardData.overview.costSavings > 20000) {
    insights.push('Significant cost savings achieved through AI automation and process optimization');
  }
  
  // Volume insights
  if (dashboardData.overview.totalAuthorizations > 100) {
    insights.push('High authorization volume demonstrates successful platform adoption');
  }
  
  return insights.slice(0, 5); // Return top 5 insights
}

function generateActionableRecommendations(dashboardData: any): Array<{
  category: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
}> {
  const recommendations = [];
  
  // Approval rate recommendations
  if (dashboardData.overview.approvalRate < 75) {
    recommendations.push({
      category: 'Approval Rate',
      priority: 'high' as const,
      action: 'Implement AI-powered documentation review to identify missing clinical justifications',
      impact: 'Could improve approval rate by 10-15 percentage points',
      effort: 'medium' as const
    });
  }
  
  // AI utilization recommendations
  if (dashboardData.aiInsights.automationRate < 80) {
    recommendations.push({
      category: 'AI Utilization',
      priority: 'medium' as const,
      action: 'Increase AI assistance adoption through provider training and workflow integration',
      impact: 'Potential to reduce processing time by 30-40%',
      effort: 'low' as const
    });
  }
  
  // Processing time recommendations
  if (dashboardData.overview.averageProcessingTime > 48) {
    recommendations.push({
      category: 'Processing Time',
      priority: 'medium' as const,
      action: 'Analyze bottlenecks in insurance provider communication and submission workflows',
      impact: 'Could reduce average processing time by 20-30%',
      effort: 'medium' as const
    });
  }
  
  // Cost optimization recommendations
  recommendations.push({
    category: 'Cost Optimization',
    priority: 'low' as const,
    action: 'Implement alternative medication recommendations to increase formulary compliance',
    impact: 'Additional 15-25% cost savings potential',
    effort: 'high' as const
  });
  
  // Quality improvement recommendations
  if (dashboardData.overview.aiAccuracyRate < 85) {
    recommendations.push({
      category: 'AI Quality',
      priority: 'medium' as const,
      action: 'Collect feedback on AI recommendations to improve model accuracy',
      impact: 'Improved AI accuracy leads to better clinical outcomes',
      effort: 'low' as const
    });
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

export default withAuth(handler);