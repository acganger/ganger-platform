/**
 * Medication Authorization Integrations Package
 * Exports all external integration services for medication authorization system
 */

// ModMed FHIR Integration
export { ModMedAuthorizationClient } from './modmed/fhir-client';
export type {
  ModMedConfig,
  AuthorizationPatient,
  MedicationList,
  DiagnosisHistory,
  InsuranceEligibility,
  SubmissionResult
} from './modmed/fhir-client';

// Insurance Provider API Integration
export { InsuranceProviderAPIService } from './insurance/insurance-api-service';
export type {
  InsuranceProvider,
  SubmissionResponse,
  StatusUpdate,
  AuthorizationDecision,
  FormularyStatus,
  Requirements,
  AppealData,
  AppealResponse,
  ContactInfo,
  ValidationError,
  QuantityLimit,
  AgeRestriction,
  ClinicalCriteria,
  DurationLimit
} from './insurance/insurance-api-service';

// Medication Database Integration
export { MedicationDatabaseService } from './medication/drug-database-service';
export type {
  MedicationSearchResult,
  DetailedMedication,
  Warning,
  DrugInteraction,
  DosingInformation,
  Pharmacokinetics,
  PricingInformation,
  RegulatoryInfo,
  AuthorizationRequirements,
  TherapeuticAlternative,
  InteractionWarnings,
  AllergyConflict,
  DuplicateTherapy,
  CostInformation
} from './medication/drug-database-service';

// Unified Integration Manager
export { IntegrationsManager } from './integration-manager';
export type {
  IntegrationsConfig,
  PatientData,
  AuthorizationSubmission,
  IntegrationStatus,
  HealthCheckResult
} from './integration-manager';

// Utility functions and helpers
export * from './utils/data-mappers';
export * from './utils/validation-schemas';
export * from './utils/error-handlers';