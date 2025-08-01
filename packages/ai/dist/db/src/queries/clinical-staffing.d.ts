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
export declare class ClinicalStaffingQueries extends BaseRepository<StaffMember> {
    constructor();
    getActiveStaffMembers(locationId?: string): Promise<StaffMember[]>;
    getStaffMemberWithSkills(skills: string[]): Promise<StaffMember[]>;
    updateStaffPerformanceMetrics(staffMemberId: string, metrics: {
        performance_score?: number;
        patient_satisfaction_score?: number;
        reliability_score?: number;
        productivity_metrics?: Record<string, any>;
    }): Promise<StaffMember>;
    getStaffAvailability(staffMemberId: string, startDate: string, endDate: string): Promise<StaffAvailability[]>;
    bulkUpdateAvailability(availabilityUpdates: Array<{
        id?: string;
        staff_member_id: string;
        date: string;
        start_time: string;
        end_time: string;
        availability_type: 'available' | 'unavailable' | 'preferred' | 'conditional';
        reason?: string;
    }>): Promise<StaffAvailability[]>;
    getSchedulesByDateRange(startDate: string, endDate: string, locationId?: string, staffMemberId?: string): Promise<(StaffSchedule & {
        staff_member: StaffMember;
    })[]>;
    checkScheduleConflicts(staffMemberId: string, scheduleDate: string, startTime: string, endTime: string, excludeScheduleId?: string): Promise<ScheduleConflict>;
    getOptimalStaffAssignment(locationId: string, scheduleDate: string, startTime: string, endTime: string, requiredRole: string, requiredSkills?: string[]): Promise<OptimalAssignment[]>;
    createOptimizedSchedule(assignments: Array<{
        staff_member_id: string;
        location_id: string;
        schedule_date: string;
        start_time: string;
        end_time: string;
        assigned_role: string;
        ai_confidence_score: number;
        optimization_factors: Record<string, any>;
    }>): Promise<StaffSchedule[]>;
    getCoverageRequirements(locationId: string, effectiveDate: string): Promise<CoverageRequirement[]>;
    calculateStaffUtilization(staffMemberId: string, startDate: string, endDate: string): Promise<number>;
    getStaffingMetrics(locationId: string, startDate: string, endDate: string): Promise<StaffingMetrics>;
    createOptimizationRun(runData: {
        run_type: 'daily' | 'weekly' | 'monthly' | 'manual' | 'emergency';
        schedule_start_date: string;
        schedule_end_date: string;
        location_ids: string[];
        optimization_strategy: 'cost_minimize' | 'quality_maximize' | 'balanced' | 'coverage_priority';
        constraints?: Record<string, any>;
    }): Promise<OptimizationRun>;
    updateOptimizationRun(runId: string, updates: {
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
    }): Promise<OptimizationRun>;
    getOptimizationHistory(locationId?: string, limit?: number): Promise<OptimizationRun[]>;
    logExternalSync(systemName: 'deputy' | 'zenefits' | 'modmed', syncType: string, status?: 'started' | 'in_progress' | 'completed' | 'failed' | 'partial'): Promise<string>;
    updateExternalSync(syncId: string, updates: {
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
    }): Promise<void>;
    getRecentSyncStatus(systemName?: 'deputy' | 'zenefits' | 'modmed', syncType?: string, limit?: number): Promise<any[]>;
}
//# sourceMappingURL=clinical-staffing.d.ts.map