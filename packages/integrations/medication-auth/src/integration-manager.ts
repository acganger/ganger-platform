import { ModMedAuthorizationClient, AuthorizationPatient } from './modmed/fhir-client';
import { InsuranceProviderAPIService, InsuranceProvider, SubmissionResponse } from './insurance/insurance-api-service';
import { MedicationDatabaseService, DetailedMedication, InteractionWarnings } from './medication/drug-database-service';

/**
 * Unified Integration Manager
 * Coordinates all external integrations for medication authorization system
 */

export interface IntegrationsConfig {
  modmed: {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    scope: string[];
    tokenUrl: string;
    sandbox?: boolean;
  };
  insuranceProviders: InsuranceProvider[];
  medicationDatabases: {
    primary: string;
    secondary: string;
    pricingAPI: string;
    interactionAPI: string;
  };
  enabledFeatures: {
    realTimeEligibility: boolean;
    electronicSubmission: boolean;
    drugInteractionChecking: boolean;
    costTransparency: boolean;
    alternativeRecommendations: boolean;
  };
}

export interface PatientData {
  modmedId: string;
  demographics: any;
  insurance: any;
  medications: any[];
  allergies: string[];
  diagnoses: any[];
}

export interface AuthorizationSubmission {
  patientId: string;
  medicationId: string;
  insuranceId: string;
  clinicalData: any;
  urgency: 'routine' | 'urgent' | 'emergent';
}

export interface IntegrationStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: Date;
  responseTime: number;
  errorCount: number;
  features: string[];
}

export interface HealthCheckResult {
  overall: 'healthy' | 'degraded' | 'down';
  services: IntegrationStatus[];
  timestamp: Date;
  version: string;
}

export class IntegrationsManager {
  private modmedClient: ModMedAuthorizationClient;
  private insuranceService: InsuranceProviderAPIService;
  private medicationService: MedicationDatabaseService;
  private config: IntegrationsConfig;
  private healthCache: Map<string, IntegrationStatus> = new Map();

  constructor(config: IntegrationsConfig) {
    this.config = config;
    this.modmedClient = new ModMedAuthorizationClient(config.modmed);
    this.insuranceService = new InsuranceProviderAPIService();
    this.medicationService = new MedicationDatabaseService();
  }

  /**
   * Get comprehensive patient data for authorization
   */
  async getPatientData(patientId: string): Promise<PatientData> {
    try {
      console.log(`Fetching patient data for ${patientId}`);
      
      const patient = await this.modmedClient.getPatientForAuthorization(patientId);
      
      return {
        modmedId: patient.modmedPatientId,
        demographics: patient.demographics,
        insurance: patient.insurance,
        medications: patient.currentMedications,
        allergies: patient.allergies.map(allergy => allergy.code?.text || ''),
        diagnoses: patient.medicalHistory
      };
    } catch (error) {
      console.error('Failed to fetch patient data:', error);
      throw new Error(`Patient data retrieval failed: ${error}`);
    }
  }

  /**
   * Submit authorization to appropriate insurance provider
   */
  async submitAuthorization(submission: AuthorizationSubmission): Promise<SubmissionResponse> {
    try {
      // Find insurance provider configuration
      const insuranceProvider = this.config.insuranceProviders.find(
        provider => provider.id === submission.insuranceId
      );

      if (!insuranceProvider) {
        throw new Error(`Insurance provider ${submission.insuranceId} not configured`);
      }

      // Get patient and medication details
      const [patientData, medicationDetails] = await Promise.all([
        this.getPatientData(submission.patientId),
        this.medicationService.getMedicationDetails(submission.medicationId)
      ]);

      // Check for drug interactions if enabled
      if (this.config.enabledFeatures.drugInteractionChecking) {
        await this.performInteractionChecks(patientData, medicationDetails);
      }

      // Format authorization request
      const authorizationRequest = this.formatAuthorizationRequest(
        submission,
        patientData,
        medicationDetails
      );

      // Submit to insurance provider
      const response = await this.insuranceService.submitAuthorization(
        authorizationRequest,
        insuranceProvider
      );

      console.log(`Authorization submitted successfully: ${response.referenceNumber}`);
      return response;
    } catch (error) {
      console.error('Authorization submission failed:', error);
      throw new Error(`Submission failed: ${error}`);
    }
  }

  /**
   * Check authorization status across providers
   */
  async checkAuthorizationStatus(referenceNumber: string, insuranceId: string) {
    try {
      const insuranceProvider = this.config.insuranceProviders.find(
        provider => provider.id === insuranceId
      );

      if (!insuranceProvider) {
        throw new Error(`Insurance provider ${insuranceId} not configured`);
      }

      return await this.insuranceService.checkAuthorizationStatus(
        referenceNumber,
        insuranceProvider
      );
    } catch (error) {
      console.error('Status check failed:', error);
      throw new Error(`Status check failed: ${error}`);
    }
  }

  /**
   * Get medication alternatives and cost information
   */
  async getMedicationAlternatives(medicationId: string, insuranceId: string) {
    try {
      const [alternatives, costInfo] = await Promise.all([
        this.medicationService.findAlternatives(medicationId),
        this.config.enabledFeatures.costTransparency 
          ? this.medicationService.getMedicationCost(medicationId)
          : null
      ]);

      // Enhance alternatives with formulary status
      if (this.config.enabledFeatures.alternativeRecommendations) {
        const insuranceProvider = this.config.insuranceProviders.find(p => p.id === insuranceId);
        if (insuranceProvider) {
          await this.enhanceAlternativesWithFormulary(alternatives, insuranceProvider);
        }
      }

      return {
        alternatives,
        costInfo,
        recommendations: this.generateAlternativeRecommendations(alternatives, costInfo)
      };
    } catch (error) {
      console.error('Failed to get medication alternatives:', error);
      throw new Error(`Alternative lookup failed: ${error}`);
    }
  }

  /**
   * Perform comprehensive drug interaction checking
   */
  async checkDrugInteractions(patientId: string, newMedicationId: string): Promise<InteractionWarnings> {
    try {
      const patientData = await this.getPatientData(patientId);
      const currentMedications = patientData.medications.map(med => med.medicationCodeableConcept?.coding?.[0]?.code || '');
      const allMedications = [...currentMedications, newMedicationId];

      return await this.medicationService.checkInteractions(
        allMedications,
        patientData.allergies
      );
    } catch (error) {
      console.error('Drug interaction check failed:', error);
      throw new Error(`Interaction check failed: ${error}`);
    }
  }

  /**
   * Check real-time insurance eligibility
   */
  async checkInsuranceEligibility(patientId: string) {
    try {
      if (!this.config.enabledFeatures.realTimeEligibility) {
        throw new Error('Real-time eligibility checking not enabled');
      }

      return await this.modmedClient.getInsuranceEligibility(patientId);
    } catch (error) {
      console.error('Eligibility check failed:', error);
      throw new Error(`Eligibility check failed: ${error}`);
    }
  }

  /**
   * Search patients across ModMed
   */
  async searchPatients(criteria: {
    name?: string;
    birthdate?: string;
    identifier?: string;
    phone?: string;
    email?: string;
  }) {
    try {
      return await this.modmedClient.searchPatients(criteria);
    } catch (error) {
      console.error('Patient search failed:', error);
      throw new Error(`Patient search failed: ${error}`);
    }
  }

  /**
   * Get formulary status for medication
   */
  async getFormularyStatus(medicationId: string, insuranceId: string) {
    try {
      const insuranceProvider = this.config.insuranceProviders.find(p => p.id === insuranceId);
      if (!insuranceProvider) {
        throw new Error(`Insurance provider ${insuranceId} not configured`);
      }

      return await this.insuranceService.getFormularyStatus(medicationId, insuranceProvider);
    } catch (error) {
      console.error('Formulary check failed:', error);
      throw new Error(`Formulary check failed: ${error}`);
    }
  }

  /**
   * Comprehensive health check of all integrations
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const services: IntegrationStatus[] = [];
    const startTime = Date.now();

    // Check ModMed connectivity
    try {
      const modmedStart = Date.now();
      await this.modmedClient.searchPatients({ name: 'test' });
      services.push({
        service: 'ModMed FHIR',
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: Date.now() - modmedStart,
        errorCount: 0,
        features: ['patient-data', 'eligibility', 'medication-history']
      });
    } catch (error) {
      services.push({
        service: 'ModMed FHIR',
        status: 'down',
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        errorCount: 1,
        features: []
      });
    }

    // Check insurance providers
    for (const provider of this.config.insuranceProviders) {
      try {
        const result = await this.insuranceService.testConnection(provider);
        services.push({
          service: `Insurance-${provider.name}`,
          status: result.success ? 'healthy' : 'down',
          lastCheck: new Date(),
          responseTime: result.latency,
          errorCount: result.success ? 0 : 1,
          features: result.features
        });
      } catch (error) {
        services.push({
          service: `Insurance-${provider.name}`,
          status: 'down',
          lastCheck: new Date(),
          responseTime: Date.now() - startTime,
          errorCount: 1,
          features: []
        });
      }
    }

    // Check medication databases
    try {
      const medStart = Date.now();
      await this.medicationService.searchMedications('test', { limit: 1 });
      services.push({
        service: 'Medication Database',
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: Date.now() - medStart,
        errorCount: 0,
        features: ['drug-search', 'interactions', 'alternatives', 'pricing']
      });
    } catch (error) {
      services.push({
        service: 'Medication Database',
        status: 'down',
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        errorCount: 1,
        features: []
      });
    }

    // Determine overall health
    const healthyCount = services.filter(s => s.status === 'healthy').length;
    const downCount = services.filter(s => s.status === 'down').length;
    
    let overall: 'healthy' | 'degraded' | 'down';
    if (downCount === 0) {
      overall = 'healthy';
    } else if (healthyCount > downCount) {
      overall = 'degraded';
    } else {
      overall = 'down';
    }

    return {
      overall,
      services,
      timestamp: new Date(),
      version: '1.0.0'
    };
  }

  /**
   * Private helper methods
   */

  private async performInteractionChecks(patientData: PatientData, newMedication: DetailedMedication): Promise<void> {
    const currentMedications = patientData.medications.map(med => 
      med.medicationCodeableConcept?.coding?.[0]?.code || ''
    ).filter(Boolean);

    const interactions = await this.medicationService.checkInteractions(
      [...currentMedications, newMedication.ndc],
      patientData.allergies
    );

    // Log critical interactions
    if (interactions.criticalInteractions.length > 0) {
      console.warn('Critical drug interactions detected:', interactions.criticalInteractions);
    }

    if (interactions.allergyConflicts.length > 0) {
      console.warn('Allergy conflicts detected:', interactions.allergyConflicts);
    }
  }

  private formatAuthorizationRequest(
    submission: AuthorizationSubmission,
    patientData: PatientData,
    medicationDetails: DetailedMedication
  ): any {
    return {
      id: `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patient: patientData,
      medication: medicationDetails,
      clinicalData: submission.clinicalData,
      urgency: submission.urgency,
      submissionDate: new Date().toISOString(),
      provider: {
        id: 'ganger_dermatology',
        name: 'Ganger Dermatology',
        npi: process.env.PROVIDER_NPI || ''
      }
    };
  }

  private async enhanceAlternativesWithFormulary(alternatives: any[], insuranceProvider: InsuranceProvider): Promise<void> {
    await Promise.all(alternatives.map(async (alt) => {
      try {
        const formularyStatus = await this.insuranceService.getFormularyStatus(
          alt.ndc,
          insuranceProvider
        );
        alt.formularyStatus = formularyStatus;
      } catch (error) {
        console.warn(`Failed to get formulary status for ${alt.ndc}`);
        alt.formularyStatus = { covered: false, tier: 0 };
      }
    }));
  }

  private generateAlternativeRecommendations(alternatives: any[], costInfo: any): any[] {
    return alternatives
      .map(alt => ({
        ...alt,
        recommendation: this.calculateRecommendationScore(alt, costInfo)
      }))
      .sort((a, b) => b.recommendation.score - a.recommendation.score);
  }

  private calculateRecommendationScore(alternative: any, costInfo: any): any {
    let score = 0;
    let reasons = [];

    // Therapeutic equivalence
    if (alternative.therapeuticEquivalence === 'AB') {
      score += 40;
      reasons.push('Therapeutically equivalent');
    }

    // Formulary status
    if (alternative.formularyStatus?.covered) {
      score += 30;
      reasons.push('Covered by insurance');
      
      if (alternative.formularyStatus.tier <= 2) {
        score += 10;
        reasons.push('Preferred tier');
      }
    }

    // Cost comparison
    if (alternative.costComparison < 0.8) {
      score += 20;
      reasons.push('Lower cost');
    }

    return {
      score: Math.min(100, score),
      reasons,
      category: score >= 70 ? 'highly_recommended' : score >= 40 ? 'recommended' : 'consider'
    };
  }
}