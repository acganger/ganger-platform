/**
 * Mock Authentication Service for Ganger Platform Testing
 * 
 * Provides test authentication capabilities that mimic the real Google OAuth
 * and Supabase authentication flow without requiring actual credentials.
 */

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export interface TestUser {
  id: string;
  email: string;
  role: 'admin' | 'staff' | 'viewer';
  department?: string;
  permissions: string[];
  createdAt: string;
  lastLogin?: string;
}

export interface TestSession {
  token: string;
  userId: string;
  expiresAt: string;
  isActive: boolean;
}

export class GangerPlatformAuth {
  private testUsers: Map<string, TestUser> = new Map();
  private testSessions: Map<string, TestSession> = new Map();
  private jwtSecret: string;

  constructor() {
    // Use a test-specific JWT secret
    this.jwtSecret = process.env.TEST_JWT_SECRET || 'test-jwt-secret-ganger-platform-2025';
    
    // Create default test users
    this.initializeDefaultTestUsers();
  }

  private initializeDefaultTestUsers() {
    const defaultUsers = [
      {
        email: 'admin@test.gangerdermatology.com',
        role: 'admin' as const,
        department: 'IT',
        permissions: ['*'] // Admin has all permissions
      },
      {
        email: 'staff@test.gangerdermatology.com',
        role: 'staff' as const,
        department: 'Clinical',
        permissions: ['read', 'write', 'inventory', 'handouts', 'checkin']
      },
      {
        email: 'viewer@test.gangerdermatology.com',
        role: 'viewer' as const,
        department: 'Reception',
        permissions: ['read', 'checkin']
      },
      {
        email: 'provider@test.gangerdermatology.com',
        role: 'staff' as const,
        department: 'Medical',
        permissions: ['read', 'write', 'handouts', 'medication-auth', 'pharma-scheduling']
      },
      {
        email: 'nurse@test.gangerdermatology.com',
        role: 'staff' as const,
        department: 'Nursing',
        permissions: ['read', 'write', 'inventory', 'checkin', 'medication-auth']
      }
    ];

    defaultUsers.forEach(userData => {
      const user: TestUser = {
        id: uuidv4(),
        email: userData.email,
        role: userData.role,
        department: userData.department,
        permissions: userData.permissions,
        createdAt: new Date().toISOString()
      };
      this.testUsers.set(user.id, user);
    });

    console.error(`Initialized ${defaultUsers.length} default test users`);
  }

  /**
   * Create a new test user
   */
  async createTestUser(args: any) {
    const { email, role, department, permissions = [] } = args;

    // Validate email is in test domain
    if (!email.endsWith('@test.gangerdermatology.com')) {
      throw new Error('Test user email must end with @test.gangerdermatology.com');
    }

    // Check if user already exists
    const existingUser = Array.from(this.testUsers.values()).find(u => u.email === email);
    if (existingUser) {
      throw new Error(`Test user with email ${email} already exists`);
    }

    const user: TestUser = {
      id: uuidv4(),
      email,
      role,
      department,
      permissions,
      createdAt: new Date().toISOString()
    };

    this.testUsers.set(user.id, user);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Test user created successfully:
          
**User Details:**
- ID: ${user.id}
- Email: ${user.email}
- Role: ${user.role}
- Department: ${user.department || 'Not specified'}
- Permissions: ${user.permissions.join(', ') || 'None'}
- Created: ${user.createdAt}

**Next Steps:**
1. Use 'generate_test_token' to create an authentication token
2. Use the token in API requests with header: Authorization: Bearer <token>
3. Test authentication with 'test_app_authentication'`
        }
      ]
    };
  }

  /**
   * Generate a valid JWT token for testing
   */
  async generateTestToken(args: any) {
    const { userId, expiresIn = '1h' } = args;

    const user = this.testUsers.get(userId);
    if (!user) {
      throw new Error(`Test user with ID ${userId} not found`);
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      department: user.department,
      permissions: user.permissions,
      aud: 'authenticated',
      iss: 'ganger-platform-test',
      exp: Math.floor(Date.now() / 1000) + this.parseExpiration(expiresIn)
    };

    const token = jwt.sign(payload, this.jwtSecret);

    // Store session
    const session: TestSession = {
      token,
      userId: user.id,
      expiresAt: new Date(payload.exp * 1000).toISOString(),
      isActive: true
    };

    this.testSessions.set(token, session);

    // Update last login
    user.lastLogin = new Date().toISOString();

    return {
      content: [
        {
          type: 'text',
          text: `🔑 Test token generated successfully:

**Token Information:**
- User: ${user.email} (${user.role})
- Expires: ${session.expiresAt}
- Token: ${token}

**Usage:**
\`\`\`bash
# Use in API requests
curl -H "Authorization: Bearer ${token}" \\
     https://api.gangerdermatology.com/endpoint

# Or in JavaScript fetch
fetch('/api/endpoint', {
  headers: { 'Authorization': 'Bearer ${token}' }
})
\`\`\`

**Testing Authentication:**
Use 'validate_test_session' to verify this token works correctly.`
        }
      ]
    };
  }

  /**
   * Mock Google OAuth flow
   */
  async mockGoogleOAuth(args: any) {
    const { email, returnUrl } = args;

    // Validate email domain
    if (!email.endsWith('@test.gangerdermatology.com') && !email.endsWith('@gangerdermatology.com')) {
      throw new Error('OAuth email must be from gangerdermatology.com or test.gangerdermatology.com domain');
    }

    // Find or create user
    let user = Array.from(this.testUsers.values()).find(u => u.email === email);
    
    if (!user && email.endsWith('@test.gangerdermatology.com')) {
      // Create new test user if it's a test email
      user = {
        id: uuidv4(),
        email,
        role: 'staff', // Default role for OAuth users
        department: 'Test Department',
        permissions: ['read', 'write'],
        createdAt: new Date().toISOString()
      };
      this.testUsers.set(user.id, user);
    } else if (!user) {
      throw new Error(`User with email ${email} not found. For testing, use @test.gangerdermatology.com emails.`);
    }

    // Generate OAuth-style response
    const authCode = uuidv4();
    const state = uuidv4();

    const mockOAuthResponse = {
      code: authCode,
      state,
      user: {
        id: user.id,
        email: user.email,
        name: user.email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email.split('@')[0])}&background=3b82f6&color=fff`,
        email_verified: true,
        hd: 'gangerdermatology.com'
      }
    };

    // Update last login
    user.lastLogin = new Date().toISOString();

    return {
      content: [
        {
          type: 'text',
          text: `🔐 Mock Google OAuth completed successfully:

**OAuth Response:**
\`\`\`json
${JSON.stringify(mockOAuthResponse, null, 2)}
\`\`\`

**Simulated Flow:**
1. User clicked "Sign in with Google"
2. Redirected to Google OAuth (mocked)
3. User authorized Ganger Platform access
4. Google returned authorization code: ${authCode}
5. Application exchanges code for access token

**Next Steps:**
1. Use 'generate_test_token' with userId: ${user.id}
2. The application would normally exchange the auth code for a token
3. Test the full authentication flow with your application

**Return URL:** ${returnUrl || 'Not specified'}`
        }
      ]
    };
  }

  /**
   * Validate a test session token
   */
  async validateTestSession(args: any) {
    const { token } = args;

    try {
      // Verify JWT signature and expiration
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      // Check if session exists and is active
      const session = this.testSessions.get(token);
      if (!session || !session.isActive) {
        throw new Error('Session not found or inactive');
      }

      // Get user details
      const user = this.testUsers.get(decoded.sub);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ Token validation successful:

**Token Details:**
- Valid: ✅ Yes
- User: ${user.email}
- Role: ${user.role}
- Department: ${user.department || 'Not specified'}
- Permissions: ${user.permissions.join(', ')}
- Expires: ${session.expiresAt}
- Time Remaining: ${this.getTimeRemaining(session.expiresAt)}

**Decoded JWT Payload:**
\`\`\`json
${JSON.stringify({
  sub: decoded.sub,
  email: decoded.email,
  role: decoded.role,
  department: decoded.department,
  permissions: decoded.permissions,
  exp: decoded.exp,
  iss: decoded.iss
}, null, 2)}
\`\`\`

**Authentication Status:** Ready for API testing`
        }
      ]
    };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text',
            text: `❌ Token validation failed:

**Error:** ${errorMessage}

**Common Issues:**
- Token expired
- Invalid token signature
- Session was manually invalidated
- User account was deleted

**Solution:** Generate a new token using 'generate_test_token'`
          }
        ]
      };
    }
  }

  /**
   * Clean up all test users and sessions
   */
  async cleanupTestUsers() {
    const userCount = this.testUsers.size;
    const sessionCount = this.testSessions.size;

    this.testUsers.clear();
    this.testSessions.clear();

    // Reinitialize default users
    this.initializeDefaultTestUsers();

    return {
      content: [
        {
          type: 'text',
          text: `🧹 Test user cleanup completed:

**Removed:**
- ${userCount} test users
- ${sessionCount} active sessions

**Reinitialized:**
- 5 default test users (admin, staff, viewer, provider, nurse)

**Available Test Users:**
${Array.from(this.testUsers.values()).map(user => 
  `- ${user.email} (${user.role})`
).join('\n')}

**Next Steps:**
1. Use 'generate_test_token' to create new authentication tokens
2. Run 'test_app_authentication' to verify authentication flows`
        }
      ]
    };
  }

  /**
   * Get all test users for debugging
   */
  getTestUsers(): TestUser[] {
    return Array.from(this.testUsers.values());
  }

  /**
   * Get all active sessions for debugging
   */
  getActiveSessions(): TestSession[] {
    return Array.from(this.testSessions.values()).filter(s => s.isActive);
  }

  private parseExpiration(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error('Invalid expiration format. Use format like "1h", "30m", "24h"');
    }

    const [, amount, unit] = match;
    const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
    return parseInt(amount) * multipliers[unit as keyof typeof multipliers];
  }

  private getTimeRemaining(expiresAt: string): string {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  }
}