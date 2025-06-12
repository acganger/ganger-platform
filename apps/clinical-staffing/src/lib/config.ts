// apps/clinical-staffing/src/lib/config.ts
/**
 * Clinical Staffing Application Configuration
 * Uses the standardized configuration system from @ganger/config
 */

import { getAppConfig, getApiBaseUrl, isDevelopment } from '@ganger/config';

// Get configuration for this app
export const appConfig = getAppConfig('clinical-staffing');

// API configuration
export const apiConfig = {
  baseUrl: getApiBaseUrl('clinical-staffing'),
  timeout: 30000,
  retries: isDevelopment() ? 1 : 3,
  endpoints: {
    staffSchedules: '/api/staff-schedules',
    staffAvailability: '/api/staff-availability',
    analytics: '/api/analytics',
    staffing: '/api/staffing',
  },
};

// Feature flags specific to clinical staffing
export const features = {
  ...appConfig.features,
  enableAdvancedScheduling: process.env.NEXT_PUBLIC_ENABLE_ADVANCED_SCHEDULING !== 'false',
  enableDragAndDrop: process.env.NEXT_PUBLIC_ENABLE_DRAG_DROP !== 'false',
  enableRealtimeUpdates: appConfig.features.enableRealtime,
  enableAnalyticsDashboard: appConfig.features.enableAnalytics,
};

// Clinical staffing specific configuration
export const clinicalConfig = {
  scheduleViewModes: ['week', 'month', 'day'] as const,
  defaultViewMode: 'week' as const,
  maxStaffPerShift: parseInt(process.env.NEXT_PUBLIC_MAX_STAFF_PER_SHIFT || '10'),
  minStaffPerShift: parseInt(process.env.NEXT_PUBLIC_MIN_STAFF_PER_SHIFT || '2'),
  shiftDurations: [4, 6, 8, 10, 12] as const, // hours
  defaultShiftDuration: 8,
};

// Export the complete configuration
export default {
  app: appConfig,
  api: apiConfig,
  features,
  clinical: clinicalConfig,
};