export { ZenefitsComplianceSync } from './ZenefitsComplianceSync';

// Export types for Zenefits integration
export interface ZenefitsEmployee {
  id: string;
  first_name: string;
  last_name: string;
  work_email?: string;
  personal_email?: string;
  employments?: Array<{
    id: string;
    company: string;
    department?: {
      id: string;
      name: string;
    };
    location?: {
      id: string;
      name: string;
    };
    title?: string;
    start_date?: string;
    end_date?: string;
    status: 'active' | 'inactive' | 'terminated';
    manager?: {
      id: string;
      work_email?: string;
    };
  }>;
  created_at: string;
  updated_at: string;
}

export interface ZenefitsApiResponse<T> {
  data: T[];
  meta: {
    count: number;
    next?: string;
    previous?: string;
  };
}

export interface ZenefitsSyncResult {
  success: boolean;
  processed: number;
  created: number;
  updated: number;
  failed: number;
  duration: number;
  errors?: string[];
  dryRun?: boolean;
  preview?: ZenefitsEmployee[];
}