import { supabase } from '@ganger/db';

export interface UserPermissions {
  canSchedule: boolean; // OS managers only
  canResolveConflicts: boolean; // OU managers only
  canApproveOvertime: boolean; // OS managers
  canViewAllProviders: boolean; // All staff
  canEditTemplates: boolean; // OS managers
  isManager: boolean;
  managerType?: 'OS' | 'OU' | 'both';
}

export class PermissionService {
  private static instance: PermissionService;
  private userPermissionsCache: Map<string, UserPermissions> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  /**
   * Get permissions for the current user
   */
  async getCurrentUserPermissions(): Promise<UserPermissions> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return this.getDefaultPermissions();
    }

    return this.getUserPermissions(user.id);
  }

  /**
   * Get permissions for a specific user
   */
  async getUserPermissions(userId: string): Promise<UserPermissions> {
    // Check cache first
    const cached = this.userPermissionsCache.get(userId);
    if (cached) {
      return cached;
    }

    try {
      // Query user roles from database
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select('role_name, department')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Failed to fetch user roles:', error);
        return this.getDefaultPermissions();
      }

      // Determine manager type
      const isOSManager = userRoles?.some(r => 
        r.role_name === 'manager' && r.department === 'OS'
      ) || false;
      
      const isOUManager = userRoles?.some(r => 
        r.role_name === 'manager' && r.department === 'OU'
      ) || false;

      const permissions: UserPermissions = {
        canSchedule: isOSManager,
        canResolveConflicts: isOUManager,
        canApproveOvertime: isOSManager,
        canViewAllProviders: true, // All authenticated users
        canEditTemplates: isOSManager,
        isManager: isOSManager || isOUManager,
        managerType: isOSManager && isOUManager ? 'both' : 
                     isOSManager ? 'OS' : 
                     isOUManager ? 'OU' : 
                     undefined
      };

      // Cache permissions
      this.userPermissionsCache.set(userId, permissions);
      
      // Clear cache after timeout
      setTimeout(() => {
        this.userPermissionsCache.delete(userId);
      }, this.cacheTimeout);

      return permissions;
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return this.getDefaultPermissions();
    }
  }

  /**
   * Check if current user has a specific permission
   */
  async checkPermission(permission: keyof UserPermissions): Promise<boolean> {
    const permissions = await this.getCurrentUserPermissions();
    return permissions[permission] as boolean;
  }

  /**
   * Require a specific permission, throw error if not granted
   */
  async requirePermission(permission: keyof UserPermissions, action: string): Promise<void> {
    const hasPermission = await this.checkPermission(permission);
    
    if (!hasPermission) {
      throw new Error(`Unauthorized: You do not have permission to ${action}`);
    }
  }

  /**
   * Clear permission cache for a user
   */
  clearUserCache(userId: string): void {
    this.userPermissionsCache.delete(userId);
  }

  /**
   * Clear all permission caches
   */
  clearAllCaches(): void {
    this.userPermissionsCache.clear();
  }

  /**
   * Get default permissions for unauthenticated users
   */
  private getDefaultPermissions(): UserPermissions {
    return {
      canSchedule: false,
      canResolveConflicts: false,
      canApproveOvertime: false,
      canViewAllProviders: false,
      canEditTemplates: false,
      isManager: false
    };
  }

  /**
   * Check if user can assign a specific staff member
   */
  async canAssignStaff(staffMemberId: string, providerId: string): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const permissions = await this.getCurrentUserPermissions();

    if (!permissions.canSchedule) {
      return {
        allowed: false,
        reason: 'Only OS managers can create schedules'
      };
    }

    // Additional business rules can be added here
    // For example: checking if staff member is qualified for the provider's specialty

    return { allowed: true };
  }

  /**
   * Check if user can approve overtime
   */
  async canApproveOvertime(staffMemberId: string, hours: number): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const permissions = await this.getCurrentUserPermissions();

    if (!permissions.canApproveOvertime) {
      return {
        allowed: false,
        reason: 'Only OS managers can approve overtime'
      };
    }

    if (hours > 60) {
      return {
        allowed: false,
        reason: 'Weekly hours cannot exceed 60 even with approval'
      };
    }

    return { allowed: true };
  }

  /**
   * Get permission-based UI configuration
   */
  async getUIConfiguration(): Promise<{
    showSchedulingTools: boolean;
    showConflictResolution: boolean;
    showOvertimeApproval: boolean;
    showTemplateEditor: boolean;
    enableDragDrop: boolean;
    viewMode: 'single' | 'all';
  }> {
    const permissions = await this.getCurrentUserPermissions();

    return {
      showSchedulingTools: permissions.canSchedule,
      showConflictResolution: permissions.canResolveConflicts,
      showOvertimeApproval: permissions.canApproveOvertime,
      showTemplateEditor: permissions.canEditTemplates,
      enableDragDrop: permissions.canSchedule,
      viewMode: permissions.canViewAllProviders ? 'all' : 'single'
    };
  }
}

// Export singleton instance
export const permissionService = PermissionService.getInstance();