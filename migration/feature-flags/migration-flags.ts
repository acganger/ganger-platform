/**
 * Feature Flags for Database Migration
 * Phase 4: Validation & Production Deployment
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://supa.gangerdermatology.com';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export interface MigrationFeatureFlag {
  flag_name: string;
  enabled: boolean;
  rollout_percentage: number;
  app_name?: string;
  user_emails?: string[];
  description: string;
  created_at: string;
  updated_at: string;
}

export class MigrationFeatureFlags {
  private supabase: any;
  private cache: Map<string, MigrationFeatureFlag> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate: number = 0;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }

  /**
   * Initialize feature flags in database
   */
  async initialize() {
    const defaultFlags: Partial<MigrationFeatureFlag>[] = [
      {
        flag_name: 'use_new_schema_clinical_staffing',
        enabled: false,
        rollout_percentage: 0,
        app_name: 'clinical-staffing',
        description: 'Enable new database schema for Clinical Staffing app'
      },
      {
        flag_name: 'use_new_schema_ganger_actions',
        enabled: false,
        rollout_percentage: 0,
        app_name: 'ganger-actions',
        description: 'Enable new database schema for Ganger Actions app'
      },
      {
        flag_name: 'use_new_schema_eos_l10',
        enabled: false,
        rollout_percentage: 0,
        app_name: 'eos-l10',
        description: 'Enable new database schema for EOS L10 app'
      },
      {
        flag_name: 'use_new_schema_compliance_training',
        enabled: false,
        rollout_percentage: 0,
        app_name: 'compliance-training',
        description: 'Enable new database schema for Compliance Training app'
      },
      {
        flag_name: 'migration_read_only_mode',
        enabled: false,
        rollout_percentage: 0,
        description: 'Enable read-only mode during migration'
      },
      {
        flag_name: 'migration_dual_write',
        enabled: false,
        rollout_percentage: 0,
        description: 'Write to both old and new schemas during migration'
      },
      {
        flag_name: 'migration_performance_monitoring',
        enabled: true,
        rollout_percentage: 100,
        description: 'Enable enhanced performance monitoring during migration'
      }
    ];

    for (const flag of defaultFlags) {
      await this.createOrUpdateFlag(flag);
    }
  }

  /**
   * Create or update a feature flag
   */
  async createOrUpdateFlag(flag: Partial<MigrationFeatureFlag>) {
    const existingFlag = await this.supabase
      .from('migration_feature_flags')
      .select('*')
      .eq('flag_name', flag.flag_name)
      .single();

    if (existingFlag.data) {
      // Update existing flag
      await this.supabase
        .from('migration_feature_flags')
        .update({
          ...flag,
          updated_at: new Date().toISOString()
        })
        .eq('flag_name', flag.flag_name);
    } else {
      // Create new flag
      await this.supabase
        .from('migration_feature_flags')
        .insert({
          ...flag,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }

    // Invalidate cache
    this.cache.delete(flag.flag_name as string);
  }

  /**
   * Check if a feature flag is enabled for a specific user
   */
  async isEnabled(flagName: string, userEmail?: string): Promise<boolean> {
    const flag = await this.getFlag(flagName);
    
    if (!flag || !flag.enabled) {
      return false;
    }

    // Check if user is in allowlist
    if (flag.user_emails && flag.user_emails.length > 0) {
      return userEmail ? flag.user_emails.includes(userEmail) : false;
    }

    // Check rollout percentage
    if (flag.rollout_percentage < 100) {
      // Use email hash for consistent rollout
      if (userEmail) {
        const hash = this.hashEmail(userEmail);
        const threshold = flag.rollout_percentage / 100;
        return hash < threshold;
      }
      return false;
    }

    return true;
  }

  /**
   * Get a specific feature flag
   */
  async getFlag(flagName: string): Promise<MigrationFeatureFlag | null> {
    // Check cache first
    if (this.cache.has(flagName) && Date.now() - this.lastCacheUpdate < this.cacheExpiry) {
      return this.cache.get(flagName) || null;
    }

    // Fetch from database
    const { data, error } = await this.supabase
      .from('migration_feature_flags')
      .select('*')
      .eq('flag_name', flagName)
      .single();

    if (error || !data) {
      return null;
    }

    // Update cache
    this.cache.set(flagName, data);
    this.lastCacheUpdate = Date.now();

    return data;
  }

  /**
   * Get all feature flags
   */
  async getAllFlags(): Promise<MigrationFeatureFlag[]> {
    const { data, error } = await this.supabase
      .from('migration_feature_flags')
      .select('*')
      .order('flag_name');

    if (error || !data) {
      return [];
    }

    // Update cache
    data.forEach((flag: MigrationFeatureFlag) => {
      this.cache.set(flag.flag_name, flag);
    });
    this.lastCacheUpdate = Date.now();

    return data;
  }

  /**
   * Enable a feature flag with optional rollout percentage
   */
  async enableFlag(flagName: string, rolloutPercentage: number = 100) {
    await this.createOrUpdateFlag({
      flag_name: flagName,
      enabled: true,
      rollout_percentage: rolloutPercentage
    });
  }

  /**
   * Disable a feature flag
   */
  async disableFlag(flagName: string) {
    await this.createOrUpdateFlag({
      flag_name: flagName,
      enabled: false,
      rollout_percentage: 0
    });
  }

  /**
   * Add users to feature flag allowlist
   */
  async addUsersToFlag(flagName: string, userEmails: string[]) {
    const flag = await this.getFlag(flagName);
    if (!flag) return;

    const currentEmails = flag.user_emails || [];
    const newEmails = Array.from(new Set([...currentEmails, ...userEmails]));

    await this.createOrUpdateFlag({
      flag_name: flagName,
      user_emails: newEmails
    });
  }

  /**
   * Hash email for consistent rollout
   */
  private hashEmail(email: string): number {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Convert to 0-1 range
    return Math.abs(hash) / 2147483647;
  }

  /**
   * Get migration configuration based on feature flags
   */
  async getMigrationConfig(appName: string, userEmail?: string): Promise<{
    useNewSchema: boolean;
    dualWrite: boolean;
    readOnly: boolean;
    performanceMonitoring: boolean;
  }> {
    const [
      appFlag,
      dualWriteFlag,
      readOnlyFlag,
      performanceFlag
    ] = await Promise.all([
      this.isEnabled(`use_new_schema_${appName.replace('-', '_')}`, userEmail),
      this.isEnabled('migration_dual_write', userEmail),
      this.isEnabled('migration_read_only_mode', userEmail),
      this.isEnabled('migration_performance_monitoring', userEmail)
    ]);

    return {
      useNewSchema: appFlag,
      dualWrite: dualWriteFlag,
      readOnly: readOnlyFlag,
      performanceMonitoring: performanceFlag
    };
  }

  /**
   * Log feature flag usage for monitoring
   */
  async logFlagUsage(flagName: string, userEmail?: string, result: boolean) {
    try {
      await this.supabase
        .from('migration_feature_flag_logs')
        .insert({
          flag_name: flagName,
          user_email: userEmail,
          result: result,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log feature flag usage:', error);
    }
  }
}

// Singleton instance
export const migrationFlags = new MigrationFeatureFlags();

// Helper function for apps to check migration status
export async function shouldUseMigrationAdapter(
  appName: string,
  userEmail?: string
): Promise<boolean> {
  const config = await migrationFlags.getMigrationConfig(appName, userEmail);
  
  // Use migration adapter if we're not fully on new schema yet
  // or if we're in dual-write mode
  return !config.useNewSchema || config.dualWrite;
}

// Export types
export type { MigrationFeatureFlag };