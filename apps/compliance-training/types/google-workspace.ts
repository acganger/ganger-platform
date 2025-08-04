/**
 * Google Workspace integration types for Compliance Training
 */

// Employee sync types
export interface EmployeeSyncRequest {
  dryRun?: boolean;
  departments?: string[];
  locations?: string[];
  forceUpdate?: boolean;
}

export interface EmployeeSyncResponse {
  syncId: string;
  status: 'started' | 'completed' | 'failed';
  results: {
    employeesProcessed: number;
    accountsCreated: number;
    accountsUpdated: number;
    accountsAlreadyExist: number;
    accountsSkipped: number;
    errors: Array<{ email: string; error: string }>;
    activeEmployees?: ActiveEmployee[];
  };
  startTime: string;
  endTime?: string;
  duration?: number;
  dryRun: boolean;
}

export interface ActiveEmployee {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  department: string;
  job_title: string;
  location: string;
  start_date: string;
  google_account_status?: 'active' | 'not_found' | 'needs_creation' | 'needs_update';
  google_account_details?: {
    suspended: boolean;
    orgUnitPath: string;
    lastLoginTime?: string;
  };
}

// Cleanup types
export interface CleanupRequest {
  dryRun?: boolean;
  includeRecentlyTerminated?: boolean;
  departments?: string[];
}

export interface CleanupResponse {
  cleanupId: string;
  status: 'started' | 'completed' | 'failed';
  results: {
    employeesProcessed: number;
    accountsSuspended: number;
    accountsAlreadySuspended: number;
    accountsNotFound: number;
    errors: Array<{ email: string; error: string }>;
    terminatedEmployees?: TerminatedEmployee[];
  };
  startTime: string;
  endTime?: string;
  duration?: number;
  dryRun: boolean;
}

export interface TerminatedEmployee {
  id: string;
  email: string;
  name: string;
  terminated_date: string;
  department: string;
  google_account_status?: 'active' | 'suspended' | 'deleted' | 'not_found';
}

// Google Admin SDK types
export interface GoogleUserData {
  primaryEmail: string;
  name: {
    givenName: string;
    familyName: string;
  };
  password?: string;
  changePasswordAtNextLogin?: boolean;
  suspended?: boolean;
  suspensionReason?: string;
  orgUnitPath?: string;
  customSchemas?: {
    EmployeeInfo?: {
      department?: string;
      jobTitle?: string;
      location?: string;
      startDate?: string;
    };
  };
  lastLoginTime?: string;
}

// Organizational unit mapping
export const ORG_UNIT_PATHS = {
  'Clinical': '/Clinical Staff',
  'Front Desk': '/Front Desk',
  'Call Center': '/Call Center',
  'Administration': '/Administration',
  'Management': '/Management',
  'Providers': '/Providers',
  'Nurses': '/Clinical Staff/Nurses',
  'Medical Assistants': '/Clinical Staff/Medical Assistants'
} as const;

export type Department = keyof typeof ORG_UNIT_PATHS;

// Sync/Cleanup log types
export interface SyncLog {
  id: string;
  type: 'google_workspace_terminated' | 'google_workspace_active' | 'google_workspace_sync';
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  started_at: string;
  started_by: string;
  completed_at?: string;
  duration_ms?: number;
  options: Record<string, any>;
  results: Record<string, any>;
  error?: string;
}

// API Error types
export interface GoogleWorkspaceError {
  code: string;
  message: string;
  details?: Record<string, any>;
}