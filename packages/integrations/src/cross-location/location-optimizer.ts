/**
 * Cross-Location Staff Optimization Engine
 * Multi-location staff allocation with travel time and cost optimization
 */

import { ClinicalStaffingQueries, StaffMember, CoverageRequirement } from '@ganger/db';

export interface Location {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    latitude: number;
    longitude: number;
  };
  timezone: string;
  operatingHours: {
    [key: string]: { // day of week
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  facilityType: 'clinic' | 'hospital' | 'urgent_care' | 'satellite';
  capacity: number;
  amenities: string[];
}

export interface TravelRoute {
  fromLocationId: string;
  toLocationId: string;
  distance: number; // miles
  travelTime: number; // minutes
  estimatedCost: number; // dollars
  reliability: number; // 0-1 scale
  preferredMethod: 'driving' | 'public_transit' | 'walking';
}

export interface StaffPreferences {
  staffMemberId: string;
  preferredLocations: string[];
  maxTravelTime: number; // minutes
  maxTravelDistance: number; // miles
  travelCompensationRequired: boolean;
  crossLocationLimit: number; // assignments per week
  unavailableLocations: string[];
}

export interface CrossLocationAssignment {
  staffMemberId: string;
  primaryLocationId: string;
  assignedLocationId: string;
  date: string;
  startTime: string;
  endTime: string;
  role: string;
  travelRequired: boolean;
  travelTime: number;
  travelCost: number;
  confidence: number;
  conflictRisk: number;
  efficiencyScore: number;
}

export interface LocationCoverage {
  locationId: string;
  date: string;
  timeSlot: {
    startTime: string;
    endTime: string;
  };
  requiredStaff: number;
  assignedStaff: number;
  coveragePercentage: number;
  gapAnalysis: {
    shortfall: number;
    criticalGaps: Array<{
      startTime: string;
      endTime: string;
      missingRoles: string[];
      priority: number;
    }>;
  };
}

export interface OptimizationConstraints {
  maxTravelTimePerDay: number; // minutes
  maxCrossLocationAssignments: number; // per staff per week
  travelCompensationRate: number; // dollars per mile
  travelTimeCompensation: number; // dollars per hour
  minStaffingLevels: Record<string, number>; // location -> min staff
  maxOvertime: number; // hours per week
  preferLocalStaff: boolean;
  balanceWorkload: boolean;
}

export interface OptimizationResult {
  assignments: CrossLocationAssignment[];
  locationCoverage: LocationCoverage[];
  travelCosts: {
    totalCost: number;
    costByLocation: Record<string, number>;
    costByStaff: Record<string, number>;
  };
  efficiencyMetrics: {
    averageUtilization: number;
    travelEfficiency: number;
    coverageOptimization: number;
    staffSatisfaction: number;
  };
  recommendations: string[];
  warnings: string[];
}

export class CrossLocationOptimizer {
  private db: ClinicalStaffingQueries;
  private locations: Map<string, Location>;
  private travelRoutes: Map<string, TravelRoute>;
  private staffPreferences: Map<string, StaffPreferences>;

  constructor(dbQueries: ClinicalStaffingQueries) {
    this.db = dbQueries;
    this.locations = new Map();
    this.travelRoutes = new Map();
    this.staffPreferences = new Map();
  }

  // =====================================================
  // INITIALIZATION AND SETUP
  // =====================================================

  async initialize(
    locations: Location[],
    travelRoutes: TravelRoute[],
    staffPreferences: StaffPreferences[]
  ): Promise<void> {
    // Load locations
    locations.forEach(location => {
      this.locations.set(location.id, location);
    });

    // Load travel routes
    travelRoutes.forEach(route => {
      const key = `${route.fromLocationId}-${route.toLocationId}`;
      this.travelRoutes.set(key, route);
    });

    // Load staff preferences
    staffPreferences.forEach(prefs => {
      this.staffPreferences.set(prefs.staffMemberId, prefs);
    });

    this.logInfo(`Initialized cross-location optimizer: ${locations.length} locations, ${travelRoutes.length} routes, ${staffPreferences.length} staff preferences`);
  }

  // =====================================================
  // MAIN OPTIMIZATION ENGINE
  // =====================================================

  async optimizeCrossLocationCoverage(
    startDate: string,
    endDate: string,
    constraints: OptimizationConstraints
  ): Promise<OptimizationResult> {
    const startTime = Date.now();

    try {
      // 1. Analyze coverage requirements for all locations
      const coverageRequirements = await this.analyzeCoverageRequirements(startDate, endDate);
      
      // 2. Get available staff across all locations
      const availableStaff = await this.getAvailableStaffAcrossLocations(startDate, endDate);
      
      // 3. Calculate travel possibilities and costs
      const travelOptions = await this.calculateTravelOptions(availableStaff, coverageRequirements);
      
      // 4. Generate initial assignments with local staff preference
      const initialAssignments = await this.generateInitialAssignments(
        coverageRequirements,
        availableStaff,
        constraints
      );
      
      // 5. Optimize cross-location assignments to fill gaps
      const optimizedAssignments = await this.optimizeCrossLocationAssignments(
        initialAssignments,
        coverageRequirements,
        travelOptions,
        constraints
      );
      
      // 6. Calculate final metrics and recommendations
      const result = await this.buildOptimizationResult(
        optimizedAssignments,
        coverageRequirements,
        constraints,
        Date.now() - startTime
      );

      return result;
    } catch (error) {
      throw new Error(`Cross-location optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // =====================================================
  // COVERAGE ANALYSIS
  // =====================================================

  private async analyzeCoverageRequirements(
    startDate: string,
    endDate: string
  ): Promise<Map<string, CoverageRequirement[]>> {
    const coverageByLocation = new Map<string, CoverageRequirement[]>();

    for (const [locationId] of this.locations) {
      const requirements = await this.db.getCoverageRequirements(locationId, startDate);
      coverageByLocation.set(locationId, requirements);
    }

    return coverageByLocation;
  }

  private async getAvailableStaffAcrossLocations(
    startDate: string,
    endDate: string
  ): Promise<Map<string, StaffMember[]>> {
    const staffByLocation = new Map<string, StaffMember[]>();

    for (const [locationId] of this.locations) {
      const staff = await this.db.getActiveStaffMembers(locationId);
      
      // Filter staff based on availability in the date range
      const availableStaff = [];
      for (const staffMember of staff) {
        const availability = await this.db.getStaffAvailability(
          staffMember.id,
          startDate,
          endDate
        );
        
        // Only include staff with some availability
        if (availability.some(avail => avail.availability_type === 'available_extra')) {
          availableStaff.push(staffMember);
        }
      }
      
      staffByLocation.set(locationId, availableStaff);
    }

    return staffByLocation;
  }

  // =====================================================
  // TRAVEL OPTIMIZATION
  // =====================================================

  private async calculateTravelOptions(
    staffByLocation: Map<string, StaffMember[]>,
    coverageRequirements: Map<string, CoverageRequirement[]>
  ): Promise<Map<string, TravelRoute[]>> {
    const travelOptions = new Map<string, TravelRoute[]>();

    // For each staff member, find viable travel options to other locations
    for (const [primaryLocationId, staff] of staffByLocation) {
      for (const staffMember of staff) {
        const staffTravelOptions: TravelRoute[] = [];
        const preferences = this.staffPreferences.get(staffMember.id);

        for (const [targetLocationId] of this.locations) {
          if (targetLocationId === primaryLocationId) continue;

          // Check if staff member can work at this location
          if (preferences?.unavailableLocations?.includes(targetLocationId)) {
            continue;
          }

          const routeKey = `${primaryLocationId}-${targetLocationId}`;
          const route = this.travelRoutes.get(routeKey);

          if (route && this.isTravelViable(route, preferences)) {
            staffTravelOptions.push(route);
          }
        }

        if (staffTravelOptions.length > 0) {
          travelOptions.set(staffMember.id, staffTravelOptions);
        }
      }
    }

    return travelOptions;
  }

  private isTravelViable(route: TravelRoute, preferences?: StaffPreferences): boolean {
    if (!preferences) return route.travelTime <= 60; // Default 1 hour max

    return (
      route.travelTime <= preferences.maxTravelTime &&
      route.distance <= preferences.maxTravelDistance
    );
  }

  private calculateTravelCost(
    route: TravelRoute,
    constraints: OptimizationConstraints
  ): number {
    const mileageCost = route.distance * constraints.travelCompensationRate;
    const timeCost = (route.travelTime / 60) * constraints.travelTimeCompensation;
    
    return mileageCost + timeCost;
  }

  // =====================================================
  // ASSIGNMENT GENERATION
  // =====================================================

  private async generateInitialAssignments(
    coverageRequirements: Map<string, CoverageRequirement[]>,
    staffByLocation: Map<string, StaffMember[]>,
    constraints: OptimizationConstraints
  ): Promise<CrossLocationAssignment[]> {
    const assignments: CrossLocationAssignment[] = [];

    // First pass: Assign local staff to their primary locations
    for (const [locationId, requirements] of coverageRequirements) {
      const localStaff = staffByLocation.get(locationId) || [];
      
      for (const requirement of requirements) {
        const availableLocalStaff = await this.getAvailableStaffForRequirement(
          localStaff,
          requirement,
          locationId
        );

        // Assign local staff first (higher confidence, no travel)
        const assignmentsNeeded = Math.min(
          requirement.required_staff_count,
          availableLocalStaff.length
        );

        for (let i = 0; i < assignmentsNeeded; i++) {
          const staffMember = availableLocalStaff[i];
          
          assignments.push({
            staffMemberId: staffMember.id,
            primaryLocationId: locationId,
            assignedLocationId: locationId,
            date: requirement.date,
            startTime: requirement.start_time,
            endTime: requirement.end_time,
            role: requirement.position,
            travelRequired: false,
            travelTime: 0,
            travelCost: 0,
            confidence: 0.95, // High confidence for local assignments
            conflictRisk: 0.1,
            efficiencyScore: 0.9
          });
        }
      }
    }

    return assignments;
  }

  private async optimizeCrossLocationAssignments(
    initialAssignments: CrossLocationAssignment[],
    coverageRequirements: Map<string, CoverageRequirement[]>,
    travelOptions: Map<string, TravelRoute[]>,
    constraints: OptimizationConstraints
  ): Promise<CrossLocationAssignment[]> {
    const assignments = [...initialAssignments];
    
    // Identify gaps in coverage
    const coverageGaps = await this.identifyCoverageGaps(assignments, coverageRequirements);
    
    // Sort gaps by priority (critical gaps first)
    const sortedGaps = coverageGaps.sort((a, b) => b.priority - a.priority);

    for (const gap of sortedGaps) {
      const fillAssignments = await this.findCrossLocationAssignments(
        gap,
        travelOptions,
        constraints,
        assignments
      );

      // Add the best cross-location assignments to fill the gap
      const bestAssignments = fillAssignments
        .sort((a, b) => b.efficiencyScore - a.efficiencyScore)
        .slice(0, gap.shortfall);

      assignments.push(...bestAssignments);
    }

    return assignments;
  }

  // =====================================================
  // GAP ANALYSIS AND OPTIMIZATION
  // =====================================================

  private async identifyCoverageGaps(
    assignments: CrossLocationAssignment[],
    coverageRequirements: Map<string, CoverageRequirement[]>
  ): Promise<Array<{
    locationId: string;
    date: string;
    startTime: string;
    endTime: string;
    role: string;
    shortfall: number;
    priority: number;
  }>> {
    const gaps: Array<{
      locationId: string;
      date: string;
      startTime: string;
      endTime: string;
      role: string;
      shortfall: number;
      priority: number;
    }> = [];

    for (const [locationId, requirements] of coverageRequirements) {
      for (const requirement of requirements) {
        // Count existing assignments for this requirement
        const existingAssignments = assignments.filter(assignment =>
          assignment.assignedLocationId === locationId &&
          assignment.date === requirement.date &&
          assignment.startTime === requirement.start_time &&
          assignment.endTime === requirement.end_time &&
          assignment.role === requirement.position
        );

        const shortfall = requirement.required_staff_count - existingAssignments.length;

        if (shortfall > 0) {
          gaps.push({
            locationId,
            date: requirement.date,
            startTime: requirement.start_time,
            endTime: requirement.end_time,
            role: requirement.position,
            shortfall,
            priority: this.priorityToNumber(requirement.priority)
          });
        }
      }
    }

    return gaps;
  }

  private async findCrossLocationAssignments(
    gap: {
      locationId: string;
      date: string;
      startTime: string;
      endTime: string;
      role: string;
      shortfall: number;
    },
    travelOptions: Map<string, TravelRoute[]>,
    constraints: OptimizationConstraints,
    existingAssignments: CrossLocationAssignment[]
  ): Promise<CrossLocationAssignment[]> {
    const potentialAssignments: CrossLocationAssignment[] = [];

    // Find staff who can travel to this location
    for (const [staffMemberId, routes] of travelOptions) {
      // Check if staff member already has assignment at this time
      const hasConflict = existingAssignments.some(assignment =>
        assignment.staffMemberId === staffMemberId &&
        assignment.date === gap.date &&
        this.timePeriodsOverlap(
          assignment.startTime,
          assignment.endTime,
          gap.startTime,
          gap.endTime
        )
      );

      if (hasConflict) continue;

      // Check weekly cross-location limit
      const weeklyAssignments = this.getWeeklyCrossLocationAssignments(
        staffMemberId,
        gap.date,
        existingAssignments
      );

      if (weeklyAssignments >= constraints.maxCrossLocationAssignments) {
        continue;
      }

      // Find route to gap location
      const routeToLocation = routes.find(route => route.toLocationId === gap.locationId);
      
      if (!routeToLocation) continue;

      // Check if travel time exceeds daily limit
      const dailyTravelTime = this.getDailyTravelTime(
        staffMemberId,
        gap.date,
        existingAssignments
      );

      if (dailyTravelTime + routeToLocation.travelTime > constraints.maxTravelTimePerDay) {
        continue;
      }

      // Calculate assignment metrics
      const travelCost = this.calculateTravelCost(routeToLocation, constraints);
      const confidence = this.calculateAssignmentConfidence(
        staffMemberId,
        gap.locationId,
        routeToLocation
      );
      const efficiencyScore = this.calculateEfficiencyScore(
        staffMemberId,
        gap,
        routeToLocation,
        constraints
      );

      potentialAssignments.push({
        staffMemberId,
        primaryLocationId: routeToLocation.fromLocationId,
        assignedLocationId: gap.locationId,
        date: gap.date,
        startTime: gap.startTime,
        endTime: gap.endTime,
        role: gap.role,
        travelRequired: true,
        travelTime: routeToLocation.travelTime,
        travelCost,
        confidence,
        conflictRisk: 1 - routeToLocation.reliability,
        efficiencyScore
      });
    }

    return potentialAssignments;
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private async getAvailableStaffForRequirement(
    staff: StaffMember[],
    requirement: CoverageRequirement,
    locationId: string
  ): Promise<StaffMember[]> {
    const availableStaff: StaffMember[] = [];

    for (const staffMember of staff) {
      // Check if staff member has required role/skills
      if (requirement.required_skills && requirement.required_skills.length > 0) {
        const hasRequiredSkills = requirement.required_skills.every(skill =>
          staffMember.skills?.some((staffSkill: any) => staffSkill.skill === skill)
        );
        
        if (!hasRequiredSkills) continue;
      }

      // Check availability on the specific date/time
      const availability = await this.db.getStaffAvailability(
        staffMember.id,
        requirement.date,
        requirement.date
      );

      const isAvailable = availability.some(avail =>
        avail.specific_date === requirement.date &&
        avail.availability_type === 'available_extra' &&
        avail.start_time && avail.end_time &&
        this.timePeriodsOverlap(
          avail.start_time,
          avail.end_time,
          requirement.start_time,
          requirement.end_time
        )
      );

      if (isAvailable) {
        availableStaff.push(staffMember);
      }
    }

    return availableStaff;
  }

  private timePeriodsOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    const s1 = new Date(`1970-01-01T${start1}`);
    const e1 = new Date(`1970-01-01T${end1}`);
    const s2 = new Date(`1970-01-01T${start2}`);
    const e2 = new Date(`1970-01-01T${end2}`);
    
    return s1 < e2 && s2 < e1;
  }

  private getWeeklyCrossLocationAssignments(
    staffMemberId: string,
    date: string,
    assignments: CrossLocationAssignment[]
  ): number {
    const targetDate = new Date(date);
    const weekStart = new Date(targetDate);
    weekStart.setDate(targetDate.getDate() - targetDate.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return assignments.filter(assignment =>
      assignment.staffMemberId === staffMemberId &&
      assignment.travelRequired &&
      new Date(assignment.date) >= weekStart &&
      new Date(assignment.date) <= weekEnd
    ).length;
  }

  private getDailyTravelTime(
    staffMemberId: string,
    date: string,
    assignments: CrossLocationAssignment[]
  ): number {
    return assignments
      .filter(assignment =>
        assignment.staffMemberId === staffMemberId &&
        assignment.date === date &&
        assignment.travelRequired
      )
      .reduce((total, assignment) => total + assignment.travelTime, 0);
  }

  private calculateAssignmentConfidence(
    staffMemberId: string,
    locationId: string,
    route: TravelRoute
  ): number {
    const preferences = this.staffPreferences.get(staffMemberId);
    
    let confidence = 0.7; // Base confidence for cross-location assignment

    // Increase confidence if location is preferred
    if (preferences?.preferredLocations?.includes(locationId)) {
      confidence += 0.2;
    }

    // Adjust based on route reliability
    confidence *= route.reliability;

    // Adjust based on travel time (shorter = higher confidence)
    const travelTimeFactor = Math.max(0.5, 1 - (route.travelTime / 120)); // 2 hours max
    confidence *= travelTimeFactor;

    return Math.min(0.95, confidence);
  }

  private calculateEfficiencyScore(
    staffMemberId: string,
    gap: any,
    route: TravelRoute,
    constraints: OptimizationConstraints
  ): number {
    let score = 0.5; // Base score

    // Factor in travel efficiency (distance vs time)
    const speedEfficiency = route.distance / (route.travelTime / 60); // mph
    const normalizedSpeed = Math.min(1, speedEfficiency / 60); // normalize to 60mph max
    score += normalizedSpeed * 0.2;

    // Factor in cost efficiency
    const travelCost = this.calculateTravelCost(route, constraints);
    const costEfficiency = Math.max(0, 1 - (travelCost / 100)); // normalize to $100 max
    score += costEfficiency * 0.2;

    // Factor in location preferences
    const preferences = this.staffPreferences.get(staffMemberId);
    if (preferences?.preferredLocations?.includes(gap.locationId)) {
      score += 0.1;
    }

    return Math.min(1, score);
  }

  private async buildOptimizationResult(
    assignments: CrossLocationAssignment[],
    coverageRequirements: Map<string, CoverageRequirement[]>,
    constraints: OptimizationConstraints,
    computationTime: number
  ): Promise<OptimizationResult> {
    // Calculate location coverage
    const locationCoverage = await this.calculateLocationCoverage(assignments, coverageRequirements);
    
    // Calculate travel costs
    const travelCosts = this.calculateTravelCosts(assignments);
    
    // Calculate efficiency metrics
    const efficiencyMetrics = this.calculateEfficiencyMetrics(assignments, locationCoverage);
    
    // Generate recommendations and warnings
    const { recommendations, warnings } = this.generateRecommendations(
      assignments,
      locationCoverage,
      travelCosts,
      constraints
    );

    return {
      assignments,
      locationCoverage,
      travelCosts,
      efficiencyMetrics,
      recommendations,
      warnings
    };
  }

  private async calculateLocationCoverage(
    assignments: CrossLocationAssignment[],
    coverageRequirements: Map<string, CoverageRequirement[]>
  ): Promise<LocationCoverage[]> {
    const coverage: LocationCoverage[] = [];

    for (const [locationId, requirements] of coverageRequirements) {
      for (const requirement of requirements) {
        const assignedStaff = assignments.filter(assignment =>
          assignment.assignedLocationId === locationId &&
          assignment.date === requirement.date &&
          assignment.startTime === requirement.start_time &&
          assignment.endTime === requirement.end_time
        ).length;

        const coveragePercentage = Math.min(100, (assignedStaff / requirement.required_staff_count) * 100);
        const shortfall = Math.max(0, requirement.required_staff_count - assignedStaff);

        coverage.push({
          locationId,
          date: requirement.date,
          timeSlot: {
            startTime: requirement.start_time,
            endTime: requirement.end_time
          },
          requiredStaff: requirement.required_staff_count,
          assignedStaff,
          coveragePercentage,
          gapAnalysis: {
            shortfall,
            criticalGaps: shortfall > 0 ? [{
              startTime: requirement.start_time,
              endTime: requirement.end_time,
              missingRoles: [requirement.position],
              priority: this.priorityToNumber(requirement.priority)
            }] : []
          }
        });
      }
    }

    return coverage;
  }

  private calculateTravelCosts(assignments: CrossLocationAssignment[]): OptimizationResult['travelCosts'] {
    const totalCost = assignments.reduce((sum, assignment) => sum + assignment.travelCost, 0);
    
    const costByLocation: Record<string, number> = {};
    const costByStaff: Record<string, number> = {};

    assignments.forEach(assignment => {
      if (assignment.travelRequired) {
        costByLocation[assignment.assignedLocationId] = 
          (costByLocation[assignment.assignedLocationId] || 0) + assignment.travelCost;
        
        costByStaff[assignment.staffMemberId] = 
          (costByStaff[assignment.staffMemberId] || 0) + assignment.travelCost;
      }
    });

    return {
      totalCost,
      costByLocation,
      costByStaff
    };
  }

  private calculateEfficiencyMetrics(
    assignments: CrossLocationAssignment[],
    locationCoverage: LocationCoverage[]
  ): OptimizationResult['efficiencyMetrics'] {
    // Calculate average utilization
    const averageUtilization = assignments.length > 0
      ? assignments.reduce((sum, a) => sum + a.efficiencyScore, 0) / assignments.length
      : 0;

    // Calculate travel efficiency
    const travelAssignments = assignments.filter(a => a.travelRequired);
    const travelEfficiency = travelAssignments.length > 0
      ? travelAssignments.reduce((sum, a) => sum + a.efficiencyScore, 0) / travelAssignments.length
      : 1;

    // Calculate coverage optimization
    const coverageOptimization = locationCoverage.length > 0
      ? locationCoverage.reduce((sum, c) => sum + c.coveragePercentage, 0) / locationCoverage.length / 100
      : 0;

    // Calculate staff satisfaction (based on preferences)
    const staffSatisfaction = assignments.length > 0
      ? assignments.reduce((sum, a) => sum + a.confidence, 0) / assignments.length
      : 0;

    return {
      averageUtilization,
      travelEfficiency,
      coverageOptimization,
      staffSatisfaction
    };
  }

  private generateRecommendations(
    assignments: CrossLocationAssignment[],
    locationCoverage: LocationCoverage[],
    travelCosts: OptimizationResult['travelCosts'],
    constraints: OptimizationConstraints
  ): { recommendations: string[]; warnings: string[] } {
    const recommendations: string[] = [];
    const warnings: string[] = [];

    // Check for high travel costs
    if (travelCosts.totalCost > 1000) {
      warnings.push(`High travel costs detected: $${travelCosts.totalCost.toFixed(2)}`);
      recommendations.push('Consider hiring additional staff at high-cost locations');
    }

    // Check for poor coverage
    const poorCoverage = locationCoverage.filter(c => c.coveragePercentage < 80);
    if (poorCoverage.length > 0) {
      warnings.push(`${poorCoverage.length} time slots have less than 80% coverage`);
      recommendations.push('Review staffing requirements and consider additional hiring');
    }

    // Check for excessive travel assignments
    const highTravelStaff = Object.entries(travelCosts.costByStaff)
      .filter(([_, cost]) => cost > 200)
      .map(([staffId]) => staffId);
    
    if (highTravelStaff.length > 0) {
      warnings.push(`${highTravelStaff.length} staff members have high travel costs`);
      recommendations.push('Consider reassigning staff to reduce travel burden');
    }

    return { recommendations, warnings };
  }

  private priorityToNumber(priority: 'low' | 'medium' | 'high' | 'critical'): number {
    const priorityMap: Record<string, number> = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'critical': 4
    };
    return priorityMap[priority] || 1;
  }

  private logInfo(message: string): void {
    console.log(`[CrossLocationOptimizer] ${message}`);
  }
}