/**
 * Clinical Staffing Database Queries
 * Advanced queries for AI-powered staff optimization
 */

import { Database } from '../types/database';
import { BaseRepository } from '../utils/base-repository';

export type StaffMember = Database['public']['Tables']['staff_members']['Row'];
export type StaffAvailability = Database['public']['Tables']['staff_availability']['Row'];
export type StaffSchedule = Database['public']['Tables']['staff_schedules']['Row'];
export type ScheduleTemplate = Database['public']['Tables']['schedule_templates']['Row'];
export type CoverageRequirement = Database['public']['Tables']['coverage_requirements']['Row'];
export type OptimizationRun = Database['public']['Tables']['optimization_runs']['Row'];

export type StaffMemberInsert = Database['public']['Tables']['staff_members']['Insert'];
export type StaffAvailabilityInsert = Database['public']['Tables']['staff_availability']['Insert'];
export type StaffScheduleInsert = Database['public']['Tables']['staff_schedules']['Insert'];

export interface OptimalAssignment {
  staff_member_id: string;
  confidence_score: number;
  assignment_factors: {
    performance_score: number;
    patient_satisfaction: number;
    reliability: number;
    role_match: number;
    skills_match: number;
    availability_type: string;
  };
}

export interface StaffUtilization {
  staff_member_id: string;
  utilization_percentage: number;
  total_available_hours: number;
  total_scheduled_hours: number;
}

export interface ScheduleConflict {
  conflict_exists: boolean;
  conflicting_schedules: StaffSchedule[];
}

export interface StaffingMetrics {
  total_staff: number;
  active_staff: number;
  coverage_percentage: number;
  average_utilization: number;
  understaffed_slots: number;
  overstaffed_slots: number;
}

export class ClinicalStaffingQueries extends BaseRepository<StaffMember> {
  constructor() {
    super('staff_members');
  }

  // =====================================================
  // STAFF MEMBER QUERIES
  // =====================================================

  async getActiveStaffMembers(locationId?: string): Promise<StaffMember[]> {
    let query = this.client
      .from('staff_members')
      .select('*')
      .eq('employee_status', 'active');

    if (locationId) {
      query = query.or(`base_location_id.eq.${locationId},available_locations.cs.{${locationId}}`);
    }

    const { data, error } = await query.order('last_name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  async getStaffMemberWithSkills(skills: string[]): Promise<StaffMember[]> {
    const { data, error } = await this.client
      .from('staff_members')
      .select('*')
      .eq('employee_status', 'active')
      .contains('skills', skills.map(skill => ({ skill })));

    if (error) throw error;
    return data || [];
  }

  async updateStaffPerformanceMetrics(
    staffMemberId: string,
    metrics: {
      performance_score?: number;
      patient_satisfaction_score?: number;
      reliability_score?: number;
      productivity_metrics?: Record<string, any>;
    }
  ): Promise<StaffMember> {
    const { data, error } = await this.client
      .from('staff_members')
      .update(metrics)
      .eq('id', staffMemberId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // =====================================================
  // AVAILABILITY QUERIES
  // =====================================================

  async getStaffAvailability(
    staffMemberId: string,
    startDate: string,
    endDate: string
  ): Promise<StaffAvailability[]> {
    const { data, error } = await this.client
      .from('staff_availability')
      .select('*')
      .eq('staff_member_id', staffMemberId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async bulkUpdateAvailability(
    availabilityUpdates: Array<{
      id?: string;
      staff_member_id: string;
      date: string;
      start_time: string;
      end_time: string;
      availability_type: 'available' | 'unavailable' | 'preferred' | 'conditional';
      reason?: string;
    }>
  ): Promise<StaffAvailability[]> {
    const results: StaffAvailability[] = [];

    for (const update of availabilityUpdates) {
      if (update.id) {
        // Update existing
        const { data, error } = await this.client
          .from('staff_availability')
          .update(update)
          .eq('id', update.id)
          .select()
          .single();
        
        if (error) throw error;
        results.push(data);
      } else {
        // Insert new
        const { data, error } = await this.client
          .from('staff_availability')
          .insert(update)
          .select()
          .single();
        
        if (error) throw error;
        results.push(data);
      }
    }

    return results;
  }

  // =====================================================
  // SCHEDULE QUERIES
  // =====================================================

  async getSchedulesByDateRange(
    startDate: string,
    endDate: string,
    locationId?: string,
    staffMemberId?: string
  ): Promise<(StaffSchedule & { staff_member: StaffMember })[]> {
    let query = this.client
      .from('staff_schedules')
      .select(`
        *,
        staff_member:staff_members(*)
      `)
      .gte('schedule_date', startDate)
      .lte('schedule_date', endDate)
      .neq('status', 'cancelled');

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    if (staffMemberId) {
      query = query.eq('staff_member_id', staffMemberId);
    }

    const { data, error } = await query.order('schedule_date').order('start_time');
    
    if (error) throw error;
    return data || [];
  }

  async checkScheduleConflicts(
    staffMemberId: string,
    scheduleDate: string,
    startTime: string,
    endTime: string,
    excludeScheduleId?: string
  ): Promise<ScheduleConflict> {
    const { data, error } = await this.client.rpc('check_schedule_conflicts', {
      p_staff_member_id: staffMemberId,
      p_schedule_date: scheduleDate,
      p_start_time: startTime,
      p_end_time: endTime,
      p_exclude_schedule_id: excludeScheduleId || null
    });

    if (error) throw error;

    const conflictExists = data as boolean;
    let conflictingSchedules: StaffSchedule[] = [];

    if (conflictExists) {
      const { data: schedules, error: schedulesError } = await this.client
        .from('staff_schedules')
        .select('*')
        .eq('staff_member_id', staffMemberId)
        .eq('schedule_date', scheduleDate)
        .neq('status', 'cancelled')
        .or(`start_time.lte.${endTime},end_time.gte.${startTime}`);

      if (schedulesError) throw schedulesError;
      conflictingSchedules = schedules || [];
    }

    return {
      conflict_exists: conflictExists,
      conflicting_schedules: conflictingSchedules
    };
  }

  async getOptimalStaffAssignment(
    locationId: string,
    scheduleDate: string,
    startTime: string,
    endTime: string,
    requiredRole: string,
    requiredSkills: string[] = []
  ): Promise<OptimalAssignment[]> {
    const { data, error } = await this.client.rpc('get_optimal_staff_assignment', {
      p_location_id: locationId,
      p_schedule_date: scheduleDate,
      p_start_time: startTime,
      p_end_time: endTime,
      p_required_role: requiredRole,
      p_required_skills: JSON.stringify(requiredSkills)
    });

    if (error) throw error;
    return data || [];
  }

  async createOptimizedSchedule(
    assignments: Array<{
      staff_member_id: string;
      location_id: string;
      schedule_date: string;
      start_time: string;
      end_time: string;
      assigned_role: string;
      ai_confidence_score: number;
      optimization_factors: Record<string, any>;
    }>
  ): Promise<StaffSchedule[]> {
    const { data, error } = await this.client
      .from('staff_schedules')
      .insert(assignments)
      .select();

    if (error) throw error;
    return data || [];
  }

  // =====================================================
  // COVERAGE AND OPTIMIZATION QUERIES
  // =====================================================

  async getCoverageRequirements(
    locationId: string,
    effectiveDate: string
  ): Promise<CoverageRequirement[]> {
    const { data, error } = await this.client
      .from('coverage_requirements')
      .select('*')
      .eq('location_id', locationId)
      .lte('effective_date', effectiveDate)
      .or(`end_date.is.null,end_date.gte.${effectiveDate}`)
      .order('priority_level', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async calculateStaffUtilization(
    staffMemberId: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    const { data, error } = await this.client.rpc('calculate_staff_utilization', {
      p_staff_member_id: staffMemberId,
      p_start_date: startDate,
      p_end_date: endDate
    });

    if (error) throw error;
    return data || 0;
  }

  async getStaffingMetrics(
    locationId: string,
    startDate: string,
    endDate: string
  ): Promise<StaffingMetrics> {
    // Get total and active staff count
    const { data: staffData, error: staffError } = await this.client
      .from('staff_members')
      .select('id, employee_status')
      .or(`base_location_id.eq.${locationId},available_locations.cs.{${locationId}}`);

    if (staffError) throw staffError;

    const totalStaff = staffData?.length || 0;
    const activeStaff = staffData?.filter(s => s.employee_status === 'active').length || 0;

    // Get coverage requirements vs actual schedules
    const { data: coverageData, error: coverageError } = await this.client
      .from('coverage_requirements')
      .select('*')
      .eq('location_id', locationId)
      .lte('effective_date', endDate)
      .or(`end_date.is.null,end_date.gte.${startDate}`);

    if (coverageError) throw coverageError;

    const { data: scheduleData, error: scheduleError } = await this.client
      .from('staff_schedules')
      .select('*')
      .eq('location_id', locationId)
      .gte('schedule_date', startDate)
      .lte('schedule_date', endDate)
      .neq('status', 'cancelled');

    if (scheduleError) throw scheduleError;

    // Calculate basic metrics (simplified for now)
    const totalRequiredSlots = coverageData?.length || 0;
    const totalScheduledSlots = scheduleData?.length || 0;
    const coveragePercentage = totalRequiredSlots > 0 
      ? Math.min(100, (totalScheduledSlots / totalRequiredSlots) * 100) 
      : 100;

    // Calculate average utilization for active staff
    const utilisationPromises = staffData
      ?.filter(s => s.employee_status === 'active')
      .map(s => this.calculateStaffUtilization(s.id, startDate, endDate)) || [];
    
    const utilisations = await Promise.all(utilisationPromises);
    const averageUtilization = utilisations.length > 0 
      ? utilisations.reduce((sum, util) => sum + util, 0) / utilisations.length 
      : 0;

    return {
      total_staff: totalStaff,
      active_staff: activeStaff,
      coverage_percentage: Math.round(coveragePercentage * 100) / 100,
      average_utilization: Math.round(averageUtilization * 100) / 100,
      understaffed_slots: Math.max(0, totalRequiredSlots - totalScheduledSlots),
      overstaffed_slots: Math.max(0, totalScheduledSlots - totalRequiredSlots)
    };
  }

  // =====================================================
  // OPTIMIZATION RUN QUERIES
  // =====================================================

  async createOptimizationRun(
    runData: {
      run_type: 'daily' | 'weekly' | 'monthly' | 'manual' | 'emergency';
      schedule_start_date: string;
      schedule_end_date: string;
      location_ids: string[];
      optimization_strategy: 'cost_minimize' | 'quality_maximize' | 'balanced' | 'coverage_priority';
      constraints?: Record<string, any>;
    }
  ): Promise<OptimizationRun> {
    const { data, error } = await this.client
      .from('optimization_runs')
      .insert({
        ...runData,
        status: 'running',
        algorithm_version: '1.0.0'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateOptimizationRun(
    runId: string,
    updates: {
      status?: 'running' | 'completed' | 'failed' | 'cancelled';
      coverage_percentage?: number;
      total_cost?: number;
      quality_score?: number;
      computation_time_seconds?: number;
      schedules_created?: number;
      schedules_modified?: number;
      conflicts_resolved?: number;
      optimization_report?: Record<string, any>;
      recommendations?: any[];
      warnings?: any[];
    }
  ): Promise<OptimizationRun> {
    const { data, error } = await this.client
      .from('optimization_runs')
      .update(updates)
      .eq('id', runId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getOptimizationHistory(
    locationId?: string,
    limit: number = 10
  ): Promise<OptimizationRun[]> {
    let query = this.client
      .from('optimization_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (locationId) {
      query = query.contains('location_ids', [locationId]);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }

  // =====================================================
  // EXTERNAL SYSTEM SYNC QUERIES
  // =====================================================

  async logExternalSync(
    systemName: 'deputy' | 'zenefits' | 'modmed',
    syncType: string,
    status: 'started' | 'in_progress' | 'completed' | 'failed' | 'partial' = 'started'
  ): Promise<string> {
    const { data, error } = await this.client
      .from('external_sync_log')
      .insert({
        system_name: systemName,
        sync_type: syncType,
        status: status,
        start_time: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  async updateExternalSync(
    syncId: string,
    updates: {
      status?: 'started' | 'in_progress' | 'completed' | 'failed' | 'partial';
      records_processed?: number;
      records_created?: number;
      records_updated?: number;
      records_failed?: number;
      error_message?: string;
      error_details?: Record<string, any>;
      external_ids?: string[];
      affected_records?: string[];
      end_time?: string;
      duration_seconds?: number;
    }
  ): Promise<void> {
    const updateData = {
      ...updates,
      end_time: ['completed', 'failed', 'partial'].includes(updates.status || '') 
        ? new Date().toISOString() 
        : undefined
    };

    // Calculate duration if end_time is set
    if (updateData.end_time) {
      const { data: logData, error: logError } = await this.client
        .from('external_sync_log')
        .select('start_time')
        .eq('id', syncId)
        .single();

      if (!logError && logData) {
        const startTime = new Date(logData.start_time);
        const endTime = new Date(updateData.end_time);
        updateData.duration_seconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
      }
    }

    const { error } = await this.client
      .from('external_sync_log')
      .update(updateData)
      .eq('id', syncId);

    if (error) throw error;
  }

  async getRecentSyncStatus(
    systemName?: 'deputy' | 'zenefits' | 'modmed',
    syncType?: string,
    limit: number = 20
  ): Promise<any[]> {
    let query = this.client
      .from('external_sync_log')
      .select('*')
      .order('start_time', { ascending: false })
      .limit(limit);

    if (systemName) {
      query = query.eq('system_name', systemName);
    }

    if (syncType) {
      query = query.eq('sync_type', syncType);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }
}