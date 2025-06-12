import { ApiResponse, StaffSchedule, StaffMember, Provider, OptimizationSuggestion, StaffingAnalytics } from '@/types/staffing';

// Standard API response format compliance
interface StandardApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  };
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://clinical-staffing.gangerdermatology.com'
      : '';
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<StandardApiResponse<T>> {
    const url = `${this.baseUrl}/api${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      headers: { ...defaultHeaders, ...options.headers },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: StandardApiResponse<T> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'API request failed');
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Staff Schedules API
  async getSchedules(
    date: string, 
    locationId?: string
  ): Promise<StandardApiResponse<StaffSchedule[]>> {
    const params = new URLSearchParams({ date });
    if (locationId) params.append('locationId', locationId);
    
    return this.request<StaffSchedule[]>(`/staff-schedules?${params}`);
  }

  async updateSchedule(
    scheduleId: string, 
    data: Partial<StaffSchedule>
  ): Promise<StandardApiResponse<StaffSchedule>> {
    return this.request<StaffSchedule>(`/staff-schedules/${scheduleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async createSchedule(
    data: Omit<StaffSchedule, 'id' | 'created_at' | 'updated_at'>
  ): Promise<StandardApiResponse<StaffSchedule>> {
    return this.request<StaffSchedule>('/staff-schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteSchedule(scheduleId: string): Promise<StandardApiResponse<void>> {
    return this.request<void>(`/staff-schedules/${scheduleId}`, {
      method: 'DELETE',
    });
  }

  // Staff Members API
  async getStaffMembers(
    locationId?: string,
    role?: string
  ): Promise<StandardApiResponse<StaffMember[]>> {
    const params = new URLSearchParams();
    if (locationId) params.append('locationId', locationId);
    if (role) params.append('role', role);
    
    return this.request<StaffMember[]>(`/staff-members?${params}`);
  }

  async updateStaffAvailability(
    staffId: string,
    availability: {
      available_start_time: string;
      available_end_time: string;
      location_preferences: string[];
      unavailable_dates: string[];
      notes?: string;
    }
  ): Promise<StandardApiResponse<StaffMember>> {
    return this.request<StaffMember>(`/staff-members/${staffId}/availability`, {
      method: 'PUT',
      body: JSON.stringify(availability),
    });
  }

  // Providers API
  async getProviders(
    locationId?: string,
    date?: string
  ): Promise<StandardApiResponse<Provider[]>> {
    const params = new URLSearchParams();
    if (locationId) params.append('locationId', locationId);
    if (date) params.append('date', date);
    
    return this.request<Provider[]>(`/providers?${params}`);
  }

  // Optimization API
  async getOptimizationSuggestions(
    date: string, 
    locationId: string
  ): Promise<StandardApiResponse<OptimizationSuggestion[]>> {
    return this.request<OptimizationSuggestion[]>('/staffing/suggestions', {
      method: 'POST',
      body: JSON.stringify({ date, locationId }),
    });
  }

  async applyOptimizationSuggestion(
    suggestionId: string
  ): Promise<StandardApiResponse<StaffSchedule[]>> {
    return this.request<StaffSchedule[]>(`/staffing/suggestions/${suggestionId}/apply`, {
      method: 'POST',
    });
  }

  async autoAssignStaff(
    date: string,
    locationId: string,
    preferences?: Record<string, any>
  ): Promise<StandardApiResponse<StaffSchedule[]>> {
    return this.request<StaffSchedule[]>('/staffing/auto-assign', {
      method: 'POST',
      body: JSON.stringify({ date, locationId, preferences }),
    });
  }

  // Analytics API
  async getStaffingAnalytics(
    startDate: string,
    endDate: string,
    locationId?: string
  ): Promise<StandardApiResponse<StaffingAnalytics>> {
    const params = new URLSearchParams({ startDate, endDate });
    if (locationId) params.append('locationId', locationId);
    
    return this.request<StaffingAnalytics>(`/analytics/staffing?${params}`);
  }

  // Locations API
  async getLocations(): Promise<StandardApiResponse<import('@/types/staffing').Location[]>> {
    return this.request<import('@/types/staffing').Location[]>('/locations');
  }

  // Health check
  async healthCheck(): Promise<StandardApiResponse<{ status: string; timestamp: string }>> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;