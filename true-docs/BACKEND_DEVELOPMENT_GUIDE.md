# Ganger Platform - Backend Development Guide

*Complete backend development reference for APIs, database, authentication, and server-side integrations.*

## Table of Contents

### **Core Backend Development**
- [Authentication and Security](#authentication-and-security)
- [API Standards and Integration](#api-standards-and-integration)
- [Database and Data Management](#database-and-data-management)
- [MCP Integration Architecture](#mcp-integration-architecture)

### **Development Workflow**
- [Backend Platform Overview](#backend-platform-overview)
- [Development Environment Setup](#development-environment-setup)
- [Backend Quality Gates](#backend-quality-gates)
- [Testing and Deployment](#testing-and-deployment)

### **Companion Documents**
- 📱 **[Frontend Development Guide](./FRONTEND_DEVELOPMENT_GUIDE.md)** - Complete frontend development reference
- 🏗️ **[Shared Infrastructure Guide](./SHARED_INFRASTRUCTURE_GUIDE.md)** - Platform-wide standards and setup

---

*This backend guide provides complete guidance for developing APIs, database operations, and server-side functionality on the Ganger Platform. Backend developers should reference this alongside the Shared Infrastructure Guide for platform setup and quality enforcement.*

---

# Authentication and Security

## Authentication Standards

The Ganger Platform uses a standardized authentication system through @ganger/auth that provides secure, role-based access control across all applications with Google OAuth integration and HIPAA compliance.

### Standard Authentication Implementation

**Required setup in every application:**
```typescript
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

### Role Hierarchy and Permissions

**User Roles:**
```typescript
type UserRole = 
  | 'superadmin'     // Full system access
  | 'manager'        // Location management and staff oversight
  | 'provider'       // Clinical operations and patient care
  | 'nurse'          // Clinical support and patient assistance
  | 'medical_assistant' // Administrative and clinical assistance
  | 'pharmacy_tech'  // Medication management
  | 'billing'        // Financial operations
  | 'user';          // Basic access
```

**Permission Checking:**
```typescript
// Permission validation service
import { PermissionService } from '@ganger/auth/server';

// Check user permissions in API routes
const hasPermission = PermissionService.hasPermission(user, 'access_patient_records');
const canAccessLocation = PermissionService.canAccessLocation(user, locationId);

// Server-side permission middleware
export const withPermissions = (requiredPermissions: string[]) => {
  return async (request: Request, context: any) => {
    const user = await getUserFromRequest(request);
    
    for (const permission of requiredPermissions) {
      if (!PermissionService.hasPermission(user, permission)) {
        return new Response('Forbidden', { status: 403 });
      }
    }
    
    return context.next();
  };
};
```

### Server-Side Authentication Context

```typescript
// Server-side authentication utilities
import { withAuth, verifyPermissions, getUserFromToken } from '@ganger/auth/server';

// API route protection
export async function GET(request: Request) {
  const user = await getUserFromToken(request);
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  if (!verifyPermissions(user, ['read_appointments'])) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // Process request...
}

// Middleware-based protection
export const protectedHandler = withAuth(
  async (request: Request, user: User) => {
    // Handler with authenticated user
    const data = await processRequest(request, user);
    return Response.json(data);
  },
  { requiredRoles: ['manager', 'provider'] }
);
```

### HIPAA Compliance and Audit Logging

**Audit Logging Requirements:**
```typescript
import { auditLog } from '@ganger/utils/server';

export async function POST(request: Request) {
  const user = await getUserFromToken(request);
  const data = await request.json();
  
  // Log all patient data access
  await auditLog({
    action: 'patient_record_access',
    userId: user.id,
    userEmail: user.email,
    resourceType: 'patient_record',
    resourceId: data.patientId,
    ipAddress: request.headers.get('x-forwarded-for'),
    userAgent: request.headers.get('user-agent'),
    timestamp: new Date().toISOString(),
    compliance: 'hipaa'
  });
  
  // Process request...
}
```

### Page Protection Setup

**New Application Authentication Checklist:**
- [ ] Install @ganger/auth package
- [ ] Configure server-side authentication middleware
- [ ] Set up Google OAuth domain restriction
- [ ] Implement API route protection with withAuth
- [ ] Add role-based access control for endpoints
- [ ] Implement audit logging for sensitive operations
- [ ] Test authentication flows with all user roles
- [ ] Verify HIPAA compliance logging

---

# API Standards and Integration

## MCP (Model Context Protocol) Integration Architecture

The Ganger Platform uses a Universal Hub Architecture for integrating with external services through MCP servers, providing consistent interfaces across all applications.

### Universal Hub Architecture

**Hub Integration Pattern:**
```typescript
// Base Universal Hub class
export abstract class UniversalHub {
  protected serverName: string;
  protected version: string;
  protected capabilities: string[];
  protected healthStatus: 'healthy' | 'degraded' | 'unhealthy';
  
  constructor(config: HubConfig) {
    this.serverName = config.serverName;
    this.version = config.version;
    this.capabilities = config.capabilities;
  }
  
  abstract async initialize(): Promise<void>;
  abstract async healthCheck(): Promise<HealthStatus>;
  abstract async shutdown(): Promise<void>;
}

// Universal Database Hub implementation
export class UniversalDatabaseHub extends UniversalHub {
  private supabaseClient: SupabaseClient;
  
  constructor() {
    super({
      serverName: 'supabase-mcp',
      version: '1.0.0',
      capabilities: ['query', 'mutation', 'subscription', 'storage']
    });
  }
  
  async query(sql: string, params?: any[]): Promise<QueryResult> {
    const startTime = performance.now();
    
    try {
      const result = await this.supabaseClient.rpc('execute_sql', {
        query: sql,
        parameters: params
      });
      
      await this.logOperation('query', sql, performance.now() - startTime);
      return result;
    } catch (error) {
      await this.logError('query', error, sql);
      throw error;
    }
  }
}
```

### API Response Standards

**Standard Response Format:**
```typescript
interface StandardApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    pagination?: PaginationMeta;
    performance?: PerformanceMeta;
  };
}

// Response utility functions
export function successResponse<T>(
  data: T, 
  meta?: Partial<StandardApiResponse['meta']>
): StandardApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
      ...meta
    }
  };
}

export function errorResponse(
  code: string,
  message: string,
  details?: any
): StandardApiResponse {
  return {
    success: false,
    error: { code, message, details },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId()
    }
  };
}
```

### Universal Communication Hub

**Server-Side Communication Integration:**
```typescript
import { ServerCommunicationService } from '@ganger/integrations/server';

export class UniversalCommunicationHub extends UniversalHub {
  private twilioService: TwilioService;
  private emailService: EmailService;
  
  async sendSMS(params: SMSParams): Promise<SMSResult> {
    const { to, message, priority = 'normal' } = params;
    
    // HIPAA compliance validation
    await this.validateHIPAACompliance(params);
    
    try {
      const result = await this.twilioService.sendSMS({
        to: this.formatPhoneNumber(to),
        body: message,
        from: this.getFromNumber(priority)
      });
      
      // Audit logging for communication
      await auditLog({
        action: 'sms_sent',
        resourceType: 'communication',
        resourceId: result.sid,
        metadata: {
          to: this.maskPhoneNumber(to),
          messageLength: message.length,
          priority
        }
      });
      
      return {
        success: true,
        messageId: result.sid,
        status: result.status
      };
    } catch (error) {
      await this.logError('sms_send_failed', error, params);
      throw error;
    }
  }
  
  async sendEmail(params: EmailParams): Promise<EmailResult> {
    // Similar implementation for email
  }
}
```

### Universal Payment Hub

**Server-Side Payment Processing:**
```typescript
import { ServerPaymentService } from '@ganger/integrations/server';

export class UniversalPaymentHub extends UniversalHub {
  private stripeService: StripeService;
  
  async createPaymentIntent(params: PaymentIntentParams): Promise<PaymentIntentResult> {
    const { amount, currency, customerId, metadata } = params;
    
    try {
      const paymentIntent = await this.stripeService.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customer: customerId,
        metadata: {
          ...metadata,
          platform: 'ganger-platform',
          timestamp: new Date().toISOString()
        }
      });
      
      // Audit logging for financial transactions
      await auditLog({
        action: 'payment_intent_created',
        resourceType: 'payment',
        resourceId: paymentIntent.id,
        metadata: {
          amount,
          currency,
          customerId: this.maskCustomerId(customerId)
        }
      });
      
      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret
      };
    } catch (error) {
      await this.logError('payment_intent_failed', error, params);
      throw error;
    }
  }
}
```

### API Endpoint Patterns

**Standard CRUD Endpoints:**
```typescript
// GET /api/[resource] - List with pagination
export async function GET(request: Request) {
  const user = await getUserFromToken(request);
  const url = new URL(request.url);
  
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '25');
  const search = url.searchParams.get('search');
  
  try {
    const result = await db.appointments.findMany({
      where: {
        userId: user.id,
        ...(search && {
          OR: [
            { patientName: { contains: search, mode: 'insensitive' } },
            { notes: { contains: search, mode: 'insensitive' } }
          ]
        })
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
    
    const total = await db.appointments.count({
      where: { userId: user.id }
    });
    
    return Response.json(successResponse(result, {
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }));
  } catch (error) {
    return Response.json(
      errorResponse('QUERY_FAILED', 'Failed to fetch appointments', error),
      { status: 500 }
    );
  }
}

// POST /api/[resource] - Create new
export async function POST(request: Request) {
  const user = await getUserFromToken(request);
  const data = await request.json();
  
  // Validation
  const validation = await validateAppointmentData(data);
  if (!validation.isValid) {
    return Response.json(
      errorResponse('VALIDATION_ERROR', 'Invalid data', validation.errors),
      { status: 400 }
    );
  }
  
  try {
    const appointment = await db.appointments.create({
      data: {
        ...data,
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    // Send confirmation via Universal Communication Hub
    await universalCommunicationHub.sendSMS({
      to: data.patientPhone,
      message: `Appointment confirmed for ${formatDate(data.appointmentDate)}`
    });
    
    return Response.json(successResponse(appointment), { status: 201 });
  } catch (error) {
    return Response.json(
      errorResponse('CREATION_FAILED', 'Failed to create appointment', error),
      { status: 500 }
    );
  }
}
```

### Error Handling and Monitoring

**Centralized Error Handling:**
```typescript
export class APIErrorHandler {
  static async handleError(error: Error, context: ErrorContext): Promise<Response> {
    const errorId = generateErrorId();
    
    // Log error with context
    await errorLogger.log({
      errorId,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      severity: this.determineSeverity(error)
    });
    
    // Notify monitoring systems for critical errors
    if (this.isCritical(error)) {
      await alertingService.sendAlert({
        type: 'critical_api_error',
        errorId,
        message: error.message,
        context
      });
    }
    
    // Return appropriate error response
    const response = this.formatErrorResponse(error, errorId);
    return Response.json(response, { status: this.getStatusCode(error) });
  }
  
  private static determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    if (error.name === 'ValidationError') return 'low';
    if (error.name === 'DatabaseError') return 'high';
    if (error.name === 'AuthenticationError') return 'medium';
    if (error.name === 'PaymentError') return 'critical';
    return 'medium';
  }
}
```

---

# Database and Data Management

## Database Architecture

### Supabase Integration

**Database Connection Setup:**
```typescript
import { createClient } from '@supabase/supabase-js';
import { db } from '@ganger/db';

// Server-side Supabase client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Database operations through @ganger/db
export class DatabaseService {
  static async query<T>(sql: string, params?: any[]): Promise<T[]> {
    try {
      const { data, error } = await supabaseAdmin.rpc('execute_sql', {
        query: sql,
        parameters: params
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      await this.logDatabaseError(error, sql, params);
      throw error;
    }
  }
  
  static async transaction<T>(operations: DatabaseOperation[]): Promise<T> {
    const client = await supabaseAdmin.rpc('begin_transaction');
    
    try {
      const results = [];
      for (const operation of operations) {
        const result = await this.executeOperation(operation);
        results.push(result);
      }
      
      await supabaseAdmin.rpc('commit_transaction');
      return results as T;
    } catch (error) {
      await supabaseAdmin.rpc('rollback_transaction');
      throw error;
    }
  }
}
```

### Row Level Security (RLS)

**RLS Policy Implementation:**
```sql
-- Appointments table RLS policies
CREATE POLICY "Users can view own appointments" ON appointments
FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('manager', 'superadmin')
  )
);

CREATE POLICY "Users can create appointments" ON appointments
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('provider', 'nurse', 'medical_assistant', 'manager', 'superadmin')
  )
);

CREATE POLICY "Users can update own appointments" ON appointments
FOR UPDATE USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('provider', 'nurse', 'medical_assistant', 'manager', 'superadmin')
  )
);
```

### Database Migration Management

**Migration Pattern:**
```typescript
// Migration script template
export const migration_2025_01_10_create_appointments = {
  id: '2025_01_10_create_appointments',
  description: 'Create appointments table with RLS policies',
  
  up: async (db: DatabaseClient) => {
    await db.query(`
      CREATE TABLE appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        patient_name TEXT NOT NULL,
        appointment_date TIMESTAMPTZ NOT NULL,
        location_id UUID REFERENCES locations(id) NOT NULL,
        notes TEXT,
        status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    // Enable RLS
    await db.query('ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;');
    
    // Create policies
    await db.query(`
      CREATE POLICY "appointments_select" ON appointments
      FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('manager', 'superadmin'))
      );
    `);
    
    // Create indexes
    await db.query('CREATE INDEX idx_appointments_user_id ON appointments(user_id);');
    await db.query('CREATE INDEX idx_appointments_date ON appointments(appointment_date);');
  },
  
  down: async (db: DatabaseClient) => {
    await db.query('DROP TABLE IF EXISTS appointments CASCADE;');
  }
};
```

### Data Validation and Sanitization

**Server-Side Validation:**
```typescript
import { z } from 'zod';

// Appointment validation schema
export const AppointmentSchema = z.object({
  patientName: z.string()
    .min(2, 'Patient name must be at least 2 characters')
    .max(100, 'Patient name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Patient name contains invalid characters'),
    
  appointmentDate: z.string()
    .datetime('Invalid appointment date format')
    .refine(date => new Date(date) > new Date(), 'Appointment date must be in the future'),
    
  locationId: z.string().uuid('Invalid location ID'),
  
  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
    
  patientPhone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional()
});

// Validation middleware
export async function validateAppointmentData(data: any): Promise<ValidationResult> {
  try {
    const validatedData = AppointmentSchema.parse(data);
    
    // Additional business logic validation
    const existingAppointment = await db.appointments.findFirst({
      where: {
        appointmentDate: validatedData.appointmentDate,
        locationId: validatedData.locationId
      }
    });
    
    if (existingAppointment) {
      return {
        isValid: false,
        errors: ['Appointment slot already taken']
      };
    }
    
    return {
      isValid: true,
      data: validatedData
    };
  } catch (error) {
    return {
      isValid: false,
      errors: error.errors?.map(e => e.message) || ['Validation failed']
    };
  }
}
```

### Backup and Recovery

**Automated Backup Strategy:**
```typescript
export class DatabaseBackupService {
  static async createBackup(backupType: 'full' | 'incremental'): Promise<BackupResult> {
    const backupId = generateBackupId();
    const timestamp = new Date().toISOString();
    
    try {
      if (backupType === 'full') {
        // Full database backup
        const backup = await supabaseAdmin.rpc('create_full_backup', {
          backup_id: backupId,
          timestamp
        });
        
        // Upload to secure storage
        await this.uploadBackupToStorage(backup, backupId);
      } else {
        // Incremental backup
        const lastBackup = await this.getLastBackupTimestamp();
        const incrementalData = await supabaseAdmin.rpc('create_incremental_backup', {
          since: lastBackup,
          backup_id: backupId
        });
        
        await this.uploadIncrementalBackup(incrementalData, backupId);
      }
      
      // Update backup registry
      await this.registerBackup({
        id: backupId,
        type: backupType,
        timestamp,
        status: 'completed'
      });
      
      return { success: true, backupId };
    } catch (error) {
      await this.logBackupError(error, backupType, backupId);
      throw error;
    }
  }
  
  static async restoreFromBackup(backupId: string): Promise<RestoreResult> {
    // Backup restoration logic with validation
  }
}
```

---

# Backend Platform Overview

## Technology Stack for Backend Development

### **Core Backend Technologies**
- **Runtime**: Node.js 18+ with TypeScript
- **API Framework**: Next.js 14 API Routes
- **Database**: Supabase PostgreSQL with Row Level Security
- **Authentication**: Google OAuth + Supabase Auth
- **Integration Layer**: MCP servers with Universal Hubs
- **File Storage**: Supabase Storage with CDN

### **Backend Service Architecture**
```
ganger-platform/
├── packages/
│   ├── auth/server/           # ✅ Server-side authentication
│   │   ├── middleware/        # Auth middleware and guards
│   │   ├── providers/         # OAuth and session providers
│   │   └── permissions/       # Role-based access control
│   ├── db/                    # ✅ Database operations (server-only)
│   │   ├── schema/           # Prisma schema and types
│   │   ├── migrations/       # Database migrations
│   │   └── queries/          # Reusable database operations
│   ├── integrations/server/   # ✅ Server-side integrations
│   │   ├── communication/    # Twilio SMS/voice services
│   │   ├── payments/         # Stripe payment processing
│   │   ├── pdf/              # PDF generation with Puppeteer
│   │   ├── google/           # Google APIs integration
│   │   └── cache/            # Redis caching layer
│   ├── utils/server/         # ✅ Server-safe utilities
│   │   ├── validation/       # Zod schemas and validators
│   │   ├── logging/          # Audit logging and monitoring
│   │   └── helpers/          # Server-specific helper functions
│   └── types/                # ✅ Shared TypeScript types
└── apps/*/pages/api/         # API routes per application
```

### **Development and Production URLs**
- **Development API**: http://localhost:3000/api
- **Production API**: https://api.gangerdermatology.com
- **Database**: Supabase hosted PostgreSQL
- **File Storage**: Supabase Storage with CDN

## Development Environment Setup

### **Backend-Specific Prerequisites**
- **Node.js**: 18+ (required for server-side operations)
- **Docker**: For local Supabase and Redis development
- **PostgreSQL**: For database development (via Docker)
- **Postman/Insomnia**: For API testing

### **Backend Development Commands**

```bash
# Start backend services
pnpm supabase:start    # Start local database
pnpm redis:start       # Start local Redis cache

# Database operations
pnpm db:generate       # Generate Prisma client
pnpm db:push           # Push schema changes
pnpm db:migrate        # Run database migrations
pnpm db:seed           # Seed development data
pnpm db:studio         # Open database browser

# API development
pnpm api:dev           # Start API server with hot reload
pnpm api:test          # Run API endpoint tests
pnpm api:docs          # Generate API documentation

# Integration testing
pnpm test:integrations # Test external service integrations
pnpm test:auth         # Test authentication flows
pnpm test:permissions  # Test role-based access control
```

### **Essential Backend Environment Variables**

```bash
# Database Configuration (Server-only)
DATABASE_URL="postgresql://postgres:password@localhost:54322/postgres"
DIRECT_URL="postgresql://postgres:password@localhost:54322/postgres"
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google OAuth & APIs (Server-only)
GOOGLE_CLIENT_SECRET=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
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# External Service APIs (Server-only)
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=optional_password

# Security
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_encryption_key
```

---

# Backend Quality Gates

## Backend-Specific Quality Enforcement

### **Required Backend Quality Checks**

```bash
# 1. TypeScript Compilation - Zero Errors Tolerance
pnpm type-check
# Expected output: "Found 0 errors"

# 2. Authentication Compliance - No Custom Auth
pnpm audit:auth-compliance
# Expected output: "✅ Authentication compliance verified"

# 3. Security Compliance - HIPAA and General Security
pnpm audit:security-compliance
# Expected output: "✅ Security compliance verified"

# 4. API Standards Compliance - Consistent Response Formats
pnpm audit:api-standards
# Expected output: "✅ API standards compliance verified"

# 5. Database Schema Validation - Proper RLS and Constraints
pnpm audit:database-schema
# Expected output: "✅ Database schema validation passed"

# 6. Integration Testing - External Services Working
pnpm test:integrations
# Expected output: "All integration tests passed"
```

### **Backend-Specific Prohibited Patterns**

**❌ Custom Authentication Implementation:**
```typescript
// PROHIBITED - Custom authentication logic
const authenticateUser = async (token: string) => {
  // Custom JWT verification
  const decoded = jwt.verify(token, secret);
  return decoded;
};

// ✅ REQUIRED - Use @ganger/auth/server
import { getUserFromToken, withAuth } from '@ganger/auth/server';

export const protectedHandler = withAuth(async (request, user) => {
  // Handler with authenticated user
});
```

**❌ Direct Database Client Usage:**
```typescript
// PROHIBITED - Direct Supabase client in app code
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(url, key);

// ✅ REQUIRED - Use @ganger/db
import { db } from '@ganger/db';
const appointments = await db.appointments.findMany();
```

**❌ Hardcoded Secrets and Configuration:**
```typescript
// PROHIBITED - Hardcoded secrets
const stripeKey = 'sk_test_51abcd...'; // ❌ Security violation

// ✅ REQUIRED - Environment variables
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) throw new Error('STRIPE_SECRET_KEY not configured');
```

### **Backend Performance Standards**

```typescript
// Enforced backend performance limits
const BACKEND_PERFORMANCE_STANDARDS = {
  // API response times
  apiResponseTime: {
    simple: 200,      // 200ms max for simple queries
    complex: 1000,    // 1s max for complex operations
    reports: 5000     // 5s max for report generation
  },
  
  // Database performance
  queryTime: {
    simple: 50,       // 50ms max for simple queries
    complex: 500,     // 500ms max for complex queries
    aggregation: 2000 // 2s max for aggregations
  },
  
  // Memory usage
  memoryUsage: {
    rss: 512 * 1024 * 1024,     // 512MB max RSS
    heapUsed: 256 * 1024 * 1024  // 256MB max heap
  },
  
  // Connection limits
  database: {
    maxConnections: 20,
    connectionTimeout: 10000
  }
};
```

## Testing and Deployment

### **Backend Testing Requirements**

**API Endpoint Testing Pattern:**
```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { testApiHandler } from 'next-test-api-route-handler';
import handler from '../../../pages/api/appointments';

describe('/api/appointments', () => {
  // ✅ REQUIRED - Authentication testing
  it('requires authentication', async () => {
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(401);
      }
    });
  });
  
  // ✅ REQUIRED - Role-based access testing
  it('enforces role-based access', async () => {
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: {
            authorization: 'Bearer ' + await getTestToken('user') // Basic user role
          },
          body: JSON.stringify(appointmentData)
        });
        expect(res.status).toBe(403); // Should be forbidden for basic users
      }
    });
  });
  
  // ✅ REQUIRED - Data validation testing
  it('validates request data', async () => {
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: {
            authorization: 'Bearer ' + await getTestToken('provider')
          },
          body: JSON.stringify({ invalid: 'data' })
        });
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });
  
  // ✅ REQUIRED - Success case testing
  it('creates appointment successfully', async () => {
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: {
            authorization: 'Bearer ' + await getTestToken('provider')
          },
          body: JSON.stringify(validAppointmentData)
        });
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data.id).toBeDefined();
      }
    });
  });
});
```

### **Integration Testing**

**External Service Integration Testing:**
```typescript
describe('Universal Communication Hub', () => {
  // ✅ REQUIRED - SMS integration testing
  it('sends SMS messages successfully', async () => {
    const result = await universalCommunicationHub.sendSMS({
      to: '+1234567890',
      message: 'Test appointment reminder'
    });
    
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });
  
  // ✅ REQUIRED - Error handling testing
  it('handles SMS failures gracefully', async () => {
    const result = await universalCommunicationHub.sendSMS({
      to: 'invalid-number',
      message: 'Test'
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('Universal Payment Hub', () => {
  // ✅ REQUIRED - Payment processing testing
  it('creates payment intents successfully', async () => {
    const result = await universalPaymentHub.createPaymentIntent({
      amount: 100.00,
      currency: 'usd',
      customerId: 'test-customer'
    });
    
    expect(result.success).toBe(true);
    expect(result.paymentIntentId).toBeDefined();
  });
});
```

### **Deployment and Monitoring**

**For complete deployment procedures**, see **[/true-docs/deployment/](./deployment/)** - Vercel distributed deployment strategy.

**Backend-Specific Pre-Deployment Checklist:**
```bash
# ✅ Pre-deployment validation
pnpm type-check              # TypeScript compilation
pnpm test                    # All tests pass
pnpm test:integrations       # External services working
pnpm audit:security-compliance # Security standards met
pnpm build                   # Production build succeeds

# ✅ Database migration
pnpm db:migrate:production   # Apply database changes
pnpm db:validate:production  # Verify schema integrity

# ✅ Environment validation
pnpm validate:env:production # Verify all required env vars
pnpm test:health:production  # Health check endpoints

# ✅ Performance validation
pnpm test:load              # Load testing
pnpm audit:performance      # Performance benchmarks
```

**Production Monitoring Setup:**
```typescript
// Health check endpoint
export async function GET() {
  const healthChecks = await Promise.allSettled([
    // Database connectivity
    db.query('SELECT 1'),
    
    // External service connectivity
    universalCommunicationHub.healthCheck(),
    universalPaymentHub.healthCheck(),
    
    // Redis connectivity
    cacheService.ping(),
    
    // File storage
    storageService.healthCheck()
  ]);
  
  const results = healthChecks.map((check, index) => ({
    service: ['database', 'communication', 'payment', 'cache', 'storage'][index],
    status: check.status === 'fulfilled' ? 'healthy' : 'unhealthy',
    error: check.status === 'rejected' ? check.reason.message : null
  }));
  
  const allHealthy = results.every(r => r.status === 'healthy');
  
  return Response.json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: results
  }, { status: allHealthy ? 200 : 503 });
}
```

---

*This backend development guide provides complete guidance for building APIs, database operations, and server-side functionality on the Ganger Platform. For frontend development, platform infrastructure, and deployment, see:*

- 📱 **[Frontend Development Guide](./FRONTEND_DEVELOPMENT_GUIDE.md)** - React components, UI patterns, client-side development
- 🏗️ **[Shared Infrastructure Guide](./SHARED_INFRASTRUCTURE_GUIDE.md)** - Platform setup, quality gates, standards
- 🚀 **[Deployment Documentation](./deployment/)** - Complete Vercel deployment strategy and automation

---