import { supabase } from '../database/supabase-client';
// import { addDays, addWeeks, addMonths, startOfDay, endOfDay, format } from 'date-fns';

/**
 * Comprehensive Analytics Service for Authorization Performance
 * Provides real-time analytics, cost savings calculations, and business intelligence
 */

export interface DashboardAnalytics {
  overview: {
    totalAuthorizations: number;
    pendingCount: number;
    approvedCount: number;
    deniedCount: number;
    approvalRate: number;
    averageProcessingTime: number;
    aiAccuracyRate: number;
    costSavings: number;
  };
  trends: {
    daily: TrendDataPoint[];
    weekly: TrendDataPoint[];
    monthly: TrendDataPoint[];
  };
  performance: {
    topProviders: ProviderMetrics[];
    insurancePerformance: InsuranceMetrics[];
    medicationStats: MedicationStats[];
  };
  aiInsights: {
    accuracyTrend: AIAccuracyPoint[];
    recommendationDistribution: RecommendationDistribution[];
    processingTimeReduction: number;
    automationRate: number;
  };
}

export interface TrendDataPoint {
  date: string;
  submissions: number;
  approvals: number;
  denials: number;
  processingTime: number;
  costSavings: number;
}

export interface ProviderMetrics {
  providerId: string;
  providerName: string;
  totalSubmissions: number;
  approvalRate: number;
  avgProcessingTime: number;
  aiUsageRate: number;
  costSavings: number;
}

export interface InsuranceMetrics {
  insuranceId: string;
  insuranceName: string;
  totalSubmissions: number;
  approvalRate: number;
  avgProcessingTime: number;
  processingTimeVariance: number;
  formularyCompliance: number;
}

export interface MedicationStats {
  medicationId: string;
  medicationName: string;
  totalRequests: number;
  approvalRate: number;
  avgCost: number;
  alternativesUsed: number;
  costSavingsFromAlternatives: number;
}

export interface AIAccuracyPoint {
  date: string;
  accuracy: number;
  totalPredictions: number;
  correctPredictions: number;
}

export interface RecommendationDistribution {
  type: string;
  count: number;
  percentage: number;
  successRate: number;
}

export interface CostSavingsReport {
  totalSavings: number;
  savingsByCategory: {
    aiAutomation: number;
    alternativeMedications: number;
    processOptimization: number;
    denialPrevention: number;
  };
  timeframe: {
    start: Date;
    end: Date;
  };
  breakdown: CostSavingsBreakdown[];
  projections: {
    monthly: number;
    quarterly: number;
    annual: number;
  };
}

export interface CostSavingsBreakdown {
  category: string;
  description: string;
  amount: number;
  metric: string;
  calculation: string;
}

export interface SuccessRateAnalytics {
  overall: {
    totalSubmissions: number;
    approvals: number;
    denials: number;
    pending: number;
    approvalRate: number;
  };
  byProvider: ProviderSuccessRate[];
  byInsurance: InsuranceSuccessRate[];
  byMedication: MedicationSuccessRate[];
  trends: SuccessRateTrend[];
}

export interface ProviderSuccessRate {
  providerId: string;
  providerName: string;
  submissionCount: number;
  approvalRate: number;
  benchmarkComparison: number;
}

export interface InsuranceSuccessRate {
  insuranceId: string;
  insuranceName: string;
  submissionCount: number;
  approvalRate: number;
  avgProcessingDays: number;
  reliability: number;
}

export interface MedicationSuccessRate {
  medicationName: string;
  therapeuticClass: string;
  submissionCount: number;
  approvalRate: number;
  avgCost: number;
  alternativeSuccessRate: number;
}

export interface SuccessRateTrend {
  period: string;
  approvalRate: number;
  submissionVolume: number;
  aiAccuracy: number;
}

export interface ProcessingTimeAnalytics {
  overall: {
    avgProcessingTime: number;
    medianProcessingTime: number;
    minProcessingTime: number;
    maxProcessingTime: number;
    standardDeviation: number;
  };
  byInsurance: InsuranceProcessingTime[];
  byMedication: MedicationProcessingTime[];
  byPriority: PriorityProcessingTime[];
  trends: ProcessingTimeTrend[];
  slaPerformance: {
    within24Hours: number;
    within72Hours: number;
    beyond72Hours: number;
    escalationRate: number;
  };
}

export interface InsuranceProcessingTime {
  insuranceId: string;
  insuranceName: string;
  avgProcessingTime: number;
  reliability: number;
  slaCompliance: number;
}

export interface MedicationProcessingTime {
  medicationName: string;
  avgProcessingTime: number;
  complexity: number;
  priorAuthFrequency: number;
}

export interface PriorityProcessingTime {
  priority: string;
  avgProcessingTime: number;
  targetTime: number;
  slaCompliance: number;
}

export interface ProcessingTimeTrend {
  period: string;
  avgProcessingTime: number;
  volume: number;
  aiPredictionAccuracy: number;
}

export class AuthorizationAnalyticsService {
  
  /**
   * Generate comprehensive dashboard analytics
   */
  async generateDashboardAnalytics(dateRange?: { start: Date; end: Date }): Promise<DashboardAnalytics> {
    const range = dateRange || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date()
    };

    try {
      const [
        overview,
        trends,
        performance,
        aiInsights
      ] = await Promise.all([
        this.calculateOverviewMetrics(range),
        this.calculateTrends(range),
        this.calculatePerformanceMetrics(range),
        this.calculateAIInsights(range)
      ]);

      return {
        overview,
        trends,
        performance,
        aiInsights
      };
    } catch (error) {
      console.error('Failed to generate dashboard analytics:', error);
      throw new Error('Analytics generation failed');
    }
  }

  /**
   * Calculate cost savings across all categories
   */
  async calculateCostSavings(dateRange: { start: Date; end: Date }): Promise<CostSavingsReport> {
    try {
      // Fetch authorization data for the period
      const { data: authorizations, error } = await supabase
        .from('medication_authorizations')
        .select(`
          *,
          ai_recommendations!left(recommendation_type, confidence_score),
          medications(average_wholesale_price, typical_copay_tier)
        `)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      if (error) throw error;

      // Calculate savings by category
      const aiAutomationSavings = this.calculateAIAutomationSavings(authorizations || []);
      const alternativeMedicationSavings = this.calculateAlternativeMedicationSavings(authorizations || []);
      const processOptimizationSavings = this.calculateProcessOptimizationSavings(authorizations || []);
      const denialPreventionSavings = this.calculateDenialPreventionSavings(authorizations || []);

      const totalSavings = aiAutomationSavings + alternativeMedicationSavings + 
                          processOptimizationSavings + denialPreventionSavings;

      const breakdown: CostSavingsBreakdown[] = [
        {
          category: 'AI Automation',
          description: 'Time savings from automated form completion and analysis',
          amount: aiAutomationSavings,
          metric: 'hours saved',
          calculation: 'Automated tasks × average staff hourly rate'
        },
        {
          category: 'Alternative Medications',
          description: 'Cost reduction from AI-recommended medication alternatives',
          amount: alternativeMedicationSavings,
          metric: 'prescription cost difference',
          calculation: 'Original cost - alternative cost'
        },
        {
          category: 'Process Optimization',
          description: 'Efficiency gains from streamlined workflows',
          amount: processOptimizationSavings,
          metric: 'reduced processing time',
          calculation: 'Time savings × operational cost per hour'
        },
        {
          category: 'Denial Prevention',
          description: 'Avoided costs from prevented authorization denials',
          amount: denialPreventionSavings,
          metric: 'prevented denials',
          calculation: 'Prevented denials × average appeal cost'
        }
      ];

      // Calculate projections
      const daysInPeriod = (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24);
      const dailyAverage = totalSavings / daysInPeriod;

      return {
        totalSavings,
        savingsByCategory: {
          aiAutomation: aiAutomationSavings,
          alternativeMedications: alternativeMedicationSavings,
          processOptimization: processOptimizationSavings,
          denialPrevention: denialPreventionSavings
        },
        timeframe: dateRange,
        breakdown,
        projections: {
          monthly: dailyAverage * 30,
          quarterly: dailyAverage * 90,
          annual: dailyAverage * 365
        }
      };
    } catch (error) {
      console.error('Failed to calculate cost savings:', error);
      throw new Error('Cost savings calculation failed');
    }
  }

  /**
   * Analyze success rates across different dimensions
   */
  async calculateSuccessRates(dateRange: { start: Date; end: Date }): Promise<SuccessRateAnalytics> {
    try {
      const { data: authorizations, error } = await supabase
        .from('medication_authorizations')
        .select(`
          *,
          medications(brand_name, generic_name, therapeutic_class),
          insurance_providers(name),
          user_profiles!provider_id(first_name, last_name)
        `)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      if (error) throw error;

      const data = authorizations || [];

      // Calculate overall metrics
      const totalSubmissions = data.length;
      const approvals = data.filter(auth => auth.status === 'approved').length;
      const denials = data.filter(auth => auth.status === 'denied').length;
      const pending = data.filter(auth => ['submitted', 'under_review'].includes(auth.status)).length;
      const approvalRate = totalSubmissions > 0 ? (approvals / (approvals + denials)) * 100 : 0;

      // Calculate success rates by different dimensions
      const byProvider = this.calculateProviderSuccessRates(data);
      const byInsurance = this.calculateInsuranceSuccessRates(data);
      const byMedication = this.calculateMedicationSuccessRates(data);
      const trends = await this.calculateSuccessRateTrends(dateRange);

      return {
        overall: {
          totalSubmissions,
          approvals,
          denials,
          pending,
          approvalRate
        },
        byProvider,
        byInsurance,
        byMedication,
        trends
      };
    } catch (error) {
      console.error('Failed to calculate success rates:', error);
      throw new Error('Success rate calculation failed');
    }
  }

  /**
   * Analyze processing time performance
   */
  async analyzeProcessingTimes(dateRange: { start: Date; end: Date }): Promise<ProcessingTimeAnalytics> {
    try {
      const { data: authorizations, error } = await supabase
        .from('medication_authorizations')
        .select(`
          *,
          medications(brand_name, generic_name),
          insurance_providers(name, processing_time_hours)
        `)
        .gte('submitted_at', dateRange.start.toISOString())
        .lte('submitted_at', dateRange.end.toISOString())
        .not('submitted_at', 'is', null);

      if (error) throw error;

      const data = authorizations || [];
      const completedAuths = data.filter(auth => 
        ['approved', 'denied'].includes(auth.status) && 
        auth.submitted_at && 
        (auth.approved_at || auth.denied_at)
      );

      // Calculate processing times in hours
      const processingTimes = completedAuths.map(auth => {
        const submitTime = new Date(auth.submitted_at).getTime();
        const completeTime = new Date(auth.approved_at || auth.denied_at).getTime();
        return (completeTime - submitTime) / (1000 * 60 * 60); // Convert to hours
      });

      // Overall statistics
      const avgProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length || 0;
      const sortedTimes = [...processingTimes].sort((a, b) => a - b);
      const medianProcessingTime = sortedTimes.length > 0 ? sortedTimes[Math.floor(sortedTimes.length / 2)] : 0;
      const minProcessingTime = Math.min(...processingTimes) || 0;
      const maxProcessingTime = Math.max(...processingTimes) || 0;
      
      // Calculate standard deviation
      const variance = processingTimes.reduce((sum, time) => sum + Math.pow(time - avgProcessingTime, 2), 0) / processingTimes.length;
      const standardDeviation = Math.sqrt(variance) || 0;

      // SLA performance (24h, 72h thresholds)
      const within24Hours = processingTimes.filter(time => time <= 24).length;
      const within72Hours = processingTimes.filter(time => time <= 72).length;
      const beyond72Hours = processingTimes.filter(time => time > 72).length;

      const slaPerformance = {
        within24Hours: processingTimes.length > 0 ? (within24Hours / processingTimes.length) * 100 : 0,
        within72Hours: processingTimes.length > 0 ? (within72Hours / processingTimes.length) * 100 : 0,
        beyond72Hours: processingTimes.length > 0 ? (beyond72Hours / processingTimes.length) * 100 : 0,
        escalationRate: processingTimes.length > 0 ? (beyond72Hours / processingTimes.length) * 100 : 0
      };

      // Detailed breakdowns
      const byInsurance = this.calculateInsuranceProcessingTimes(completedAuths);
      const byMedication = this.calculateMedicationProcessingTimes(completedAuths);
      const byPriority = this.calculatePriorityProcessingTimes(completedAuths);
      const trends = await this.calculateProcessingTimeTrends(dateRange);

      return {
        overall: {
          avgProcessingTime,
          medianProcessingTime,
          minProcessingTime,
          maxProcessingTime,
          standardDeviation
        },
        byInsurance,
        byMedication,
        byPriority,
        trends,
        slaPerformance
      };
    } catch (error) {
      console.error('Failed to analyze processing times:', error);
      throw new Error('Processing time analysis failed');
    }
  }

  /**
   * Generate provider performance insights
   */
  async generateProviderInsights(providerId: string, dateRange?: { start: Date; end: Date }): Promise<any> {
    const range = dateRange || {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 months ago
      end: new Date()
    };

    try {
      const { data: authorizations, error } = await supabase
        .from('medication_authorizations')
        .select(`
          *,
          ai_recommendations!left(recommendation_type, confidence_score),
          medications(brand_name, generic_name),
          insurance_providers(name)
        `)
        .eq('provider_id', providerId)
        .gte('created_at', range.start.toISOString())
        .lte('created_at', range.end.toISOString());

      if (error) throw error;

      const data = authorizations || [];

      // Calculate key metrics
      const totalSubmissions = data.length;
      const approvals = data.filter(auth => auth.status === 'approved').length;
      const denials = data.filter(auth => auth.status === 'denied').length;
      const approvalRate = totalSubmissions > 0 ? (approvals / (approvals + denials)) * 100 : 0;

      // AI usage metrics
      const aiAssisted = data.filter(auth => auth.ai_confidence_score > 0).length;
      const aiUsageRate = totalSubmissions > 0 ? (aiAssisted / totalSubmissions) * 100 : 0;
      const avgAiConfidence = data
        .filter(auth => auth.ai_confidence_score > 0)
        .reduce((sum, auth) => sum + auth.ai_confidence_score, 0) / aiAssisted || 0;

      // Performance comparison with benchmarks
      const benchmarkApprovalRate = 75; // Industry benchmark
      const benchmarkProcessingTime = 48; // Hours
      
      const performance = {
        approvalRateVsBenchmark: approvalRate - benchmarkApprovalRate,
        efficiencyScore: this.calculateEfficiencyScore(data),
        qualityScore: this.calculateQualityScore(data),
        recommendations: this.generateProviderRecommendations(data, approvalRate, aiUsageRate)
      };

      return {
        summary: {
          totalSubmissions,
          approvalRate,
          aiUsageRate,
          avgAiConfidence,
          timeframe: range
        },
        performance,
        trends: await this.calculateProviderTrends(providerId, range),
        insights: this.generateProviderSpecificInsights(data)
      };
    } catch (error) {
      console.error('Failed to generate provider insights:', error);
      throw new Error('Provider insights generation failed');
    }
  }

  /**
   * Private helper methods
   */

  private async calculateOverviewMetrics(dateRange: { start: Date; end: Date }): Promise<any> {
    const { data: authorizations, error } = await supabase
      .from('medication_authorizations')
      .select(`
        *,
        ai_recommendations!left(recommendation_type, confidence_score)
      `)
      .gte('created_at', dateRange.start.toISOString())
      .lte('created_at', dateRange.end.toISOString());

    if (error) throw error;

    const data = authorizations || [];
    const totalAuthorizations = data.length;
    const pendingCount = data.filter(auth => ['submitted', 'under_review'].includes(auth.status)).length;
    const approvedCount = data.filter(auth => auth.status === 'approved').length;
    const deniedCount = data.filter(auth => auth.status === 'denied').length;

    const approvalRate = totalAuthorizations > 0 ? (approvedCount / (approvedCount + deniedCount)) * 100 : 0;
    const averageProcessingTime = await this.calculateAverageProcessingTime(data);
    const aiAccuracyRate = await this.calculateAIAccuracyRate(data);
    const costSavings = await this.calculateTotalCostSavings(data);

    return {
      totalAuthorizations,
      pendingCount,
      approvedCount,
      deniedCount,
      approvalRate,
      averageProcessingTime,
      aiAccuracyRate,
      costSavings
    };
  }

  private async calculateTrends(dateRange: { start: Date; end: Date }): Promise<any> {
    // Calculate daily, weekly, and monthly trends
    const dailyTrends = await this.calculateDailyTrends(dateRange);
    const weeklyTrends = await this.calculateWeeklyTrends(dateRange);
    const monthlyTrends = await this.calculateMonthlyTrends(dateRange);

    return {
      daily: dailyTrends,
      weekly: weeklyTrends,
      monthly: monthlyTrends
    };
  }

  private async calculatePerformanceMetrics(dateRange: { start: Date; end: Date }): Promise<any> {
    // Implementation would calculate provider, insurance, and medication performance
    return {
      topProviders: [],
      insurancePerformance: [],
      medicationStats: []
    };
  }

  private async calculateAIInsights(dateRange: { start: Date; end: Date }): Promise<any> {
    // Implementation would calculate AI-specific metrics
    return {
      accuracyTrend: [],
      recommendationDistribution: [],
      processingTimeReduction: 0,
      automationRate: 0
    };
  }

  private calculateAIAutomationSavings(authorizations: any[]): number {
    // Assume AI automation saves 30 minutes per authorization at $50/hour staff rate
    const aiAssistedCount = authorizations.filter(auth => auth.ai_confidence_score > 0).length;
    return aiAssistedCount * 0.5 * 50; // 30 minutes * hourly rate
  }

  private calculateAlternativeMedicationSavings(authorizations: any[]): number {
    // Calculate savings from AI-recommended alternatives
    // This would require integration with medication cost data
    return 0; // Placeholder
  }

  private calculateProcessOptimizationSavings(authorizations: any[]): number {
    // Calculate savings from streamlined processes
    return authorizations.length * 15; // $15 average per authorization
  }

  private calculateDenialPreventionSavings(authorizations: any[]): number {
    // Calculate savings from preventing denials through AI recommendations
    const aiRecommendedChanges = authorizations.filter(auth => 
      auth.ai_recommendations?.some((rec: any) => rec.recommendation_type === 'suggest_alternative')
    ).length;
    return aiRecommendedChanges * 200; // $200 average cost per appeal
  }

  private calculateProviderSuccessRates(data: any[]): ProviderSuccessRate[] {
    // Group by provider and calculate success rates
    const providerGroups = data.reduce((groups, auth) => {
      if (!groups[auth.provider_id]) {
        groups[auth.provider_id] = [];
      }
      groups[auth.provider_id].push(auth);
      return groups;
    }, {});

    return Object.entries(providerGroups).map(([providerId, auths]: [string, any]) => {
      const authArray = auths as any[];
      const approvals = authArray.filter(auth => auth.status === 'approved').length;
      const denials = authArray.filter(auth => auth.status === 'denied').length;
      const approvalRate = (approvals + denials) > 0 ? (approvals / (approvals + denials)) * 100 : 0;

      return {
        providerId,
        providerName: authArray[0]?.user_profiles?.first_name + ' ' + authArray[0]?.user_profiles?.last_name || 'Unknown',
        submissionCount: authArray.length,
        approvalRate,
        benchmarkComparison: approvalRate - 75 // Compare to 75% benchmark
      };
    });
  }

  private calculateInsuranceSuccessRates(data: any[]): InsuranceSuccessRate[] {
    // Similar implementation for insurance providers
    return [];
  }

  private calculateMedicationSuccessRates(data: any[]): MedicationSuccessRate[] {
    // Similar implementation for medications
    return [];
  }

  private async calculateSuccessRateTrends(dateRange: { start: Date; end: Date }): Promise<SuccessRateTrend[]> {
    // Calculate weekly trends over the date range
    return [];
  }

  private calculateInsuranceProcessingTimes(data: any[]): InsuranceProcessingTime[] {
    // Calculate processing times by insurance provider
    return [];
  }

  private calculateMedicationProcessingTimes(data: any[]): MedicationProcessingTime[] {
    // Calculate processing times by medication
    return [];
  }

  private calculatePriorityProcessingTimes(data: any[]): PriorityProcessingTime[] {
    // Calculate processing times by priority level
    return [];
  }

  private async calculateProcessingTimeTrends(dateRange: { start: Date; end: Date }): Promise<ProcessingTimeTrend[]> {
    // Calculate processing time trends over time
    return [];
  }

  private async calculateAverageProcessingTime(data: any[]): Promise<number> {
    // Calculate average processing time in hours
    return 48; // Placeholder
  }

  private async calculateAIAccuracyRate(data: any[]): Promise<number> {
    // Calculate AI prediction accuracy rate
    return 87; // Placeholder
  }

  private async calculateTotalCostSavings(data: any[]): Promise<number> {
    // Calculate total cost savings
    return 25000; // Placeholder
  }

  private async calculateDailyTrends(dateRange: { start: Date; end: Date }): Promise<TrendDataPoint[]> {
    // Calculate daily trend data
    return [];
  }

  private async calculateWeeklyTrends(dateRange: { start: Date; end: Date }): Promise<TrendDataPoint[]> {
    // Calculate weekly trend data
    return [];
  }

  private async calculateMonthlyTrends(dateRange: { start: Date; end: Date }): Promise<TrendDataPoint[]> {
    // Calculate monthly trend data
    return [];
  }

  private calculateEfficiencyScore(data: any[]): number {
    // Calculate provider efficiency score
    return 85; // Placeholder
  }

  private calculateQualityScore(data: any[]): number {
    // Calculate provider quality score
    return 92; // Placeholder
  }

  private generateProviderRecommendations(data: any[], approvalRate: number, aiUsageRate: number): string[] {
    const recommendations = [];

    if (approvalRate < 70) {
      recommendations.push('Consider reviewing clinical documentation practices to improve approval rates');
    }

    if (aiUsageRate < 50) {
      recommendations.push('Increase usage of AI recommendations to improve efficiency');
    }

    return recommendations;
  }

  private async calculateProviderTrends(providerId: string, dateRange: { start: Date; end: Date }): Promise<any[]> {
    // Calculate provider-specific trends
    return [];
  }

  private generateProviderSpecificInsights(data: any[]): string[] {
    // Generate actionable insights for the provider
    return [
      'Most successful medication categories for this provider',
      'Insurance providers with highest approval rates',
      'Optimal submission timing patterns'
    ];
  }
}