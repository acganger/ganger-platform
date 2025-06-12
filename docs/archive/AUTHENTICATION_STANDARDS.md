# AUTHENTICATION STANDARDS
*Ganger Platform Authentication Integration Standards*
*Post-Beast Mode Excellence: Established Authentication Patterns*

## 📋 **Authentication Overview**

The Ganger Platform uses a standardized authentication system through @ganger/auth that provides secure, role-based access control across all applications with Google OAuth integration and HIPAA compliance.

### **🔐 Standard Authentication Pattern**

```typescript
// Required authentication setup in every application
import { AuthProvider, useAuth, withAuth } from '@ganger/auth';

// App root component
export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

// Protected route implementation
export default withAuth(ProtectedPage, { 
  requiredRoles: ['manager', 'superadmin'] 
});

// Hook usage in components
const { user, signIn, signOut, isLoading } = useAuth();
```

## 🏗️ **@ganger/auth Package Structure**

### **Core Components**
```typescript
// AuthProvider - Main authentication context provider
export const AuthProvider: React.FC<{ children: React.ReactNode }>;

// useAuth - Primary authentication hook
export const useAuth: () => AuthContextValue;

// withAuth - Higher-order component for route protection
export const withAuth: <P extends object>(
  Component: React.ComponentType<P>,
  options?: AuthOptions
) => React.ComponentType<P>;

// Role-based access control
export const requireRole: (roles: UserRole[]) => MethodDecorator;
```

### **Authentication Context**
```typescript
interface AuthContextValue {
  // User state
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Authentication methods
  signIn: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  
  // Permission checks
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
  canAccessLocation: (locationId: string) => boolean;
  
  // Session management
  refreshSession: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}
```

## 👥 **Established Role Hierarchy**

### **User Roles and Permissions**
```typescript
type UserRole = 
  | 'superadmin'
  | 'manager' 
  | 'provider'
  | 'nurse'
  | 'medical_assistant'
  | 'pharmacy_tech'
  | 'billing'
  | 'user';

// Role hierarchy and permissions
const ROLE_PERMISSIONS = {
  superadmin: {
    description: 'Full system access and administration',
    permissions: ['*'], // All permissions
    locations: ['*'],   // All locations
    inherits: []
  },
  
  manager: {
    description: 'Location management and staff oversight',
    permissions: [
      'manage_staff',
      'approve_appointments', 
      'view_reports',
      'manage_inventory',
      'configure_settings',
      'access_analytics'
    ],
    locations: ['assigned'], // Based on user.locations
    inherits: ['provider']
  },
  
  provider: {
    description: 'Clinical operations and patient care',
    permissions: [
      'access_patient_records',
      'create_handouts',
      'manage_appointments',
      'view_schedules',
      'medication_authorization',
      'clinical_documentation'
    ],
    locations: ['assigned'],
    inherits: ['nurse']
  },
  
  nurse: {
    description: 'Clinical support and patient assistance',
    permissions: [
      'access_patient_records',
      'assist_appointments',
      'view_schedules',
      'medication_tracking',
      'patient_communication'
    ],
    locations: ['assigned'],
    inherits: ['medical_assistant']
  },
  
  medical_assistant: {
    description: 'Administrative support and clinical assistance',
    permissions: [
      'checkin_patients',
      'schedule_appointments',
      'generate_handouts',
      'basic_patient_info',
      'inventory_updates'
    ],
    locations: ['assigned'],
    inherits: ['user']
  },
  
  pharmacy_tech: {
    description: 'Medication management and pharmaceutical scheduling',
    permissions: [
      'manage_medication_auth',
      'pharma_scheduling',
      'medication_tracking',
      'inventory_medication',
      'pharmaceutical_reports'
    ],
    locations: ['assigned'],
    inherits: ['user']
  },
  
  billing: {
    description: 'Financial operations and insurance processing',
    permissions: [
      'process_payments',
      'manage_billing',
      'insurance_verification',
      'financial_reports',
      'payment_reconciliation'
    ],
    locations: ['assigned'],
    inherits: ['user']
  },
  
  user: {
    description: 'Basic access with limited functionality',
    permissions: [
      'view_own_profile',
      'basic_navigation',
      'read_announcements'
    ],
    locations: ['assigned'],
    inherits: []
  }
};
```

### **Permission Checking Implementation**
```typescript
// Permission validation service
export class PermissionService {
  static hasPermission(user: User, permission: string): boolean {
    if (!user?.role) return false;
    
    const rolePermissions = ROLE_PERMISSIONS[user.role];
    
    // Superadmin has all permissions
    if (rolePermissions.permissions.includes('*')) return true;
    
    // Check direct permissions
    if (rolePermissions.permissions.includes(permission)) return true;
    
    // Check inherited permissions
    return this.checkInheritedPermissions(user.role, permission);
  }
  
  static canAccessLocation(user: User, locationId: string): boolean {
    if (!user?.role) return false;
    
    const rolePermissions = ROLE_PERMISSIONS[user.role];
    
    // Superadmin can access all locations
    if (rolePermissions.locations.includes('*')) return true;
    
    // Check if user is assigned to this location
    return user.locations?.includes(locationId) || false;
  }
  
  private static checkInheritedPermissions(role: UserRole, permission: string): boolean {
    const roleConfig = ROLE_PERMISSIONS[role];
    
    for (const inheritedRole of roleConfig.inherits) {
      const inheritedPermissions = ROLE_PERMISSIONS[inheritedRole];
      if (inheritedPermissions.permissions.includes(permission)) {
        return true;
      }
      
      // Recursively check inherited roles
      if (this.checkInheritedPermissions(inheritedRole, permission)) {
        return true;
      }
    }
    
    return false;
  }
}
```

## 🔒 **Authentication Implementation**

### **AuthProvider Implementation**
```typescript
// @ganger/auth/src/AuthProvider.tsx
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  
  // Initialize authentication on mount
  useEffect(() => {
    initializeAuth();
  }, []);
  
  const initializeAuth = async () => {
    setIsLoading(true);
    
    try {
      // Get current session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth initialization error:', error);
        return;
      }
      
      if (session) {
        await handleSessionChange(session);
      }
      
      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        await handleAuthStateChange(event, session);
      });
      
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSessionChange = async (session: Session | null) => {
    setSession(session);
    
    if (session?.user) {
      // Fetch user profile with role and permissions
      const userProfile = await fetchUserProfile(session.user.id);
      setUser(userProfile);
      
      // Log authentication event for HIPAA compliance
      await logAuthEvent({
        type: 'user_login',
        userId: session.user.id,
        email: session.user.email,
        timestamp: new Date().toISOString(),
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent
      });
    } else {
      setUser(null);
    }
  };
  
  const signInWithGoogle = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            hd: 'gangerdermatology.com' // Domain restriction
          },
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Log sign-out event
      if (user) {
        await logAuthEvent({
          type: 'user_logout',
          userId: user.id,
          email: user.email,
          timestamp: new Date().toISOString()
        });
      }
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
      setSession(null);
      
      // Clear any cached data
      localStorage.removeItem('user_preferences');
      
      // Redirect to login
      window.location.href = '/auth/login';
      
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const hasRole = (role: UserRole): boolean => {
    if (!user?.role) return false;
    
    // Check direct role match
    if (user.role === role) return true;
    
    // Check role hierarchy
    const userRoleConfig = ROLE_PERMISSIONS[user.role];
    return checkRoleInheritance(user.role, role);
  };
  
  const hasPermission = (permission: string): boolean => {
    return PermissionService.hasPermission(user, permission);
  };
  
  const canAccessLocation = (locationId: string): boolean => {
    return PermissionService.canAccessLocation(user, locationId);
  };
  
  const contextValue: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signInWithGoogle,
    signOut,
    hasRole,
    hasPermission,
    canAccessLocation,
    refreshSession: () => supabase.auth.refreshSession(),
    getAccessToken: async () => {
      const session = await supabase.auth.getSession();
      return session.data.session?.access_token || null;
    }
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
```

### **Route Protection with withAuth HOC**
```typescript
// @ganger/auth/src/withAuth.tsx
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options: AuthOptions = {}
) => {
  const AuthenticatedComponent: React.FC<P> = (props) => {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    
    // Show loading state
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="large" message="Authenticating..." />
        </div>
      );
    }
    
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push('/auth/login');
      return null;
    }
    
    // Check role requirements
    if (options.requiredRoles && !options.requiredRoles.some(role => user?.role === role)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-gray-500">
              Required roles: {options.requiredRoles.join(', ')}
            </p>
          </div>
        </div>
      );
    }
    
    // Check location access if specified
    if (options.requiredLocation && !PermissionService.canAccessLocation(user!, options.requiredLocation)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Location Access Denied</h1>
            <p className="text-gray-600">
              You don't have access to this location.
            </p>
          </div>
        </div>
      );
    }
    
    // Log page access for audit trail
    useEffect(() => {
      if (user && options.logAccess !== false) {
        logPageAccess({
          userId: user.id,
          page: router.pathname,
          timestamp: new Date().toISOString(),
          requiredRoles: options.requiredRoles
        });
      }
    }, [user, router.pathname]);
    
    return <Component {...props} />;
  };
  
  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return AuthenticatedComponent;
};
```

## 📱 **Application Integration Patterns**

### **Standard App Setup**
```typescript
// pages/_app.tsx - Required in every application
import { AuthProvider } from '@ganger/auth';
import { AppLayout } from '@ganger/ui';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <AppLayout>
        <Component {...pageProps} />
      </AppLayout>
    </AuthProvider>
  );
}
```

### **Protected Page Implementation**
```typescript
// pages/dashboard.tsx - Standard protected page pattern
import { withAuth } from '@ganger/auth';
import { PageHeader, Card } from '@ganger/ui';

function DashboardPage() {
  const { user, hasPermission } = useAuth();
  
  return (
    <div>
      <PageHeader 
        title={`Welcome, ${user?.name}`}
        subtitle="Dashboard Overview"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {hasPermission('view_reports') && (
          <Card>
            <h3>Reports</h3>
            <p>View system reports and analytics</p>
          </Card>
        )}
        
        {hasPermission('manage_staff') && (
          <Card>
            <h3>Staff Management</h3>
            <p>Manage staff accounts and permissions</p>
          </Card>
        )}
      </div>
    </div>
  );
}

// Export with authentication protection
export default withAuth(DashboardPage, {
  requiredRoles: ['manager', 'provider', 'superadmin']
});
```

### **API Route Protection**
```typescript
// pages/api/patients/[id].ts - Protected API endpoint
import { requireRole } from '@ganger/auth';
import { createAPIResponse } from '@ganger/utils';

class PatientController {
  @requireRole(['provider', 'nurse', 'manager', 'superadmin'])
  async getPatient(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const user = req.user; // Populated by requireRole decorator
      
      // Check location access
      const patient = await db.patients.findById(id);
      if (!PermissionService.canAccessLocation(user, patient.locationId)) {
        return res.status(403).json(
          createAPIResponse({
            success: false,
            error: 'Insufficient location access',
            statusCode: 403
          })
        );
      }
      
      // Log PHI access for HIPAA compliance
      await logPHIAccess({
        userId: user.id,
        patientId: id,
        action: 'view_patient_record',
        businessJustification: 'Clinical care',
        timestamp: new Date().toISOString()
      });
      
      return res.json(
        createAPIResponse({
          success: true,
          data: patient
        })
      );
      
    } catch (error) {
      return res.status(500).json(
        createAPIResponse({
          success: false,
          error: error.message,
          statusCode: 500
        })
      );
    }
  }
}
```

## 🔐 **HIPAA Compliance Features**

### **Audit Logging Implementation**
```typescript
// Authentication audit logging
export class AuthAuditLogger {
  async logAuthEvent(event: AuthEvent): Promise<void> {
    const auditEntry = {
      id: generateId(),
      event_type: event.type,
      user_id: event.userId,
      user_email: event.email,
      timestamp: event.timestamp,
      ip_address: event.ipAddress,
      user_agent: event.userAgent,
      success: event.success || true,
      failure_reason: event.failureReason,
      session_id: event.sessionId,
      location_id: event.locationId,
      additional_data: event.additionalData
    };
    
    // Store in secure audit log table
    await db.authAuditLogs.create(auditEntry);
    
    // Real-time monitoring for suspicious activity
    if (event.type === 'failed_login' || event.type === 'unauthorized_access') {
      await this.triggerSecurityAlert(auditEntry);
    }
  }
  
  async logPHIAccess(access: PHIAccessEvent): Promise<void> {
    const auditEntry = {
      id: generateId(),
      user_id: access.userId,
      patient_id: access.patientId,
      action: access.action,
      business_justification: access.businessJustification,
      data_accessed: access.dataAccessed,
      timestamp: access.timestamp,
      ip_address: access.ipAddress,
      user_agent: access.userAgent,
      location_id: access.locationId,
      minimum_necessary: access.minimumNecessary || true,
      patient_consent: access.patientConsent
    };
    
    // Store in HIPAA-compliant PHI access log
    await db.phiAccessLogs.create(auditEntry);
    
    // Alert on unusual access patterns
    await this.analyzeAccessPattern(auditEntry);
  }
  
  private async triggerSecurityAlert(event: AuditEntry): Promise<void> {
    // Implementation for security alerting
    await notifications.sendSecurityAlert({
      type: 'authentication_security',
      severity: 'high',
      details: event,
      timestamp: new Date().toISOString()
    });
  }
}
```

### **Session Management**
```typescript
// Secure session management
export class SessionManager {
  private static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly REFRESH_THRESHOLD = 60 * 60 * 1000; // 1 hour
  
  static async validateSession(sessionToken: string): Promise<SessionValidation> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(sessionToken);
      
      if (error || !user) {
        return {
          isValid: false,
          reason: 'Invalid or expired session'
        };
      }
      
      // Check if session needs refresh
      const session = await supabase.auth.getSession();
      const expiresAt = new Date(session.data.session?.expires_at || 0);
      const timeUntilExpiry = expiresAt.getTime() - Date.now();
      
      return {
        isValid: true,
        user,
        needsRefresh: timeUntilExpiry < this.REFRESH_THRESHOLD,
        expiresAt
      };
      
    } catch (error) {
      return {
        isValid: false,
        reason: error.message
      };
    }
  }
  
  static async refreshSession(): Promise<RefreshResult> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw error;
      }
      
      return {
        success: true,
        session: data.session,
        user: data.user
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  static async revokeSession(sessionId: string): Promise<void> {
    // Revoke session and log for audit
    await supabase.auth.signOut();
    
    await logAuthEvent({
      type: 'session_revoked',
      sessionId,
      timestamp: new Date().toISOString(),
      reason: 'Manual revocation'
    });
  }
}
```

## 🧪 **Testing Authentication**

### **Authentication Testing Utilities**
```typescript
// test/auth-utils.ts
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-id',
  email: 'test@gangerdermatology.com',
  name: 'Test User',
  role: 'provider',
  locations: ['ann-arbor'],
  createdAt: new Date().toISOString(),
  ...overrides
});

export const createMockAuthContext = (user: User | null = null): AuthContextValue => ({
  user,
  isLoading: false,
  isAuthenticated: !!user,
  signInWithGoogle: jest.fn(),
  signOut: jest.fn(),
  hasRole: jest.fn((role) => user?.role === role),
  hasPermission: jest.fn((permission) => 
    user ? PermissionService.hasPermission(user, permission) : false
  ),
  canAccessLocation: jest.fn((locationId) => 
    user ? PermissionService.canAccessLocation(user, locationId) : false
  ),
  refreshSession: jest.fn(),
  getAccessToken: jest.fn().mockResolvedValue('mock-token')
});

// Mock AuthProvider for testing
export const MockAuthProvider: React.FC<{ 
  children: React.ReactNode;
  mockUser?: User | null;
}> = ({ children, mockUser = null }) => {
  const mockContext = createMockAuthContext(mockUser);
  
  return (
    <AuthContext.Provider value={mockContext}>
      {children}
    </AuthContext.Provider>
  );
};
```

### **Authentication Component Tests**
```typescript
// __tests__/auth/withAuth.test.tsx
import { render, screen } from '@testing-library/react';
import { withAuth } from '@ganger/auth';
import { MockAuthProvider, createMockUser } from '../test-utils';

const TestComponent = () => <div>Protected Content</div>;
const ProtectedComponent = withAuth(TestComponent, { 
  requiredRoles: ['manager', 'superadmin'] 
});

describe('withAuth HOC', () => {
  it('should render component for authorized user', () => {
    const mockUser = createMockUser({ role: 'manager' });
    
    render(
      <MockAuthProvider mockUser={mockUser}>
        <ProtectedComponent />
      </MockAuthProvider>
    );
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
  
  it('should show access denied for unauthorized user', () => {
    const mockUser = createMockUser({ role: 'user' });
    
    render(
      <MockAuthProvider mockUser={mockUser}>
        <ProtectedComponent />
      </MockAuthProvider>
    );
    
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText('Required roles: manager, superadmin')).toBeInTheDocument();
  });
  
  it('should show loading state when authenticating', () => {
    const mockContext = {
      ...createMockAuthContext(),
      isLoading: true,
      isAuthenticated: false
    };
    
    render(
      <AuthContext.Provider value={mockContext}>
        <ProtectedComponent />
      </AuthContext.Provider>
    );
    
    expect(screen.getByText('Authenticating...')).toBeInTheDocument();
  });
});

// Permission service tests
describe('PermissionService', () => {
  it('should grant permission for authorized role', () => {
    const user = createMockUser({ role: 'provider' });
    
    expect(PermissionService.hasPermission(user, 'access_patient_records')).toBe(true);
    expect(PermissionService.hasPermission(user, 'manage_staff')).toBe(false);
  });
  
  it('should respect role inheritance', () => {
    const user = createMockUser({ role: 'manager' });
    
    // Manager inherits provider permissions
    expect(PermissionService.hasPermission(user, 'access_patient_records')).toBe(true);
    expect(PermissionService.hasPermission(user, 'manage_staff')).toBe(true);
  });
  
  it('should check location access', () => {
    const user = createMockUser({ 
      role: 'provider', 
      locations: ['ann-arbor', 'plymouth'] 
    });
    
    expect(PermissionService.canAccessLocation(user, 'ann-arbor')).toBe(true);
    expect(PermissionService.canAccessLocation(user, 'wixom')).toBe(false);
  });
  
  it('should grant superadmin all permissions and locations', () => {
    const user = createMockUser({ role: 'superadmin' });
    
    expect(PermissionService.hasPermission(user, 'any_permission')).toBe(true);
    expect(PermissionService.canAccessLocation(user, 'any_location')).toBe(true);
  });
});
```

## 📋 **Authentication Checklist**

### **New Application Setup**
- [ ] Install @ganger/auth package
- [ ] Wrap app with AuthProvider in _app.tsx
- [ ] Configure Google OAuth domain restriction
- [ ] Set up protected routes with withAuth HOC
- [ ] Implement role-based UI rendering
- [ ] Add audit logging for sensitive operations
- [ ] Test authentication flows
- [ ] Verify HIPAA compliance logging

### **Page Protection Setup**
```typescript
// Standard page protection pattern
export default withAuth(YourPage, {
  requiredRoles: ['provider', 'manager', 'superadmin'],
  requiredLocation: 'optional-location-id',
  logAccess: true // Enable audit logging (default: true)
});
```

### **API Endpoint Protection**
```typescript
// Standard API protection pattern
import { requireRole } from '@ganger/auth';

class YourController {
  @requireRole(['provider', 'manager', 'superadmin'])
  async yourMethod(req: AuthenticatedRequest, res: Response) {
    const user = req.user; // Available after authentication
    // Your implementation
  }
}
```

## 🔧 **Configuration Standards**

### **🔐 Secret Management (UPDATED)**
**The platform now uses enterprise-grade secret management. See [Secret Management PRD](../PRDs/06_SECRET_MANAGEMENT_SYSTEM.md) for complete details.**

**Environment Variables (Development Only)**
```bash
# Standard auth environment variables (Development Only)
# Production uses Google Secret Manager - see Secret Management PRD
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Google OAuth configuration (Development Only)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Auth-specific settings (Development Only)
AUTH_DOMAIN_RESTRICTION=gangerdermatology.com
AUTH_SESSION_TIMEOUT=86400000
AUTH_REFRESH_THRESHOLD=3600000

# Production Secret Management:
# - Google Secret Manager for production secrets
# - GitHub Secrets for CI/CD redundancy
# - @ganger/config package for secure retrieval
# - Automated secret rotation and audit logging
```

**Production Secret Access Pattern:**
```typescript
// Production authentication configuration
import { SecretManager } from '@ganger/config';

// Secure secret retrieval in production
const authConfig = await SecretManager.getBatchSecrets([
  'supabase-url-production',
  'supabase-anon-key-production', 
  'supabase-service-role-key-production',
  'google-oauth-client-id-production',
  'google-oauth-client-secret-production'
]);

// Development fallback
const fallbackConfig = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  // ... other development secrets
};
```

### **Database Setup**
```sql
-- Required user profile extensions
ALTER TABLE users ADD COLUMN IF NOT EXISTS role user_role_enum DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS locations TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Audit logging tables
CREATE TABLE auth_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  user_email TEXT,
  success BOOLEAN DEFAULT true,
  failure_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  location_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  additional_data JSONB
);

CREATE TABLE phi_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  patient_id UUID NOT NULL,
  action TEXT NOT NULL,
  business_justification TEXT NOT NULL,
  data_accessed TEXT[],
  minimum_necessary BOOLEAN DEFAULT true,
  patient_consent BOOLEAN,
  ip_address INET,
  user_agent TEXT,
  location_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

## 🚨 **Security Best Practices**

### **Authentication Security**
```typescript
// Secure authentication patterns
export const authSecurityPractices = {
  // 1. Domain restriction for Google OAuth
  googleOAuthConfig: {
    hd: 'gangerdermatology.com', // Required
    prompt: 'consent',
    access_type: 'offline'
  },
  
  // 2. Session timeout management
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  refreshThreshold: 60 * 60 * 1000,     // 1 hour
  
  // 3. Audit everything
  auditEvents: [
    'user_login',
    'user_logout', 
    'failed_login',
    'unauthorized_access',
    'permission_escalation',
    'phi_access',
    'sensitive_operation'
  ],
  
  // 4. IP and location tracking
  enableLocationTracking: true,
  enableIPTracking: true,
  
  // 5. Rate limiting on auth endpoints
  authRateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    skipSuccessfulRequests: false
  }
};
```

### **HIPAA Compliance Requirements**
```typescript
// HIPAA compliance checklist
export const hipaaComplianceChecklist = {
  // Access controls
  accessControls: {
    uniqueUserIdentification: true,    // ✅ User IDs and email
    automaticLogoff: true,            // ✅ Session timeout
    encryptionDecryption: true        // ✅ Data encryption
  },
  
  // Audit controls
  auditControls: {
    auditLogs: true,                  // ✅ Comprehensive logging
    auditReview: true,                // ✅ Regular audit review
    auditReporting: true,             // ✅ Audit reports
    auditAlerts: true                 // ✅ Real-time alerts
  },
  
  // Integrity controls
  integrityControls: {
    phiAlteration: true,              // ✅ PHI change tracking
    electronicSignature: true,       // ✅ User authentication
    auditTrail: true                  // ✅ Complete audit trail
  },
  
  // Person or entity authentication
  personEntityAuth: {
    userAuthentication: true,         // ✅ Google OAuth
    roleBasedAccess: true,           // ✅ Role hierarchy
    minimumNecessary: true           // ✅ Location-based access
  },
  
  // Transmission security
  transmissionSecurity: {
    endToEndEncryption: true,        // ✅ TLS encryption
    integrityGuards: true,           // ✅ Data validation
    networkControls: true           // ✅ Secure transmission
  }
};
```

## 📊 **Authentication Analytics**

### **Key Metrics Tracking**
```typescript
// Authentication metrics
export class AuthMetrics {
  static async trackAuthEvent(event: AuthEvent): Promise<void> {
    // Track authentication patterns
    await analytics.track('auth_event', {
      category: 'authentication',
      action: event.type,
      userId: event.userId,
      timestamp: event.timestamp,
      location: event.locationId,
      success: event.success
    });
  }
  
  static async generateAuthReport(): Promise<AuthReport> {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const metrics = await db.authAuditLogs.aggregate([
      { $match: { timestamp: { $gte: last30Days } } },
      {
        $group: {
          _id: '$event_type',
          count: { $sum: 1 },
          successRate: {
            $avg: { $cond: ['$success', 1, 0] }
          }
        }
      }
    ]);
    
    return {
      period: '30 days',
      totalAuthEvents: metrics.reduce((sum, m) => sum + m.count, 0),
      successRate: metrics.find(m => m._id === 'user_login')?.successRate || 0,
      failedAttempts: metrics.find(m => m._id === 'failed_login')?.count || 0,
      uniqueUsers: await this.getUniqueUserCount(last30Days),
      averageSessionDuration: await this.getAverageSessionDuration(last30Days),
      locationBreakdown: await this.getLocationBreakdown(last30Days)
    };
  }
}
```

---

These authentication standards ensure secure, HIPAA-compliant access control across all Ganger Platform applications with comprehensive audit trails and role-based permissions.
