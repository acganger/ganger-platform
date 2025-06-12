/**
 * Pharmaceutical Scheduling API Client
 * Complete integration with the backend API system
 */

import type {
  Location,
  TimeSlot,
  BookingRequest,
  BookingResponse,
  Appointment,
  PendingApproval,
  AdminStats,
  APIResponse,
  PaginatedResponse,
  BookingAnalytics,
  LocationConfig
} from '@/types';

class PharmaSchedulingAPI {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl = '/api/pharma-scheduling') {
    this.baseUrl = baseUrl;
  }

  // Authentication helpers
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  private getHeaders(includeAuth = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<APIResponse<T>> {
    try {
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: {
            message: data.message || 'An error occurred',
            code: data.code || 'UNKNOWN_ERROR',
            details: data.details
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: data.requestId || crypto.randomUUID()
          }
        };
      }

      return {
        success: true,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: data.requestId || crypto.randomUUID()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Failed to parse response',
          code: 'PARSE_ERROR',
          details: error
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        }
      };
    }
  }

  // =====================================================
  // PUBLIC API ENDPOINTS (No Authentication Required)
  // =====================================================

  /**
   * Get all available locations for pharmaceutical presentations
   */
  async getLocations(): Promise<APIResponse<Location[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/public/locations`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      return this.handleResponse<Location[]>(response);
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Network error fetching locations',
          code: 'NETWORK_ERROR',
          details: error
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        }
      };
    }
  }

  /**
   * Get available time slots for a specific location and date range
   */
  async getAvailability(
    location: string,
    startDate: string,
    endDate: string,
    participantCount = 1
  ): Promise<APIResponse<TimeSlot[]>> {
    try {
      const params = new URLSearchParams({
        start: startDate,
        end: endDate,
        participants: participantCount.toString()
      });

      const response = await fetch(
        `${this.baseUrl}/public/availability/${encodeURIComponent(location)}?${params}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      return this.handleResponse<TimeSlot[]>(response);
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Network error fetching availability',
          code: 'NETWORK_ERROR',
          details: error
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        }
      };
    }
  }

  /**
   * Submit a new booking request
   */
  async submitBooking(bookingData: BookingRequest): Promise<APIResponse<BookingResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/public/bookings`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(bookingData)
      });

      return this.handleResponse<BookingResponse>(response);
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Network error submitting booking',
          code: 'NETWORK_ERROR',
          details: error
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        }
      };
    }
  }

  /**
   * Get booking details by confirmation number
   */
  async getBookingDetails(confirmationNumber: string): Promise<APIResponse<Appointment>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/public/booking/${encodeURIComponent(confirmationNumber)}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      return this.handleResponse<Appointment>(response);
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Network error fetching booking details',
          code: 'NETWORK_ERROR',
          details: error
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        }
      };
    }
  }

  /**
   * Cancel a booking by confirmation number
   */
  async cancelBooking(
    confirmationNumber: string,
    reason?: string
  ): Promise<APIResponse<{ success: boolean }>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/public/booking/${encodeURIComponent(confirmationNumber)}/cancel`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ reason })
        }
      );

      return this.handleResponse<{ success: boolean }>(response);
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Network error cancelling booking',
          code: 'NETWORK_ERROR',
          details: error
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        }
      };
    }
  }

  // =====================================================
  // ADMIN API ENDPOINTS (Authentication Required)
  // =====================================================

  /**
   * Get admin dashboard statistics
   */
  async getAdminStats(): Promise<APIResponse<AdminStats>> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/stats`, {
        method: 'GET',
        headers: this.getHeaders(true)
      });

      return this.handleResponse<AdminStats>(response);
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Network error fetching admin stats',
          code: 'NETWORK_ERROR',
          details: error
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        }
      };
    }
  }

  /**
   * Get pending approval requests
   */
  async getPendingApprovals(): Promise<APIResponse<PendingApproval[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/approvals/pending`, {
        method: 'GET',
        headers: this.getHeaders(true)
      });

      return this.handleResponse<PendingApproval[]>(response);
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Network error fetching pending approvals',
          code: 'NETWORK_ERROR',
          details: error
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        }
      };
    }
  }

  /**
   * Approve an appointment
   */
  async approveAppointment(
    appointmentId: string,
    notes?: string
  ): Promise<APIResponse<{ success: boolean }>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/admin/approvals/${encodeURIComponent(appointmentId)}/approve`,
        {
          method: 'POST',
          headers: this.getHeaders(true),
          body: JSON.stringify({ notes })
        }
      );

      return this.handleResponse<{ success: boolean }>(response);
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Network error approving appointment',
          code: 'NETWORK_ERROR',
          details: error
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        }
      };
    }
  }

  /**
   * Reject an appointment
   */
  async rejectAppointment(
    appointmentId: string,
    reason: string
  ): Promise<APIResponse<{ success: boolean }>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/admin/approvals/${encodeURIComponent(appointmentId)}/reject`,
        {
          method: 'POST',
          headers: this.getHeaders(true),
          body: JSON.stringify({ reason })
        }
      );

      return this.handleResponse<{ success: boolean }>(response);
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Network error rejecting appointment',
          code: 'NETWORK_ERROR',
          details: error
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        }
      };
    }
  }

  /**
   * Get all appointments with filters
   */
  async getAppointments(params: {
    page?: number;
    limit?: number;
    status?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<PaginatedResponse<Appointment>> {
    try {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.set(key, value.toString());
        }
      });

      const response = await fetch(
        `${this.baseUrl}/admin/appointments?${searchParams}`,
        {
          method: 'GET',
          headers: this.getHeaders(true)
        }
      );

      const result = await this.handleResponse<Appointment[]>(response);
      
      // Convert to paginated response
      return {
        ...result,
        pagination: {
          page: params.page || 1,
          limit: params.limit || 20,
          total: (result.data || []).length,
          hasMore: false // Would be calculated by backend
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Network error fetching appointments',
          code: 'NETWORK_ERROR',
          details: error
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        },
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          hasMore: false
        }
      };
    }
  }

  /**
   * Get booking analytics
   */
  async getAnalytics(
    startDate: string,
    endDate: string
  ): Promise<APIResponse<BookingAnalytics>> {
    try {
      const params = new URLSearchParams({
        start: startDate,
        end: endDate
      });

      const response = await fetch(
        `${this.baseUrl}/admin/analytics?${params}`,
        {
          method: 'GET',
          headers: this.getHeaders(true)
        }
      );

      return this.handleResponse<BookingAnalytics>(response);
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Network error fetching analytics',
          code: 'NETWORK_ERROR',
          details: error
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        }
      };
    }
  }

  /**
   * Get location configurations
   */
  async getLocationConfigs(): Promise<APIResponse<LocationConfig[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/config/locations`, {
        method: 'GET',
        headers: this.getHeaders(true)
      });

      return this.handleResponse<LocationConfig[]>(response);
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Network error fetching location configs',
          code: 'NETWORK_ERROR',
          details: error
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        }
      };
    }
  }

  /**
   * Update location configuration
   */
  async updateLocationConfig(
    locationId: string,
    config: Partial<LocationConfig>
  ): Promise<APIResponse<LocationConfig>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/admin/config/locations/${encodeURIComponent(locationId)}`,
        {
          method: 'PUT',
          headers: this.getHeaders(true),
          body: JSON.stringify(config)
        }
      );

      return this.handleResponse<LocationConfig>(response);
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Network error updating location config',
          code: 'NETWORK_ERROR',
          details: error
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        }
      };
    }
  }

  /**
   * Test Google Calendar connection
   */
  async testCalendarConnection(
    locationId: string
  ): Promise<APIResponse<{ connected: boolean; lastSync?: string }>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/admin/config/test-calendar/${encodeURIComponent(locationId)}`,
        {
          method: 'POST',
          headers: this.getHeaders(true)
        }
      );

      return this.handleResponse<{ connected: boolean; lastSync?: string }>(response);
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Network error testing calendar connection',
          code: 'NETWORK_ERROR',
          details: error
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        }
      };
    }
  }
}

// Create singleton instance
export const pharmaAPI = new PharmaSchedulingAPI();

// Export the class for dependency injection
export default PharmaSchedulingAPI;