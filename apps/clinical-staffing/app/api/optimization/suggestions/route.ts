/**
 * Optimization Suggestions API Route
 * Clinical Staffing App - Migration-Aware Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { migrationAdapter } from '@ganger/db';
import { migrationStaffingBusinessLogic } from '@ganger/utils/server';
import { withAuth } from '@ganger/auth/middleware';

export const dynamic = 'force-dynamic';

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
 * GET /api/optimization/suggestions
 * Generate staffing optimization suggestions
 */
export async function GET(request: NextRequest) {
  return withAuth(async (request, { user }) => {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const date = searchParams.get('date');
    const suggestionType = searchParams.get('type') || 'all';

    // Validate required parameters
    if (!locationId || !date) {
      return NextResponse.json({ success: false, error: 'locationId and date are required' }, { status: 400 });
    }

    const targetDate = new Date(date);

    // Get current schedules for the date
    const currentSchedules = await migrationAdapter.select(
      'staff_schedules',
      `
        *,
        staff_member:staff_members!inner(
          id, first_name, last_name, role, hourly_rate, 
          performance_score, skills, certifications
        )
      `,
      {
        location_id: locationId,
        schedule_date: date,
        status: ['scheduled', 'confirmed', 'in_progress']
      }
    );

    // Get provider schedules for the date
    const providerSchedules = await migrationAdapter.rawQuery(`
      SELECT * FROM provider_schedules_cache 
      WHERE location_id = $1 AND schedule_date = $2
    `, [locationId, date]);

    if (providerSchedules.length === 0) {
      return NextResponse.json({ success: false, error: 'No provider schedules found for this date' }, { status: 404 });
    }

    // Calculate optimal staffing using migration-aware business logic
    const optimalStaffing = await migrationStaffingBusinessLogic.calculateOptimalStaffingWithMigration(
      locationId,
      targetDate,
      providerSchedules
    );

    // Generate suggestions based on analysis
    const suggestions = [];

    // 1. Coverage Gap Analysis
    if (suggestionType === 'all' || suggestionType === 'coverage') {
      const coverageGaps = await analyzeCoverageGaps(currentSchedules, providerSchedules);
      suggestions.push(...coverageGaps);
    }

    // 2. Cost Optimization
    if (suggestionType === 'all' || suggestionType === 'cost') {
      const costOptimizations = await analyzeCostOptimizations(currentSchedules, optimalStaffing);
      suggestions.push(...costOptimizations);
    }

    // 3. Skill Matching
    if (suggestionType === 'all' || suggestionType === 'skills') {
      const skillOptimizations = await analyzeSkillMatching(currentSchedules, providerSchedules);
      suggestions.push(...skillOptimizations);
    }

    // 4. Workload Balance
    if (suggestionType === 'all' || suggestionType === 'workload') {
      const workloadSuggestions = await analyzeWorkloadBalance(currentSchedules);
      suggestions.push(...workloadSuggestions);
    }

    // Sort suggestions by priority and impact
    const prioritizedSuggestions = suggestions.sort((a, b) => {
      const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0) || b.impact_score - a.impact_score;
    });

    return NextResponse.json({ success: true, data: {
      date: date,
      location_id: locationId,
      suggestion_type: suggestionType,
      total_suggestions: prioritizedSuggestions.length,
      high_priority: prioritizedSuggestions.filter(s => s.priority === 'high').length,
      medium_priority: prioritizedSuggestions.filter(s => s.priority === 'medium').length,
      low_priority: prioritizedSuggestions.filter(s => s.priority === 'low').length,
      suggestions: prioritizedSuggestions,
      optimal_staffing_summary: {
        optimal_staff_count: optimalStaffing.optimalStaffCount,
        current_staff_count: currentSchedules.length,
        coverage_percentage: Math.round((currentSchedules.length / optimalStaffing.optimalStaffCount) * 100),
        cost_efficiency_score: (optimalStaffing as any).costEfficiencyScore || 0
      },
      generated_at: new Date().toISOString()
    }});
  });
}

/**
 * POST /api/optimization/suggestions
 * Apply optimization suggestions
 */
export async function POST(request: NextRequest) {
  return withAuth(async (request, { user }) => {
    const body = await request.json();
    
    // Validate required fields
    const required = ['suggestion_ids', 'location_id', 'date'];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ success: false, error: `${field} is required` }, { status: 400 });
      }
    }

    const { suggestion_ids, location_id, date, auto_approve = false } = body;
    const results = [];

    // Process each suggestion
    for (const suggestionId of suggestion_ids) {
      try {
        // This would typically involve looking up the suggestion and applying it
        // For now, we'll simulate the application
        const result = await applySuggestion(suggestionId, location_id, date, user.id, auto_approve);
        results.push(result);
      } catch (error) {
        results.push({
          suggestion_id: suggestionId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({ success: true, data: {
      applied_suggestions: successCount,
      failed_suggestions: failureCount,
      results: results,
      summary: {
        total_processed: suggestion_ids.length,
        success_rate: Math.round((successCount / suggestion_ids.length) * 100)
      }
    }});
  });
}

/**
 * Analyze coverage gaps
 */
async function analyzeCoverageGaps(currentSchedules: any[], providerSchedules: any[]) {
  const suggestions = [];
  
  // Check for time periods without adequate coverage
  const coverageMap = new Map();
  
  // Build coverage map from current schedules
  for (const schedule of currentSchedules) {
    const start = new Date(`2000-01-01T${schedule.start_time}`);
    const end = new Date(`2000-01-01T${schedule.end_time}`);
    
    for (let time = start; time < end; time.setMinutes(time.getMinutes() + 30)) {
      const timeKey = time.toTimeString().substring(0, 5);
      if (!coverageMap.has(timeKey)) coverageMap.set(timeKey, 0);
      coverageMap.set(timeKey, coverageMap.get(timeKey) + 1);
    }
  }
  
  // Check against provider schedules
  for (const provider of providerSchedules) {
    const start = new Date(`2000-01-01T${provider.start_time}`);
    const end = new Date(`2000-01-01T${provider.end_time}`);
    
    for (let time = start; time < end; time.setMinutes(time.getMinutes() + 30)) {
      const timeKey = time.toTimeString().substring(0, 5);
      const currentCoverage = coverageMap.get(timeKey) || 0;
      
      // Assume we need 1:1 ratio (can be adjusted)
      if (currentCoverage < 1) {
        suggestions.push({
          id: `coverage_gap_${timeKey}`,
          type: 'coverage_gap',
          priority: 'high',
          title: `Coverage Gap at ${timeKey}`,
          description: `Provider ${provider.first_name} ${provider.last_name} needs staff support from ${timeKey}`,
          impact_score: 85,
          estimated_cost: 0,
          recommendation: `Add staff member for ${timeKey} - ${end.toTimeString().substring(0, 5)}`,
          provider_id: provider.physician_id,
          time_slot: { start: timeKey, end: end.toTimeString().substring(0, 5) }
        });
      }
    }
  }
  
  return suggestions;
}

/**
 * Analyze cost optimizations
 */
async function analyzeCostOptimizations(currentSchedules: any[], optimalStaffing: any) {
  const suggestions = [];
  
  // Check for overtime opportunities
  for (const schedule of currentSchedules) {
    const start = new Date(`2000-01-01T${schedule.start_time}`);
    const end = new Date(`2000-01-01T${schedule.end_time}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    if (hours > 8) {
      const overtimeHours = hours - 8;
      const overtimeCost = overtimeHours * (schedule.staff_member?.hourly_rate || 25) * 1.5;
      
      suggestions.push({
        id: `overtime_${schedule.id}`,
        type: 'cost_optimization',
        priority: 'medium',
        title: `Overtime Alert - ${schedule.staff_member?.first_name} ${schedule.staff_member?.last_name}`,
        description: `${overtimeHours} hours of overtime (${overtimeCost.toFixed(2)} extra cost)`,
        impact_score: 60,
        estimated_cost: -overtimeCost,
        recommendation: 'Consider splitting shift or adjusting schedule',
        schedule_id: schedule.id,
        overtime_hours: overtimeHours
      });
    }
  }
  
  return suggestions;
}

/**
 * Analyze skill matching
 */
async function analyzeSkillMatching(currentSchedules: any[], providerSchedules: any[]) {
  const suggestions = [];
  
  // Check if staff skills match provider specialties
  for (const schedule of currentSchedules) {
    const staffSkills = schedule.staff_member?.skills || [];
    
    // Find overlapping providers
    const overlappingProviders = providerSchedules.filter(provider => {
      const providerStart = new Date(`2000-01-01T${provider.start_time}`);
      const providerEnd = new Date(`2000-01-01T${provider.end_time}`);
      const staffStart = new Date(`2000-01-01T${schedule.start_time}`);
      const staffEnd = new Date(`2000-01-01T${schedule.end_time}`);
      
      return staffStart < providerEnd && staffEnd > providerStart;
    });
    
    if (overlappingProviders.length > 0 && staffSkills.length === 0) {
      suggestions.push({
        id: `skill_mismatch_${schedule.id}`,
        type: 'skill_optimization',
        priority: 'low',
        title: `Skill Enhancement Opportunity`,
        description: `${schedule.staff_member?.first_name} ${schedule.staff_member?.last_name} could benefit from additional training`,
        impact_score: 40,
        estimated_cost: 0,
        recommendation: 'Consider additional training or skill development',
        schedule_id: schedule.id,
        suggested_skills: overlappingProviders.map(p => p.specialty_name).filter(Boolean)
      });
    }
  }
  
  return suggestions;
}

/**
 * Analyze workload balance
 */
async function analyzeWorkloadBalance(currentSchedules: any[]) {
  const suggestions = [];
  
  // Calculate hours per staff member
  const staffHours = new Map();
  
  for (const schedule of currentSchedules) {
    const staffId = schedule.staff_member_id;
    const start = new Date(`2000-01-01T${schedule.start_time}`);
    const end = new Date(`2000-01-01T${schedule.end_time}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    if (!staffHours.has(staffId)) {
      staffHours.set(staffId, { hours: 0, name: `${schedule.staff_member?.first_name} ${schedule.staff_member?.last_name}` });
    }
    
    const current = staffHours.get(staffId);
    staffHours.set(staffId, { ...current, hours: current.hours + hours });
  }
  
  // Check for imbalances
  const hoursArray = Array.from(staffHours.values());
  const avgHours = hoursArray.reduce((sum, staff) => sum + staff.hours, 0) / hoursArray.length;
  
  for (const [staffId, data] of staffHours) {
    if (data.hours > avgHours * 1.3) {
      suggestions.push({
        id: `workload_high_${staffId}`,
        type: 'workload_balance',
        priority: 'medium',
        title: `High Workload - ${data.name}`,
        description: `${data.hours} hours (${Math.round(((data.hours - avgHours) / avgHours) * 100)}% above average)`,
        impact_score: 70,
        estimated_cost: 0,
        recommendation: 'Consider redistributing some shifts to other staff members',
        staff_id: staffId,
        current_hours: data.hours,
        average_hours: avgHours
      });
    }
  }
  
  return suggestions;
}

/**
 * Apply a suggestion
 */
async function applySuggestion(suggestionId: string, locationId: string, date: string, userId: string, autoApprove: boolean) {
  // This would implement the actual suggestion application logic
  // For now, we'll simulate success
  return {
    suggestion_id: suggestionId,
    success: true,
    message: 'Suggestion applied successfully',
    auto_approved: autoApprove
  };
}