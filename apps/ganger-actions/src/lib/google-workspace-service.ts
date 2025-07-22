// This file is temporarily disabled to reduce build time
// The googleapis dependency adds 144MB+ and causes 4+ minute builds
// To re-enable: 
// 1. Rename this file back to google-workspace-service.ts
// 2. Uncomment the googleapis dependency in package.json
// 3. Re-enable the API endpoint in pages/api/admin/google-sync.ts

// lib/google-workspace-service.ts
import { google } from 'googleapis';
import { z } from 'zod';

// Google Workspace user schema
const googleUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  department: z.string().optional(),
  title: z.string().optional(),
  manager: z.string().email().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  suspended: z.boolean().default(false),
  orgUnitPath: z.string().default('/Google Cloud Identity'),
  recoveryEmail: z.string().email().optional(),
  recoveryPhone: z.string().optional()
});

export type GoogleWorkspaceUser = z.infer<typeof googleUserSchema>;

export interface GoogleWorkspaceConfig {
  clientEmail: string;
  privateKey: string;
  domain: string;
  impersonateEmail: string;
  targetGroup: string;
  targetOU: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
  verified_email: boolean;
  hd?: string; // Hosted domain
  locale?: string;
}

export interface GoogleGroupMember {
  email: string;
  role: 'MEMBER' | 'MANAGER' | 'OWNER';
  status: 'ACTIVE' | 'SUSPENDED';
  type: 'USER' | 'GROUP';
}

export class GoogleWorkspaceService {
  private adminSDK;
  private config: GoogleWorkspaceConfig;

  constructor(config: GoogleWorkspaceConfig) {
    this.config = config;

    // Initialize Google Admin SDK with service account
    const auth = new google.auth.JWT({
      email: config.clientEmail,
      key: config.privateKey.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/admin.directory.user',
        'https://www.googleapis.com/auth/admin.directory.group',
        'https://www.googleapis.com/auth/admin.directory.orgunit'
      ],
      subject: config.impersonateEmail
    });

    this.adminSDK = google.admin({ version: 'directory_v1', auth });
  }

  // User management methods

  async createUser(userData: GoogleWorkspaceUser): Promise<{ success: true; user: unknown } | { success: false; error: string }> {
    try {
      // Validate input
      const validation = googleUserSchema.safeParse(userData);
      if (!validation.success) {
        return { success: false, error: 'Invalid user data provided' };
      }

      const { data } = validation;

      // Check if user already exists
      const existingUser = await this.getUser(data.email);
      if (existingUser.success) {
        return { success: false, error: 'User already exists' };
      }

      // Create user in Google Workspace
      const response = await this.adminSDK.users.insert({
        requestBody: {
          primaryEmail: data.email,
          name: {
            givenName: data.firstName,
            familyName: data.lastName
          },
          password: this.generateTemporaryPassword(),
          changePasswordAtNextLogin: true,
          orgUnitPath: data.orgUnitPath || this.config.targetOU,
          suspended: data.suspended || false,
          organizations: data.department ? [{
            name: data.department,
            title: data.title,
            primary: true,
            type: 'work',
            department: data.department
          }] : undefined,
          phones: data.phone ? [{
            value: data.phone,
            type: 'work',
            primary: true
          }] : undefined,
          locations: data.location ? [{
            type: 'work',
            area: data.location
          }] : undefined,
          recoveryEmail: data.recoveryEmail,
          recoveryPhone: data.recoveryPhone,
          customSchemas: {
            'Staff_Management': {
              'Employee_ID': data.email.split('@')[0],
              'Manager_Email': data.manager,
              'Department': data.department,
              'Location': data.location
            }
          }
        }
      });

      // Add user to the target group
      await this.addUserToGroup(data.email, this.config.targetGroup);

      return { success: true, user: response.data };

    } catch (error) {
      console.error('Failed to create Google Workspace user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create user'
      };
    }
  }

  async getUser(email: string): Promise<{ success: true; user: any } | { success: false; error: string }> {
    try {
      const response = await this.adminSDK.users.get({
        userKey: email
      });

      return { success: true, user: response.data };

    } catch (error: any) {
      if (error.code === 404) {
        return { success: false, error: 'User not found' };
      }

      console.error('Failed to get Google Workspace user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get user'
      };
    }
  }

  async updateUser(email: string, updates: Partial<GoogleWorkspaceUser>): Promise<{ success: true; user: any } | { success: false; error: string }> {
    try {
      const updateData: any = {};

      if (updates.firstName || updates.lastName) {
        updateData.name = {};
        if (updates.firstName) updateData.name.givenName = updates.firstName;
        if (updates.lastName) updateData.name.familyName = updates.lastName;
      }

      if (updates.suspended !== undefined) {
        updateData.suspended = updates.suspended;
      }

      if (updates.department || updates.title) {
        updateData.organizations = [{
          name: updates.department,
          title: updates.title,
          primary: true,
          type: 'work',
          department: updates.department
        }];
      }

      if (updates.phone) {
        updateData.phones = [{
          value: updates.phone,
          type: 'work',
          primary: true
        }];
      }

      if (updates.location) {
        updateData.locations = [{
          type: 'work',
          area: updates.location
        }];
      }

      if (updates.recoveryEmail) {
        updateData.recoveryEmail = updates.recoveryEmail;
      }

      if (updates.recoveryPhone) {
        updateData.recoveryPhone = updates.recoveryPhone;
      }

      // Update custom schemas
      updateData.customSchemas = {
        'Staff_Management': {
          'Manager_Email': updates.manager,
          'Department': updates.department,
          'Location': updates.location
        }
      };

      const response = await this.adminSDK.users.update({
        userKey: email,
        requestBody: updateData
      });

      return { success: true, user: response.data };

    } catch (error) {
      console.error('Failed to update Google Workspace user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update user'
      };
    }
  }

  async suspendUser(email: string): Promise<{ success: true } | { success: false; error: string }> {
    try {
      await this.adminSDK.users.update({
        userKey: email,
        requestBody: {
          suspended: true
        }
      });

      return { success: true };

    } catch (error) {
      console.error('Failed to suspend Google Workspace user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to suspend user'
      };
    }
  }

  async restoreUser(email: string): Promise<{ success: true } | { success: false; error: string }> {
    try {
      await this.adminSDK.users.update({
        userKey: email,
        requestBody: {
          suspended: false
        }
      });

      return { success: true };

    } catch (error) {
      console.error('Failed to restore Google Workspace user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to restore user'
      };
    }
  }

  async deleteUser(email: string): Promise<{ success: true } | { success: false; error: string }> {
    try {
      await this.adminSDK.users.delete({
        userKey: email
      });

      return { success: true };

    } catch (error) {
      console.error('Failed to delete Google Workspace user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete user'
      };
    }
  }

  // Group management methods

  async addUserToGroup(userEmail: string, groupEmail: string): Promise<{ success: true } | { success: false; error: string }> {
    try {
      await this.adminSDK.members.insert({
        groupKey: groupEmail,
        requestBody: {
          email: userEmail,
          role: 'MEMBER'
        }
      });

      return { success: true };

    } catch (error: any) {
      // Ignore error if user is already a member
      if (error.code === 409) {
        return { success: true };
      }

      console.error('Failed to add user to Google group:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to add user to group'
      };
    }
  }

  async removeUserFromGroup(userEmail: string, groupEmail: string): Promise<{ success: true } | { success: false; error: string }> {
    try {
      await this.adminSDK.members.delete({
        groupKey: groupEmail,
        memberKey: userEmail
      });

      return { success: true };

    } catch (error: any) {
      // Ignore error if user is not a member
      if (error.code === 404) {
        return { success: true };
      }

      console.error('Failed to remove user from Google group:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to remove user from group'
      };
    }
  }

  async getGroupMembers(groupEmail: string): Promise<{ success: true; members: GoogleGroupMember[] } | { success: false; error: string }> {
    try {
      const response = await this.adminSDK.members.list({
        groupKey: groupEmail
      });

      const members: GoogleGroupMember[] = (response.data.members || []).map(member => ({
        email: member.email!,
        role: member.role as 'MEMBER' | 'MANAGER' | 'OWNER',
        status: member.status as 'ACTIVE' | 'SUSPENDED',
        type: member.type as 'USER' | 'GROUP'
      }));

      return { success: true, members };

    } catch (error) {
      console.error('Failed to get Google group members:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get group members'
      };
    }
  }

  // Directory methods

  async listUsers(domain?: string, maxResults: number = 100): Promise<{ success: true; users: any[] } | { success: false; error: string }> {
    try {
      const response = await this.adminSDK.users.list({
        domain: domain || this.config.domain,
        maxResults,
        orderBy: 'email'
      });

      return { success: true, users: response.data.users || [] };

    } catch (error) {
      console.error('Failed to list Google Workspace users:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to list users'
      };
    }
  }

  async searchUsers(query: string): Promise<{ success: true; users: any[] } | { success: false; error: string }> {
    try {
      const response = await this.adminSDK.users.list({
        domain: this.config.domain,
        query,
        maxResults: 50,
        orderBy: 'email'
      });

      return { success: true, users: response.data.users || [] };

    } catch (error) {
      console.error('Failed to search Google Workspace users:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to search users'
      };
    }
  }

  // Utility methods

  async verifyUserInDomain(email: string): Promise<boolean> {
    try {
      const user = await this.getUser(email);
      return user.success && user.user.primaryEmail.endsWith(`@${this.config.domain}`);
    } catch {
      return false;
    }
  }

  async getUserProfile(email: string): Promise<GoogleUserInfo | null> {
    try {
      const result = await this.getUser(email);
      if (!result.success) return null;

      const user = result.user;
      return {
        id: user.id,
        email: user.primaryEmail,
        name: `${user.name.givenName} ${user.name.familyName}`,
        given_name: user.name.givenName,
        family_name: user.name.familyName,
        picture: user.thumbnailPhotoUrl,
        verified_email: !user.suspended,
        hd: this.config.domain
      };
    } catch {
      return null;
    }
  }

  private generateTemporaryPassword(): string {
    // Generate a secure temporary password
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }

  // Sync methods for staff management integration

  async syncUserToWorkspace(staffUser: {
    full_name: string;
    email: string;
    department?: string;
    location?: string;
    phone_number?: string;
    manager_id?: string;
    is_active: boolean;
  }, managerEmail?: string): Promise<{ success: true; user: any } | { success: false; error: string }> {
    try {
      const [firstName, ...lastNameParts] = staffUser.full_name.split(' ');
      const lastName = lastNameParts.join(' ') || firstName;

      const userData: GoogleWorkspaceUser = {
        firstName,
        lastName,
        email: staffUser.email,
        department: staffUser.department,
        location: staffUser.location,
        phone: staffUser.phone_number,
        manager: managerEmail,
        suspended: !staffUser.is_active,
        orgUnitPath: this.config.targetOU
      };

      // Check if user exists
      const existingUser = await this.getUser(staffUser.email);
      
      if (existingUser.success) {
        // Update existing user
        return await this.updateUser(staffUser.email, userData);
      } else {
        // Create new user
        return await this.createUser(userData);
      }

    } catch (error) {
      console.error('Failed to sync user to Google Workspace:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to sync user'
      };
    }
  }

  async bulkSyncUsers(staffUsers: Array<{
    full_name: string;
    email: string;
    department?: string;
    location?: string;
    phone_number?: string;
    manager_email?: string;
    is_active: boolean;
  }>): Promise<{
    successful: number;
    failed: number;
    errors: Array<{ email: string; error: string }>;
  }> {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ email: string; error: string }>
    };

    for (const user of staffUsers) {
      try {
        const result = await this.syncUserToWorkspace(user, user.manager_email);
        
        if (result.success) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push({ email: user?.email, error: result.error });
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        results.failed++;
        results.errors.push({ 
          email: user?.email, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }
}

// Singleton instance
let googleWorkspaceServiceInstance: GoogleWorkspaceService | null = null;

export function getGoogleWorkspaceService(): GoogleWorkspaceService {
  if (!googleWorkspaceServiceInstance) {
    // Check if Google Workspace integration is configured
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.warn('Google Workspace integration not configured. Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY environment variables.');
      console.warn('To enable Google Workspace integration:');
      console.warn('1. Create a service account in Google Cloud Console');
      console.warn('2. Download the JSON key file');
      console.warn('3. Add GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY to .env');
      throw new Error('Google Workspace integration not configured. Please set up service account credentials.');
    }

    const config: GoogleWorkspaceConfig = {
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL!,
      privateKey: process.env.GOOGLE_PRIVATE_KEY!,
      domain: process.env.GOOGLE_DOMAIN || 'gangerdermatology.com',
      impersonateEmail: process.env.GOOGLE_IMPERSONATE_EMAIL || 'anand@gangerdermatology.com',
      targetGroup: process.env.GOOGLE_TARGET_GROUP || 'gci-users@gangerdermatology.com',
      targetOU: process.env.GOOGLE_TARGET_OU || '/Google Cloud Identity'
    };

    // Validate required environment variables
    const requiredVars = ['GOOGLE_CLIENT_EMAIL', 'GOOGLE_PRIVATE_KEY'];
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        throw new Error(`Missing required environment variable: ${varName}`);
      }
    }

    googleWorkspaceServiceInstance = new GoogleWorkspaceService(config);
  }

  return googleWorkspaceServiceInstance;
}

// Helper function to validate Google Workspace configuration
export async function validateGoogleWorkspaceConfig(): Promise<{ valid: true } | { valid: false; error: string }> {
  try {
    // First check if credentials are configured
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      return {
        valid: false,
        error: 'Google Workspace integration not configured. Missing service account credentials.'
      };
    }

    const service = getGoogleWorkspaceService();
    
    // Test basic connectivity by listing users
    const result = await service.listUsers(undefined, 1);
    
    if (result.success) {
      return { valid: true };
    } else {
      return { valid: false, error: result.error };
    }

  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Configuration validation failed'
    };
  }
}
