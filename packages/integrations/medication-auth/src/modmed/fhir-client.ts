import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Bundle, Patient, Medication, Condition, AllergyIntolerance, MedicationRequest } from 'fhir/r4';
import { z } from 'zod';

/**
 * Enhanced ModMed FHIR Integration Client
 * Provides comprehensive patient data access for medication authorization
 */

export interface ModMedConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string[];
  tokenUrl: string;
  sandbox?: boolean;
}

export interface AuthorizationPatient {
  id: string;
  modmedPatientId: string;
  demographics: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: string;
    phone?: string;
    email?: string;
    address?: any;
  };
  insurance: {
    memberId?: string;
    groupNumber?: string;
    planName?: string;
    eligibilityStatus: string;
    effectiveDate?: Date;
    terminationDate?: Date;
  };
  medicalHistory: Condition[];
  currentMedications: MedicationRequest[];
  allergies: AllergyIntolerance[];
  recentVisits: any[];
}

export interface MedicationList {
  active: MedicationRequest[];
  inactive: MedicationRequest[];
  total: number;
  lastUpdated: Date;
}

export interface DiagnosisHistory {
  conditions: Condition[];
  activeConditions: Condition[];
  chronicConditions: Condition[];
  lastUpdated: Date;
}

export interface InsuranceEligibility {
  status: 'active' | 'inactive' | 'pending' | 'unknown';
  coverage: {
    type: string;
    planName: string;
    memberId: string;
    groupNumber: string;
    effectiveDate: Date;
    terminationDate?: Date;
  };
  benefits: {
    prescriptionDrugs: boolean;
    priorAuthRequired: boolean;
    copayTier: number;
    deductible: number;
    outOfPocketMax: number;
  };
  eligibilityDate: Date;
}

export interface SubmissionResult {
  success: boolean;
  submissionId: string;
  modmedReferenceNumber?: string;
  acknowledgment?: any;
  errors?: string[];
  warnings?: string[];
  processedAt: Date;
}

export class ModMedAuthorizationClient {
  private client: AxiosInstance;
  private config: ModMedConfig;
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(config: ModMedConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      headers: {
        'Accept': 'application/fhir+json',
        'Content-Type': 'application/fhir+json',
        'User-Agent': 'GangerPlatform-MedicationAuth/1.0.0'
      }
    });

    this.setupInterceptors();
  }

  /**
   * Get comprehensive patient information for authorization
   */
  async getPatientForAuthorization(patientId: string): Promise<AuthorizationPatient> {
    try {
      await this.ensureAuthenticated();

      // Fetch patient bundle with all related resources
      const bundle = await this.fetchPatientBundle(patientId);
      
      return this.transformToAuthorizationPatient(bundle);
    } catch (error) {
      console.error('Error fetching patient for authorization:', error);
      throw new Error(`Failed to retrieve patient data: ${error}`);
    }
  }

  /**
   * Retrieve current medications and interactions
   */
  async getCurrentMedications(patientId: string): Promise<MedicationList> {
    try {
      await this.ensureAuthenticated();

      const response = await this.client.get(`/Patient/${patientId}/MedicationRequest`, {
        params: {
          status: 'active,on-hold,completed',
          '_include': 'MedicationRequest:medication',
          '_sort': '-authored'
        }
      });

      const bundle: Bundle = response.data;
      const medicationRequests = this.extractResourcesFromBundle<MedicationRequest>(bundle, 'MedicationRequest');

      const active = medicationRequests.filter(med => 
        med.status === 'active' || med.status === 'on-hold'
      );
      
      const inactive = medicationRequests.filter(med => 
        med.status === 'completed' || med.status === 'stopped'
      );

      return {
        active,
        inactive,
        total: medicationRequests.length,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching current medications:', error);
      throw new Error(`Failed to retrieve medications: ${error}`);
    }
  }

  /**
   * Get diagnosis history and active conditions
   */
  async getDiagnosisHistory(patientId: string): Promise<DiagnosisHistory> {
    try {
      await this.ensureAuthenticated();

      const response = await this.client.get(`/Patient/${patientId}/Condition`, {
        params: {
          '_sort': '-onset-date',
          '_count': 100
        }
      });

      const bundle: Bundle = response.data;
      const conditions = this.extractResourcesFromBundle<Condition>(bundle, 'Condition');

      const activeConditions = conditions.filter(condition => 
        condition.clinicalStatus?.coding?.some(coding => 
          coding.code === 'active' || coding.code === 'recurrence'
        )
      );

      const chronicConditions = conditions.filter(condition =>
        condition.category?.some(cat =>
          cat.coding?.some(coding => coding.code === 'problem-list-item')
        )
      );

      return {
        conditions,
        activeConditions,
        chronicConditions,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching diagnosis history:', error);
      throw new Error(`Failed to retrieve diagnosis history: ${error}`);
    }
  }

  /**
   * Retrieve insurance information and eligibility
   */
  async getInsuranceEligibility(patientId: string): Promise<InsuranceEligibility> {
    try {
      await this.ensureAuthenticated();

      // Fetch Coverage resources for the patient
      const response = await this.client.get(`/Coverage`, {
        params: {
          beneficiary: `Patient/${patientId}`,
          status: 'active',
          '_sort': '-period-start'
        }
      });

      const bundle: Bundle = response.data;
      const coverages = this.extractResourcesFromBundle(bundle, 'Coverage');

      if (coverages.length === 0) {
        return {
          status: 'unknown',
          coverage: {
            type: '',
            planName: '',
            memberId: '',
            groupNumber: '',
            effectiveDate: new Date(),
          },
          benefits: {
            prescriptionDrugs: false,
            priorAuthRequired: false,
            copayTier: 0,
            deductible: 0,
            outOfPocketMax: 0
          },
          eligibilityDate: new Date()
        };
      }

      const primaryCoverage = coverages[0];
      
      return this.transformToInsuranceEligibility(primaryCoverage);
    } catch (error) {
      console.error('Error fetching insurance eligibility:', error);
      throw new Error(`Failed to retrieve insurance eligibility: ${error}`);
    }
  }

  /**
   * Submit completed authorization back to ModMed
   */
  async submitAuthorizationResult(authorization: any): Promise<SubmissionResult> {
    try {
      await this.ensureAuthenticated();

      // Create FHIR CommunicationRequest for the authorization
      const communicationRequest = this.createAuthorizationCommunication(authorization);

      const response = await this.client.post('/CommunicationRequest', communicationRequest);

      return {
        success: true,
        submissionId: response.data.id,
        modmedReferenceNumber: response.data.identifier?.[0]?.value,
        acknowledgment: response.data,
        processedAt: new Date()
      };
    } catch (error) {
      console.error('Error submitting authorization result:', error);
      return {
        success: false,
        submissionId: '',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        processedAt: new Date()
      };
    }
  }

  /**
   * Search patients by various criteria
   */
  async searchPatients(criteria: {
    name?: string;
    birthdate?: string;
    identifier?: string;
    phone?: string;
    email?: string;
  }): Promise<Patient[]> {
    try {
      await this.ensureAuthenticated();

      const params: any = {};
      
      if (criteria.name) params.name = criteria.name;
      if (criteria.birthdate) params.birthdate = criteria.birthdate;
      if (criteria.identifier) params.identifier = criteria.identifier;
      if (criteria.phone) params.phone = criteria.phone;
      if (criteria.email) params.email = criteria.email;

      const response = await this.client.get('/Patient', { params });
      const bundle: Bundle = response.data;
      
      return this.extractResourcesFromBundle<Patient>(bundle, 'Patient');
    } catch (error) {
      console.error('Error searching patients:', error);
      throw new Error(`Failed to search patients: ${error}`);
    }
  }

  /**
   * Get detailed medication information including interactions
   */
  async getMedicationDetails(medicationId: string): Promise<Medication> {
    try {
      await this.ensureAuthenticated();

      const response = await this.client.get(`/Medication/${medicationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching medication details:', error);
      throw new Error(`Failed to retrieve medication details: ${error}`);
    }
  }

  /**
   * Private helper methods
   */

  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || this.isTokenExpired()) {
      await this.authenticate();
    }
  }

  private async authenticate(): Promise<void> {
    try {
      const response = await axios.post(this.config.tokenUrl, {
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: this.config.scope.join(' ')
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));
      
      // Update client default headers
      this.client.defaults.headers.Authorization = `Bearer ${this.accessToken}`;
    } catch (error) {
      console.error('Authentication failed:', error);
      throw new Error('Failed to authenticate with ModMed API');
    }
  }

  private isTokenExpired(): boolean {
    if (!this.tokenExpiry) return true;
    return new Date() >= this.tokenExpiry;
  }

  private setupInterceptors(): void {
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`ModMed API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('ModMed API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`ModMed API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('ModMed API Response Error:', error.response?.status, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  private async fetchPatientBundle(patientId: string): Promise<Bundle> {
    const response = await this.client.get(`/Patient/${patientId}/$everything`, {
      params: {
        '_include': '*',
        '_revinclude': '*'
      }
    });

    return response.data;
  }

  private transformToAuthorizationPatient(bundle: Bundle): AuthorizationPatient {
    const patient = this.extractResourcesFromBundle<Patient>(bundle, 'Patient')[0];
    const conditions = this.extractResourcesFromBundle<Condition>(bundle, 'Condition');
    const medications = this.extractResourcesFromBundle<MedicationRequest>(bundle, 'MedicationRequest');
    const allergies = this.extractResourcesFromBundle<AllergyIntolerance>(bundle, 'AllergyIntolerance');
    const coverages = this.extractResourcesFromBundle(bundle, 'Coverage');

    return {
      id: patient.id!,
      modmedPatientId: patient.id!,
      demographics: {
        firstName: patient.name?.[0]?.given?.[0] || '',
        lastName: patient.name?.[0]?.family || '',
        dateOfBirth: new Date(patient.birthDate || ''),
        gender: patient.gender || '',
        phone: patient.telecom?.find(t => t.system === 'phone')?.value,
        email: patient.telecom?.find(t => t.system === 'email')?.value,
        address: patient.address?.[0]
      },
      insurance: this.extractInsuranceInfo(coverages[0]),
      medicalHistory: conditions,
      currentMedications: medications.filter(med => med.status === 'active'),
      allergies,
      recentVisits: [] // Would extract from Encounter resources
    };
  }

  private extractInsuranceInfo(coverage: any): any {
    if (!coverage) {
      return {
        eligibilityStatus: 'unknown'
      };
    }

    return {
      memberId: coverage.subscriberId,
      groupNumber: coverage.identifier?.find((id: any) => id.type?.text === 'group')?.value,
      planName: coverage.payor?.[0]?.display,
      eligibilityStatus: coverage.status,
      effectiveDate: coverage.period?.start ? new Date(coverage.period.start) : undefined,
      terminationDate: coverage.period?.end ? new Date(coverage.period.end) : undefined
    };
  }

  private transformToInsuranceEligibility(coverage: any): InsuranceEligibility {
    return {
      status: coverage.status === 'active' ? 'active' : 'inactive',
      coverage: {
        type: coverage.type?.coding?.[0]?.display || '',
        planName: coverage.payor?.[0]?.display || '',
        memberId: coverage.subscriberId || '',
        groupNumber: coverage.identifier?.find((id: any) => id.type?.text === 'group')?.value || '',
        effectiveDate: new Date(coverage.period?.start || ''),
        terminationDate: coverage.period?.end ? new Date(coverage.period.end) : undefined
      },
      benefits: {
        prescriptionDrugs: true, // Would need to query specific benefits
        priorAuthRequired: false,
        copayTier: 1,
        deductible: 0,
        outOfPocketMax: 0
      },
      eligibilityDate: new Date()
    };
  }

  private createAuthorizationCommunication(authorization: any): any {
    return {
      resourceType: 'CommunicationRequest',
      status: 'active',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/communication-category',
          code: 'notification'
        }]
      }],
      subject: {
        reference: `Patient/${authorization.patientId}`
      },
      about: [{
        reference: `MedicationRequest/${authorization.medicationRequestId}`
      }],
      payload: [{
        contentString: JSON.stringify({
          authorizationId: authorization.id,
          status: authorization.status,
          decision: authorization.decision,
          processedAt: new Date().toISOString()
        })
      }],
      authoredOn: new Date().toISOString()
    };
  }

  private extractResourcesFromBundle<T>(bundle: Bundle, resourceType: string): T[] {
    if (!bundle.entry) return [];
    
    return bundle.entry
      .filter(entry => entry.resource?.resourceType === resourceType)
      .map(entry => entry.resource as T);
  }
}