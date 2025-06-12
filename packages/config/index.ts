// packages/config/index.ts
/**
 * Main export file for @ganger/config package
 * Centralizes all configuration utilities for the Ganger Platform
 */

// Environment configuration
export * from './environment';
export { default as environmentConfig } from './environment';

// Supabase configuration
export * from './supabase-template';

// Next.js configuration (CommonJS)
export { createNextConfig } from './next-config-template';

// Type definitions
export type {
  AppEnvironmentConfig,
} from './environment';

// Default configurations for common apps
import { getAppConfig } from './environment';

export const appConfigs = {
  staff: () => getAppConfig('staff'),
  clinicalStaffing: () => getAppConfig('clinical-staffing'),
  medicationAuth: () => getAppConfig('medication-auth'),
  callCenterOps: () => getAppConfig('call-center-ops'),
  integrationStatus: () => getAppConfig('integration-status'),
  platformDashboard: () => getAppConfig('platform-dashboard'),
  socialsReviews: () => getAppConfig('socials-reviews'),
  handouts: () => getAppConfig('handouts'),
  inventory: () => getAppConfig('inventory'),
  checkinKiosk: () => getAppConfig('checkin-kiosk'),
  eosL10: () => getAppConfig('eos-l10'),
  pharmaScheduling: () => getAppConfig('pharma-scheduling'),
  complianceTraining: () => getAppConfig('compliance-training'),
  batchCloseout: () => getAppConfig('batch-closeout'),
  configDashboard: () => getAppConfig('config-dashboard'),
};