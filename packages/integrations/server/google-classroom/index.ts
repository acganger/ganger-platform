export { GoogleClassroomComplianceSync } from './GoogleClassroomComplianceSync';

// Export types for Google Classroom integration
export interface GoogleClassroomSubmission {
  id: string;
  userId: string;
  state: 'NEW' | 'CREATED' | 'TURNED_IN' | 'RETURNED' | 'RECLAIMED_BY_STUDENT';
  assignedGrade?: number;
  submissionHistory?: Array<{
    submissionTime?: string;
    stateHistory?: {
      state: string;
      timestamp: string;
    };
  }>;
  creationTime: string;
  updateTime: string;
}

export interface GoogleClassroomCourse {
  id: string;
  name: string;
  description?: string;
  state: 'ACTIVE' | 'ARCHIVED' | 'PROVISIONED' | 'DECLINED' | 'SUSPENDED';
  creationTime: string;
  updateTime: string;
}

export interface GoogleClassroomCoursework {
  id: string;
  title: string;
  description?: string;
  state: 'PUBLISHED' | 'DRAFT' | 'DELETED';
  creationTime: string;
  updateTime: string;
  dueDate?: {
    year: number;
    month: number;
    day: number;
  };
  dueTime?: {
    hours: number;
    minutes: number;
  };
}

export interface GoogleClassroomUserProfile {
  id: string;
  name: {
    givenName: string;
    familyName: string;
    fullName: string;
  };
  emailAddress: string;
}

export interface ClassroomSyncResult {
  success: boolean;
  processed: number;
  updated: number;
  failed: number;
  duration: number;
  errors?: string[];
  dryRun?: boolean;
  preview?: any[];
}