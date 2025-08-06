/**
 * Pharmaceutical Scheduling Availability Engine
 * Intelligent slot calculation, conflict detection, and optimization
 */

import { PharmaSchedulingQueries, SchedulingActivity, PharmaAppointment, AvailableSlot, ConflictCheck } from '@ganger/db';

export interface AvailabilityRequest {
  activityId: string;
  startDate: string;
  endDate: string;
  preferredTimes?: string[]; // e.g., ['12:00', '12:30', '13:00']
  excludeWeekends?: boolean;
  minLeadTimeHours?: number;
  repId?: string; // For checking rep-specific conflicts
}

export interface OptimizedSlot extends AvailableSlot {
  score: number; // 0-100, higher is better
  optimizationFactors: {
    timePreference: number;
    leadTimeScore: number;
    historicalPopularity: number;
    staffAvailability: number;
    conflictRisk: number;
  };
  suggestedParticipants?: string[]; // Suggested staff emails
}

export interface AvailabilityContext {
  activity: SchedulingActivity;
  existingAppointments: PharmaAppointment[];
  staffAvailability: Map<string, boolean>; // email -> available
  businessRules: BusinessRule[];
  historicalData: HistoricalPattern[];
}

export interface BusinessRule {
  id: string;
  type: 'time_restriction' | 'capacity_limit' | 'approval_requirement' | 'blackout_period' | 'lead_time_requirement';
  conditions: Record<string, any>;
  actions: Record<string, any>;
  priority: number;
  isActive: boolean;
}

export interface HistoricalPattern {
  timeSlot: string;
  dayOfWeek: number;
  location: string;
  averageAttendance: number;
  popularityScore: number;
  cancellationRate: number;
  approvalRate: number;
}

export interface ConflictReason {
  type: 'rep_conflict' | 'capacity_exceeded' | 'staff_unavailable' | 'business_rule' | 'blackout_period';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedAlternatives?: string[];
}

export interface AvailabilityReport {
  totalSlotsChecked: number;
  availableSlots: number;
  conflictedSlots: number;
  blackoutSlots: number;
  optimizedSlots: OptimizedSlot[];
  conflicts: ConflictReason[];
  recommendations: string[];
  generatedAt: string;
  computationTimeMs: number;
}

export class AvailabilityEngine {
  private db: PharmaSchedulingQueries;
  private cache: Map<string, any>;
  private cacheExpiry: Map<string, number>;

  constructor(dbQueries: PharmaSchedulingQueries) {
    this.db = dbQueries;
    this.cache = new Map();
    this.cacheExpiry = new Map();
  }

  // =====================================================
  // MAIN AVAILABILITY CALCULATION
  // =====================================================

  async calculateAvailability(request: AvailabilityRequest): Promise<AvailabilityReport> {
    const startTime = Date.now();

    try {
      // 1. Build availability context
      const context = await this.buildAvailabilityContext(request);
      
      // 2. Generate base time slots
      const baseSlots = await this.generateBaseTimeSlots(request, context);
      
      // 3. Apply conflict detection
      const slotsWithConflicts = await this.detectConflicts(baseSlots, request, context);
      
      // 4. Optimize and score slots
      const optimizedSlots = await this.optimizeSlots(slotsWithConflicts, request, context);
      
      // 5. Generate report
      const report = this.generateAvailabilityReport(
        optimizedSlots,
        slotsWithConflicts,
        Date.now() - startTime
      );

      return report;
      
    } catch (error) {
      throw new Error(`Availability calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // =====================================================
  // INTELLIGENT SLOT OPTIMIZATION
  // =====================================================

  async findOptimalSlots(
    request: AvailabilityRequest,
    maxSlots = 10
  ): Promise<OptimizedSlot[]> {
    const report = await this.calculateAvailability(request);
    
    return report.optimizedSlots
      .filter(slot => slot.isAvailable)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSlots);
  }

  async suggestAlternativeSlots(
    conflictedSlot: { date: string; startTime: string; endTime: string },
    request: AvailabilityRequest,
    alternativeCount = 5
  ): Promise<OptimizedSlot[]> {
    // Expand search window for alternatives
    const expandedRequest = {
      ...request,
      startDate: this.addDays(request.startDate, -7), // Look 7 days earlier
      endDate: this.addDays(request.endDate, 14) // Look 14 days later
    };

    const alternatives = await this.findOptimalSlots(expandedRequest, alternativeCount * 2);
    
    // Filter out the conflicted slot and nearby times
    const conflictDate = conflictedSlot.date;
    const conflictStart = conflictedSlot.startTime;
    
    return alternatives
      .filter(slot => 
        !(slot.date === conflictDate && 
          Math.abs(this.timeToMinutes(slot.startTime) - this.timeToMinutes(conflictStart)) < 120)
      )
      .slice(0, alternativeCount);
  }

  // =====================================================
  // REAL-TIME CONFLICT CHECKING
  // =====================================================

  async checkRealTimeConflicts(
    repId: string,
    activityId: string,
    appointmentDate: string,
    startTime: string,
    endTime: string,
    excludeAppointmentId?: string
  ): Promise<ConflictCheck & { detailedReasons: ConflictReason[] }> {
    const conflicts: ConflictReason[] = [];

    // 1. Check rep scheduling conflicts
    const repConflicts = await this.db.checkAppointmentConflicts(
      repId,
      appointmentDate,
      startTime,
      endTime,
      excludeAppointmentId
    );

    if (repConflicts.hasConflicts) {
      conflicts.push({
        type: 'rep_conflict',
        message: 'Representative has conflicting appointment',
        severity: 'critical',
        suggestedAlternatives: await this.findNearbyAvailableSlots(appointmentDate, startTime, activityId)
      });
    }

    // 2. Check activity capacity
    const activity = await this.db.getSchedulingActivityById(activityId);
    if (activity) {
      const dayAppointments = await this.db.getPharmaAppointments({
        activityId,
        startDate: appointmentDate,
        endDate: appointmentDate,
        status: 'confirmed'
      });

      if (dayAppointments.length >= activity.maxParticipants) {
        conflicts.push({
          type: 'capacity_exceeded',
          message: `Maximum daily capacity (${activity.maxParticipants}) exceeded`,
          severity: 'high'
        });
      }
    }

    // 3. Check lead time requirements
    const leadTimeHours = this.calculateLeadTimeHours(appointmentDate, startTime);
    if (activity && leadTimeHours < activity.cancellationHours) {
      conflicts.push({
        type: 'business_rule',
        message: `Booking requires ${activity.cancellationHours} hours lead time`,
        severity: 'medium'
      });
    }

    // 4. Check business rules
    const businessRuleConflicts = await this.checkBusinessRules(
      activityId,
      appointmentDate,
      startTime,
      endTime
    );
    conflicts.push(...businessRuleConflicts);

    return {
      hasConflicts: conflicts.length > 0,
      conflictingAppointments: repConflicts.conflictingAppointments,
      conflictReasons: conflicts.map(c => c.message),
      detailedReasons: conflicts
    };
  }

  // =====================================================
  // CONTEXT BUILDING
  // =====================================================

  private async buildAvailabilityContext(request: AvailabilityRequest): Promise<AvailabilityContext> {
    const cacheKey = `context_${request.activityId}_${request.startDate}_${request.endDate}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const [activity, existingAppointments, businessRules, historicalData] = await Promise.all([
      this.db.getSchedulingActivityById(request.activityId),
      this.db.getPharmaAppointments({
        activityId: request.activityId,
        startDate: request.startDate,
        endDate: request.endDate
      }),
      this.getBusinessRules(request.activityId),
      this.getHistoricalPatterns(request.activityId)
    ]);

    if (!activity) {
      throw new Error(`Activity ${request.activityId} not found`);
    }

    const staffAvailability = await this.getStaffAvailability(
      request.startDate,
      request.endDate,
      activity.location
    );

    const context: AvailabilityContext = {
      activity,
      existingAppointments,
      staffAvailability,
      businessRules,
      historicalData
    };

    // Cache for 5 minutes
    this.cache.set(cacheKey, context);
    this.cacheExpiry.set(cacheKey, Date.now() + 5 * 60 * 1000);

    return context;
  }

  // =====================================================
  // TIME SLOT GENERATION
  // =====================================================

  private async generateBaseTimeSlots(
    request: AvailabilityRequest,
    context: AvailabilityContext
  ): Promise<AvailableSlot[]> {
    const slots: AvailableSlot[] = [];
    const activity = context.activity;

    const start = new Date(request.startDate);
    const end = new Date(request.endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
      
      // Skip weekends if requested
      if (request.excludeWeekends && (dayOfWeek === 6 || dayOfWeek === 7)) {
        continue;
      }

      // Check if activity is available on this day
      if (!activity.availableDays.includes(dayOfWeek)) {
        continue;
      }

      // Get available times for this day
      const dayName = this.getDayName(date.getDay());
      const availableTimes = activity.availableTimes[dayName] || [];

      for (const timeRange of availableTimes) {
        // Generate slots within the time range based on activity duration
        const slotDuration = activity.durationMinutes + activity.blockOffMinutes;
        const rangeStart = this.timeToMinutes(timeRange.start);
        const rangeEnd = this.timeToMinutes(timeRange.end);

        for (let slotStart = rangeStart; slotStart + activity.durationMinutes <= rangeEnd; slotStart += slotDuration) {
          const slotEnd = slotStart + activity.durationMinutes;
          
          slots.push({
            date: dateStr || '',
            startTime: this.minutesToTime(slotStart),
            endTime: this.minutesToTime(slotEnd),
            isAvailable: true // Will be updated by conflict detection
          });
        }
      }
    }

    return slots;
  }

  // =====================================================
  // CONFLICT DETECTION
  // =====================================================

  private async detectConflicts(
    slots: AvailableSlot[],
    request: AvailabilityRequest,
    context: AvailabilityContext
  ): Promise<AvailableSlot[]> {
    const slotsWithConflicts: AvailableSlot[] = [];

    for (const slot of slots) {
      const conflicts: string[] = [];

      // Check against existing appointments
      const overlappingAppointments = context.existingAppointments.filter(apt =>
        apt.appointmentDate === slot.date &&
        this.timeRangesOverlap(slot.startTime, slot.endTime, apt.startTime, apt.endTime) &&
        apt.status !== 'cancelled' &&
        apt.approvalStatus !== 'denied'
      );

      if (overlappingAppointments.length > 0) {
        conflicts.push('Time slot already booked');
      }

      // Check lead time requirements
      if (request.minLeadTimeHours) {
        const leadTimeHours = this.calculateLeadTimeHours(slot.date, slot.startTime);
        if (leadTimeHours < request.minLeadTimeHours) {
          conflicts.push(`Minimum ${request.minLeadTimeHours} hours lead time required`);
        }
      }

      // Check rep-specific conflicts if repId provided
      if (request.repId) {
        const repConflicts = await this.db.checkAppointmentConflicts(
          request.repId,
          slot.date,
          slot.startTime,
          slot.endTime
        );

        if (repConflicts.hasConflicts) {
          conflicts.push('Representative has conflicting appointment');
        }
      }

      slotsWithConflicts.push({
        ...slot,
        isAvailable: conflicts.length === 0,
        conflictReason: conflicts.length > 0 ? conflicts.join('; ') : undefined,
        existingAppointments: overlappingAppointments.length > 0 ? overlappingAppointments : undefined
      });
    }

    return slotsWithConflicts;
  }

  // =====================================================
  // SLOT OPTIMIZATION
  // =====================================================

  private async optimizeSlots(
    slots: AvailableSlot[],
    request: AvailabilityRequest,
    context: AvailabilityContext
  ): Promise<OptimizedSlot[]> {
    const optimizedSlots: OptimizedSlot[] = [];

    for (const slot of slots) {
      if (!slot.isAvailable) {
        optimizedSlots.push({
          ...slot,
          score: 0,
          optimizationFactors: {
            timePreference: 0,
            leadTimeScore: 0,
            historicalPopularity: 0,
            staffAvailability: 0,
            conflictRisk: 0
          }
        });
        continue;
      }

      const factors = await this.calculateOptimizationFactors(slot, request, context);
      const score = this.calculateSlotScore(factors);

      optimizedSlots.push({
        ...slot,
        score,
        optimizationFactors: factors,
        suggestedParticipants: await this.suggestParticipants(slot, context)
      });
    }

    return optimizedSlots.sort((a, b) => b.score - a.score);
  }

  private async calculateOptimizationFactors(
    slot: AvailableSlot,
    request: AvailabilityRequest,
    context: AvailabilityContext
  ): Promise<OptimizedSlot['optimizationFactors']> {
    // Time preference score (based on preferred times)
    const timePreference = this.calculateTimePreference(slot.startTime, request.preferredTimes);
    
    // Lead time score (more lead time = better)
    const leadTimeScore = this.calculateLeadTimeScore(slot.date, slot.startTime);
    
    // Historical popularity score
    const historicalPopularity = this.calculateHistoricalPopularity(
      slot.startTime,
      this.getDateDayOfWeek(slot.date),
      context.activity.location,
      context.historicalData
    );
    
    // Staff availability score
    const staffAvailability = await this.calculateStaffAvailabilityScore(slot, context);
    
    // Conflict risk score (lower risk = better)
    const conflictRisk = this.calculateConflictRisk(slot, context);

    return {
      timePreference,
      leadTimeScore,
      historicalPopularity,
      staffAvailability,
      conflictRisk
    };
  }

  private calculateSlotScore(factors: OptimizedSlot['optimizationFactors']): number {
    // Weighted scoring algorithm
    const weights = {
      timePreference: 0.25,
      leadTimeScore: 0.15,
      historicalPopularity: 0.20,
      staffAvailability: 0.25,
      conflictRisk: 0.15
    };

    return Math.round(
      factors.timePreference * weights.timePreference +
      factors.leadTimeScore * weights.leadTimeScore +
      factors.historicalPopularity * weights.historicalPopularity +
      factors.staffAvailability * weights.staffAvailability +
      (100 - factors.conflictRisk) * weights.conflictRisk
    );
  }

  // =====================================================
  // BUSINESS RULES CHECKING
  // =====================================================

  private async checkBusinessRules(
    activityId: string,
    appointmentDate: string,
    startTime: string,
    endTime: string
  ): Promise<ConflictReason[]> {
    const conflicts: ConflictReason[] = [];

    // This would check against the booking_rules table
    // For now, implementing basic rules
    console.log(`[AvailabilityEngine] Checking business rules for activity ${activityId}: ${appointmentDate} ${startTime}-${endTime}`);
    
    // Example: Check holiday blackouts
    const holidays = ['2024-12-25', '2024-01-01', '2024-07-04', '2024-11-28'];
    if (holidays.includes(appointmentDate)) {
      conflicts.push({
        type: 'blackout_period',
        message: 'Bookings not available on holidays',
        severity: 'critical'
      });
    }

    // Example: Check weekend restrictions
    const date = new Date(appointmentDate);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      conflicts.push({
        type: 'business_rule',
        message: 'Weekend bookings require special approval',
        severity: 'medium'
      });
    }

    return conflicts;
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private async getStaffAvailability(
    startDate: string,
    endDate: string,
    location: string
  ): Promise<Map<string, boolean>> {
    // This would integrate with Google Calendar or staff scheduling system
    // For now, returning mock data
    console.log(`[AvailabilityEngine] Getting staff availability for ${location}: ${startDate} to ${endDate}`);
    const staffAvailability = new Map<string, boolean>();
    
    // Mock staff members
    const staff = [
      'dr.ganger@gangerdermatology.com',
      'nurse.smith@gangerdermatology.com',
      'admin.jones@gangerdermatology.com'
    ];

    staff.forEach(email => {
      staffAvailability.set(email, Math.random() > 0.3); // 70% availability
    });

    return staffAvailability;
  }

  private async getBusinessRules(activityId: string): Promise<BusinessRule[]> {
    // This would query the booking_rules table
    console.log(`[AvailabilityEngine] Getting business rules for activity: ${activityId}`);
    return [];
  }

  private async getHistoricalPatterns(activityId: string): Promise<HistoricalPattern[]> {
    // This would analyze historical data from pharma_analytics
    return [];
  }

  private calculateTimePreference(slotTime: string, preferredTimes?: string[]): number {
    if (!preferredTimes || preferredTimes.length === 0) return 75; // Default score

    const slotMinutes = this.timeToMinutes(slotTime);
    const closestPreference = preferredTimes.reduce((closest, prefTime) => {
      const prefMinutes = this.timeToMinutes(prefTime);
      const currentDiff = Math.abs(slotMinutes - prefMinutes);
      const closestDiff = Math.abs(slotMinutes - this.timeToMinutes(closest));
      return currentDiff < closestDiff ? prefTime : closest;
    });

    const diffMinutes = Math.abs(slotMinutes - this.timeToMinutes(closestPreference));
    return Math.max(0, 100 - (diffMinutes / 60) * 20); // Decrease score by 20 per hour difference
  }

  private calculateLeadTimeScore(date: string, time: string): number {
    const appointmentDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    const leadTimeHours = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (leadTimeHours < 24) return 20; // Low score for short lead time
    if (leadTimeHours < 72) return 60; // Medium score for 1-3 days
    if (leadTimeHours < 168) return 85; // Good score for 3-7 days
    return 100; // Excellent score for 7+ days
  }

  private calculateHistoricalPopularity(
    timeSlot: string,
    dayOfWeek: number,
    location: string,
    historicalData: HistoricalPattern[]
  ): number {
    const pattern = historicalData.find(p => 
      p.timeSlot === timeSlot && 
      p.dayOfWeek === dayOfWeek && 
      p.location === location
    );

    return pattern ? pattern.popularityScore : 50; // Default score if no historical data
  }

  private async calculateStaffAvailabilityScore(
    slot: AvailableSlot,
    context: AvailabilityContext
  ): Promise<number> {
    const availableStaffCount = Array.from(context.staffAvailability.values())
      .filter(available => available).length;
    const totalStaff = context.staffAvailability.size;
    
    return totalStaff > 0 ? (availableStaffCount / totalStaff) * 100 : 50;
  }

  private calculateConflictRisk(slot: AvailableSlot, context: AvailabilityContext): number {
    // Calculate risk based on proximity to existing appointments
    const sameTimeAppointments = context.existingAppointments.filter(apt =>
      apt.appointmentDate === slot.date &&
      Math.abs(this.timeToMinutes(apt.startTime) - this.timeToMinutes(slot.startTime)) < 60
    );

    return sameTimeAppointments.length * 25; // 25% risk per nearby appointment
  }

  private async suggestParticipants(
    slot: AvailableSlot,
    context: AvailabilityContext
  ): Promise<string[]> {
    const availableStaff = Array.from(context.staffAvailability.entries())
      .filter(([email, available]) => available)
      .map(([email]) => email);

    return availableStaff.slice(0, 3); // Suggest up to 3 participants
  }

  private async findNearbyAvailableSlots(
    date: string,
    time: string,
    activityId: string
  ): Promise<string[]> {
    // Find alternative slots within 2 hours and ±2 days
    const alternatives: string[] = [];
    
    const baseDate = new Date(date);
    const baseTime = this.timeToMinutes(time);

    for (let dayOffset = -2; dayOffset <= 2; dayOffset++) {
      const checkDate = new Date(baseDate);
      checkDate.setDate(baseDate.getDate() + dayOffset);
      const checkDateStr = checkDate.toISOString().split('T')[0];

      for (let timeOffset = -120; timeOffset <= 120; timeOffset += 30) {
        const checkTime = baseTime + timeOffset;
        if (checkTime < 8 * 60 || checkTime > 17 * 60) continue; // Business hours only

        const checkTimeStr = this.minutesToTime(checkTime);
        alternatives.push(`${checkDateStr} at ${checkTimeStr}`);
      }
    }

    return alternatives.slice(0, 5); // Return top 5 alternatives
  }

  private calculateLeadTimeHours(date: string, time: string): number {
    const appointmentDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    return (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  }

  private generateAvailabilityReport(
    optimizedSlots: OptimizedSlot[],
    allSlots: AvailableSlot[],
    computationTimeMs: number
  ): AvailabilityReport {
    const availableSlots = allSlots.filter(s => s.isAvailable).length;
    const conflictedSlots = allSlots.filter(s => !s.isAvailable).length;

    const recommendations: string[] = [];
    
    if (availableSlots === 0) {
      recommendations.push('No available slots found. Consider expanding date range or adjusting requirements.');
    } else if (availableSlots < 5) {
      recommendations.push('Limited availability. Book soon or consider alternative dates.');
    }

    if (conflictedSlots > availableSlots) {
      recommendations.push('High conflict rate detected. Review scheduling patterns and capacity.');
    }

    return {
      totalSlotsChecked: allSlots.length,
      availableSlots,
      conflictedSlots,
      blackoutSlots: 0, // Would be calculated from overrides
      optimizedSlots: optimizedSlots.filter(s => s.isAvailable).slice(0, 20),
      conflicts: [], // Would be populated from detailed conflict analysis
      recommendations,
      generatedAt: new Date().toISOString(),
      computationTimeMs
    };
  }

  // Helper methods
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private timeRangesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 < end2 && start2 < end1;
  }

  private getDayName(dayOfWeek: number): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayOfWeek] || 'unknown';
  }

  private getDateDayOfWeek(dateStr: string): number {
    return new Date(dateStr).getDay();
  }

  private addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0] || '';
  }

  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }
}