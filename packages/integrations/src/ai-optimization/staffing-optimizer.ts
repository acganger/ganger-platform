/**
 * AI-Powered Clinical Staffing Optimization Engine
 * Advanced algorithms for optimal staff allocation and scheduling
 */

import { ClinicalStaffingQueries, StaffMember, OptimalAssignment } from '@ganger/db';

export interface OptimizationConstraints {
  maxOvertimeHours?: number;
  minBreakBetweenShifts?: number; // hours
  maxConsecutiveWorkDays?: number;
  preferredStaffUtilization?: number; // percentage
  budgetLimit?: number;
  qualityThreshold?: number; // minimum quality score
  mandatorySkills?: Record<string, string[]>; // role -> required skills
  locationCapacity?: Record<string, number>; // location -> max staff
}

export interface OptimizationObjective {
  strategy: 'cost_minimize' | 'quality_maximize' | 'balanced' | 'coverage_priority';
  weights: {
    cost: number;
    quality: number;
    coverage: number;
    satisfaction: number;
  };
}

export interface ScheduleAssignment {
  staffMemberId: string;
  locationId: string;
  date: string;
  startTime: string;
  endTime: string;
  role: string;
  confidenceScore: number;
  estimatedCost: number;
  qualityScore: number;
  constraints: string[];
  alternatives: OptimalAssignment[];
}

export interface OptimizationResult {
  assignments: ScheduleAssignment[];
  metrics: {
    totalCost: number;
    averageQuality: number;
    coveragePercentage: number;
    staffUtilization: number;
    constraintViolations: number;
  };
  warnings: string[];
  recommendations: string[];
  computationTimeMs: number;
}

export interface StaffingDemand {
  locationId: string;
  date: string;
  timeSlot: {
    startTime: string;
    endTime: string;
  };
  requiredRole: string;
  requiredSkills: string[];
  minStaffCount: number;
  maxStaffCount?: number;
  priority: number; // 1-5, 1 = highest
  estimatedWorkload: number; // 1-10 scale
}

export class StaffingOptimizer {
  private db: ClinicalStaffingQueries;
  
  constructor(dbQueries: ClinicalStaffingQueries) {
    this.db = dbQueries;
  }

  // =====================================================
  // MAIN OPTIMIZATION ENGINE
  // =====================================================

  async optimizeSchedule(
    demands: StaffingDemand[],
    constraints: OptimizationConstraints = {},
    objective: OptimizationObjective = this.getDefaultObjective()
  ): Promise<OptimizationResult> {
    const startTime = Date.now();
    
    try {
      // 1. Validate inputs
      this.validateOptimizationInputs(demands, constraints, objective);
      
      // 2. Get available staff and their availability
      const availableStaff = await this.getAvailableStaff(demands);
      
      // 3. Generate initial assignments using greedy algorithm
      const initialAssignments = await this.generateInitialAssignments(
        demands, 
        availableStaff, 
        constraints
      );
      
      // 4. Optimize assignments using local search
      const optimizedAssignments = await this.optimizeAssignments(
        initialAssignments,
        demands,
        constraints,
        objective
      );
      
      // 5. Validate constraints and calculate metrics
      const result = await this.buildOptimizationResult(
        optimizedAssignments,
        demands,
        objective,
        Date.now() - startTime
      );
      
      return result;
    } catch (error) {
      throw new Error(`Optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // =====================================================
  // ASSIGNMENT GENERATION
  // =====================================================

  private async generateInitialAssignments(
    demands: StaffingDemand[],
    availableStaff: Map<string, StaffMember[]>,
    constraints: OptimizationConstraints
  ): Promise<ScheduleAssignment[]> {
    const assignments: ScheduleAssignment[] = [];
    
    // Sort demands by priority (highest first)
    const sortedDemands = demands.sort((a, b) => a.priority - b.priority);
    
    for (const demand of sortedDemands) {
      const staffForLocation = availableStaff.get(demand.locationId) || [];
      
      // Get optimal assignments for this demand
      const optimalAssignments = await this.db.getOptimalStaffAssignment(
        demand.locationId,
        demand.date,
        demand.timeSlot.startTime,
        demand.timeSlot.endTime,
        demand.requiredRole,
        demand.requiredSkills
      );
      
      // Filter by constraints and select best candidates
      const validAssignments = await this.filterByConstraints(
        optimalAssignments,
        demand,
        constraints,
        assignments // existing assignments to check conflicts
      );
      
      // Select top candidates based on confidence and requirements
      const selectedCount = Math.min(demand.minStaffCount, validAssignments.length);
      const selectedAssignments = validAssignments.slice(0, selectedCount);
      
      for (const assignment of selectedAssignments) {
        const scheduleAssignment: ScheduleAssignment = {
          staffMemberId: assignment.staff_member_id,
          locationId: demand.locationId,
          date: demand.date,
          startTime: demand.timeSlot.startTime,
          endTime: demand.timeSlot.endTime,
          role: demand.requiredRole,
          confidenceScore: assignment.confidence_score,
          estimatedCost: await this.calculateStaffCost(
            assignment.staff_member_id,
            demand.timeSlot.startTime,
            demand.timeSlot.endTime
          ),
          qualityScore: assignment.assignment_factors.performance_score || 5.0,
          constraints: [],
          alternatives: validAssignments.slice(selectedCount, selectedCount + 3) // Keep alternatives
        };
        
        assignments.push(scheduleAssignment);
      }
    }
    
    return assignments;
  }

  // =====================================================
  // CONSTRAINT VALIDATION
  // =====================================================

  private async filterByConstraints(
    assignments: OptimalAssignment[],
    demand: StaffingDemand,
    constraints: OptimizationConstraints,
    existingAssignments: ScheduleAssignment[]
  ): Promise<OptimalAssignment[]> {
    const validAssignments: OptimalAssignment[] = [];
    
    for (const assignment of assignments) {
      const violations = await this.checkConstraintViolations(
        assignment,
        demand,
        constraints,
        existingAssignments
      );
      
      // Only include if no hard constraint violations
      if (violations.every(v => v.severity !== 'hard')) {
        validAssignments.push(assignment);
      }
    }
    
    return validAssignments;
  }

  private async checkConstraintViolations(
    assignment: OptimalAssignment,
    demand: StaffingDemand,
    constraints: OptimizationConstraints,
    existingAssignments: ScheduleAssignment[]
  ): Promise<Array<{ type: string; severity: 'hard' | 'soft'; message: string }>> {
    const violations: Array<{ type: string; severity: 'hard' | 'soft'; message: string }> = [];
    
    // Check for scheduling conflicts
    const hasConflict = existingAssignments.some(existing => 
      existing.staffMemberId === assignment.staff_member_id &&
      existing.date === demand.date &&
      this.timePeriodsOverlap(
        existing.startTime, existing.endTime,
        demand.timeSlot.startTime, demand.timeSlot.endTime
      )
    );
    
    if (hasConflict) {
      violations.push({
        type: 'schedule_conflict',
        severity: 'hard',
        message: 'Staff member already scheduled during this time'
      });
    }
    
    // Check maximum overtime hours
    if (constraints.maxOvertimeHours !== undefined) {
      const weeklyHours = await this.calculateWeeklyHours(
        assignment.staff_member_id,
        demand.date
      );
      
      const shiftHours = this.calculateShiftHours(
        demand.timeSlot.startTime,
        demand.timeSlot.endTime
      );
      
      if (weeklyHours + shiftHours > 40 + constraints.maxOvertimeHours) {
        violations.push({
          type: 'overtime_violation',
          severity: 'soft',
          message: `Would exceed maximum overtime hours (${constraints.maxOvertimeHours})`
        });
      }
    }
    
    // Check minimum break between shifts
    if (constraints.minBreakBetweenShifts !== undefined) {
      const hasAdequateBreak = await this.checkBreakBetweenShifts(
        assignment.staff_member_id,
        demand.date,
        demand.timeSlot.startTime,
        constraints.minBreakBetweenShifts
      );
      
      if (!hasAdequateBreak) {
        violations.push({
          type: 'insufficient_break',
          severity: 'soft',
          message: `Insufficient break between shifts (minimum ${constraints.minBreakBetweenShifts} hours)`
        });
      }
    }
    
    // Check quality threshold
    if (constraints.qualityThreshold !== undefined) {
      const qualityScore = assignment.assignment_factors.performance_score || 5.0;
      
      if (qualityScore < constraints.qualityThreshold) {
        violations.push({
          type: 'quality_threshold',
          severity: 'soft',
          message: `Quality score (${qualityScore}) below threshold (${constraints.qualityThreshold})`
        });
      }
    }
    
    return violations;
  }

  // =====================================================
  // OPTIMIZATION ALGORITHMS
  // =====================================================

  private async optimizeAssignments(
    initialAssignments: ScheduleAssignment[],
    demands: StaffingDemand[],
    constraints: OptimizationConstraints,
    objective: OptimizationObjective
  ): Promise<ScheduleAssignment[]> {
    let currentAssignments = [...initialAssignments];
    let bestScore = await this.calculateObjectiveScore(currentAssignments, objective);
    let improved = true;
    let iterations = 0;
    const maxIterations = 100;
    
    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;
      
      // Try swapping assignments between staff members
      for (let i = 0; i < currentAssignments.length; i++) {
        for (let j = i + 1; j < currentAssignments.length; j++) {
          const assignment1 = currentAssignments[i];
          const assignment2 = currentAssignments[j];
          
          // Skip if same staff member or incompatible swaps
          if (!assignment1 || !assignment2 ||
              assignment1.staffMemberId === assignment2.staffMemberId ||
              assignment1.role !== assignment2.role) {
            continue;
          }
          
          // Try swapping
          const newAssignments = [...currentAssignments];
          newAssignments[i] = { ...assignment1!, staffMemberId: assignment2!.staffMemberId };
          newAssignments[j] = { ...assignment2!, staffMemberId: assignment1!.staffMemberId };
          
          // Check if swap is valid and improves score
          const isValid = await this.validateAssignmentSwap(newAssignments[i], newAssignments[j], constraints);
          
          if (isValid) {
            const newScore = await this.calculateObjectiveScore(newAssignments, objective);
            
            if (newScore > bestScore) {
              currentAssignments = newAssignments;
              bestScore = newScore;
              improved = true;
            }
          }
        }
      }
      
      // Try replacing assignments with alternatives
      for (let i = 0; i < currentAssignments.length; i++) {
        const assignment = currentAssignments[i];
        
        if (!assignment) continue;
        for (const alternative of assignment.alternatives || []) {
          const newAssignment: ScheduleAssignment = {
            ...assignment,
            staffMemberId: alternative.staff_member_id,
            confidenceScore: alternative.confidence_score,
            qualityScore: alternative.assignment_factors.performance_score || 5.0
          };
          
          const newAssignments = [...currentAssignments];
          newAssignments[i] = newAssignment;
          
          const isValid = await this.validateSingleAssignment(newAssignment, constraints, newAssignments);
          
          if (isValid) {
            const newScore = await this.calculateObjectiveScore(newAssignments, objective);
            
            if (newScore > bestScore) {
              currentAssignments = newAssignments;
              bestScore = newScore;
              improved = true;
              break;
            }
          }
        }
      }
    }
    
    return currentAssignments;
  }

  // =====================================================
  // SCORING AND EVALUATION
  // =====================================================

  private async calculateObjectiveScore(
    assignments: ScheduleAssignment[],
    objective: OptimizationObjective
  ): Promise<number> {
    const metrics = await this.calculateAssignmentMetrics(assignments);
    
    // Normalize metrics to 0-1 scale
    const normalizedCost = 1 - Math.min(1, metrics.totalCost / 10000); // Assume max cost of $10k
    const normalizedQuality = metrics.averageQuality / 10; // Quality is 0-10 scale
    const normalizedCoverage = metrics.coveragePercentage / 100; // Coverage is 0-100%
    const normalizedSatisfaction = metrics.staffUtilization / 100; // Utilization as satisfaction proxy
    
    // Calculate weighted score
    const score = (
      objective.weights.cost * normalizedCost +
      objective.weights.quality * normalizedQuality +
      objective.weights.coverage * normalizedCoverage +
      objective.weights.satisfaction * normalizedSatisfaction
    );
    
    return score;
  }

  private async calculateAssignmentMetrics(assignments: ScheduleAssignment[]): Promise<{
    totalCost: number;
    averageQuality: number;
    coveragePercentage: number;
    staffUtilization: number;
  }> {
    const totalCost = assignments.reduce((sum, a) => sum + a.estimatedCost, 0);
    const averageQuality = assignments.length > 0 
      ? assignments.reduce((sum, a) => sum + a.qualityScore, 0) / assignments.length 
      : 0;
    
    // Coverage calculation would need demand comparison
    const coveragePercentage = 95; // Simplified for now
    
    // Utilization calculation would need staff availability data
    const staffUtilization = 85; // Simplified for now
    
    return {
      totalCost,
      averageQuality,
      coveragePercentage,
      staffUtilization
    };
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private async getAvailableStaff(demands: StaffingDemand[]): Promise<Map<string, StaffMember[]>> {
    const staffByLocation = new Map<string, StaffMember[]>();
    
    // Get unique location IDs
    const locationIds = [...new Set(demands.map(d => d.locationId))];
    
    for (const locationId of locationIds) {
      const staff = await this.db.getActiveStaffMembers(locationId);
      staffByLocation.set(locationId, staff);
    }
    
    return staffByLocation;
  }

  private async calculateStaffCost(
    staffMemberId: string,
    startTime: string,
    endTime: string
  ): Promise<number> {
    // Simplified cost calculation
    // In reality, this would consider hourly rates, overtime multipliers, etc.
    const hours = this.calculateShiftHours(startTime, endTime);
    const baseHourlyRate = 25; // Default rate
    return hours * baseHourlyRate;
  }

  private calculateShiftHours(startTime: string, endTime: string): number {
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    
    if (end < start) {
      // Handle overnight shifts
      end.setDate(end.getDate() + 1);
    }
    
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }

  private timePeriodsOverlap(
    start1: string, end1: string,
    start2: string, end2: string
  ): boolean {
    const s1 = new Date(`1970-01-01T${start1}`);
    const e1 = new Date(`1970-01-01T${end1}`);
    const s2 = new Date(`1970-01-01T${start2}`);
    const e2 = new Date(`1970-01-01T${end2}`);
    
    return s1 < e2 && s2 < e1;
  }

  private async calculateWeeklyHours(staffMemberId: string, date: string): Promise<number> {
    // Calculate weekly hours for the week containing the given date
    // This would query the database for existing schedules
    return 32; // Simplified for now
  }

  private async checkBreakBetweenShifts(
    staffMemberId: string,
    date: string,
    startTime: string,
    minBreakHours: number
  ): Promise<boolean> {
    // Check if there's adequate break before/after this shift
    // This would query the database for adjacent schedules
    return true; // Simplified for now
  }

  private async validateAssignmentSwap(
    assignment1: ScheduleAssignment,
    assignment2: ScheduleAssignment,
    constraints: OptimizationConstraint[]
  ): Promise<boolean> {
    // Validate that swapping these assignments doesn't violate constraints
    return true; // Simplified for now
  }

  private async validateSingleAssignment(
    assignment: ScheduleAssignment,
    constraints: OptimizationConstraints,
    allAssignments: ScheduleAssignment[]
  ): Promise<boolean> {
    // Validate that this assignment doesn't violate constraints
    return true; // Simplified for now
  }

  private validateOptimizationInputs(
    demands: StaffingDemand[],
    constraints: OptimizationConstraints,
    objective: OptimizationObjective
  ): void {
    if (demands.length === 0) {
      throw new Error('No staffing demands provided');
    }
    
    if (Math.abs(
      objective.weights.cost + 
      objective.weights.quality + 
      objective.weights.coverage + 
      objective.weights.satisfaction - 1
    ) > 0.01) {
      throw new Error('Objective weights must sum to 1.0');
    }
  }

  private async buildOptimizationResult(
    assignments: ScheduleAssignment[],
    demands: StaffingDemand[],
    objective: OptimizationObjective,
    computationTimeMs: number
  ): Promise<OptimizationResult> {
    const metrics = await this.calculateAssignmentMetrics(assignments);
    
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    // Generate warnings for understaffed demands
    const assignedDemands = new Set(assignments.map(a => `${a.locationId}-${a.date}-${a.startTime}`));
    const unmetDemands = demands.filter(d => 
      !assignedDemands.has(`${d.locationId}-${d.date}-${d.timeSlot.startTime}`)
    );
    
    if (unmetDemands.length > 0) {
      warnings.push(`${unmetDemands.length} staffing demands could not be fully met`);
      recommendations.push('Consider hiring additional staff or adjusting requirements');
    }
    
    if (metrics.averageQuality < 7.0) {
      warnings.push(`Average quality score (${metrics.averageQuality.toFixed(1)}) is below recommended threshold`);
      recommendations.push('Consider staff training or performance improvement programs');
    }
    
    return {
      assignments,
      metrics: {
        ...metrics,
        constraintViolations: 0 // Would be calculated from actual constraint checking
      },
      warnings,
      recommendations,
      computationTimeMs
    };
  }

  private getDefaultObjective(): OptimizationObjective {
    return {
      strategy: 'balanced',
      weights: {
        cost: 0.25,
        quality: 0.30,
        coverage: 0.35,
        satisfaction: 0.10
      }
    };
  }
}