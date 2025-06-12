import axios, { AxiosInstance } from 'axios';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import CryptoJS from 'crypto-js';
import { z } from 'zod';

/**
 * Insurance Provider API Integration Service
 * Handles electronic submission and communication with various insurance providers
 */

export interface InsuranceProvider {
  id: string;
  name: string;
  planType: string;
  apiEndpoint?: string;
  submissionFormat: 'ncpdp' | 'x12' | 'fhir' | 'proprietary';
  authenticationMethod: 'oauth2' | 'api_key' | 'certificate' | 'basic_auth';
  credentials: {
    clientId?: string;
    clientSecret?: string;
    apiKey?: string;
    username?: string;
    password?: string;
    certificatePath?: string;
  };
  supportedTransactions: string[];
  processingTimeHours: number;
  testMode: boolean;
}

export interface SubmissionResponse {
  success: boolean;
  referenceNumber: string;
  confirmationCode?: string;
  trackingId?: string;
  estimatedProcessingTime?: number;
  status: 'submitted' | 'received' | 'processing' | 'completed' | 'rejected';
  errors?: ValidationError[];
  warnings?: string[];
  submittedAt: Date;
  nextActionDate?: Date;
}

export interface StatusUpdate {
  referenceNumber: string;
  status: 'submitted' | 'under_review' | 'approved' | 'denied' | 'pended' | 'cancelled';
  statusDate: Date;
  decision?: AuthorizationDecision;
  communicationRequired?: boolean;
  nextSteps?: string[];
  estimatedCompletionDate?: Date;
  lastUpdated: Date;
}

export interface AuthorizationDecision {
  approved: boolean;
  approvedQuantity?: number;
  approvedDaysSupply?: number;
  authorizationNumber?: string;
  expirationDate?: Date;
  denialReason?: string;
  denialCode?: string;
  appealEligible?: boolean;
  alternativeCovered?: string[];
  priorAuthRequired?: boolean;
  stepTherapyRequired?: boolean;
  additionalDocumentationRequired?: string[];
}

export interface FormularyStatus {
  covered: boolean;
  tier: number;
  copay?: number;
  coinsurance?: number;
  priorAuthRequired: boolean;
  quantityLimits?: QuantityLimit[];
  stepTherapyRequired: boolean;
  ageRestrictions?: AgeRestriction[];
  diagnosisRestrictions?: string[];
  lastUpdated: Date;
}

export interface QuantityLimit {
  maxQuantity: number;
  timeFrame: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  exceptionCriteria?: string[];
}

export interface AgeRestriction {
  minAge?: number;
  maxAge?: number;
  condition?: string;
}

export interface Requirements {
  priorAuthRequired: boolean;
  stepTherapyDrugs?: string[];
  requiredDocumentation: string[];
  clinicalCriteria: ClinicalCriteria[];
  contraindications: string[];
  durationLimits?: DurationLimit[];
  quantityLimits?: QuantityLimit[];
}

export interface ClinicalCriteria {
  diagnosis: string;
  icdCodes: string[];
  required: boolean;
  alternatives?: string[];
  trialDuration?: number;
}

export interface DurationLimit {
  maxDuration: number;
  timeUnit: 'days' | 'weeks' | 'months' | 'years';
  renewalCriteria?: string[];
}

export interface AppealData {
  authorizationId: string;
  originalDenialReason: string;
  appealReason: string;
  additionalDocumentation: string[];
  clinicalNotes: string;
  providerStatement: string;
  urgentAppeal: boolean;
  supportingEvidence?: any[];
}

export interface AppealResponse {
  success: boolean;
  appealReferenceNumber: string;
  acknowledgmentDate: Date;
  estimatedReviewDate: Date;
  requiredDocuments?: string[];
  nextSteps: string[];
  contactInformation?: ContactInfo;
}

export interface ContactInfo {
  phone: string;
  email?: string;
  fax?: string;
  address?: string;
  hours?: string;
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export class InsuranceProviderAPIService {
  private clients: Map<string, AxiosInstance> = new Map();
  private xmlParser: XMLParser;
  private xmlBuilder: XMLBuilder;

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text'
    });
    
    this.xmlBuilder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      format: true
    });
  }

  /**
   * Submit authorization request electronically
   */
  async submitAuthorization(
    authorization: any, 
    provider: InsuranceProvider
  ): Promise<SubmissionResponse> {
    try {
      const client = await this.getOrCreateClient(provider);
      
      // Format request based on provider's preferred format
      const formattedRequest = await this.formatAuthorizationRequest(authorization, provider);
      
      // Submit to provider's API
      const response = await client.post('/prior-authorization', formattedRequest, {
        headers: await this.getSubmissionHeaders(provider),
        timeout: 60000 // 60 second timeout for submissions
      });

      return this.parseSubmissionResponse(response.data, provider);
    } catch (error) {
      console.error(`Submission error for ${provider.name}:`, error);
      return this.createErrorResponse(error);
    }
  }

  /**
   * Check real-time authorization status
   */
  async checkAuthorizationStatus(
    referenceNumber: string, 
    provider: InsuranceProvider
  ): Promise<StatusUpdate> {
    try {
      const client = await this.getOrCreateClient(provider);
      
      const response = await client.get(`/prior-authorization/${referenceNumber}/status`, {
        headers: await this.getAuthHeaders(provider)
      });

      return this.parseStatusResponse(response.data, provider);
    } catch (error) {
      console.error(`Status check error for ${provider.name}:`, error);
      throw new Error(`Failed to check authorization status: ${error}`);
    }
  }

  /**
   * Retrieve formulary information
   */
  async getFormularyStatus(
    ndc: string, 
    provider: InsuranceProvider
  ): Promise<FormularyStatus> {
    try {
      const client = await this.getOrCreateClient(provider);
      
      const response = await client.get('/formulary/status', {
        params: { ndc, plan_id: provider.id },
        headers: await this.getAuthHeaders(provider)
      });

      return this.parseFormularyResponse(response.data, provider);
    } catch (error) {
      console.error(`Formulary lookup error for ${provider.name}:`, error);
      throw new Error(`Failed to retrieve formulary status: ${error}`);
    }
  }

  /**
   * Get prior authorization requirements
   */
  async getPriorAuthRequirements(
    medication: string, 
    provider: InsuranceProvider
  ): Promise<Requirements> {
    try {
      const client = await this.getOrCreateClient(provider);
      
      const response = await client.get('/prior-authorization/requirements', {
        params: { 
          medication,
          plan_id: provider.id,
          format: 'detailed'
        },
        headers: await this.getAuthHeaders(provider)
      });

      return this.parseRequirementsResponse(response.data, provider);
    } catch (error) {
      console.error(`Requirements lookup error for ${provider.name}:`, error);
      throw new Error(`Failed to retrieve PA requirements: ${error}`);
    }
  }

  /**
   * Submit appeals for denied authorizations
   */
  async submitAppeal(
    authId: string, 
    appealData: AppealData, 
    provider: InsuranceProvider
  ): Promise<AppealResponse> {
    try {
      const client = await this.getOrCreateClient(provider);
      
      const formattedAppeal = await this.formatAppealRequest(appealData, provider);
      
      const response = await client.post('/appeals', formattedAppeal, {
        headers: await this.getSubmissionHeaders(provider),
        timeout: 60000
      });

      return this.parseAppealResponse(response.data, provider);
    } catch (error) {
      console.error(`Appeal submission error for ${provider.name}:`, error);
      throw new Error(`Failed to submit appeal: ${error}`);
    }
  }

  /**
   * Test connectivity and authentication with provider
   */
  async testConnection(provider: InsuranceProvider): Promise<{
    success: boolean;
    latency: number;
    features: string[];
    errors?: string[];
  }> {
    const startTime = Date.now();
    
    try {
      const client = await this.getOrCreateClient(provider);
      
      const response = await client.get('/health', {
        headers: await this.getAuthHeaders(provider),
        timeout: 10000
      });

      const latency = Date.now() - startTime;
      
      return {
        success: true,
        latency,
        features: response.data.features || []
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      
      return {
        success: false,
        latency,
        features: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Private helper methods
   */

  private async getOrCreateClient(provider: InsuranceProvider): Promise<AxiosInstance> {
    const clientKey = `${provider.id}-${provider.testMode ? 'test' : 'prod'}`;
    
    if (!this.clients.has(clientKey)) {
      const client = axios.create({
        baseURL: provider.apiEndpoint,
        timeout: 30000,
        headers: {
          'User-Agent': 'GangerPlatform-MedicationAuth/1.0.0',
          'Accept': this.getAcceptHeader(provider.submissionFormat)
        }
      });

      // Add authentication interceptor
      client.interceptors.request.use(async (config) => {
        const authHeaders = await this.getAuthHeaders(provider);
        config.headers = { ...config.headers, ...authHeaders };
        return config;
      });

      // Add response interceptor for error handling
      client.interceptors.response.use(
        (response) => response,
        (error) => {
          console.error(`API Error for ${provider.name}:`, error.response?.data);
          return Promise.reject(error);
        }
      );

      this.clients.set(clientKey, client);
    }

    return this.clients.get(clientKey)!;
  }

  private async getAuthHeaders(provider: InsuranceProvider): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};

    switch (provider.authenticationMethod) {
      case 'oauth2':
        const token = await this.getOAuth2Token(provider);
        headers['Authorization'] = `Bearer ${token}`;
        break;
        
      case 'api_key':
        headers['X-API-Key'] = provider.credentials.apiKey!;
        break;
        
      case 'basic_auth':
        const encoded = Buffer.from(
          `${provider.credentials.username}:${provider.credentials.password}`
        ).toString('base64');
        headers['Authorization'] = `Basic ${encoded}`;
        break;
        
      case 'certificate':
        // Certificate authentication would be handled at the axios client level
        break;
    }

    return headers;
  }

  private async getSubmissionHeaders(provider: InsuranceProvider): Promise<Record<string, string>> {
    const authHeaders = await this.getAuthHeaders(provider);
    
    return {
      ...authHeaders,
      'Content-Type': this.getContentTypeHeader(provider.submissionFormat),
      'X-Submission-Type': 'prior-authorization',
      'X-Provider-ID': provider.id
    };
  }

  private getAcceptHeader(format: string): string {
    switch (format) {
      case 'fhir': return 'application/fhir+json';
      case 'x12': return 'application/x12';
      case 'ncpdp': return 'application/ncpdp';
      default: return 'application/json';
    }
  }

  private getContentTypeHeader(format: string): string {
    switch (format) {
      case 'fhir': return 'application/fhir+json';
      case 'x12': return 'application/x12';
      case 'ncpdp': return 'application/ncpdp';
      default: return 'application/json';
    }
  }

  private async getOAuth2Token(provider: InsuranceProvider): Promise<string> {
    // Implement OAuth2 token retrieval
    // This would cache tokens and refresh as needed
    const tokenResponse = await axios.post(provider.credentials.tokenUrl || '', {
      grant_type: 'client_credentials',
      client_id: provider.credentials.clientId,
      client_secret: provider.credentials.clientSecret,
      scope: 'prior-authorization formulary'
    });

    return tokenResponse.data.access_token;
  }

  private async formatAuthorizationRequest(authorization: any, provider: InsuranceProvider): Promise<any> {
    switch (provider.submissionFormat) {
      case 'fhir':
        return this.formatAsFHIR(authorization);
      case 'x12':
        return this.formatAsX12(authorization);
      case 'ncpdp':
        return this.formatAsNCPDP(authorization);
      default:
        return this.formatAsJSON(authorization);
    }
  }

  private formatAsFHIR(authorization: any): any {
    // Convert to FHIR CommunicationRequest format
    return {
      resourceType: 'CommunicationRequest',
      status: 'active',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/communication-category',
          code: 'prior-authorization'
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
          medication: authorization.medication,
          quantity: authorization.quantityRequested,
          daysSupply: authorization.daysSupply,
          diagnosisCodes: authorization.diagnosisCodes,
          clinicalJustification: authorization.clinicalNotes
        })
      }]
    };
  }

  private formatAsX12(authorization: any): string {
    // Convert to X12 278 format for prior authorization
    // This would use an X12 library to format properly
    return `ST*278*0001~
BHT*0007*13*${authorization.id}*${new Date().toISOString().split('T')[0]}~
HL*1**20*1~
NM1*85*2*${authorization.provider.name}*****FI*${authorization.provider.npi}~
HL*2*1*21*1~
NM1*IL*1*${authorization.patient.lastName}*${authorization.patient.firstName}****MI*${authorization.patient.memberId}~
HL*3*2*22*0~
NM1*77*2*${authorization.medication.manufacturer}~
SE*8*0001~`;
  }

  private formatAsNCPDP(authorization: any): any {
    // Convert to NCPDP SCRIPT format
    return {
      Header: {
        To: provider.id,
        From: 'GANGER_PLATFORM',
        MessageID: authorization.id,
        SentTime: new Date().toISOString()
      },
      Body: {
        PriorAuthorizationRequest: {
          Patient: {
            Name: {
              FirstName: authorization.patient.firstName,
              LastName: authorization.patient.lastName
            },
            DateOfBirth: authorization.patient.dateOfBirth,
            Gender: authorization.patient.gender
          },
          Medication: {
            DrugDescription: authorization.medication.name,
            Quantity: authorization.quantityRequested,
            DaysSupply: authorization.daysSupply
          },
          ClinicalInfo: {
            DiagnosisCodes: authorization.diagnosisCodes,
            ClinicalJustification: authorization.clinicalNotes
          }
        }
      }
    };
  }

  private formatAsJSON(authorization: any): any {
    // Standard JSON format
    return {
      authorizationRequest: {
        patient: authorization.patient,
        medication: authorization.medication,
        quantity: authorization.quantityRequested,
        daysSupply: authorization.daysSupply,
        diagnosisCodes: authorization.diagnosisCodes,
        clinicalJustification: authorization.clinicalNotes,
        provider: authorization.provider,
        submissionDate: new Date().toISOString()
      }
    };
  }

  private formatAppealRequest(appealData: AppealData, provider: InsuranceProvider): any {
    return {
      appeal: {
        originalAuthorizationId: appealData.authorizationId,
        denialReason: appealData.originalDenialReason,
        appealReason: appealData.appealReason,
        urgentAppeal: appealData.urgentAppeal,
        clinicalNotes: appealData.clinicalNotes,
        providerStatement: appealData.providerStatement,
        additionalDocumentation: appealData.additionalDocumentation,
        submissionDate: new Date().toISOString()
      }
    };
  }

  private parseSubmissionResponse(data: any, provider: InsuranceProvider): SubmissionResponse {
    // Parse provider-specific response format
    return {
      success: data.success || data.status === 'accepted',
      referenceNumber: data.referenceNumber || data.confirmationNumber,
      confirmationCode: data.confirmationCode,
      trackingId: data.trackingId,
      status: this.normalizeStatus(data.status),
      submittedAt: new Date(),
      errors: data.errors?.map(this.normalizeError) || [],
      warnings: data.warnings || []
    };
  }

  private parseStatusResponse(data: any, provider: InsuranceProvider): StatusUpdate {
    return {
      referenceNumber: data.referenceNumber,
      status: this.normalizeStatus(data.status),
      statusDate: new Date(data.statusDate),
      decision: data.decision ? this.parseDecision(data.decision) : undefined,
      lastUpdated: new Date()
    };
  }

  private parseFormularyResponse(data: any, provider: InsuranceProvider): FormularyStatus {
    return {
      covered: data.covered,
      tier: data.tier || 1,
      copay: data.copay,
      priorAuthRequired: data.priorAuthRequired || false,
      quantityLimits: data.quantityLimits || [],
      stepTherapyRequired: data.stepTherapyRequired || false,
      lastUpdated: new Date()
    };
  }

  private parseRequirementsResponse(data: any, provider: InsuranceProvider): Requirements {
    return {
      priorAuthRequired: data.priorAuthRequired,
      stepTherapyDrugs: data.stepTherapyDrugs || [],
      requiredDocumentation: data.requiredDocumentation || [],
      clinicalCriteria: data.clinicalCriteria || [],
      contraindications: data.contraindications || [],
      durationLimits: data.durationLimits || [],
      quantityLimits: data.quantityLimits || []
    };
  }

  private parseAppealResponse(data: any, provider: InsuranceProvider): AppealResponse {
    return {
      success: data.success,
      appealReferenceNumber: data.appealReferenceNumber,
      acknowledgmentDate: new Date(data.acknowledgmentDate),
      estimatedReviewDate: new Date(data.estimatedReviewDate),
      nextSteps: data.nextSteps || []
    };
  }

  private parseDecision(decision: any): AuthorizationDecision {
    return {
      approved: decision.approved,
      approvedQuantity: decision.approvedQuantity,
      authorizationNumber: decision.authorizationNumber,
      expirationDate: decision.expirationDate ? new Date(decision.expirationDate) : undefined,
      denialReason: decision.denialReason,
      denialCode: decision.denialCode
    };
  }

  private normalizeStatus(status: string): StatusUpdate['status'] {
    const statusMap: Record<string, StatusUpdate['status']> = {
      'accepted': 'submitted',
      'received': 'submitted',
      'processing': 'under_review',
      'in_review': 'under_review',
      'approved': 'approved',
      'denied': 'denied',
      'pended': 'pended',
      'cancelled': 'cancelled'
    };

    return statusMap[status.toLowerCase()] || 'submitted';
  }

  private normalizeError(error: any): ValidationError {
    return {
      field: error.field || 'unknown',
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      severity: error.severity || 'error'
    };
  }

  private createErrorResponse(error: any): SubmissionResponse {
    return {
      success: false,
      referenceNumber: '',
      status: 'rejected',
      errors: [{
        field: 'submission',
        code: 'SUBMISSION_FAILED',
        message: error instanceof Error ? error.message : 'Submission failed',
        severity: 'error'
      }],
      submittedAt: new Date()
    };
  }
}