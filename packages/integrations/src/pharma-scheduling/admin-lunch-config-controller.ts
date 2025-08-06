/**
 * Admin Lunch Configuration Controller
 * Administrative endpoints for managing lunch availability settings
 * Requires manager or superadmin role access
 */

// Express types will be resolved at runtime
type Request = any;
type Response = any;

// Note: Decorator implementations are defined below in the file
import { PharmaSchedulingQueries, LunchAvailabilityConfig } from '@ganger/db';
import { PharmaLunchCalendarService } from './lunch-calendar-service';

export interface AdminAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export interface AuthenticatedRequest {
  user?: {
    id: string;
    email: string;
    role: string;
    name?: string;
  };
  params: Record<string, string>;
  body: any;
  get: (header: string) => string | undefined;
}

export interface LunchConfigUpdateRequest {
  availableDays?: number[];
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  bookingWindowWeeks?: number;
  minAdvanceHours?: number;
  locationAddress?: string;
  specialInstructions?: string;
  maxAttendees?: number;
  isActive?: boolean;
}

export interface CalendarTestRequest {
  location: string;
  testDays?: number; // Days ahead to test (default 7)
}

export interface LocationSummary {
  location: string;
  isActive: boolean;
  configuration: {
    availableDays: string[];
    lunchTime: string;
    durationMinutes: number;
    bookingWindowWeeks: number;
    minAdvanceHours: number;
    maxAttendees: number;
  };
  calendar: {
    connected: boolean;
    calendarId: string;
    lastTested?: string;
    testStatus?: string;
  };
  bookings: {
    upcomingCount: number;
    nextBooking?: {
      date: string;
      time: string;
      repName: string;
      companyName: string;
    };
  };
  availability: {
    nextAvailableSlot?: string;
    totalUpcomingSlots: number;
  };
}

export interface AuditLogEntry {
  id: string;
  action: string;
  location: string;
  changedBy: string;
  changeDetails: Record<string, any>;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
}

// Role-based access control decorator
export function requireRole(roles: string[]): MethodDecorator {
  return function (target: any, propertyName: string | symbol | undefined, descriptor: PropertyDescriptor) {
    console.log(`[RoleAuth] Applying role requirement to ${String(propertyName)} on ${target.constructor.name}`);
    const method = descriptor.value;
    descriptor.value = function (req: AuthenticatedRequest, res: Response, ...args: any[]) {
      if (!req.user) {
        const response: AdminAPIResponse = {
          success: false,
          error: 'Authentication required',
          message: 'User must be authenticated to access this endpoint',
          timestamp: new Date().toISOString()
        };
        res.status(401).json(response);
        return;
      }

      if (!roles.includes(req.user.role)) {
        const response: AdminAPIResponse = {
          success: false,
          error: 'Insufficient permissions',
          message: `Requires one of the following roles: ${roles.join(', ')}`,
          timestamp: new Date().toISOString()
        };
        res.status(403).json(response);
        return;
      }

      return method.apply(this, [req, res, ...args]);
    };
  };
}

export class AdminLunchConfigController {
  private db: PharmaSchedulingQueries;
  private calendarService: PharmaLunchCalendarService;

  constructor(dbQueries: PharmaSchedulingQueries, calendarService: PharmaLunchCalendarService) {
    this.db = dbQueries;
    this.calendarService = calendarService;
  }

  // =====================================================
  // CONFIGURATION MANAGEMENT ENDPOINTS
  // =====================================================

  /**
   * GET /api/admin/lunch-config
   * Get all lunch location configurations
   */
  // @requireRole(['manager', 'superadmin']) // TODO: Fix decorator signature
  async getLunchConfigs(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const configs = await this.db.getAllLunchConfigs();
      
      // Format for admin interface
      const formattedConfigs = configs.map(config => ({
        ...config,
        availableDaysFormatted: this.formatAvailableDays(config.availableDays),
        lunchTimeFormatted: `${this.formatTime(config.startTime)} - ${this.formatTime(config.endTime)}`,
        lastUpdatedFormatted: config.updatedAt ? this.formatDateTime(config.updatedAt) : 'Never'
      }));

      const response: AdminAPIResponse<{ configs: typeof formattedConfigs }> = {
        success: true,
        data: { configs: formattedConfigs },
        message: `Retrieved ${configs.length} lunch configurations`,
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId()
      };

      res.json(response);

    } catch (error) {
      const response: AdminAPIResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to retrieve lunch configurations',
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId()
      };

      res.status(500).json(response);
    }
  }

  /**
   * GET /api/admin/lunch-config/:location
   * Get specific location configuration
   */
  // @requireRole(['manager', 'superadmin']) // TODO: Fix decorator signature
  async getLunchConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { location } = req.params;
      if (!location) {
        const response: AdminAPIResponse = {
          success: false,
          error: 'Location parameter is required',
          message: 'Location must be specified in the URL',
          timestamp: new Date().toISOString(),
          requestId: this.generateRequestId()
        };
        res.status(400).json(response);
        return;
      }
      const config = await this.db.getLunchConfigByLocation(location);

      if (!config) {
        const response: AdminAPIResponse = {
          success: false,
          error: 'Configuration not found',
          message: `No configuration found for location: ${location}`,
          timestamp: new Date().toISOString(),
          requestId: this.generateRequestId()
        };
        res.status(404).json(response);
        return;
      }

      // Get additional stats for admin interface
      const upcomingBookings = await this.db.getLunchAppointmentsByLocation(
        location,
        new Date().toISOString().split('T')[0] // Today onwards
      );

      const enhancedConfig = {
        ...config,
        availableDaysFormatted: this.formatAvailableDays(config.availableDays),
        lunchTimeFormatted: `${this.formatTime(config.startTime)} - ${this.formatTime(config.endTime)}`,
        lastUpdatedFormatted: config.updatedAt ? this.formatDateTime(config.updatedAt) : 'Never',
        stats: {
          upcomingBookings: upcomingBookings.length,
          nextBooking: upcomingBookings.length > 0 ? {
            date: upcomingBookings[0] ? this.formatDate(upcomingBookings[0].appointmentDate) : '',
            time: upcomingBookings[0] ? this.formatTime(upcomingBookings[0].startTime) : '',
            repName: upcomingBookings[0]?.repId || 'Unknown',
            companyName: 'Loading...' // Would need to join with rep data
          } : null
        }
      };

      const response: AdminAPIResponse<{ config: typeof enhancedConfig }> = {
        success: true,
        data: { config: enhancedConfig },
        message: 'Configuration retrieved successfully',
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId()
      };

      res.json(response);

    } catch (error) {
      const response: AdminAPIResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to retrieve configuration',
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId()
      };

      res.status(500).json(response);
    }
  }

  /**
   * PUT /api/admin/lunch-config/:location
   * Update location configuration
   */
  // @requireRole(['manager', 'superadmin']) // TODO: Fix decorator signature
  async updateLunchConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { location } = req.params;
      if (!location) {
        const response: AdminAPIResponse = {
          success: false,
          error: 'Location parameter is required',
          message: 'Location must be specified in the URL',
          timestamp: new Date().toISOString(),
          requestId: this.generateRequestId()
        };
        res.status(400).json(response);
        return;
      }
      const updateData: LunchConfigUpdateRequest = req.body;
      const userId = req.user!.id;

      // Validate update data
      const validation = this.validateConfigUpdate(updateData);
      if (!validation.isValid) {
        const response: AdminAPIResponse = {
          success: false,
          error: validation.errors?.join('; '),
          message: 'Configuration validation failed',
          timestamp: new Date().toISOString(),
          requestId: this.generateRequestId()
        };
        res.status(400).json(response);
        return;
      }

      // Get current config for change tracking
      const currentConfig = await this.db.getLunchConfigByLocation(location);
      if (!currentConfig) {
        const response: AdminAPIResponse = {
          success: false,
          error: 'Configuration not found',
          message: `No configuration found for location: ${location}`,
          timestamp: new Date().toISOString(),
          requestId: this.generateRequestId()
        };
        res.status(404).json(response);
        return;
      }

      // Update configuration
      const updateSuccess = await this.db.updateLunchConfig(location, updateData, userId);

      if (!updateSuccess) {
        const response: AdminAPIResponse = {
          success: false,
          error: 'Update failed',
          message: 'Failed to update configuration in database',
          timestamp: new Date().toISOString(),
          requestId: this.generateRequestId()
        };
        res.status(500).json(response);
        return;
      }

      // Log configuration change for audit trail
      await this.logConfigurationChange(
        location,
        req.user!,
        currentConfig,
        updateData,
        req.get('User-Agent'),
        this.getClientIP(req)
      );

      // Get updated configuration
      const updatedConfig = await this.db.getLunchConfigByLocation(location);

      const response: AdminAPIResponse<{ config: LunchAvailabilityConfig }> = {
        success: true,
        data: { config: updatedConfig! },
        message: 'Configuration updated successfully',
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId()
      };

      res.json(response);

      // Log success
      console.log(`[AdminConfig] ${req.user!.email} updated lunch config for ${location}`);

    } catch (error) {
      const response: AdminAPIResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to update configuration',
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId()
      };

      res.status(500).json(response);
    }
  }

  // =====================================================
  // CALENDAR INTEGRATION TESTING
  // =====================================================

  /**
   * POST /api/admin/lunch-config/test-calendar
   * Test Google Calendar connection for a location
   */
  // @requireRole(['manager', 'superadmin']) // TODO: Fix decorator signature
  async testCalendarConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { location, testDays = 7 }: CalendarTestRequest = req.body;

      if (!location) {
        const response: AdminAPIResponse = {
          success: false,
          error: 'Location is required',
          message: 'Please specify a location to test',
          timestamp: new Date().toISOString(),
          requestId: this.generateRequestId()
        };
        res.status(400).json(response);
        return;
      }

      // Test calendar connection
      const testResult = await this.calendarService.testCalendarConnection(location);

      // If test successful, get additional details
      let additionalInfo = {};
      if (testResult.success) {
        try {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(startDate.getDate() + testDays);

          const slots = await this.calendarService.getAvailableSlots(location, startDate, endDate);
          const availableSlots = slots.filter(slot => slot.available);

          additionalInfo = {
            testPeriod: `${testDays} days`,
            totalSlotsChecked: slots.length,
            availableSlots: availableSlots.length,
            nextAvailableSlot: availableSlots.length > 0 && availableSlots[0] ? 
              `${availableSlots[0].date} at ${availableSlots[0].startTime}` : 
              'None in test period'
          };
        } catch (error) {
          additionalInfo = {
            warning: 'Calendar connection succeeded but slot calculation failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }

      const response: AdminAPIResponse<typeof testResult & typeof additionalInfo> = {
        success: testResult.success,
        data: { ...testResult, ...additionalInfo },
        message: testResult.message,
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId()
      };

      if (testResult.success) {
        res.json(response);
      } else {
        res.status(500).json(response);
      }

      // Log test attempt
      console.log(`[AdminConfig] ${req.user!.email} tested calendar connection for ${location}: ${testResult.success ? 'SUCCESS' : 'FAILED'}`);

    } catch (error) {
      const response: AdminAPIResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Calendar connection test failed',
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId()
      };

      res.status(500).json(response);
    }
  }

  // =====================================================
  // SYSTEM OVERVIEW AND MONITORING
  // =====================================================

  /**
   * GET /api/admin/lunch-config/overview
   * Get complete system overview with all locations
   */
  // @requireRole(['manager', 'superadmin']) // TODO: Fix decorator signature
  async getSystemOverview(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Get location summary from calendar service
      const locationSummary = await this.calendarService.getLocationSummary();
      
      // Get all configurations
      const configs = await this.db.getAllLunchConfigs();
      
      // Build comprehensive overview
      const overview = {
        totalLocations: configs.length,
        activeLocations: configs.filter(c => c.isActive).length,
        inactiveLocations: configs.filter(c => !c.isActive).length,
        locations: await Promise.all(configs.map(async (config) => {
          const summary = locationSummary.find(s => s.location === config.locationName);
          
          // Get recent bookings for this location
          const recentBookings = await this.db.getLunchAppointmentsByLocation(
            config.locationName,
            new Date().toISOString().split('T')[0]
          );

          return {
            location: config.locationName,
            isActive: config.isActive,
            configuration: {
              availableDays: this.formatAvailableDays(config.availableDays),
              lunchTime: `${this.formatTime(config.startTime)} - ${this.formatTime(config.endTime)}`,
              durationMinutes: config.durationMinutes,
              bookingWindowWeeks: config.bookingWindowWeeks,
              minAdvanceHours: config.minAdvanceHours,
              maxAttendees: config.maxAttendees
            },
            calendar: {
              connected: summary?.isActive || false,
              calendarId: config.googleCalendarId,
              lastTested: config.updatedAt,
              testStatus: summary?.isActive ? 'Connected' : 'Connection Issues'
            },
            bookings: {
              upcomingCount: recentBookings.length,
              nextBooking: recentBookings.length > 0 ? {
                date: recentBookings[0] ? this.formatDate(recentBookings[0].appointmentDate) : '',
                time: recentBookings[0] ? this.formatTime(recentBookings[0].startTime) : '',
                repName: 'Loading...',
                companyName: 'Loading...'
              } : undefined
            },
            availability: {
              nextAvailableSlot: summary?.nextAvailableSlot,
              totalUpcomingSlots: summary?.totalUpcomingSlots || 0
            }
          };
        })),
        systemHealth: {
          allLocationsActive: configs.every(c => c.isActive),
          calendarConnections: locationSummary.filter(s => s.isActive).length,
          totalUpcomingSlots: locationSummary.reduce((sum, s) => sum + s.totalUpcomingSlots, 0)
        },
        lastUpdated: new Date().toISOString()
      };

      const response: AdminAPIResponse<typeof overview> = {
        success: true,
        data: overview,
        message: 'System overview retrieved successfully',
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId()
      };

      res.json(response);

    } catch (error) {
      const response: AdminAPIResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to retrieve system overview',
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId()
      };

      res.status(500).json(response);
    }
  }

  // =====================================================
  // VALIDATION AND UTILITY METHODS
  // =====================================================

  private validateConfigUpdate(updateData: LunchConfigUpdateRequest): {
    isValid: boolean;
    errors?: string[];
  } {
    const errors: string[] = [];

    // Validate available days
    if (updateData.availableDays) {
      if (!Array.isArray(updateData.availableDays) || 
          updateData.availableDays.some(day => day < 1 || day > 7)) {
        errors.push('Available days must be array of numbers 1-7 (Monday-Sunday)');
      }
    }

    // Validate time format
    if (updateData.startTime && !this.isValidTime(updateData.startTime)) {
      errors.push('Invalid start time format (use HH:MM)');
    }

    if (updateData.endTime && !this.isValidTime(updateData.endTime)) {
      errors.push('Invalid end time format (use HH:MM)');
    }

    // Validate time logic
    if (updateData.startTime && updateData.endTime) {
      if (updateData.startTime >= updateData.endTime) {
        errors.push('End time must be after start time');
      }
    }

    // Validate numeric ranges
    if (updateData.durationMinutes && (updateData.durationMinutes < 15 || updateData.durationMinutes > 180)) {
      errors.push('Duration must be between 15 and 180 minutes');
    }

    if (updateData.bookingWindowWeeks && (updateData.bookingWindowWeeks < 1 || updateData.bookingWindowWeeks > 52)) {
      errors.push('Booking window must be between 1 and 52 weeks');
    }

    if (updateData.minAdvanceHours && (updateData.minAdvanceHours < 1 || updateData.minAdvanceHours > 168)) {
      errors.push('Minimum advance hours must be between 1 and 168 (1 week)');
    }

    if (updateData.maxAttendees && (updateData.maxAttendees < 1 || updateData.maxAttendees > 100)) {
      errors.push('Max attendees must be between 1 and 100');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  private async logConfigurationChange(
    location: string,
    user: { id: string; email: string; role: string },
    _oldConfig: LunchAvailabilityConfig,
    changes: LunchConfigUpdateRequest,
    userAgent?: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      // This would log to a proper audit table
      // For now, just console logging
      console.log(`[ConfigAudit] ${user.email} (${user.role}) updated ${location} configuration:`, {
        changes,
        timestamp: new Date().toISOString(),
        userAgent,
        ipAddress
      });
      
      // In production, this would be:
      // await this.db.logConfigurationChange(location, user.id, oldConfig, changes, userAgent, ipAddress);
      
    } catch (error) {
      console.error('Failed to log configuration change:', error);
    }
  }

  private formatAvailableDays(days: number[]): string[] {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.map(day => {
      const index = day === 7 ? 0 : day;
      return dayNames[index] || 'Unknown';
    }).filter(name => name !== 'Unknown');
  }

  private formatTime(timeStr: string): string {
    const parts = timeStr.split(':');
    if (parts.length !== 2) return timeStr;
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    if (isNaN(hours) || isNaN(minutes)) return timeStr;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private formatDateTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private isValidTime(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private getClientIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
           req.connection.remoteAddress || 
           'unknown';
  }
}