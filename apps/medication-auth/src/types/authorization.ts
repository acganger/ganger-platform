// ================================================
// MEDICATION AUTHORIZATION TYPES
// Comprehensive TypeScript types for the medication authorization system
// ================================================

export type AuthorizationStatus = 
  | 'draft'
  | 'submitted' 
  | 'under_review'
  | 'approved'
  | 'denied'
  | 'expired'
  | 'cancelled'
  | 'appealed';

export type PriorityLevel = 
  | 'routine'
  | 'urgent' 
  | 'emergent'
  | 'stat';

export type AIRecommendationType = 
  | 'approve'
  | 'deny'
  | 'request_more_info'
  | 'suggest_alternative'
  | 'escalate_manual_review';

export type StepStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'skipped'
  | 'failed';

export type CommunicationType = 
  | 'email'
  | 'fax'
  | 'phone'
  | 'portal'
  | 'api_call';

export type CommunicationDirection = 
  | 'inbound'
  | 'outbound';

// ================================================
// CORE DOMAIN MODELS
// ================================================

export interface Patient {
  id: string;
  modmedPatientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender?: string;
  phone?: string;
  email?: string;
  address?: Address;
  insuranceMemberId?: string;
  insuranceGroupNumber?: string;
  insurancePlanName?: string;
  activeMedications: Medication[];
  allergies: string[];
  diagnosisHistory: DiagnosisHistory[];
  medicalConditions: string[];
  lastSyncAt: Date;
  syncStatus: string;
  syncErrors?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

export interface Medication {
  id: string;
  ndcNumber: string;
  brandName: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  routeOfAdministration?: string;
  manufacturer?: string;
  therapeuticClass?: string;
  pharmacologicClass?: string;
  controlledSubstanceSchedule?: string;
  requiresPriorAuth: boolean;
  stepTherapyRequired: boolean;
  quantityLimits?: Record<string, any>;
  ageRestrictions?: Record<string, any>;
  diagnosisRequirements: string[];
  contraindications: string[];
  drugInteractions: string[];
  pregnancyCategory?: string;
  blackBoxWarning: boolean;
  averageWholesalePrice?: number;
  typicalCopayTier?: number;
  formularyTier?: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsuranceProvider {
  id: string;
  name: string;
  planType: string;
  planCode?: string;
  formularyTier?: number;
  formularyRestrictions?: Record<string, any>;
  preferredAlternatives?: Record<string, any>;
  priorAuthRequirements: Record<string, any>;
  stepTherapyProtocols?: Record<string, any>;
  quantityLimitPolicies?: Record<string, any>;
  submissionEndpoint?: string;
  apiCredentialsEncrypted?: string;
  supportsElectronicSubmission: boolean;
  processingTimeHours: number;
  successRate?: number;
  averageApprovalTimeHours?: number;
  phone?: string;
  fax?: string;
  email?: string;
  portalUrl?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicationAuthorization {
  id: string;
  patientId: string;
  providerId: string;
  medicationId: string;
  insuranceProviderId: string;
  status: AuthorizationStatus;
  priorityLevel: PriorityLevel;
  diagnosisCodes: string[];
  quantityRequested: number;
  daysSupply: number;
  refillsRequested: number;
  aiConfidenceScore?: number;
  aiRecommendation?: AIRecommendationType;
  aiReasoning?: string;
  estimatedApprovalProbability?: number;
  estimatedCost?: number;
  patientResponsibility?: number;
  insuranceCoveragePercentage?: number;
  submittedAt?: Date;
  approvedAt?: Date;
  deniedAt?: Date;
  expiresAt?: Date;
  clinicalNotes?: string;
  previousTherapiesTried: string[];
  contraindications: string[];
  supportingDocumentation?: Record<string, any>;
  insuranceReferenceNumber?: string;
  pharmacyReferenceNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;

  // Related entities
  patient?: Patient;
  medication?: Medication;
  insurance?: InsuranceProvider;
  aiRecommendations?: AIRecommendation[];
  workflowSteps?: AuthorizationWorkflowStep[];
  communications?: AuthorizationCommunication[];
}

export interface AIRecommendation {
  id: string;
  authorizationId: string;
  recommendationType: AIRecommendationType;
  confidenceScore: number;
  reasoning: string;
  suggestedAlternatives: Alternative[];
  requiredDocumentation: string[];
  missingInformation: string[];
  estimatedApprovalProbability?: number;
  riskFactors?: Record<string, any>;
  processingTimeMs?: number;
  modelVersion?: string;
  createdAt: Date;
}

export interface Alternative {
  medicationId: string;
  name: string;
  genericName: string;
  therapeuticEquivalence: string;
  formularyStatus: string;
  estimatedCost?: number;
  clinicalRationale: string;
  switchingConsiderations: string[];
  confidenceScore: number;
}

export interface AuthorizationWorkflowStep {
  id: string;
  authorizationId: string;
  stepName: string;
  stepOrder: number;
  status: StepStatus;
  assignedTo?: string;
  assignedAt?: Date;
  dueDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
  description?: string;
  notes?: string;
  attachments?: Record<string, any>;
  aiAssisted: boolean;
  aiSuggestions?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthorizationCommunication {
  id: string;
  authorizationId: string;
  communicationType: CommunicationType;
  direction: CommunicationDirection;
  subject?: string;
  content?: string;
  attachments?: Record<string, any>;
  fileReferences: string[];
  insuranceReferenceNumber?: string;
  confirmationNumber?: string;
  responseRequired: boolean;
  responseDueDate?: Date;
  responseReceivedAt?: Date;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  createdAt: Date;
  createdBy?: string;
}

export interface AuthorizationAnalytics {
  id: string;
  date: Date;
  hourOfDay?: number;
  providerId?: string;
  insuranceProviderId?: string;
  medicationCategory?: string;
  totalRequests: number;
  submittedRequests: number;
  approvedRequests: number;
  deniedRequests: number;
  pendingRequests: number;
  cancelledRequests: number;
  avgProcessingTimeHours?: number;
  medianProcessingTimeHours?: number;
  maxProcessingTimeHours?: number;
  aiRecommendationsCount: number;
  aiAccuracyRate?: number;
  aiRecommendationsFollowed: number;
  avgAiConfidenceScore?: number;
  totalEstimatedCost?: number;
  costSavingsEstimate?: number;
  administrativeTimeSavedHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthorizationAuditLog {
  id: string;
  authorizationId: string;
  userId?: string;
  userEmail?: string;
  sessionId?: string;
  action: string;
  tableName?: string;
  recordId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changedFields: string[];
  ipAddress?: string;
  userAgent?: string;
  requestPath?: string;
  requestMethod?: string;
  accessReason?: string;
  complianceNote?: string;
  phiAccessed: boolean;
  createdAt: Date;
}

export interface DiagnosisHistory {
  code: string;
  description: string;
  diagnosedAt: Date;
  status: 'active' | 'inactive' | 'resolved';
}

// ================================================
// REQUEST/RESPONSE TYPES
// ================================================

export interface AuthorizationRequest {
  id: string;
  patient: {
    id: string;
    age: number;
    gender: string;
    medicalHistory: string[];
    currentMedications: string[];
    allergies: string[];
  };
  medication: {
    id: string;
    name: string;
    genericName: string;
    strength: string;
    formularyTier?: number;
    requiresPriorAuth: boolean;
    requiresStepTherapy: boolean;
  };
  insurance: {
    id: string;
    name: string;
    planType: string;
  };
  diagnosisCodes: string[];
  quantityRequested: number;
  daysSupply: number;
  refillsRequested: number;
  clinicalNotes?: string;
  previousTherapies?: string[];
  contraindications?: string[];
}

export interface FormSuggestions {
  diagnosisCodes: string[];
  quantitySuggestion: number;
  daysSupplySuggestion: number;
  clinicalJustification: string;
  previousTherapies: string[];
  supportingDocuments: string[];
  confidenceScore: number;
}

export interface ProbabilityScore {
  probability: number;
  confidenceInterval: [number, number];
  riskFactors: string[];
  positiveFactors: string[];
  processingTimeEstimate: number;
  similarCasesCount: number;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface PartialAuthForm {
  patientId: string;
  medicationId: string;
  diagnosisCodes?: string[];
  quantityRequested?: number;
  daysSupply?: number;
  clinicalNotes?: string;
  previousTherapies?: string[];
  [key: string]: any;
}

export interface CompletedForm extends PartialAuthForm {
  aiCompletedFields: string[];
  completionConfidence: number;
  reviewRequired: boolean;
  completionNotes: string;
}

// ================================================
// API RESPONSE TYPES
// ================================================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export interface AuthorizationListResponse {
  authorizations: MedicationAuthorization[];
  total: number;
  page: number;
  limit: number;
  filters: {
    status?: AuthorizationStatus[];
    priority?: PriorityLevel[];
    providerId?: string;
    patientId?: string;
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
}

export interface DashboardAnalytics {
  totalAuthorizations: number;
  pendingCount: number;
  approvedCount: number;
  deniedCount: number;
  averageProcessingTime: number;
  aiAccuracyRate: number;
  costSavings: number;
  recentActivity: AuthorizationActivity[];
  trendData: TrendData[];
}

export interface AuthorizationActivity {
  id: string;
  type: 'created' | 'submitted' | 'approved' | 'denied' | 'updated';
  authorizationId: string;
  patientName: string;
  medicationName: string;
  timestamp: Date;
  userId?: string;
  details?: string;
}

export interface TrendData {
  date: Date;
  submissions: number;
  approvals: number;
  denials: number;
  processingTime: number;
}

// ================================================
// FILTER AND SEARCH TYPES
// ================================================

export interface AuthorizationFilters {
  status?: AuthorizationStatus[];
  priority?: PriorityLevel[];
  providerId?: string;
  patientId?: string;
  medicationId?: string;
  insuranceId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  aiRecommendation?: AIRecommendationType[];
  searchTerm?: string;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeRelated?: boolean;
}

// ================================================
// VALIDATION SCHEMAS (for use with Zod)
// ================================================

export interface CreateAuthorizationInput {
  patientId: string;
  medicationId: string;
  insuranceProviderId: string;
  diagnosisCodes: string[];
  quantityRequested: number;
  daysSupply: number;
  refillsRequested?: number;
  priorityLevel?: PriorityLevel;
  clinicalNotes?: string;
  previousTherapiesTried?: string[];
  contraindications?: string[];
  supportingDocumentation?: Record<string, any>;
}

export interface UpdateAuthorizationInput {
  status?: AuthorizationStatus;
  diagnosisCodes?: string[];
  quantityRequested?: number;
  daysSupply?: number;
  refillsRequested?: number;
  priorityLevel?: PriorityLevel;
  clinicalNotes?: string;
  previousTherapiesTried?: string[];
  contraindications?: string[];
  supportingDocumentation?: Record<string, any>;
  insuranceReferenceNumber?: string;
  pharmacyReferenceNumber?: string;
}