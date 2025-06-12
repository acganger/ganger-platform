import { supabase } from '../supabase';
import type { 
  Authorization, 
  Patient, 
  Medication, 
  InsuranceProvider, 
  AuthorizationAnalytics,
  AIRecommendation,
  ProcessingStatus,
  AuthorizationFilters,
  PaginatedResponse,
  ApiResponse
} from '@/types';

// Base API client configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

class MedicationAuthAPI {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const { data: { session } } = await supabase.auth.getSession();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token && {
          Authorization: `Bearer ${session.access_token}`,
        }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Authorization Management
  async getAuthorizations(
    filters: AuthorizationFilters = {},
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<Authorization>> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = Array.isArray(value) ? value.join(',') : String(value);
        }
        return acc;
      }, {} as Record<string, string>),
    });

    const response = await this.request<PaginatedResponse<Authorization>>(
      `/authorizations?${queryParams}`
    );
    return response.data;
  }

  async getAuthorization(id: string): Promise<Authorization> {
    const response = await this.request<Authorization>(`/authorizations/${id}`);
    return response.data;
  }

  async createAuthorization(data: Partial<Authorization>): Promise<Authorization> {
    const response = await this.request<Authorization>('/authorizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async updateAuthorization(
    id: string,
    data: Partial<Authorization>
  ): Promise<Authorization> {
    const response = await this.request<Authorization>(`/authorizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async deleteAuthorization(id: string): Promise<void> {
    await this.request(`/authorizations/${id}`, {
      method: 'DELETE',
    });
  }

  // Patient Data (ModMed Integration)
  async searchPatients(query: string): Promise<Patient[]> {
    const response = await this.request<Patient[]>(
      `/patients/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  }

  async getPatient(id: string): Promise<Patient> {
    const response = await this.request<Patient>(`/patients/${id}`);
    return response.data;
  }

  // Medication Database
  async searchMedications(query: string): Promise<Medication[]> {
    const response = await this.request<Medication[]>(
      `/medications/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  }

  async getMedication(id: string): Promise<Medication> {
    const response = await this.request<Medication>(`/medications/${id}`);
    return response.data;
  }

  // Insurance Providers
  async getInsuranceProviders(): Promise<InsuranceProvider[]> {
    const response = await this.request<InsuranceProvider[]>('/insurance-providers');
    return response.data;
  }

  async getInsuranceProvider(id: string): Promise<InsuranceProvider> {
    const response = await this.request<InsuranceProvider>(`/insurance-providers/${id}`);
    return response.data;
  }

  async getInsuranceRequirements(
    providerId: string,
    medicationId: string
  ): Promise<any> {
    const response = await this.request(
      `/insurance-providers/${providerId}/requirements?medication_id=${medicationId}`
    );
    return response.data;
  }

  // AI Recommendations
  async getAIRecommendations(authorizationId: string): Promise<AIRecommendation[]> {
    const response = await this.request<AIRecommendation[]>(
      `/ai/recommendations/${authorizationId}`
    );
    return response.data;
  }

  async requestAISuggestions(data: {
    authorization_id: string;
    patient_data: Partial<Patient>;
    medication_data: Partial<Medication>;
    insurance_data: Partial<InsuranceProvider>;
  }): Promise<AIRecommendation[]> {
    const response = await this.request<AIRecommendation[]>('/ai/suggestions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async applyAIRecommendation(recommendationId: string): Promise<void> {
    await this.request(`/ai/recommendations/${recommendationId}/apply`, {
      method: 'POST',
    });
  }

  // Status Tracking
  async getProcessingStatus(authorizationId: string): Promise<ProcessingStatus> {
    const response = await this.request<ProcessingStatus>(
      `/authorizations/${authorizationId}/status`
    );
    return response.data;
  }

  async updateProcessingStatus(
    authorizationId: string,
    status: Partial<ProcessingStatus>
  ): Promise<ProcessingStatus> {
    const response = await this.request<ProcessingStatus>(
      `/authorizations/${authorizationId}/status`,
      {
        method: 'PUT',
        body: JSON.stringify(status),
      }
    );
    return response.data;
  }

  // Analytics
  async getAnalyticsDashboard(): Promise<AuthorizationAnalytics> {
    const response = await this.request<AuthorizationAnalytics>('/analytics/dashboard');
    return response.data;
  }

  async getProviderAnalytics(providerId?: string): Promise<any> {
    const endpoint = providerId 
      ? `/analytics/providers/${providerId}`
      : '/analytics/providers';
    const response = await this.request(endpoint);
    return response.data;
  }

  async getTimeAnalytics(period: 'week' | 'month' | 'quarter' = 'month'): Promise<any> {
    const response = await this.request(`/analytics/time?period=${period}`);
    return response.data;
  }

  // Document Management
  async uploadDocument(
    authorizationId: string,
    file: File,
    documentType: string
  ): Promise<{ url: string; id: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    formData.append('authorization_id', authorizationId);

    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: {
        ...(session?.access_token && {
          Authorization: `Bearer ${session.access_token}`,
        }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  async getDocuments(authorizationId: string): Promise<any[]> {
    const response = await this.request(`/authorizations/${authorizationId}/documents`);
    return Array.isArray(response.data) ? response.data : [];
  }
}

export const medicationAuthAPI = new MedicationAuthAPI();