import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';

/**
 * Comprehensive Medication Database Service
 * Integrates with multiple drug databases for medication information and authorization requirements
 */

export interface MedicationSearchResult {
  ndc: string;
  brandName: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  manufacturer: string;
  therapeuticClass: string;
  relevanceScore: number;
  requiresPriorAuth: boolean;
  formularyTier?: number;
}

export interface DetailedMedication {
  ndc: string;
  brandName: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  routeOfAdministration: string;
  manufacturer: string;
  therapeuticClass: string;
  pharmacologicClass: string;
  mechanismOfAction: string;
  indications: string[];
  contraindications: string[];
  warnings: Warning[];
  interactions: DrugInteraction[];
  dosing: DosingInformation;
  pharmacokinetics: Pharmacokinetics;
  pricing: PricingInformation;
  regulatoryInfo: RegulatoryInfo;
  authorizationRequirements: AuthorizationRequirements;
  lastUpdated: Date;
}

export interface Warning {
  type: 'black_box' | 'contraindication' | 'precaution' | 'adverse_reaction';
  severity: 'high' | 'medium' | 'low';
  description: string;
  populations?: string[];
}

export interface DrugInteraction {
  interactingDrug: string;
  interactionType: 'major' | 'moderate' | 'minor';
  mechanism: string;
  clinicalEffect: string;
  management: string;
  severity: number; // 1-10 scale
}

export interface DosingInformation {
  adultDose: string;
  pediatricDose?: string;
  geriatricDose?: string;
  renalAdjustment?: string;
  hepaticAdjustment?: string;
  frequency: string;
  duration?: string;
  maxDose?: string;
}

export interface Pharmacokinetics {
  absorption: string;
  distribution: string;
  metabolism: string;
  elimination: string;
  halfLife: string;
  bioavailability?: string;
  proteinBinding?: string;
}

export interface PricingInformation {
  averageWholesalePrice: number;
  wholesaleAcquisitionCost: number;
  estimatedCashPrice: number;
  medicarePartDCost?: number;
  medicaidCost?: number;
  lastPriceUpdate: Date;
}

export interface RegulatoryInfo {
  fdaApprovalDate: Date;
  controlledSubstanceSchedule?: string;
  pregnancyCategory?: string;
  lactationCategory?: string;
  pediatricExclusivity?: boolean;
  orphanDrug?: boolean;
  acceleratedApproval?: boolean;
}

export interface AuthorizationRequirements {
  requiresPriorAuth: boolean;
  stepTherapyRequired: boolean;
  quantityLimits: QuantityLimit[];
  ageRestrictions: AgeRestriction[];
  diagnosisRequirements: string[];
  documentationRequirements: string[];
  clinicalCriteria: ClinicalCriteria[];
}

export interface QuantityLimit {
  maxQuantity: number;
  timeFrame: string;
  exceptionCriteria?: string[];
}

export interface AgeRestriction {
  minAge?: number;
  maxAge?: number;
  justification?: string;
}

export interface ClinicalCriteria {
  criterion: string;
  required: boolean;
  alternatives?: string[];
}

export interface TherapeuticAlternative {
  ndc: string;
  brandName: string;
  genericName: string;
  strength: string;
  therapeuticEquivalence: 'AB' | 'AA' | 'AN' | 'AP' | 'AT' | 'BC' | 'BD' | 'BE' | 'BN' | 'BP' | 'BR' | 'BS' | 'BT' | 'BX';
  bioequivalent: boolean;
  costComparison: number; // Ratio compared to original
  formularyStatus: 'preferred' | 'covered' | 'non_preferred' | 'not_covered';
  switchingConsiderations: string[];
  clinicalNotes?: string;
}

export interface InteractionWarnings {
  criticalInteractions: DrugInteraction[];
  significantInteractions: DrugInteraction[];
  minorInteractions: DrugInteraction[];
  allergyConflicts: AllergyConflict[];
  duplicateTherapy: DuplicateTherapy[];
  overallRiskScore: number; // 1-10 scale
}

export interface AllergyConflict {
  allergen: string;
  allergyType: 'active_ingredient' | 'inactive_ingredient' | 'cross_sensitivity';
  severity: 'severe' | 'moderate' | 'mild';
  description: string;
}

export interface DuplicateTherapy {
  existingMedication: string;
  therapeuticClass: string;
  duplicationType: 'same_ingredient' | 'same_class' | 'additive_effect';
  recommendation: string;
}

export interface CostInformation {
  retailPrice: number;
  insurancePrice?: number;
  patientCopay?: number;
  deductibleApplies: boolean;
  coinsuranceAmount?: number;
  maximumBenefit?: number;
  priceComparison: {
    genericAvailable: boolean;
    genericPrice?: number;
    brandPrice?: number;
    savings?: number;
  };
  costEffectiveness: {
    costPerDay: number;
    costPerMonth: number;
    costPerYear: number;
    qualityAdjustedCost?: number;
  };
}

export class MedicationDatabaseService {
  private primaryDB: AxiosInstance; // First DataBank or similar
  private secondaryDB: AxiosInstance; // RxNav/NIH
  private pricingAPI: AxiosInstance; // GoodRx or similar
  private interactionAPI: AxiosInstance; // Lexicomp or similar

  constructor() {
    this.setupAPIClients();
  }

  /**
   * Search medications with authorization requirements
   */
  async searchMedications(query: string, options?: {
    limit?: number;
    includeGeneric?: boolean;
    includeBrand?: boolean;
    therapeuticClass?: string;
    requiresPriorAuth?: boolean;
  }): Promise<MedicationSearchResult[]> {
    try {
      const searchParams = {
        q: query,
        limit: options?.limit || 50,
        include_generic: options?.includeGeneric ?? true,
        include_brand: options?.includeBrand ?? true,
        therapeutic_class: options?.therapeuticClass,
        requires_prior_auth: options?.requiresPriorAuth
      };

      // Search primary database
      const [primaryResults, rxNavResults] = await Promise.all([
        this.searchPrimaryDB(searchParams),
        this.searchRxNav(query)
      ]);

      // Merge and rank results
      const mergedResults = this.mergeSearchResults(primaryResults, rxNavResults);
      
      // Enhance with authorization requirements
      return await this.enhanceWithAuthRequirements(mergedResults);
    } catch (error) {
      console.error('Medication search error:', error);
      throw new Error(`Failed to search medications: ${error}`);
    }
  }

  /**
   * Get detailed medication information including auth requirements
   */
  async getMedicationDetails(ndc: string): Promise<DetailedMedication> {
    try {
      // Fetch from multiple sources in parallel
      const [
        drugInfo,
        interactions,
        pricing,
        authRequirements,
        fdaInfo
      ] = await Promise.all([
        this.fetchDrugInformation(ndc),
        this.fetchInteractions(ndc),
        this.fetchPricing(ndc),
        this.fetchAuthRequirements(ndc),
        this.fetchFDAInformation(ndc)
      ]);

      return {
        ndc,
        brandName: drugInfo.brandName,
        genericName: drugInfo.genericName,
        strength: drugInfo.strength,
        dosageForm: drugInfo.dosageForm,
        routeOfAdministration: drugInfo.route,
        manufacturer: drugInfo.manufacturer,
        therapeuticClass: drugInfo.therapeuticClass,
        pharmacologicClass: drugInfo.pharmacologicClass,
        mechanismOfAction: drugInfo.mechanismOfAction,
        indications: drugInfo.indications,
        contraindications: drugInfo.contraindications,
        warnings: drugInfo.warnings,
        interactions,
        dosing: drugInfo.dosing,
        pharmacokinetics: drugInfo.pharmacokinetics,
        pricing,
        regulatoryInfo: fdaInfo,
        authorizationRequirements: authRequirements,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching medication details:', error);
      throw new Error(`Failed to retrieve medication details: ${error}`);
    }
  }

  /**
   * Find therapeutic alternatives
   */
  async findAlternatives(
    medication: string | { ndc: string; therapeuticClass: string },
    insurance?: { id: string; formulary: any }
  ): Promise<TherapeuticAlternative[]> {
    try {
      let therapeuticClass: string;
      let originalNDC: string;

      if (typeof medication === 'string') {
        const details = await this.getMedicationDetails(medication);
        therapeuticClass = details.therapeuticClass;
        originalNDC = medication;
      } else {
        therapeuticClass = medication.therapeuticClass;
        originalNDC = medication.ndc;
      }

      // Find alternatives in same therapeutic class
      const alternatives = await this.findTherapeuticEquivalents(therapeuticClass, originalNDC);

      // Enhance with formulary status if insurance provided
      if (insurance) {
        await this.enhanceWithFormularyStatus(alternatives, insurance);
      }

      // Sort by therapeutic equivalence and cost
      return alternatives.sort((a, b) => {
        // Prefer AB rated generics, then by cost
        const aScore = this.getTherapeuticScore(a);
        const bScore = this.getTherapeuticScore(b);
        return bScore - aScore;
      });
    } catch (error) {
      console.error('Error finding alternatives:', error);
      throw new Error(`Failed to find alternatives: ${error}`);
    }
  }

  /**
   * Check drug interactions and contraindications
   */
  async checkInteractions(
    medications: string[],
    allergies: string[]
  ): Promise<InteractionWarnings> {
    try {
      // Check drug-drug interactions
      const drugInteractions = await this.checkDrugInteractions(medications);
      
      // Check drug-allergy conflicts
      const allergyConflicts = await this.checkAllergyConflicts(medications, allergies);
      
      // Check for duplicate therapy
      const duplicateTherapy = await this.checkDuplicateTherapy(medications);

      // Calculate overall risk score
      const overallRiskScore = this.calculateRiskScore(drugInteractions, allergyConflicts, duplicateTherapy);

      return {
        criticalInteractions: drugInteractions.filter(i => i.severity >= 8),
        significantInteractions: drugInteractions.filter(i => i.severity >= 5 && i.severity < 8),
        minorInteractions: drugInteractions.filter(i => i.severity < 5),
        allergyConflicts,
        duplicateTherapy,
        overallRiskScore
      };
    } catch (error) {
      console.error('Error checking interactions:', error);
      throw new Error(`Failed to check interactions: ${error}`);
    }
  }

  /**
   * Get current pricing and cost information
   */
  async getMedicationCost(
    ndc: string,
    insurance?: { id: string; planType: string; memberId: string }
  ): Promise<CostInformation> {
    try {
      const [retailPricing, insurancePricing] = await Promise.all([
        this.fetchRetailPricing(ndc),
        insurance ? this.fetchInsurancePricing(ndc, insurance) : null
      ]);

      // Check for generic alternatives pricing
      const genericAlternatives = await this.findGenericAlternatives(ndc);
      
      return {
        retailPrice: retailPricing.price,
        insurancePrice: insurancePricing?.price,
        patientCopay: insurancePricing?.copay,
        deductibleApplies: insurancePricing?.deductibleApplies || false,
        coinsuranceAmount: insurancePricing?.coinsurance,
        maximumBenefit: insurancePricing?.maxBenefit,
        priceComparison: {
          genericAvailable: genericAlternatives.length > 0,
          genericPrice: genericAlternatives[0]?.price,
          brandPrice: retailPricing.price,
          savings: genericAlternatives[0] ? retailPricing.price - genericAlternatives[0].price : 0
        },
        costEffectiveness: {
          costPerDay: retailPricing.price / 30, // Assuming 30-day supply
          costPerMonth: retailPricing.price,
          costPerYear: retailPricing.price * 12,
          qualityAdjustedCost: retailPricing.price // Would need QALY data
        }
      };
    } catch (error) {
      console.error('Error fetching medication cost:', error);
      throw new Error(`Failed to retrieve medication cost: ${error}`);
    }
  }

  /**
   * Private helper methods
   */

  private setupAPIClients(): void {
    // First DataBank API
    this.primaryDB = axios.create({
      baseURL: process.env.FIRST_DATABANK_URL || 'https://api.fdbhealth.com',
      headers: {
        'Authorization': `Bearer ${process.env.FIRST_DATABANK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    // RxNav API (NIH)
    this.secondaryDB = axios.create({
      baseURL: 'https://rxnav.nlm.nih.gov/REST',
      timeout: 10000
    });

    // Pricing API
    this.pricingAPI = axios.create({
      baseURL: process.env.PRICING_API_URL || 'https://api.goodrx.com',
      headers: {
        'Authorization': `Bearer ${process.env.PRICING_API_KEY}`,
      },
      timeout: 10000
    });

    // Interaction API
    this.interactionAPI = axios.create({
      baseURL: process.env.INTERACTION_API_URL || 'https://api.lexicomp.com',
      headers: {
        'Authorization': `Bearer ${process.env.INTERACTION_API_KEY}`,
      },
      timeout: 15000
    });
  }

  private async searchPrimaryDB(params: any): Promise<any[]> {
    try {
      const response = await this.primaryDB.get('/drugs/search', { params });
      return response.data.results || [];
    } catch (error) {
      console.warn('Primary DB search failed, using fallback');
      return [];
    }
  }

  private async searchRxNav(query: string): Promise<any[]> {
    try {
      const response = await this.secondaryDB.get(`/drugs.json?name=${encodeURIComponent(query)}`);
      return response.data.drugGroup?.conceptGroup || [];
    } catch (error) {
      console.warn('RxNav search failed');
      return [];
    }
  }

  private mergeSearchResults(primary: any[], secondary: any[]): MedicationSearchResult[] {
    // Merge and deduplicate results from multiple sources
    const merged = new Map<string, MedicationSearchResult>();

    // Process primary results
    primary.forEach(drug => {
      merged.set(drug.ndc, {
        ndc: drug.ndc,
        brandName: drug.brandName,
        genericName: drug.genericName,
        strength: drug.strength,
        dosageForm: drug.dosageForm,
        manufacturer: drug.manufacturer,
        therapeuticClass: drug.therapeuticClass,
        relevanceScore: drug.relevanceScore || 0.8,
        requiresPriorAuth: drug.requiresPriorAuth || false
      });
    });

    // Enhance with secondary results
    secondary.forEach(concept => {
      concept.conceptProperties?.forEach((prop: any) => {
        if (prop.ndc && !merged.has(prop.ndc)) {
          merged.set(prop.ndc, {
            ndc: prop.ndc,
            brandName: prop.synonym || '',
            genericName: concept.name || '',
            strength: prop.strength || '',
            dosageForm: prop.doseForm || '',
            manufacturer: prop.manufacturer || '',
            therapeuticClass: prop.tty || '',
            relevanceScore: 0.6,
            requiresPriorAuth: false
          });
        }
      });
    });

    return Array.from(merged.values());
  }

  private async enhanceWithAuthRequirements(results: MedicationSearchResult[]): Promise<MedicationSearchResult[]> {
    // Add authorization requirements to search results
    return Promise.all(results.map(async (result) => {
      try {
        const authReqs = await this.fetchAuthRequirements(result.ndc);
        return {
          ...result,
          requiresPriorAuth: authReqs.requiresPriorAuth,
          formularyTier: authReqs.formularyTier
        };
      } catch (error) {
        return result; // Return without enhancement if auth req fetch fails
      }
    }));
  }

  private async fetchDrugInformation(ndc: string): Promise<any> {
    const response = await this.primaryDB.get(`/drugs/${ndc}/details`);
    return response.data;
  }

  private async fetchInteractions(ndc: string): Promise<DrugInteraction[]> {
    try {
      const response = await this.interactionAPI.get(`/interactions/${ndc}`);
      return response.data.interactions || [];
    } catch (error) {
      return [];
    }
  }

  private async fetchPricing(ndc: string): Promise<PricingInformation> {
    try {
      const response = await this.pricingAPI.get(`/pricing/${ndc}`);
      return {
        averageWholesalePrice: response.data.awp,
        wholesaleAcquisitionCost: response.data.wac,
        estimatedCashPrice: response.data.cashPrice,
        lastPriceUpdate: new Date(response.data.lastUpdated)
      };
    } catch (error) {
      return {
        averageWholesalePrice: 0,
        wholesaleAcquisitionCost: 0,
        estimatedCashPrice: 0,
        lastPriceUpdate: new Date()
      };
    }
  }

  private async fetchAuthRequirements(ndc: string): Promise<AuthorizationRequirements> {
    // This would integrate with insurance formulary databases
    return {
      requiresPriorAuth: false,
      stepTherapyRequired: false,
      quantityLimits: [],
      ageRestrictions: [],
      diagnosisRequirements: [],
      documentationRequirements: [],
      clinicalCriteria: []
    };
  }

  private async fetchFDAInformation(ndc: string): Promise<RegulatoryInfo> {
    // This would integrate with FDA databases
    return {
      fdaApprovalDate: new Date(),
      controlledSubstanceSchedule: undefined,
      pregnancyCategory: undefined,
      lactationCategory: undefined,
      pediatricExclusivity: false,
      orphanDrug: false,
      acceleratedApproval: false
    };
  }

  private async findTherapeuticEquivalents(therapeuticClass: string, excludeNDC: string): Promise<TherapeuticAlternative[]> {
    // Find drugs in same therapeutic class
    const response = await this.primaryDB.get('/drugs/alternatives', {
      params: { therapeutic_class: therapeuticClass, exclude: excludeNDC }
    });
    
    return response.data.alternatives || [];
  }

  private async enhanceWithFormularyStatus(alternatives: TherapeuticAlternative[], insurance: any): Promise<void> {
    // Enhance alternatives with formulary status
    await Promise.all(alternatives.map(async (alt) => {
      try {
        const formularyStatus = await this.checkFormularyStatus(alt.ndc, insurance.id);
        alt.formularyStatus = formularyStatus.status;
      } catch (error) {
        alt.formularyStatus = 'not_covered';
      }
    }));
  }

  private async checkFormularyStatus(ndc: string, insuranceId: string): Promise<any> {
    // Check formulary status with insurance provider
    return { status: 'covered' }; // Placeholder
  }

  private getTherapeuticScore(alternative: TherapeuticAlternative): number {
    let score = 0;
    
    // Therapeutic equivalence rating
    if (alternative.therapeuticEquivalence === 'AB') score += 10;
    else if (alternative.therapeuticEquivalence === 'AA') score += 9;
    else if (alternative.therapeuticEquivalence.startsWith('A')) score += 8;
    else score += 5;
    
    // Formulary status
    if (alternative.formularyStatus === 'preferred') score += 5;
    else if (alternative.formularyStatus === 'covered') score += 3;
    else if (alternative.formularyStatus === 'non_preferred') score += 1;
    
    // Cost comparison (lower cost = higher score)
    score += Math.max(0, 5 - alternative.costComparison);
    
    return score;
  }

  private async checkDrugInteractions(medications: string[]): Promise<DrugInteraction[]> {
    // Check all medication pairs for interactions
    const interactions: DrugInteraction[] = [];
    
    for (let i = 0; i < medications.length; i++) {
      for (let j = i + 1; j < medications.length; j++) {
        try {
          const response = await this.interactionAPI.get('/check-interaction', {
            params: { drug1: medications[i], drug2: medications[j] }
          });
          
          if (response.data.interaction) {
            interactions.push(response.data.interaction);
          }
        } catch (error) {
          console.warn(`Failed to check interaction between ${medications[i]} and ${medications[j]}`);
        }
      }
    }
    
    return interactions;
  }

  private async checkAllergyConflicts(medications: string[], allergies: string[]): Promise<AllergyConflict[]> {
    const conflicts: AllergyConflict[] = [];
    
    for (const med of medications) {
      for (const allergy of allergies) {
        // Check for conflicts with known allergens
        const conflict = await this.checkSingleAllergyConflict(med, allergy);
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }
    
    return conflicts;
  }

  private async checkSingleAllergyConflict(medication: string, allergy: string): Promise<AllergyConflict | null> {
    // Implementation would check medication ingredients against known allergens
    return null; // Placeholder
  }

  private async checkDuplicateTherapy(medications: string[]): Promise<DuplicateTherapy[]> {
    // Check for duplicate therapeutic classes
    const duplicates: DuplicateTherapy[] = [];
    // Implementation would group by therapeutic class and identify duplicates
    return duplicates;
  }

  private calculateRiskScore(
    interactions: DrugInteraction[],
    allergies: AllergyConflict[],
    duplicates: DuplicateTherapy[]
  ): number {
    let score = 0;
    
    // Weight interactions by severity
    interactions.forEach(interaction => {
      score += interaction.severity;
    });
    
    // Add points for allergy conflicts
    allergies.forEach(allergy => {
      if (allergy.severity === 'severe') score += 10;
      else if (allergy.severity === 'moderate') score += 5;
      else score += 2;
    });
    
    // Add points for duplicate therapy
    score += duplicates.length * 3;
    
    return Math.min(10, score); // Cap at 10
  }

  private async fetchRetailPricing(ndc: string): Promise<{ price: number }> {
    try {
      const response = await this.pricingAPI.get(`/retail-price/${ndc}`);
      return { price: response.data.price };
    } catch (error) {
      return { price: 0 };
    }
  }

  private async fetchInsurancePricing(ndc: string, insurance: any): Promise<any> {
    // Implementation would check insurance-specific pricing
    return null;
  }

  private async findGenericAlternatives(ndc: string): Promise<any[]> {
    try {
      const response = await this.primaryDB.get(`/drugs/${ndc}/generics`);
      return response.data.generics || [];
    } catch (error) {
      return [];
    }
  }
}