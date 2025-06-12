export { ComplianceBackgroundJobs, complianceBackgroundJobs } from './ComplianceBackgroundJobs';

// Export types for background job integration
export interface BackgroundJobResult {
  success: boolean;
  duration: number;
  recordsProcessed: number;
  errors: string[];
  metrics: Record<string, any>;
}

export interface BackgroundJobSchedule {
  name: string;
  cronExpression: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  errorCount: number;
}