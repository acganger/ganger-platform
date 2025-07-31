/**
 * Staffing Analytics API Route
 * Clinical Staffing App - Migration-Aware Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { migrationAdapter, MigrationHelpers } from '@ganger/db';
import { migrationStaffingBusinessLogic } from '@ganger/utils/server';
import { withStandardErrorHandling } from '@ganger/utils';
import { withAuth } from '@ganger/auth/middleware';

// Configure migration adapters
migrationAdapter.updateConfig({
  enableMigrationMode: true,
  useNewSchema: process.env.MIGRATION_USE_NEW_SCHEMA === 'true',
  logMigrationQueries: process.env.NODE_ENV === 'development'
});

migrationStaffingBusinessLogic.updateConfig({
  enableMigrationMode: true,
  useNewSchema: process.env.MIGRATION_USE_NEW_SCHEMA === 'true',
  logMigrationOperations: process.env.NODE_ENV === 'development'
});

/**
 * GET /api/analytics/staffing
 * Get comprehensive staffing analytics
 */
export async function GET(request: NextRequest) {
  return withAuth(async (request, { user }) => {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const locationId = searchParams.get('locationId');

    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json({ success: false, error: 'startDate and endDate are required' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculate date range metrics
    const dateRange = {
      start_date: startDate,
      end_date: endDate
    };

    // Get all schedules in the date range
    const scheduleFilters: Record<string, any> = {
      schedule_date: { gte: startDate, lte: endDate },
      status: ['scheduled', 'confirmed', 'completed']
    };

    if (locationId) {
      scheduleFilters.location_id = locationId;
    }

    const schedules = await migrationAdapter.select(
      'staff_schedules',
      `
        *,
        staff_member:staff_members!inner(
          id, first_name, last_name, email, role, 
          hourly_rate, performance_score
        ),
        location:locations!inner(
          id, name, address, timezone
        )
      `,
      scheduleFilters
    );

    // Get provider schedules for coverage analysis
    const providerSchedules = await migrationAdapter.rawQuery(`
      SELECT * FROM provider_schedules_cache 
      WHERE schedule_date >= $1 AND schedule_date <= $2
      ${locationId ? 'AND location_id = $3' : ''}
    `, locationId ? [startDate, endDate, locationId] : [startDate, endDate]);

    // Calculate coverage metrics
    const coverageMetrics = await calculateCoverageMetrics(schedules, providerSchedules);

    // Calculate staff metrics
    const staffMetrics = await calculateStaffMetrics(schedules, start, end);

    // Calculate cost metrics
    const costMetrics = await calculateCostMetrics(schedules);

    // Calculate optimization metrics for each day
    const optimizationMetrics = await calculateOptimizationMetrics(
      schedules,
      providerSchedules,
      start,
      end,
      locationId || undefined
    );

    // Compile comprehensive analytics
    const analytics = {
      date_range: dateRange,
      coverage_metrics: coverageMetrics,
      staff_metrics: staffMetrics,
      cost_metrics: costMetrics,
      optimization_metrics: optimizationMetrics,
      generated_at: new Date().toISOString(),
      migration_mode: process.env.MIGRATION_USE_NEW_SCHEMA === 'true' ? 'new_schema' : 'old_schema'
    };

    return NextResponse.json({ success: true, data: analytics });
  });
}

/**
 * Calculate coverage metrics
 */
async function calculateCoverageMetrics(schedules: any[], providerSchedules: any[]) {
  const locationCoverageRates: Record<string, number> = {};
  const providerCoverageRates: Record<string, number> = {};
  
  // Group schedules by location
  const schedulesByLocation = schedules.reduce((acc, schedule) => {
    const locationId = schedule.location_id;
    if (!acc[locationId]) acc[locationId] = [];
    acc[locationId].push(schedule);
    return acc;
  }, {} as Record<string, any[]>);

  // Calculate coverage for each location
  let totalCoveredHours = 0;
  let totalRequiredHours = 0;
  let totalUncoveredHours = 0;

  for (const [locationId, locationSchedules] of Object.entries(schedulesByLocation)) {
    const locationProviderSchedules = providerSchedules.filter(p => p.location_id === locationId);
    
    // Calculate total provider hours for this location
    const providerHours = locationProviderSchedules.reduce((sum, provider) => {
      const start = new Date(`2000-01-01T${provider.start_time}`);
      const end = new Date(`2000-01-01T${provider.end_time}`);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);

    // Calculate total staff hours for this location
    const staffHours = (locationSchedules as any[]).reduce((sum, schedule) => {
      const start = new Date(`2000-01-01T${schedule.start_time}`);
      const end = new Date(`2000-01-01T${schedule.end_time}`);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);

    // Assume 1:1 ratio for optimal coverage (can be adjusted)
    const requiredHours = providerHours;
    const coverageRate = requiredHours > 0 ? (staffHours / requiredHours) * 100 : 100;
    
    locationCoverageRates[locationId] = Math.round(coverageRate * 100) / 100;
    
    totalCoveredHours += staffHours;
    totalRequiredHours += requiredHours;
    totalUncoveredHours += Math.max(0, requiredHours - staffHours);
  }

  // Calculate provider coverage rates
  const providersByLocation = providerSchedules.reduce((acc, provider) => {
    if (!acc[provider.location_id]) acc[provider.location_id] = [];
    acc[provider.location_id].push(provider);
    return acc;
  }, {} as Record<string, typeof providerSchedules>);

  for (const [locationId, providers] of Object.entries(providersByLocation)) {
    const locationSchedules = schedulesByLocation[locationId] || [];
    
    for (const provider of providers) {
      const supportingSchedules = locationSchedules.filter(schedule => {
        // Check if schedule overlaps with provider schedule
        const scheduleStart = new Date(`2000-01-01T${schedule.start_time}`);
        const scheduleEnd = new Date(`2000-01-01T${schedule.end_time}`);
        const providerStart = new Date(`2000-01-01T${provider.start_time}`);
        const providerEnd = new Date(`2000-01-01T${provider.end_time}`);
        
        return scheduleStart < providerEnd && scheduleEnd > providerStart;
      });
      
      const providerHours = (new Date(`2000-01-01T${provider.end_time}`).getTime() - 
                            new Date(`2000-01-01T${provider.start_time}`).getTime()) / (1000 * 60 * 60);
      
      const supportHours = supportingSchedules.reduce((sum, schedule) => {
        const start = new Date(`2000-01-01T${schedule.start_time}`);
        const end = new Date(`2000-01-01T${schedule.end_time}`);
        return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }, 0);
      
      const providerId = provider.physician_id || provider.id;
      providerCoverageRates[providerId] = providerHours > 0 ? 
        Math.round((supportHours / providerHours) * 100 * 100) / 100 : 0;
    }
  }

  const totalCoverageRate = totalRequiredHours > 0 ? 
    Math.round((totalCoveredHours / totalRequiredHours) * 100 * 100) / 100 : 100;

  return {
    total_coverage_rate: totalCoverageRate,
    location_coverage_rates: locationCoverageRates,
    provider_coverage_rates: providerCoverageRates,
    uncovered_hours: Math.round(totalUncoveredHours * 100) / 100
  };
}

/**
 * Calculate staff metrics
 */
async function calculateStaffMetrics(schedules: any[], startDate: Date, endDate: Date) {
  const staffUtilization: Record<string, number> = {};
  const staffHours: Record<string, number> = {};
  
  // Calculate total staff hours
  let totalStaffHours = 0;
  let crossLocationAssignments = 0;
  
  for (const schedule of schedules) {
    const staffId = schedule.staff_member_id;
    const start = new Date(`2000-01-01T${schedule.start_time}`);
    const end = new Date(`2000-01-01T${schedule.end_time}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    if (!staffHours[staffId]) staffHours[staffId] = 0;
    staffHours[staffId] += hours;
    totalStaffHours += hours;
    
    // Check if this is a cross-location assignment
    const staffMember = schedule.staff_member;
    if (staffMember && staffMember.base_location_id !== schedule.location_id) {
      crossLocationAssignments++;
    }
  }
  
  // Calculate utilization rates
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const workingDays = Math.min(daysDiff, daysDiff * 5 / 7); // Assume 5-day work week
  
  for (const [staffId, hours] of Object.entries(staffHours)) {
    const maxPossibleHours = workingDays * 8; // 8 hours per day
    staffUtilization[staffId] = Math.round((hours / maxPossibleHours) * 100 * 100) / 100;
  }
  
  const averageUtilization = Object.values(staffUtilization).length > 0 ?
    Object.values(staffUtilization).reduce((sum, util) => sum + util, 0) / Object.values(staffUtilization).length : 0;

  return {
    total_staff_hours: Math.round(totalStaffHours * 100) / 100,
    average_utilization_rate: Math.round(averageUtilization * 100) / 100,
    staff_utilization_by_member: staffUtilization,
    cross_location_assignments: crossLocationAssignments
  };
}

/**
 * Calculate cost metrics
 */
async function calculateCostMetrics(schedules: any[]) {
  let totalCost = 0;
  let overtimeCost = 0;
  let totalHours = 0;
  const costByLocation: Record<string, number> = {};
  
  for (const schedule of schedules) {
    const start = new Date(`2000-01-01T${schedule.start_time}`);
    const end = new Date(`2000-01-01T${schedule.end_time}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    const hourlyRate = schedule.staff_member?.hourly_rate || 25; // Default rate
    const regularHours = Math.min(hours, 8);
    const overtimeHours = Math.max(0, hours - 8);
    
    const regularCost = regularHours * hourlyRate;
    const overtimeCostForShift = overtimeHours * hourlyRate * 1.5; // Time and a half
    
    const shiftCost = regularCost + overtimeCostForShift;
    totalCost += shiftCost;
    overtimeCost += overtimeCostForShift;
    totalHours += hours;
    
    // Track cost by location
    const locationId = schedule.location_id;
    if (!costByLocation[locationId]) costByLocation[locationId] = 0;
    costByLocation[locationId] += shiftCost;
  }
  
  const costPerHour = totalHours > 0 ? totalCost / totalHours : 0;

  return {
    total_staffing_cost: Math.round(totalCost * 100) / 100,
    cost_per_hour: Math.round(costPerHour * 100) / 100,
    overtime_cost: Math.round(overtimeCost * 100) / 100,
    cost_by_location: Object.fromEntries(
      Object.entries(costByLocation).map(([id, cost]) => [id, Math.round(cost * 100) / 100])
    )
  };
}

/**
 * Calculate optimization metrics
 */
async function calculateOptimizationMetrics(
  schedules: any[],
  providerSchedules: any[],
  startDate: Date,
  endDate: Date,
  locationId?: string
) {
  // Calculate daily optimization scores
  const currentDate = new Date(startDate);
  const dailyScores = [];
  
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dailySchedules = schedules.filter(s => s.schedule_date === dateStr);
    const dailyProviders = providerSchedules.filter(p => p.schedule_date === dateStr);
    
    if (dailySchedules.length > 0 && dailyProviders.length > 0) {
      // Use migration-aware business logic to calculate metrics
      const dayMetrics = await migrationStaffingBusinessLogic.calculateStaffingMetricsWithMigration(
        locationId || dailySchedules[0].location_id,
        currentDate
      );
      
      dailyScores.push(dayMetrics.costEfficiencyScore);
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  const averageOptimizationScore = dailyScores.length > 0 ?
    dailyScores.reduce((sum, score) => sum + score, 0) / dailyScores.length : 0;
  
  // Count auto-assigned schedules
  const autoAssignedSchedules = schedules.filter(s => s.assignment_type === 'auto_assigned');
  
  return {
    optimization_score: Math.round(averageOptimizationScore * 100) / 100,
    suggestions_applied: autoAssignedSchedules.length,
    cost_savings_achieved: 0, // Would need historical comparison
    coverage_improvements: 0 // Would need historical comparison
  };
}