/**
 * ModMed FHIR Integration Client
 * Syncs provider schedules and appointment data for clinical staffing optimization
 */

import { BaseIntegrationClient } from '../base/base-client';

export interface ModMedConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  tenantId: string;
  environment: 'sandbox' | 'production';
}

export interface ModMedProvider {
  id: string;
  npi: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  specialties: string[];
  locations: string[];
  isActive: boolean;
}

export interface ModMedAppointment {
  id: string;
  providerId: string;
  patientId: string;
  locationId: string;
  appointmentType: string;
  scheduledDateTime: string;
  durationMinutes: number;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  reasonCode?: string;
  notes?: string;
}

export interface ModMedScheduleSlot {
  id: string;
  providerId: string;
  locationId: string;
  startDateTime: string;
  endDateTime: string;
  appointmentTypeIds: string[];
  status: 'available' | 'booked' | 'blocked';
  capacity: number;
  bookedCount: number;
}

export interface ModMedLocation {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phone?: string;
  timezone: string;
  isActive: boolean;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errors: Array<{
    recordId?: string;
    error: string;
    details?: any;
  }>;
  lastSyncTime: string;
}

export class ModMedClient extends BaseIntegrationClient {
  private config: ModMedConfig;
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(config: ModMedConfig) {
    super();
    this.config = config;
  }

  // =====================================================
  // AUTHENTICATION
  // =====================================================

  private async authenticate(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          scope: 'read write'
        })
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.access_token) {
        throw new Error('No access token received from ModMed');
      }
      this.accessToken = data.access_token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));

      return this.accessToken!; // We just verified it exists above
    } catch (error) {
      this.logError('ModMed authentication failed', error);
      throw error;
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.authenticate();
    
    const response = await fetch(`${this.config.baseUrl}/fhir/R4${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/fhir+json',
        'Accept': 'application/fhir+json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ModMed API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  // =====================================================
  // PROVIDER MANAGEMENT
  // =====================================================

  async getProviders(): Promise<ModMedProvider[]> {
    try {
      const response = await this.makeRequest('/Practitioner');
      
      return response.entry?.map((entry: any) => {
        const practitioner = entry.resource;
        return {
          id: practitioner.id,
          npi: practitioner.identifier?.find((id: any) => id.system === 'http://hl7.org/fhir/sid/us-npi')?.value,
          firstName: practitioner.name?.[0]?.given?.[0] || '',
          lastName: practitioner.name?.[0]?.family || '',
          email: practitioner.telecom?.find((t: any) => t.system === 'email')?.value,
          phone: practitioner.telecom?.find((t: any) => t.system === 'phone')?.value,
          specialties: practitioner.qualification?.map((q: any) => q.code?.text) || [],
          locations: [], // Will be populated from PractitionerRole
          isActive: practitioner.active === true
        };
      }) || [];
    } catch (error) {
      this.logError('Failed to fetch providers from ModMed', error);
      throw error;
    }
  }

  async getProviderById(providerId: string): Promise<ModMedProvider | null> {
    try {
      const response = await this.makeRequest(`/Practitioner/${providerId}`);
      
      if (!response) return null;

      return {
        id: response.id,
        npi: response.identifier?.find((id: any) => id.system === 'http://hl7.org/fhir/sid/us-npi')?.value,
        firstName: response.name?.[0]?.given?.[0] || '',
        lastName: response.name?.[0]?.family || '',
        email: response.telecom?.find((t: any) => t.system === 'email')?.value,
        phone: response.telecom?.find((t: any) => t.system === 'phone')?.value,
        specialties: response.qualification?.map((q: any) => q.code?.text) || [],
        locations: [], // Will be populated from PractitionerRole
        isActive: response.active === true
      };
    } catch (error) {
      this.logError(`Failed to fetch provider ${providerId} from ModMed`, error);
      return null;
    }
  }

  // =====================================================
  // APPOINTMENT MANAGEMENT
  // =====================================================

  async getAppointments(
    startDate: string,
    endDate: string,
    providerId?: string,
    locationId?: string
  ): Promise<ModMedAppointment[]> {
    try {
      let searchParams = `?date=ge${startDate}&date=le${endDate}`;
      
      if (providerId) {
        searchParams += `&practitioner=${providerId}`;
      }
      
      if (locationId) {
        searchParams += `&location=${locationId}`;
      }

      const response = await this.makeRequest(`/Appointment${searchParams}`);
      
      return response.entry?.map((entry: any) => {
        const appointment = entry.resource;
        return {
          id: appointment.id,
          providerId: appointment.participant?.find((p: any) => p.actor?.reference?.startsWith('Practitioner/'))?.actor?.reference?.split('/')[1],
          patientId: appointment.participant?.find((p: any) => p.actor?.reference?.startsWith('Patient/'))?.actor?.reference?.split('/')[1],
          locationId: appointment.participant?.find((p: any) => p.actor?.reference?.startsWith('Location/'))?.actor?.reference?.split('/')[1],
          appointmentType: appointment.appointmentType?.text || 'General',
          scheduledDateTime: appointment.start,
          durationMinutes: appointment.minutesDuration || 30,
          status: this.mapFhirStatusToLocal(appointment.status),
          reasonCode: appointment.reasonCode?.[0]?.text,
          notes: appointment.comment
        };
      }) || [];
    } catch (error) {
      this.logError('Failed to fetch appointments from ModMed', error);
      throw error;
    }
  }

  // =====================================================
  // SCHEDULE MANAGEMENT
  // =====================================================

  async getScheduleSlots(
    startDate: string,
    endDate: string,
    providerId?: string,
    locationId?: string
  ): Promise<ModMedScheduleSlot[]> {
    try {
      let searchParams = `?date=ge${startDate}&date=le${endDate}`;
      
      if (providerId) {
        searchParams += `&actor=Practitioner/${providerId}`;
      }
      
      if (locationId) {
        searchParams += `&actor=Location/${locationId}`;
      }

      const response = await this.makeRequest(`/Slot${searchParams}`);
      
      return response.entry?.map((entry: any) => {
        const slot = entry.resource;
        return {
          id: slot.id,
          providerId: slot.schedule?.reference?.includes('Practitioner') 
            ? slot.schedule.reference.split('/')[1] 
            : '',
          locationId: slot.schedule?.reference?.includes('Location') 
            ? slot.schedule.reference.split('/')[1] 
            : '',
          startDateTime: slot.start,
          endDateTime: slot.end,
          appointmentTypeIds: slot.serviceType?.map((st: any) => st.coding?.[0]?.code) || [],
          status: slot.status === 'free' ? 'available' : slot.status === 'busy' ? 'booked' : 'blocked',
          capacity: 1, // FHIR slots typically represent single capacity
          bookedCount: slot.status === 'busy' ? 1 : 0
        };
      }) || [];
    } catch (error) {
      this.logError('Failed to fetch schedule slots from ModMed', error);
      throw error;
    }
  }

  // =====================================================
  // LOCATION MANAGEMENT
  // =====================================================

  async getLocations(): Promise<ModMedLocation[]> {
    try {
      const response = await this.makeRequest('/Location');
      
      return response.entry?.map((entry: any) => {
        const location = entry.resource;
        return {
          id: location.id,
          name: location.name,
          address: {
            street: location.address?.line?.join(' ') || '',
            city: location.address?.city || '',
            state: location.address?.state || '',
            zipCode: location.address?.postalCode || ''
          },
          phone: location.telecom?.find((t: any) => t.system === 'phone')?.value,
          timezone: location.extension?.find((ext: any) => 
            ext.url === 'http://hl7.org/fhir/StructureDefinition/timezone'
          )?.valueString || 'America/New_York',
          isActive: location.status === 'active'
        };
      }) || [];
    } catch (error) {
      this.logError('Failed to fetch locations from ModMed', error);
      throw error;
    }
  }

  // =====================================================
  // SYNC OPERATIONS
  // =====================================================

  async syncProviders(): Promise<SyncResult> {
    const startTime = new Date().toISOString();
    const result: SyncResult = {
      success: false,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      errors: [],
      lastSyncTime: startTime
    };

    try {
      const providers = await this.getProviders();
      result.recordsProcessed = providers.length;

      for (const provider of providers) {
        try {
          // Check if provider exists in our system
          const existingProvider = await this.findExistingProvider(provider.npi || provider.id);
          
          if (existingProvider) {
            // Update existing provider
            await this.updateStaffMember(existingProvider.id, {
              first_name: provider.firstName,
              last_name: provider.lastName,
              email: provider.email || '',
              phone: provider.phone,
              employee_status: provider.isActive ? 'active' : 'inactive',
              modmed_provider_id: provider.id,
              specializations: provider.specialties,
              metadata: {
                ...existingProvider.metadata,
                modmed_sync: {
                  last_sync: startTime,
                  npi: provider.npi
                }
              }
            });
            result.recordsUpdated++;
          } else {
            // Create new staff member
            await this.createStaffMember({
              employee_id: `MODMED_${provider.id}`,
              first_name: provider.firstName,
              last_name: provider.lastName,
              email: provider.email || `${provider.id}@gangerdermatology.com`,
              job_title: 'Provider',
              department: 'Clinical',
              employment_type: 'full_time',
              hire_date: new Date().toISOString().split('T')[0],
              employee_status: provider.isActive ? 'active' : 'inactive',
              modmed_provider_id: provider.id,
              specializations: provider.specialties,
              metadata: {
                modmed_sync: {
                  last_sync: startTime,
                  npi: provider.npi,
                  source: 'modmed_import'
                }
              }
            });
            result.recordsCreated++;
          }
        } catch (error) {
          result.recordsFailed++;
          result.errors.push({
            recordId: provider.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            details: provider
          });
        }
      }

      result.success = result.recordsFailed === 0;
      return result;
    } catch (error) {
      result.errors.push({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return result;
    }
  }

  async syncAppointments(startDate: string, endDate: string): Promise<SyncResult> {
    const startTime = new Date().toISOString();
    const result: SyncResult = {
      success: false,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      errors: [],
      lastSyncTime: startTime
    };

    try {
      const appointments = await this.getAppointments(startDate, endDate);
      result.recordsProcessed = appointments.length;

      for (const appointment of appointments) {
        try {
          // Find corresponding staff member
          const staffMember = await this.findStaffMemberByModMedId(appointment.providerId);
          
          if (!staffMember) {
            result.recordsFailed++;
            result.errors.push({
              recordId: appointment.id,
              error: `Provider not found for ModMed ID: ${appointment.providerId}`,
              details: appointment
            });
            continue;
          }

          // Check if schedule already exists
          const existingSchedule = await this.findExistingSchedule(
            staffMember.id,
            appointment.scheduledDateTime
          );

          const scheduleData = {
            staff_member_id: staffMember.id,
            location_id: await this.mapModMedLocationToLocal(appointment.locationId),
            schedule_date: appointment.scheduledDateTime.split('T')[0],
            start_time: new Date(appointment.scheduledDateTime).toTimeString().split(' ')[0],
            end_time: new Date(
              new Date(appointment.scheduledDateTime).getTime() + 
              (appointment.durationMinutes * 60000)
            ).toTimeString().split(' ')[0],
            assigned_role: 'Provider',
            status: appointment.status,
            assignment_type: 'regular',
            modmed_appointment_ids: [appointment.id],
            metadata: {
              modmed_sync: {
                last_sync: startTime,
                appointment_type: appointment.appointmentType,
                reason_code: appointment.reasonCode
              }
            }
          };

          if (existingSchedule) {
            await this.updateStaffSchedule(existingSchedule.id, scheduleData);
            result.recordsUpdated++;
          } else {
            await this.createStaffSchedule(scheduleData);
            result.recordsCreated++;
          }
        } catch (error) {
          result.recordsFailed++;
          result.errors.push({
            recordId: appointment.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            details: appointment
          });
        }
      }

      result.success = result.recordsFailed === 0;
      return result;
    } catch (error) {
      result.errors.push({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return result;
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private mapFhirStatusToLocal(fhirStatus: string): ModMedAppointment['status'] {
    const statusMap: Record<string, ModMedAppointment['status']> = {
      'proposed': 'scheduled',
      'pending': 'scheduled',
      'booked': 'confirmed',
      'arrived': 'in_progress',
      'fulfilled': 'completed',
      'cancelled': 'cancelled',
      'noshow': 'no_show',
      'entered-in-error': 'cancelled'
    };
    
    return statusMap[fhirStatus] || 'scheduled';
  }

  private async findExistingProvider(npiOrModMedId: string): Promise<any> {
    // This would query the database for existing staff member
    // Implementation depends on the database client being used
    return null; // Placeholder
  }

  private async findStaffMemberByModMedId(modMedId: string): Promise<any> {
    // This would query the database for staff member by ModMed ID
    // Implementation depends on the database client being used
    return null; // Placeholder
  }

  private async findExistingSchedule(staffMemberId: string, dateTime: string): Promise<any> {
    // This would query the database for existing schedule
    // Implementation depends on the database client being used
    return null; // Placeholder
  }

  private async mapModMedLocationToLocal(modMedLocationId: string): Promise<string> {
    // This would map ModMed location ID to local location ID
    // Implementation depends on the database client being used
    return modMedLocationId; // Placeholder
  }

  private async createStaffMember(data: any): Promise<any> {
    // This would create a new staff member in the database
    // Implementation depends on the database client being used
    return null; // Placeholder
  }

  private async updateStaffMember(id: string, data: any): Promise<any> {
    // This would update an existing staff member in the database
    // Implementation depends on the database client being used
    return null; // Placeholder
  }

  private async createStaffSchedule(data: any): Promise<any> {
    // This would create a new schedule in the database
    // Implementation depends on the database client being used
    return null; // Placeholder
  }

  private async updateStaffSchedule(id: string, data: any): Promise<any> {
    // This would update an existing schedule in the database
    // Implementation depends on the database client being used
    return null; // Placeholder
  }

  // =====================================================
  // HEALTH CHECK
  // =====================================================

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      await this.authenticate();
      
      // Test basic API connectivity
      const response = await this.makeRequest('/metadata');
      
      return {
        status: 'healthy',
        details: {
          version: response.software?.version,
          lastCheck: new Date().toISOString(),
          environment: this.config.environment
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          lastCheck: new Date().toISOString(),
          environment: this.config.environment
        }
      };
    }
  }
}