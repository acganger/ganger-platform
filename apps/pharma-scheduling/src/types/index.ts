/**
 * Pharmaceutical Scheduling Frontend Types
 * Complete type definitions for the TimeTrade replacement system
 */

// Core scheduling types
export interface Location {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone?: string;
  availableDays: string[];
  timeRange: string;
  description?: string;
  isActive: boolean;
  maxParticipants: number;
}

export interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  available: boolean;
  location: string;
  conflictReason?: string;
  optimizationScore?: number;
}

export interface BookingRequest {
  // Representative information
  repEmail: string;
  repFirstName: string;
  repLastName: string;
  repPhone?: string;
  companyName: string;
  
  // Appointment details
  location: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  participantCount: number;
  
  // Additional information
  specialRequests?: string;
  presentationTopic?: string;
  cateringPreferences?: string;
  
  // Marketing consent
  marketingConsent: boolean;
  communicationPreferences: {
    email: boolean;
    sms: boolean;
    phone: boolean;
  };
}

export interface BookingResponse {
  success: boolean;
  bookingId: string;
  confirmationNumber: string;
  status: 'pending_approval' | 'confirmed' | 'rejected';
  appointmentDetails: {
    date: string;
    time: string;
    location: string;
    duration: number;
  };
  approvalProcess: {
    estimatedResponseTime: string;
    contactPerson: string;
    nextSteps: string[];
  };
  calendarEvent?: {
    icsUrl: string;
    googleCalendarUrl: string;
  };
}

export interface Appointment {
  id: string;
  confirmationNumber: string;
  repInfo: {
    name: string;
    email: string;
    phone?: string;
    company: string;
  };
  appointmentDate: string;
  startTime: string;
  endTime: string;
  location: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  participantCount: number;
  specialRequests?: string;
  presentationTopic?: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

// Admin-specific types
export interface PendingApproval extends Appointment {
  submittedAt: string;
  urgency: 'low' | 'medium' | 'high';
  businessJustification?: string;
  previousInteractions: number;
  repRating?: number;
}

export interface AdminStats {
  pendingApprovals: number;
  thisWeekAppointments: number;
  nextWeekAppointments: number;
  cancellationRate: number;
  averageApprovalTime: number;
  totalRepresentatives: number;
}

// API response types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Form validation types
export type BookingFormData = {
  // Step 1: Representative Information
  repEmail: string;
  repFirstName: string;
  repLastName: string;
  repPhone: string;
  companyName: string;
  
  // Step 2: Appointment Details
  selectedSlot: TimeSlot | null;
  participantCount: number;
  presentationTopic: string;
  
  // Step 3: Additional Information
  specialRequests: string;
  cateringPreferences: string;
  
  // Step 4: Consent and Communication
  marketingConsent: boolean;
  emailConsent: boolean;
  smsConsent: boolean;
  phoneConsent: boolean;
};

export type BookingStep = 'location' | 'calendar' | 'form' | 'confirmation';

// UI state types
export interface AppState {
  selectedLocation: Location | null;
  selectedSlot: TimeSlot | null;
  bookingStep: BookingStep;
  isLoading: boolean;
  error: string | null;
}

// Calendar types
export interface CalendarDay {
  date: string;
  dayOfWeek: string;
  isToday: boolean;
  isAvailable: boolean;
  slots: TimeSlot[];
  totalSlots: number;
  availableSlots: number;
}

export interface CalendarWeek {
  weekOf: string;
  days: CalendarDay[];
}

// Configuration types (admin)
export interface LocationConfig {
  id: string;
  locationName: string;
  calendarId: string;
  availableHours: {
    [day: string]: { start: string; end: string; };
  };
  maxDailyBookings: number;
  advanceBookingDays: number;
  cancellationHours: number;
  approvalRequired: boolean;
  isActive: boolean;
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface BookingError {
  type: 'validation' | 'conflict' | 'system' | 'network';
  message: string;
  details?: any;
  recoverable: boolean;
  suggestedActions?: string[];
}

// Analytics types (admin)
export interface BookingAnalytics {
  period: string;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  averageLeadTime: number;
  popularTimeSlots: Array<{
    time: string;
    count: number;
  }>;
  topCompanies: Array<{
    company: string;
    bookings: number;
  }>;
  locationDistribution: Array<{
    location: string;
    percentage: number;
  }>;
}

// Notification types
export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  reminderHours: number[];
}

export interface SystemNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actions?: Array<{
    label: string;
    action: string;
    style: 'primary' | 'secondary' | 'danger';
  }>;
}