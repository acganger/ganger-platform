import { db } from '@ganger/db';
import { auditLog } from '@ganger/utils/server';

/**
 * ModMed FHIR Client for Provider Schedule Synchronization
 * 
 * Integrates with ModMed FHIR API to fetch provider schedules and appointments
 * for clinical staffing optimization.
 */

interface ModMedConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
}

interface FHIRProvider {
  id: string;
  resourceType: 'Practitioner';
  identifier: Array<{
    system: string;
    value: string;
  }>;
  name: Array<{
    given: string[];
    family: string;
  }>;
  active: boolean;
  qualification?: Array<{
    code: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
  }>;
}

interface FHIRAppointment {
  id: string;
  resourceType: 'Appointment';
  status: 'proposed' | 'pending' | 'booked' | 'arrived' | 'fulfilled' | 'cancelled' | 'noshow';
  appointmentType?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  start: string; // ISO 8601 datetime
  end: string;   // ISO 8601 datetime
  participant: Array<{
    actor: {
      reference: string; // e.g., "Practitioner/123"
      display?: string;
    };
    required: 'required' | 'optional' | 'information-only';
    status: 'accepted' | 'declined' | 'tentative' | 'needs-action';
  }>;
  location?: Array<{
    location: {
      reference: string; // e.g., "Location/456"
      display?: string;
    };
  }>;
}

interface FHIRLocation {
  id: string;
  resourceType: 'Location';
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  name: string;
  status: 'active' | 'suspended' | 'inactive';
  address?: {
    line: string[];
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

interface ProviderSchedule {
  provider_id: string;
  provider_name: string;
  schedule_date: Date;
  location_id: string;
  start_time: string;
  end_time: string;
  appointment_type?: string;
  patient_count: number;
  estimated_support_need: number;
  modmed_appointment_ids: string[];
  last_synced_at: Date;
}

interface TimeBlock {
  date: string;
  location: string;
  start_time: string;
  end_time: string;
  type: string;
  appointments: FHIRAppointment[];
}

export class ModMedFHIRClient {
  private config: ModMedConfig;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private readonly baseHeaders = {
    'Content-Type': 'application/fhir+json',
    'Accept': 'application/fhir+json'
  };

  constructor(config: ModMedConfig) {
    this.config = {
      scope: 'system/*.read',
      ...config
    };

    if (!this.config.baseUrl || !this.config.clientId || !this.config.clientSecret) {
      throw new Error('ModMed FHIR client requires baseUrl, clientId, and clientSecret');
    }
  }

  /**
   * Authenticate with ModMed FHIR API using client credentials
   */
  private async authenticate(): Promise<void> {
    try {
      const tokenUrl = `${this.config.baseUrl}/auth/token`;
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          scope: this.config.scope!
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Authentication failed: ${response.status} ${errorText}`);
      }

      const tokenData = await response.json();
      this.accessToken = tokenData.access_token;
      
      // Set expiry with 5 minute buffer
      const expiresIn = tokenData.expires_in || 3600;
      this.tokenExpiry = new Date(Date.now() + (expiresIn - 300) * 1000);

      console.log('ModMed FHIR authentication successful');
    } catch (error) {
      console.error('ModMed FHIR authentication failed:', error);
      throw error;
    }
  }

  /**
   * Ensure valid authentication token
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiry || new Date() >= this.tokenExpiry) {
      await this.authenticate();
    }
  }

  /**
   * Make authenticated FHIR API request
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    await this.ensureAuthenticated();

    const url = endpoint.startsWith('http') ? endpoint : `${this.config.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.baseHeaders,
        'Authorization': `Bearer ${this.accessToken}`,
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FHIR API request failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get all active providers from ModMed
   */
  async getProviders(locationId?: string): Promise<FHIRProvider[]> {
    try {
      let searchParams = 'active=true&_count=100';
      
      if (locationId) {
        // Map our location ID to ModMed location if needed
        const modmedLocationId = await this.mapGangerLocationToModMed(locationId);
        if (modmedLocationId) {
          searchParams += `&location=${modmedLocationId}`;
        }
      }

      const response = await this.makeRequest<any>(`/Practitioner?${searchParams}`);
      
      if (response.resourceType !== 'Bundle') {
        throw new Error('Invalid FHIR response: expected Bundle');
      }

      const providers = response.entry?.map((entry: any) => entry.resource) || [];
      
      console.log(`Retrieved ${providers.length} providers from ModMed`);
      return providers.filter((p: FHIRProvider) => p.active);
    } catch (error) {
      console.error('Failed to fetch providers from ModMed:', error);
      throw error;
    }
  }

  /**
   * Get appointments for a specific provider and date
   */
  async getAppointments(params: {
    practitioner: string;
    date: string;
    status?: string[];
    locationId?: string;
  }): Promise<FHIRAppointment[]> {
    try {
      const { practitioner, date, status = ['booked', 'arrived', 'fulfilled'], locationId } = params;
      
      // Build search parameters
      const searchParams = new URLSearchParams({
        'actor': `Practitioner/${practitioner}`,
        'date': date,
        '_count': '200'
      });

      // Add status filter
      status.forEach(s => searchParams.append('status', s));

      // Add location filter if specified
      if (locationId) {
        const modmedLocationId = await this.mapGangerLocationToModMed(locationId);
        if (modmedLocationId) {
          searchParams.append('location', `Location/${modmedLocationId}`);
        }
      }

      const response = await this.makeRequest<any>(`/Appointment?${searchParams.toString()}`);
      
      if (response.resourceType !== 'Bundle') {
        throw new Error('Invalid FHIR response: expected Bundle');
      }

      const appointments = response.entry?.map((entry: any) => entry.resource) || [];
      
      console.log(`Retrieved ${appointments.length} appointments for provider ${practitioner} on ${date}`);
      return appointments;
    } catch (error) {
      console.error('Failed to fetch appointments from ModMed:', error);
      throw error;
    }
  }

  /**
   * Get location information from ModMed
   */
  async getLocations(): Promise<FHIRLocation[]> {
    try {
      const response = await this.makeRequest<any>('/Location?status=active&_count=100');
      
      if (response.resourceType !== 'Bundle') {
        throw new Error('Invalid FHIR response: expected Bundle');
      }

      const locations = response.entry?.map((entry: any) => entry.resource) || [];
      
      console.log(`Retrieved ${locations.length} locations from ModMed`);
      return locations;
    } catch (error) {
      console.error('Failed to fetch locations from ModMed:', error);
      throw error;
    }
  }

  /**
   * Map Ganger location ID to ModMed location ID
   */
  private async mapGangerLocationToModMed(gangerLocationId: string): Promise<string | null> {
    try {
      // This would typically be stored in a mapping table
      // For now, we'll use a simple lookup
      const locationMapping: Record<string, string> = {
        // These would be actual UUIDs from your locations table mapped to ModMed location IDs
        'ann-arbor-location-id': 'modmed-aa-location',
        'wixom-location-id': 'modmed-wixom-location',
        'plymouth-location-id': 'modmed-plymouth-location'
      };

      return locationMapping[gangerLocationId] || null;
    } catch (error) {
      console.error('Failed to map location:', error);
      return null;
    }
  }

  /**
   * Map ModMed location reference to Ganger location ID
   */
  private async mapModMedLocationToGanger(modmedLocationRef: string): Promise<string> {
    try {
      // Extract location ID from reference (e.g., "Location/123" -> "123")
      const modmedLocationId = modmedLocationRef.replace('Location/', '');
      
      // This would typically be stored in a mapping table
      const reverseMapping: Record<string, string> = {
        'modmed-aa-location': 'ann-arbor-location-id',
        'modmed-wixom-location': 'wixom-location-id',
        'modmed-plymouth-location': 'plymouth-location-id'
      };

      return reverseMapping[modmedLocationId] || 'default-location-id';
    } catch (error) {
      console.error('Failed to map ModMed location to Ganger:', error);
      return 'default-location-id';
    }
  }

  /**
   * Group appointments into time blocks for schedule creation
   */
  private groupAppointmentsByTimeBlocks(appointments: FHIRAppointment[]): TimeBlock[] {
    const timeBlocks: Map<string, TimeBlock> = new Map();

    appointments.forEach(appointment => {
      const startDate = new Date(appointment.start);
      const endDate = new Date(appointment.end);
      
      // Round to nearest 30-minute block
      const roundedStart = this.roundToNearestBlock(startDate, 30);
      const roundedEnd = this.roundToNearestBlock(endDate, 30);
      
      const blockKey = `${roundedStart.toISOString()}_${roundedEnd.toISOString()}`;
      
      if (!timeBlocks.has(blockKey)) {
        const location = appointment.location?.[0]?.location?.reference || 'unknown';
        
        timeBlocks.set(blockKey, {
          date: roundedStart.toISOString().split('T')[0],
          location,
          start_time: roundedStart.toTimeString().slice(0, 8),
          end_time: roundedEnd.toTimeString().slice(0, 8),
          type: this.determineAppointmentType(appointment),
          appointments: []
        });
      }
      
      timeBlocks.get(blockKey)!.appointments.push(appointment);
    });

    return Array.from(timeBlocks.values());
  }

  /**
   * Round time to nearest block (e.g., 30 minutes)
   */
  private roundToNearestBlock(date: Date, blockMinutes: number): Date {
    const rounded = new Date(date);
    const minutes = rounded.getMinutes();
    const remainder = minutes % blockMinutes;
    
    if (remainder >= blockMinutes / 2) {
      rounded.setMinutes(minutes + (blockMinutes - remainder));
    } else {
      rounded.setMinutes(minutes - remainder);
    }
    
    rounded.setSeconds(0);
    rounded.setMilliseconds(0);
    
    return rounded;
  }

  /**
   * Determine appointment type from FHIR appointment
   */
  private determineAppointmentType(appointment: FHIRAppointment): string {
    const appointmentType = appointment.appointmentType?.coding?.[0];
    
    if (appointmentType) {
      return appointmentType.display || appointmentType.code || 'general';
    }
    
    return 'general';
  }

  /**
   * Calculate required support hours based on appointment complexity
   */
  private calculateSupportNeed(timeBlock: TimeBlock): number {
    const baseNeed = timeBlock.appointments.length * 0.5; // 30 minutes per appointment
    const complexityMultiplier = this.calculateComplexityMultiplier(timeBlock);
    
    return Math.round((baseNeed * complexityMultiplier) * 10) / 10;
  }

  /**
   * Calculate complexity multiplier based on appointment types
   */
  private calculateComplexityMultiplier(timeBlock: TimeBlock): number {
    let multiplier = 1.0;
    
    // Increase complexity for certain appointment types
    timeBlock.appointments.forEach(appointment => {
      const type = this.determineAppointmentType(appointment).toLowerCase();
      
      if (type.includes('surgery') || type.includes('procedure')) {
        multiplier += 0.5;
      } else if (type.includes('injection') || type.includes('biopsy')) {
        multiplier += 0.3;
      } else if (type.includes('consultation') || type.includes('followup')) {
        multiplier += 0.1;
      }
    });
    
    return Math.min(multiplier, 2.0); // Cap at 2x
  }

  /**
   * Process appointments into provider schedules
   */
  private async processAppointmentsToSchedule(
    provider: FHIRProvider,
    appointments: FHIRAppointment[]
  ): Promise<ProviderSchedule[]> {
    try {
      // Group appointments by time blocks
      const timeBlocks = this.groupAppointmentsByTimeBlocks(appointments);

      const schedules: ProviderSchedule[] = [];

      for (const block of timeBlocks) {
        const gangerLocationId = await this.mapModMedLocationToGanger(block.location);
        
        schedules.push({
          provider_id: provider.id,
          provider_name: this.getProviderDisplayName(provider),
          schedule_date: new Date(block.date),
          location_id: gangerLocationId,
          start_time: block.start_time,
          end_time: block.end_time,
          appointment_type: block.type,
          patient_count: block.appointments.length,
          estimated_support_need: this.calculateSupportNeed(block),
          modmed_appointment_ids: block.appointments.map(a => a.id),
          last_synced_at: new Date()
        });
      }

      return schedules;
    } catch (error) {
      console.error('Failed to process appointments to schedule:', error);
      throw error;
    }
  }

  /**
   * Get provider display name from FHIR resource
   */
  private getProviderDisplayName(provider: FHIRProvider): string {
    const name = provider.name?.[0];
    if (name) {
      const given = name.given?.join(' ') || '';
      const family = name.family || '';
      return `${given} ${family}`.trim();
    }
    return `Provider ${provider.id}`;
  }

  /**
   * Cache provider schedules in database
   */
  private async cacheProviderSchedules(schedules: ProviderSchedule[]): Promise<void> {
    try {
      for (const schedule of schedules) {
        await db.provider_schedules_cache.upsert({
          where: {
            provider_id_schedule_date_start_time_location_id: {
              provider_id: schedule.provider_id,
              schedule_date: schedule.schedule_date,
              start_time: schedule.start_time,
              location_id: schedule.location_id
            }
          },
          update: {
            provider_name: schedule.provider_name,
            end_time: schedule.end_time,
            appointment_type: schedule.appointment_type,
            patient_count: schedule.patient_count,
            estimated_support_need: schedule.estimated_support_need,
            modmed_appointment_ids: schedule.modmed_appointment_ids,
            last_synced_at: schedule.last_synced_at
          },
          create: schedule
        });
      }
      
      console.log(`Cached ${schedules.length} provider schedules`);
    } catch (error) {
      console.error('Failed to cache provider schedules:', error);
      throw error;
    }
  }

  /**
   * Main method to sync provider schedules for a specific date
   */
  async syncProviderSchedules(date: Date, locationId?: string): Promise<ProviderSchedule[]> {
    try {
      console.log(`Starting ModMed provider schedule sync for ${date.toISOString().split('T')[0]}`);
      
      // Get provider list
      const providers = await this.getProviders(locationId);
      
      if (providers.length === 0) {
        console.warn('No providers found in ModMed');
        return [];
      }

      const allSchedules: ProviderSchedule[] = [];

      // Process each provider
      for (const provider of providers) {
        try {
          // Get appointments for provider on date
          const appointments = await this.getAppointments({
            practitioner: provider.id,
            date: date.toISOString().split('T')[0],
            status: ['booked', 'arrived', 'fulfilled'],
            locationId
          });

          // Process appointments into schedule blocks
          const schedules = await this.processAppointmentsToSchedule(provider, appointments);
          allSchedules.push(...schedules);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (providerError) {
          console.error(`Failed to sync provider ${provider.id}:`, providerError);
          // Continue with other providers
        }
      }

      // Cache schedules in database
      await this.cacheProviderSchedules(allSchedules);

      // Audit log the sync
      await auditLog({
        action: 'modmed_provider_sync_completed',
        userId: 'system',
        resourceType: 'provider_schedules',
        resourceId: `${date.toISOString().split('T')[0]}_${locationId || 'all'}`,
        metadata: {
          sync_date: date,
          location_id: locationId,
          providers_processed: providers.length,
          schedules_created: allSchedules.length
        }
      });

      console.log(`ModMed sync completed: ${allSchedules.length} schedules created for ${providers.length} providers`);
      return allSchedules;
    } catch (error) {
      console.error('ModMed sync error:', error);
      
      // Audit log the error
      await auditLog({
        action: 'modmed_provider_sync_failed',
        userId: 'system',
        resourceType: 'provider_schedules',
        resourceId: `${date.toISOString().split('T')[0]}_${locationId || 'all'}`,
        metadata: {
          sync_date: date,
          location_id: locationId,
          error_message: error.message
        }
      });
      
      throw new Error(`Failed to sync provider schedules: ${error.message}`);
    }
  }

  /**
   * Test connection to ModMed FHIR API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.ensureAuthenticated();
      
      // Test with a simple metadata request
      const response = await this.makeRequest<any>('/metadata');
      
      if (response.resourceType === 'CapabilityStatement') {
        return {
          success: true,
          message: 'ModMed FHIR connection successful'
        };
      } else {
        return {
          success: false,
          message: 'Unexpected response from ModMed FHIR API'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `ModMed FHIR connection failed: ${error.message}`
      };
    }
  }
}

export default ModMedFHIRClient;