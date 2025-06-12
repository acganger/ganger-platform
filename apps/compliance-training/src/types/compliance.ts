// Frontend compliance types for client-side state management
export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  location: 'Ann Arbor' | 'Wixom' | 'Plymouth';
  role: string;
  hireDate: Date;
  active: boolean;
}

export interface TrainingModule {
  id: string;
  name: string;
  description: string;
  category: 'HIPAA' | 'Safety' | 'Clinical' | 'Administrative';
  durationMinutes: number;
  validityPeriodDays: number;
  isRequired: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingCompletion {
  id: string;
  employeeId: string;
  trainingId: string;
  status: 'completed' | 'overdue' | 'due_soon' | 'not_started' | 'not_required';
  completedAt: Date;
  expiresAt: Date;
  score?: number;
  certificateUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceMatrix {
  employees: Employee[];
  trainings: TrainingModule[];
  completions: Record<string, TrainingCompletion>;
  summary: ComplianceSummary;
}

export interface ComplianceSummary {
  totalEmployees: number;
  totalTrainings: number;
  overallComplianceRate: number;
  overdueCount: number;
  dueSoonCount: number;
  byDepartment: DepartmentSummary[];
  byLocation: LocationSummary[];
}

export interface DepartmentSummary {
  department: string;
  employeeCount: number;
  complianceRate: number;
  overdueCount: number;
  dueSoonCount: number;
}

export interface LocationSummary {
  location: string;
  employeeCount: number;
  complianceRate: number;
  overdueCount: number;
  dueSoonCount: number;
}

export interface FilterOptions {
  status: 'all' | 'completed' | 'overdue' | 'due_soon' | 'not_started';
  department: string;
  location: string;
  role?: string;
  timeRange: 'current' | 'last_3_months' | 'last_6_months' | 'custom';
  customStartDate?: Date;
  customEndDate?: Date;
  searchTerm?: string;
}

export interface DashboardData {
  matrix: ComplianceMatrix;
  departments: DepartmentSummary[];
  locations: LocationSummary[];
  overallStats: ComplianceStats;
  lastSync: Date;
}

export interface ComplianceStats {
  totalCompletions: number;
  overdueTrainings: number;
  dueSoonTrainings: number;
  complianceRate: number;
  trendsData: ComplianceTrend[];
}

export interface ComplianceTrend {
  month: string;
  completionRate: number;
  overdueRate: number;
}

export interface ExportData {
  format: 'csv' | 'pdf';
  data: any[];
  filename: string;
  generatedAt: Date;
}

export interface SyncResponse {
  success: boolean;
  lastSync: Date;
  recordsUpdated: number;
  errors?: string[];
}

// Frontend state management types
export interface ComplianceDashboardState {
  employees: Employee[];
  trainings: TrainingModule[];
  completions: TrainingCompletion[];
  filters: FilterOptions;
  loading: boolean;
  error: string | null;
  lastSync: Date | null;
}

export interface FilterState {
  activeFilters: FilterOptions;
  availableDepartments: string[];
  availableLocations: string[];
  searchResults: Employee[];
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
  }[];
}

export interface ExportOptions {
  format: 'csv' | 'pdf';
  includeFilters: boolean;
  dateRange: {
    start: Date;
    end: Date;
  };
  selectedFields: string[];
}