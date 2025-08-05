/**
 * Pharmaceutical Scheduling Database Queries
 * Comprehensive data access layer for pharmaceutical rep scheduling system
 */
export interface PharmaRepresentative {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    companyName: string;
    territory?: string;
    title?: string;
    isActive: boolean;
    lastLogin?: string;
    accountCreatedAt: string;
    createdBy?: string;
    notes?: string;
    preferredLocations: string[];
    specialties: string[];
    createdAt: string;
    updatedAt: string;
}
export interface SchedulingActivity {
    id: string;
    activityName: string;
    location: string;
    locationAddress: string;
    durationMinutes: number;
    blockOffMinutes: number;
    appointmentType: 'in_person' | 'virtual';
    maxParticipants: number;
    requiresApproval: boolean;
    isActive: boolean;
    availableDays: number[];
    availableTimes: Record<string, Array<{
        start: string;
        end: string;
    }>>;
    bookingWindowWeeks: number;
    cancellationHours: number;
    description?: string;
    specialInstructions?: string;
    createdBy?: string;
    createdAt: string;
    updatedAt: string;
}
export interface LunchAvailabilityConfig {
    id: string;
    locationName: string;
    googleCalendarId: string;
    availableDays: number[];
    startTime: string;
    endTime: string;
    durationMinutes: number;
    bookingWindowWeeks: number;
    minAdvanceHours: number;
    locationAddress: string;
    specialInstructions?: string;
    maxAttendees: number;
    isActive: boolean;
    lastUpdatedBy?: string;
    createdAt: string;
    updatedAt: string;
}
export interface LunchTimeSlot {
    date: string;
    startTime: string;
    endTime: string;
    available: boolean;
    locationName: string;
    conflictReason?: string;
}
export interface LunchBookingValidation {
    isValid: boolean;
    errorMessage?: string;
    dayOfWeek: number;
    isAvailableDay: boolean;
    withinTimeWindow: boolean;
    meetsAdvanceNotice: boolean;
}
export interface PharmaAppointment {
    id: string;
    activityId: string;
    repId: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    location: string;
    locationAddress: string;
    participantCount: number;
    approvalStatus: 'pending' | 'approved' | 'denied';
    approvedBy?: string;
    approvedAt?: string;
    denialReason?: string;
    specialRequests?: string;
    confirmationSent: boolean;
    reminderSent: boolean;
    cancelledAt?: string;
    cancelledBy?: string;
    cancellationReason?: string;
    completedAt?: string;
    googleCalendarEventId?: string;
    bookingSource: string;
    createdAt: string;
    updatedAt: string;
}
export interface AppointmentParticipant {
    id: string;
    appointmentId: string;
    staffEmail: string;
    staffName: string;
    participationStatus: 'invited' | 'confirmed' | 'declined' | 'attended';
    rsvpAt?: string;
    attendanceConfirmed: boolean;
    notes?: string;
    notificationSent: boolean;
    createdAt: string;
}
export interface AvailabilityOverride {
    id: string;
    activityId: string;
    overrideDate: string;
    overrideType: 'blackout' | 'special_hours' | 'closed';
    customTimes?: Record<string, Array<{
        start: string;
        end: string;
    }>>;
    reason?: string;
    createdBy?: string;
    createdAt: string;
}
export interface PharmaAnalytics {
    id: string;
    analyticsDate: string;
    location: string;
    totalAppointments: number;
    confirmedAppointments: number;
    cancelledAppointments: number;
    deniedAppointments: number;
    completedAppointments: number;
    totalParticipants: number;
    uniqueReps: number;
    uniqueCompanies: number;
    averageBookingLeadTimeDays?: number;
    averageApprovalTimeHours?: number;
    cancellationRate?: number;
    attendanceRate?: number;
    approvalRate?: number;
    mostPopularTimeSlot?: string;
    busiestDayOfWeek?: number;
    peakBookingHour?: number;
    totalCommunicationVolume: number;
    createdAt: string;
}
export interface AvailableSlot {
    date: string;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    conflictReason?: string;
    existingAppointments?: PharmaAppointment[];
}
export interface ConflictCheck {
    hasConflicts: boolean;
    conflictingAppointments: PharmaAppointment[];
    conflictReasons: string[];
}
export declare class PharmaSchedulingQueries {
    private db;
    constructor(supabaseClient: any);
    createPharmaRep(repData: Omit<PharmaRepresentative, 'id' | 'createdAt' | 'updatedAt'>): Promise<PharmaRepresentative>;
    getPharmaRepById(repId: string): Promise<PharmaRepresentative | null>;
    getPharmaRepByEmail(email: string): Promise<PharmaRepresentative | null>;
    getActivePharmaReps(companyFilter?: string, territoryFilter?: string): Promise<PharmaRepresentative[]>;
    updatePharmaRep(repId: string, updates: Partial<PharmaRepresentative>): Promise<PharmaRepresentative>;
    updateRepLastLogin(repId: string): Promise<void>;
    createSchedulingActivity(activityData: Omit<SchedulingActivity, 'id' | 'createdAt' | 'updatedAt'>): Promise<SchedulingActivity>;
    getSchedulingActivities(locationFilter?: string, activeOnly?: boolean): Promise<SchedulingActivity[]>;
    getSchedulingActivityById(activityId: string): Promise<SchedulingActivity | null>;
    updateSchedulingActivity(activityId: string, updates: Partial<SchedulingActivity>): Promise<SchedulingActivity>;
    createPharmaAppointment(appointmentData: Omit<PharmaAppointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<PharmaAppointment>;
    getPharmaAppointmentById(appointmentId: string): Promise<PharmaAppointment | null>;
    getPharmaAppointments(filters?: {
        repId?: string;
        activityId?: string;
        location?: string;
        status?: string;
        approvalStatus?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
    }): Promise<PharmaAppointment[]>;
    getUpcomingAppointments(days?: number): Promise<PharmaAppointment[]>;
    getPendingApprovals(): Promise<PharmaAppointment[]>;
    updatePharmaAppointment(appointmentId: string, updates: Partial<PharmaAppointment>): Promise<PharmaAppointment>;
    approveAppointment(appointmentId: string, approvedBy: string): Promise<PharmaAppointment>;
    denyAppointment(appointmentId: string, approvedBy: string, denialReason: string): Promise<PharmaAppointment>;
    cancelAppointment(appointmentId: string, cancelledBy: string, cancellationReason?: string): Promise<PharmaAppointment>;
    checkAppointmentConflicts(repId: string, appointmentDate: string, startTime: string, endTime: string, excludeAppointmentId?: string): Promise<ConflictCheck>;
    getAvailableSlots(activityId: string, startDate: string, endDate: string, includeBooked?: boolean): Promise<AvailableSlot[]>;
    getAnalytics(startDate: string, endDate: string, location?: string): Promise<PharmaAnalytics[]>;
    updateAnalytics(date: string, location: string): Promise<void>;
    private timeRangesOverlap;
    private mapPharmaRep;
    private mapSchedulingActivity;
    private mapPharmaAppointment;
    private mapPharmaAnalytics;
    getActiveLunchLocations(): Promise<Array<{
        locationName: string;
        locationAddress: string;
        durationMinutes: number;
        bookingWindowWeeks: number;
        availableDays: number[];
        startTime: string;
        endTime: string;
    }>>;
    getLunchConfigByLocation(locationName: string): Promise<LunchAvailabilityConfig | null>;
    getAllLunchConfigs(): Promise<LunchAvailabilityConfig[]>;
    updateLunchConfig(locationName: string, updates: Partial<LunchAvailabilityConfig>, updatedBy?: string): Promise<boolean>;
    validateLunchTimeSlot(locationName: string, appointmentDate: string, startTime: string): Promise<LunchBookingValidation>;
    createLunchAppointment(appointmentData: {
        repName: string;
        companyName: string;
        repEmail: string;
        repPhone?: string;
        location: string;
        appointmentDate: string;
        startTime: string;
        endTime: string;
        specialRequests?: string;
        confirmationNumber: string;
        googleCalendarEventId?: string;
    }): Promise<PharmaAppointment>;
    getLunchAppointmentsByLocation(location: string, startDate?: string, endDate?: string): Promise<PharmaAppointment[]>;
    checkLunchSlotAvailability(location: string, appointmentDate: string, startTime: string, endTime: string): Promise<{
        isAvailable: boolean;
        conflictReason?: string;
    }>;
    private mapLunchConfig;
}
