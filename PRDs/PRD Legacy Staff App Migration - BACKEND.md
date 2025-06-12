# PRD: Legacy Staff Application Migration to Ganger Platform - BACKEND TEAM

## 📋 **Executive Summary**

**Project**: Backend Infrastructure for Legacy PHP Staff Portal Migration  
**Target Application**: `apps/staff` - Backend API, Database, and Integration Services  
**Migration Scope**: Complete backend feature parity + modern API architecture for staff management, ticket systems, and HR workflows  
**Business Impact**: Modernize critical HR and IT support backend systems serving 50+ employees across 3 locations  

## 🎯 **Backend Team Objectives**

### **Primary Goals**
1. **API Development**: RESTful backend services with TypeScript interfaces
2. **Database Migration**: MySQL to Supabase PostgreSQL conversion with zero data loss
3. **Integration Services**: Google Workspace, Zenefits, Deputy API integrations
4. **Authentication Backend**: Supabase Auth + Google OAuth implementation
5. **Real-time Infrastructure**: WebSocket subscriptions and live updates

### **Success Metrics**
- **API Performance**: Sub-200ms response times for all endpoints
- **Database Migration**: 100% data preservation and validation
- **Integration Reliability**: 99.9% uptime for external API connections
- **Authentication Security**: Zero security vulnerabilities
- **Real-time Updates**: <50ms WebSocket message delivery

## 🚧 **TEAM COORDINATION & OWNERSHIP**

### **👥 Your Role: Backend Implementation Team**
You are responsible for all server-side infrastructure, APIs, database operations, and external integrations. The Frontend team will consume your APIs and depend on your data contracts.

### **🤝 Frontend Team Role** 
They handle all user interface, React components, styling, and client-side interactions. They will integrate with your APIs but NOT modify server-side code.

### **📋 Communication Protocols**
- **API Changes**: Notify Frontend team 48 hours before endpoint modifications
- **Schema Updates**: Both teams review data structure changes via GitHub issues
- **Integration Testing**: Coordinate testing schedules weekly
- **Deployment**: Your APIs must be deployed and tested before Frontend integration

## 🔗 **API INTERFACE CONTRACT** *(IDENTICAL IN BOTH PRDS)*

### **Authentication Endpoints**
| Method | Endpoint | Frontend Usage | Backend Implementation |
|--------|----------|----------------|------------------------|
| POST | `/api/auth/google` | Redirect OAuth flow | Google OAuth processing, JWT creation |
| GET | `/api/auth/user` | Get current user data | JWT validation, user profile return |
| POST | `/api/auth/logout` | Sign out button | JWT invalidation, session cleanup |

### **Tickets API**
| Method | Endpoint | Frontend Usage | Backend Implementation |
|--------|----------|----------------|------------------------|
| GET | `/api/tickets` | Display ticket list | Query staff_tickets with RLS, pagination |
| POST | `/api/tickets` | Submit new ticket form | Validate input, create ticket, trigger notifications |
| GET | `/api/tickets/[id]` | Show ticket detail page | Fetch ticket with comments/attachments |
| PUT | `/api/tickets/[id]` | Update ticket status | Validate permissions, update status, audit log |
| DELETE | `/api/tickets/[id]` | Archive ticket | Soft delete with audit trail |

### **Comments API**
| Method | Endpoint | Frontend Usage | Backend Implementation |
|--------|----------|----------------|------------------------|
| GET | `/api/tickets/[id]/comments` | Display comment thread | Query comments with author info |
| POST | `/api/tickets/[id]/comments` | Add comment form | Create comment, trigger notifications |
| PUT | `/api/comments/[id]` | Edit comment | Validate author, update content |
| DELETE | `/api/comments/[id]` | Delete comment | Soft delete with audit trail |

### **File Attachments API**
| Method | Endpoint | Frontend Usage | Backend Implementation |
|--------|----------|----------------|------------------------|
| POST | `/api/tickets/[id]/attachments` | File upload widget | Process upload, virus scan, store in Supabase |
| GET | `/api/tickets/[id]/attachments` | List attachments | Return file metadata and signed URLs |
| GET | `/api/attachments/[id]/download` | Download button | Generate signed download URL |
| DELETE | `/api/attachments/[id]` | Remove attachment | Delete file and metadata |

### **Users API**
| Method | Endpoint | Frontend Usage | Backend Implementation |
|--------|----------|----------------|------------------------|
| GET | `/api/users` | Staff directory page | Query user profiles with filters |
| POST | `/api/users` | Create user form | Google Admin SDK integration, profile creation |
| GET | `/api/users/[id]` | User profile page | Fetch complete user profile |
| PUT | `/api/users/[id]` | Edit profile form | Update profile, sync with Google Workspace |

### **Data Schemas** *(SHARED BETWEEN TEAMS)*

#### **Ticket Schema**
```typescript
interface Ticket {
  id: string;
  form_type: 'support_ticket' | 'time_off_request' | 'punch_fix' | 'change_of_availability';
  submitter: {
    id: string;
    email: string;
    name: string;
  };
  status: 'pending' | 'open' | 'in_progress' | 'stalled' | 'approved' | 'denied' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location: 'Northfield' | 'Woodbury' | 'Burnsville';
  title: string; // Frontend: max 200 chars, Backend: DB constraint
  description: string; // Frontend: max 2000 chars, Backend: sanitization
  form_data: Record<string, any>; // Frontend: type-safe forms, Backend: JSON validation
  assigned_to?: {
    id: string;
    email: string;
    name: string;
  };
  comments: Comment[];
  attachments: Attachment[];
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}
```

#### **Comment Schema**
```typescript
interface Comment {
  id: string;
  ticket_id: string;
  author: {
    id: string;
    email: string;
    name: string;
  };
  content: string; // Frontend: max 1000 chars, Backend: sanitization
  is_internal: boolean; // Frontend: manager-only display, Backend: RLS policy
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}
```

#### **User Profile Schema**
```typescript
interface UserProfile {
  id: string;
  employee_id: string;
  full_name: string;
  email: string; // Frontend: display only, Backend: Google Workspace sync
  department: string;
  role: 'staff' | 'manager' | 'admin'; // Frontend: permission checks, Backend: RLS policies
  location: 'Northfield' | 'Woodbury' | 'Burnsville';
  hire_date?: string; // ISO 8601 date
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  is_active: boolean;
  google_user_data?: Record<string, any>; // Frontend: profile enrichment, Backend: sync cache
}
```

### **Error Response Format** *(STANDARD FOR ALL ENDPOINTS)*
```typescript
interface ErrorResponse {
  error: {
    code: string; // 'VALIDATION_ERROR', 'UNAUTHORIZED', 'NOT_FOUND', etc.
    message: string; // Human-readable error for Frontend display
    details?: Record<string, string[]>; // Field-specific validation errors
    timestamp: string; // ISO 8601
    request_id: string; // For support debugging
  };
}
```

### **Authentication Pattern** *(ALL PROTECTED ENDPOINTS)*
```typescript
// Frontend Request Headers
{
  "Authorization": "Bearer <supabase_jwt_token>",
  "Content-Type": "application/json"
}

// Backend Validation
- Extract JWT from Authorization header
- Verify with Supabase Auth
- Check email domain = 'gangerdermatology.com'
- Apply row-level security based on user role
```

## 📊 **TEAM OWNERSHIP MATRIX**

| Component | Frontend Owns | Backend Owns | Shared Responsibility |
|-----------|---------------|--------------|----------------------|
| **User Input** | Form UI, client validation | Data sanitization, DB validation | Input schemas, validation rules |
| **Data Display** | Component rendering, formatting | Data processing, queries | Response format, error messages |
| **Authentication** | Token storage, login UI | Token validation, session management | JWT format, expiration handling |
| **File Upload** | Upload UI, progress indicators | File processing, virus scanning | File type validation, size limits |
| **Real-time Updates** | UI subscriptions, state updates | WebSocket broadcasting, data changes | Event format, subscription topics |
| **Error Handling** | User-friendly error messages | Error logging, response codes | Error codes, message format |
| **Form Validation** | Immediate UI feedback | Server-side data validation | Validation schemas, error formats |
| **Search/Filtering** | Search UI, filter controls | Database queries, indexing | Query parameters, result format |

## 📂 **BACKEND IMPLEMENTATION SCOPE**

### **✅ Your Responsibilities:**

#### **Database Layer**
- Design and implement all PostgreSQL schemas in `supabase/migrations/`
- Create row-level security policies for multi-tenant access
- Implement database functions for complex queries
- Set up proper indexing for performance optimization
- Handle data migration from legacy MySQL system

#### **API Layer**
- Implement all REST endpoints in `apps/staff/src/pages/api/`
- Input validation using Zod schemas in `lib/validators/`
- Authentication middleware in `middleware.ts`
- Error handling and logging throughout API routes
- Real-time subscriptions using Supabase Realtime

#### **Integration Services**
- Google Workspace Admin SDK integration in `lib/integrations/google/`
- Zenefits API integration for HR automation
- Deputy API integration for time tracking
- Email service integration for notifications
- Slack webhook integration for alerts

#### **Security Implementation**
- JWT token validation and refresh logic
- Domain restriction enforcement (@gangerdermatology.com)
- Role-based access control (staff/manager/admin)
- File upload security (virus scanning, type validation)
- Audit logging for compliance requirements

#### **Performance Optimization**
- Database query optimization and connection pooling
- Redis caching for session data and frequent queries
- File storage optimization with CDN delivery
- API response time monitoring and optimization

### **🚫 Do NOT Implement:**
❌ **React components** (Frontend team responsibility)  
❌ **User interface styling** (Frontend team responsibility)  
❌ **Client-side form validation UI** (Frontend team responsibility)  
❌ **Loading spinners or progress indicators** (Frontend team responsibility)  
❌ **Mobile responsive layouts** (Frontend team responsibility)  
❌ **User experience workflows** (Frontend team responsibility)  
❌ **Component state management** (Frontend team responsibility)  
❌ **Browser-specific code** (Frontend team responsibility)

### **🤝 Frontend Dependencies:**
- Frontend will consume your API endpoints as specified
- Frontend will handle JWT token storage and header inclusion
- Frontend will display user-friendly error messages from your error responses
- Frontend will manage loading states during API calls
- Frontend will handle client-side routing and navigation

## 🏗️ **Backend Technical Architecture**

### **API Layer Design**
- **Framework**: Next.js 14 API Routes with TypeScript
- **Database**: Supabase PostgreSQL with row-level security
- **Authentication**: Supabase Auth + Google OAuth integration
- **Real-time**: Supabase WebSocket subscriptions
- **File Storage**: Supabase Storage with CDN delivery
- **Caching**: Redis for session data and query optimization

### **Technology Stack**
- **API Framework**: Next.js 14 API routes
- **Database ORM**: Supabase client with TypeScript
- **Validation**: Zod schemas for input validation
- **Authentication**: Supabase Auth + Google OAuth
- **File Upload**: Supabase Storage with progressive upload
- **Real-time**: Supabase Realtime for live status updates
- **External APIs**: Google Admin SDK, Zenefits, Deputy

## 📊 **Database Schema Design**

### **Core Tables**

#### **`staff_tickets`** - Main Ticket System
```sql
CREATE TABLE staff_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type TEXT NOT NULL, -- 'support_ticket', 'time_off_request', etc.
  submitter_id UUID REFERENCES auth.users(id),
  submitter_email TEXT NOT NULL,
  submitter_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT,
  location TEXT, -- 'Northfield', 'Woodbury', 'Burnsville'
  title TEXT NOT NULL,
  description TEXT,
  form_data JSONB NOT NULL, -- Form-specific data
  assigned_to UUID REFERENCES auth.users(id),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
CREATE POLICY "Users can view own tickets" ON staff_tickets
  FOR SELECT USING (submitter_id = auth.uid() OR 
                   (auth.jwt() ->> 'email') = ANY(get_manager_emails()));

CREATE POLICY "Managers can view all tickets" ON staff_tickets
  FOR ALL USING ((auth.jwt() ->> 'email') = ANY(get_manager_emails()));
```

#### **`staff_ticket_comments`** - Comment System
```sql
CREATE TABLE staff_ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES staff_tickets(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  author_email TEXT NOT NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- Manager-only comments
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **`staff_attachments`** - File Management
```sql
CREATE TABLE staff_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES staff_tickets(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- Supabase storage path
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **`staff_form_definitions`** - Dynamic Form System
```sql
CREATE TABLE staff_form_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  form_schema JSONB NOT NULL, -- JSON Schema for validation
  ui_schema JSONB, -- UI rendering configuration
  workflow_config JSONB, -- Status transitions and approvals
  is_active BOOLEAN DEFAULT TRUE,
  requires_manager_approval BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **`staff_user_profiles`** - Extended User Information
```sql
CREATE TABLE staff_user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  employee_id TEXT UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT,
  role TEXT NOT NULL DEFAULT 'staff', -- 'staff', 'manager', 'admin'
  location TEXT, -- Primary work location
  hire_date DATE,
  manager_id UUID REFERENCES staff_user_profiles(id),
  is_active BOOLEAN DEFAULT TRUE,
  google_user_data JSONB, -- Cached Google Workspace info
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **`staff_notifications`** - Notification System
```sql
CREATE TABLE staff_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  ticket_id UUID REFERENCES staff_tickets(id),
  type TEXT NOT NULL, -- 'status_change', 'new_comment', 'assignment', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  channels TEXT[] DEFAULT ARRAY['in_app'], -- 'in_app', 'email', 'slack'
  read_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **`staff_analytics`** - Usage Analytics
```sql
CREATE TABLE staff_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'ticket_created', 'status_changed', etc.
  user_id UUID REFERENCES auth.users(id),
  ticket_id UUID REFERENCES staff_tickets(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔧 **Backend API Design**

### **Core API Endpoints**

#### **Authentication API**
```typescript
// POST /api/auth/login
interface LoginRequest {
  provider: 'google';
  redirectTo?: string;
}

// GET /api/auth/user
interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: 'staff' | 'manager' | 'admin';
  department: string;
  location: string;
}

// POST /api/auth/logout
interface LogoutResponse {
  success: boolean;
}
```

#### **Tickets API**
```typescript
// GET /api/tickets
interface TicketsQuery {
  form_type?: string;
  status?: string;
  assigned_to?: string;
  location?: string;
  limit?: number;
  offset?: number;
}

// POST /api/tickets
interface CreateTicketRequest {
  form_type: string;
  title: string;
  description: string;
  form_data: Record<string, any>;
  priority?: string;
  location?: string;
}

// PUT /api/tickets/[id]
interface UpdateTicketRequest {
  status?: string;
  assigned_to?: string;
  form_data?: Record<string, any>;
}

// GET /api/tickets/[id]
interface TicketResponse {
  id: string;
  form_type: string;
  submitter: UserProfile;
  status: string;
  priority: string;
  location: string;
  title: string;
  description: string;
  form_data: Record<string, any>;
  assigned_to?: UserProfile;
  comments: TicketComment[];
  attachments: TicketAttachment[];
  created_at: string;
  updated_at: string;
}
```

#### **Comments API**
```typescript
// POST /api/tickets/[id]/comments
interface CreateCommentRequest {
  content: string;
  is_internal?: boolean;
}

// GET /api/tickets/[id]/comments
interface CommentsResponse {
  comments: TicketComment[];
}
```

#### **File Upload API**
```typescript
// POST /api/tickets/[id]/attachments
interface UploadAttachmentRequest {
  file: FormData;
}

// GET /api/tickets/[id]/attachments
interface AttachmentsResponse {
  attachments: TicketAttachment[];
}

// DELETE /api/attachments/[id]
interface DeleteAttachmentResponse {
  success: boolean;
}
```

#### **User Management API**
```typescript
// GET /api/users
interface UsersQuery {
  role?: string;
  department?: string;
  location?: string;
  is_active?: boolean;
}

// POST /api/users
interface CreateUserRequest {
  first_name: string;
  last_name: string;
  personal_email: string;
  department: string;
  role: string;
  manager_id?: string;
  location: string;
}

// GET /api/users/[id]
interface UserProfileResponse {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  department: string;
  role: string;
  location: string;
  hire_date?: string;
  manager?: UserProfile;
  is_active: boolean;
  google_user_data?: Record<string, any>;
}
```

#### **Form Definitions API**
```typescript
// GET /api/forms
interface FormsResponse {
  forms: FormDefinition[];
}

// GET /api/forms/[type]
interface FormDefinitionResponse {
  form_type: string;
  display_name: string;
  description: string;
  form_schema: JSONSchema;
  ui_schema?: Record<string, any>;
  workflow_config: WorkflowConfig;
}

// PUT /api/forms/[type]
interface UpdateFormRequest {
  form_schema?: JSONSchema;
  ui_schema?: Record<string, any>;
  workflow_config?: WorkflowConfig;
  is_active?: boolean;
}
```

## 🔄 **Backend Migration Strategy**

### **Phase 1: Database Migration (Week 1-2)**

#### **1.1 Legacy Data Export**
```bash
# Export legacy MySQL data
mysqldump --host=legacy_host --user=legacy_user --password=legacy_pass \
  gangerne_apihub > legacy_data_export.sql

# Convert to CSV for analysis
mysql -e "SELECT * FROM staff_tickets" --batch --raw > tickets_export.csv
mysql -e "SELECT * FROM staff_user_cache" --batch --raw > users_export.csv
```

#### **1.2 Database Schema Creation**
```sql
-- Execute migration files in order
\i supabase/migrations/001_create_staff_tables.sql
\i supabase/migrations/002_create_rls_policies.sql
\i supabase/migrations/003_create_functions.sql
\i supabase/migrations/004_create_indexes.sql
\i supabase/migrations/005_insert_form_definitions.sql
```

#### **1.3 Data Migration Scripts**
```sql
-- Migration function (as shown in main PRD)
CREATE OR REPLACE FUNCTION migrate_legacy_staff_data()
RETURNS void AS $$
BEGIN
  -- Step 1: Migrate user cache to user profiles
  INSERT INTO staff_user_profiles (
    id, employee_id, full_name, email, department, role,
    location, hire_date, manager_id, is_active, google_user_data,
    created_at, updated_at
  )
  SELECT 
    gen_random_uuid(),
    SUBSTRING(email, 1, POSITION('@' IN email) - 1),
    JSON_UNQUOTE(JSON_EXTRACT(user_data, '$.name')),
    email,
    'General',
    CASE 
      WHEN email IN ('anand@gangerdermatology.com', 'personnel@gangerdermatology.com') 
      THEN 'admin'
      ELSE 'staff'
    END,
    'Multiple',
    NULL,
    NULL,
    TRUE,
    user_data::jsonb,
    created_at,
    updated_at
  FROM legacy_mysql.staff_user_cache;
  
  -- Continue with tickets, comments, files...
END;
$$ LANGUAGE plpgsql;
```

### **Phase 2: API Development (Week 3-6)**

#### **2.1 Authentication Middleware**
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check if user is authenticated
  if (!session) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // Check domain restriction
  const email = session.user.email;
  if (!email?.endsWith('@gangerdermatology.com')) {
    return NextResponse.redirect(new URL('/auth/unauthorized', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
```

#### **2.2 API Route Structure**
```typescript
// pages/api/tickets/route.ts
import { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { ticketRepository } from '@/lib/repositories/ticketRepository';

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filters = {
    form_type: searchParams.get('form_type'),
    status: searchParams.get('status'),
    limit: parseInt(searchParams.get('limit') || '50'),
    offset: parseInt(searchParams.get('offset') || '0'),
  };

  try {
    const tickets = await ticketRepository.findMany(filters, session.user.id);
    return Response.json({ tickets });
  } catch (error) {
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const ticket = await ticketRepository.create(body, session.user.id);
    return Response.json({ ticket }, { status: 201 });
  } catch (error) {
    return new Response('Bad Request', { status: 400 });
  }
}
```

### **Phase 3: Integration Services (Week 7-10)**

#### **3.1 Google Workspace Integration**
```typescript
// lib/integrations/googleWorkspace.ts
import { google } from 'googleapis';

export class GoogleWorkspaceService {
  private auth: any;
  private admin: any;

  constructor() {
    this.auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
      scopes: [
        'https://www.googleapis.com/auth/admin.directory.user',
        'https://www.googleapis.com/auth/admin.directory.group',
      ],
      subject: process.env.GOOGLE_IMPERSONATE_EMAIL,
    });
    
    this.admin = google.admin({ version: 'directory_v1', auth: this.auth });
  }

  async createUser(userData: CreateUserRequest): Promise<GoogleUser> {
    const response = await this.admin.users.insert({
      requestBody: {
        primaryEmail: `${userData.first_name.toLowerCase()}.${userData.last_name.toLowerCase()}@gangerdermatology.com`,
        name: {
          givenName: userData.first_name,
          familyName: userData.last_name,
        },
        password: this.generateTempPassword(),
        changePasswordAtNextLogin: true,
        orgUnitPath: '/Google Cloud Identity',
      },
    });

    return response.data;
  }

  async getUserInfo(email: string): Promise<GoogleUser> {
    const response = await this.admin.users.get({ userKey: email });
    return response.data;
  }

  async updateUserOrgUnit(email: string, orgUnitPath: string): Promise<void> {
    await this.admin.users.update({
      userKey: email,
      requestBody: { orgUnitPath },
    });
  }

  private generateTempPassword(): string {
    return Math.random().toString(36).slice(-12) + '!A1';
  }
}
```

#### **3.2 Real-time Subscriptions**
```typescript
// lib/realtime/subscriptions.ts
import { createClient } from '@supabase/supabase-js';

export class RealtimeService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  setupTicketSubscriptions() {
    return this.supabase
      .channel('staff_tickets_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staff_tickets',
        },
        (payload) => {
          // Broadcast to connected clients
          this.broadcastTicketUpdate(payload);
        }
      )
      .subscribe();
  }

  setupCommentSubscriptions() {
    return this.supabase
      .channel('staff_comments_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'staff_ticket_comments',
        },
        (payload) => {
          this.broadcastNewComment(payload);
        }
      )
      .subscribe();
  }

  private broadcastTicketUpdate(payload: any) {
    // Implementation for broadcasting updates
    this.supabase.channel('ticket_updates').send({
      type: 'broadcast',
      event: 'ticket_changed',
      payload,
    });
  }

  private broadcastNewComment(payload: any) {
    this.supabase.channel('comment_updates').send({
      type: 'broadcast',
      event: 'comment_added',
      payload,
    });
  }
}
```

## 🔐 **Backend Security Implementation**

### **Row Level Security Policies**
```sql
-- Ticket access policies
CREATE POLICY "Users can view own tickets" ON staff_tickets
  FOR SELECT USING (
    submitter_id = auth.uid() OR 
    assigned_to = auth.uid() OR
    (auth.jwt() ->> 'email') = ANY(get_manager_emails())
  );

CREATE POLICY "Users can create tickets" ON staff_tickets
  FOR INSERT WITH CHECK (submitter_id = auth.uid());

CREATE POLICY "Managers can update tickets" ON staff_tickets
  FOR UPDATE USING ((auth.jwt() ->> 'email') = ANY(get_manager_emails()));

-- Comment access policies
CREATE POLICY "Users can view ticket comments" ON staff_ticket_comments
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM staff_tickets 
      WHERE submitter_id = auth.uid() OR 
            assigned_to = auth.uid() OR
            (auth.jwt() ->> 'email') = ANY(get_manager_emails())
    )
  );

-- File access policies
CREATE POLICY "Users can view ticket attachments" ON staff_attachments
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM staff_tickets 
      WHERE submitter_id = auth.uid() OR 
            assigned_to = auth.uid() OR
            (auth.jwt() ->> 'email') = ANY(get_manager_emails())
    )
  );
```

### **Input Validation Schemas**
```typescript
// lib/validators/ticketValidators.ts
import { z } from 'zod';

export const createTicketSchema = z.object({
  form_type: z.enum(['support_ticket', 'time_off_request', 'punch_fix', 'change_of_availability']),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  location: z.enum(['Northfield', 'Woodbury', 'Burnsville']).optional(),
  form_data: z.record(z.any()),
});

export const updateTicketSchema = z.object({
  status: z.enum(['pending', 'open', 'in_progress', 'stalled', 'approved', 'denied', 'completed']).optional(),
  assigned_to: z.string().uuid().optional(),
  form_data: z.record(z.any()).optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(1000),
  is_internal: z.boolean().optional(),
});
```

## 📊 **Backend Performance Requirements**

### **Performance Targets**
- **API Response Time**: <200ms for all endpoints
- **Database Queries**: <100ms for simple queries, <500ms for complex
- **File Upload**: Support up to 50MB with chunked upload
- **Real-time Updates**: <50ms message delivery
- **Concurrent Users**: Support 100 simultaneous users

### **Optimization Strategies**
- **Database Indexing**: Proper indexes on frequently queried columns
- **Query Optimization**: Use database functions for complex operations
- **Caching**: Redis for session data and frequently accessed data
- **Connection Pooling**: Optimize Supabase connection usage
- **File Storage**: CDN delivery for attachments

## 📚 **Implementation Standards & Procedures**

### **Development Standards**
This migration follows established Ganger Platform standards:
- **Backend Development**: `/true-docs/BACKEND_DEVELOPMENT_GUIDE.md` - API design, database patterns, and performance optimization
- **Shared Infrastructure**: `/true-docs/SHARED_INFRASTRUCTURE_GUIDE.md` - Authentication, integrations, and deployment patterns

### **Quality Assurance & Testing**
- **API Testing**: REST API testing patterns and validation in `/true-docs/BACKEND_DEVELOPMENT_GUIDE.md#api-testing`
- **Performance Testing**: Load testing framework and acceptance criteria in `/true-docs/BACKEND_DEVELOPMENT_GUIDE.md#performance-validation`
- **Security Audit**: Penetration testing procedures and compliance validation in `/true-docs/SHARED_INFRASTRUCTURE_GUIDE.md#security-architecture`

### **Infrastructure & Deployment**
- **Deployment Process**: CI/CD pipeline and environment configuration in `/true-docs/SHARED_INFRASTRUCTURE_GUIDE.md#deployment`
- **Monitoring & Observability**: System monitoring and alerting in `/true-docs/BACKEND_DEVELOPMENT_GUIDE.md#monitoring`
- **Database Operations**: Migration procedures and backup strategies in `/true-docs/SHARED_INFRASTRUCTURE_GUIDE.md#database`

## 🔄 **Legacy-Specific Migration Procedures**

### **Data Migration Scripts**
**MySQL to PostgreSQL Conversion Requirements:**

Based on analysis of the actual legacy database structure, here are the verified migration scripts:

```sql
-- Verified Legacy Database Schema Analysis:
-- ✅ staff_tickets: Main tickets table with JSON payload
-- ✅ staff_ticket_comments: Comment system
-- ✅ staff_file_uploads: File attachment system
-- ✅ staff_user_cache: Google user information cache
-- ✅ staff_approvals: Approval workflow
-- ✅ staff_job_queue: Background job processing
-- ✅ staff_notifications: Notification delivery tracking
-- ✅ staff_pending_hires: User creation workflow
-- ✅ staff_login_attempts: Security audit logging

CREATE OR REPLACE FUNCTION migrate_legacy_staff_data()
RETURNS void AS $$
BEGIN
  -- Step 1: Migrate user cache to user profiles
  INSERT INTO staff_user_profiles (
    id, employee_id, full_name, email, department, role,
    location, hire_date, manager_id, is_active, google_user_data,
    created_at, updated_at
  )
  SELECT 
    gen_random_uuid(),
    SUBSTRING(email, 1, POSITION('@' IN email) - 1), -- Extract username as employee_id
    JSON_UNQUOTE(JSON_EXTRACT(user_data, '$.name')),
    email,
    'General', -- Default department
    CASE 
      WHEN email IN ('anand@gangerdermatology.com', 'personnel@gangerdermatology.com', 'office@gangerdermatology.com') 
      THEN 'admin'
      WHEN email IN ('ops@gangerdermatology.com', 'compliance@gangerdermatology.com')
      THEN 'manager'
      ELSE 'staff'
    END,
    'Multiple', -- Default location
    NULL, -- hire_date not available in cache
    NULL, -- manager_id to be resolved later
    TRUE, -- is_active
    user_data::jsonb,
    created_at,
    updated_at
  FROM legacy_mysql.staff_user_cache;

  -- Step 2: Migrate main tickets with enhanced form data
  INSERT INTO staff_tickets (
    id, form_type, submitter_id, submitter_email, submitter_name,
    status, priority, location, title, description, form_data,
    assigned_to, due_date, completed_at, created_at, updated_at
  )
  SELECT 
    gen_random_uuid(),
    form_type,
    get_user_id_by_email(submitter_email),
    submitter_email,
    JSON_UNQUOTE(JSON_EXTRACT(payload, '$.submitter_name')),
    CASE status
      WHEN 'Pending Approval' THEN 'pending'
      WHEN 'Open' THEN 'open'
      WHEN 'In Progress' THEN 'in_progress'
      WHEN 'Stalled' THEN 'stalled'
      WHEN 'Approved' THEN 'approved'
      WHEN 'Denied' THEN 'denied'
      WHEN 'Completed' THEN 'completed'
      ELSE 'pending'
    END,
    priority,
    COALESCE(location, JSON_UNQUOTE(JSON_EXTRACT(payload, '$.location'))),
    COALESCE(
      JSON_UNQUOTE(JSON_EXTRACT(payload, '$.title')),
      LEFT(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.details')), 100),
      CONCAT(form_type, ' request')
    ),
    JSON_UNQUOTE(JSON_EXTRACT(payload, '$.details')),
    payload::jsonb,
    get_user_id_by_email(assigned_to_email),
    NULL, -- due_date not in legacy
    CASE WHEN status = 'Completed' THEN action_taken_at ELSE NULL END,
    created_at,
    updated_at
  FROM legacy_mysql.staff_tickets;

  -- Continue with comments, files, etc...
END;
$$ LANGUAGE plpgsql;
```

### **Emergency Rollback Procedures**

**Rollback Decision Matrix:**
- **Phase 1 Issues** (<24 hours): Full rollback to legacy system
- **Phase 2-3 Issues** (>24 hours): Data preservation with legacy system reactivation
- **Data Corruption**: Immediate rollback with data restoration

**Emergency Rollback Steps:**
```bash
# 1. Immediate System Isolation (5 minutes)
./scripts/emergency-isolate.sh
# - Disable new user signups
# - Set maintenance mode on new system
# - Preserve all data in read-only state

# 2. Legacy System Reactivation (10 minutes)
./scripts/reactivate-legacy.sh
# - Restore legacy database from latest backup
# - Reactivate legacy PHP application
# - Update DNS to point to legacy system
# - Notify all users via email

# 3. Data Synchronization (30 minutes)
./scripts/sync-data-to-legacy.sh
# - Export new tickets created during migration
# - Import into legacy system format
# - Verify data integrity
# - Generate reconciliation report

# 4. Post-Rollback Validation (15 minutes)
./scripts/validate-rollback.sh
# - Test all legacy functionality
# - Verify user access
# - Confirm data completeness
# - Document rollback decision and next steps
```

## 🔄 **CONCURRENT DEVELOPMENT FLOW**

### **Phase 1: Foundation Setup (Week 1)**
#### **✅ Backend Team Deliverables:**
- [ ] **Database Schema**: Complete PostgreSQL schema with sample data
- [ ] **API Stubs**: All endpoints returning mock data with correct structure
- [ ] **Authentication**: Working JWT validation middleware
- [ ] **Environment Setup**: Supabase project configured for both teams

#### **🤝 Coordination with Frontend:**
- [ ] **API Contract Review**: Both teams approve endpoint specifications
- [ ] **Mock Data Validation**: Frontend tests integration with stub endpoints
- [ ] **Shared Types**: Finalize TypeScript interfaces in shared files
- [ ] **Development Environment**: Both teams can run apps locally

#### **📊 Success Criteria:**
- Frontend can successfully call all API stubs
- Authentication flow works end-to-end
- Database schema supports all legacy feature requirements
- Both teams agree on data contracts

### **Phase 2: Core Implementation (Week 2-3)**
#### **✅ Backend Team Deliverables:**
- [ ] **Full API Implementation**: All endpoints with real business logic
- [ ] **Data Migration**: Legacy MySQL data successfully migrated
- [ ] **Real-time Subscriptions**: WebSocket updates for tickets/comments
- [ ] **File Upload**: Complete file processing and storage

#### **🤝 Coordination with Frontend:**
- [ ] **Integration Testing**: Weekly testing sessions with Frontend team
- [ ] **Error Handling**: Coordinate error message formats and codes
- [ ] **Performance Testing**: API response time validation
- [ ] **Real-time Testing**: WebSocket subscription validation

#### **📊 Success Criteria:**
- All API endpoints return production-ready data
- Real-time updates work across browser tabs
- File upload/download fully functional
- Frontend integration tests pass

### **Phase 3: Advanced Features (Week 4)**
#### **✅ Backend Team Deliverables:**
- [ ] **External Integrations**: Google Workspace, Zenefits, Deputy APIs
- [ ] **Performance Optimization**: Caching, query optimization
- [ ] **Security Hardening**: Rate limiting, input sanitization
- [ ] **Monitoring & Logging**: Error tracking and performance metrics

#### **🤝 Coordination with Frontend:**
- [ ] **End-to-End Testing**: Complete user workflow validation
- [ ] **Performance Validation**: <200ms API response times confirmed
- [ ] **Security Testing**: Authentication and authorization validation
- [ ] **Production Deployment**: Coordinated deployment sequence

#### **📊 Success Criteria:**
- External integrations working in production
- Performance targets met under load
- Security audit passes
- Ready for user acceptance testing

## 🧪 **INTEGRATION TESTING STRATEGY**

### **API Contract Validation**
```typescript
// Shared test contracts for both teams
describe('API Contract Validation', () => {
  it('GET /api/tickets returns correct schema', async () => {
    const response = await fetch('/api/tickets');
    const data = await response.json();
    
    // Backend: Implements schema validation
    // Frontend: Tests data consumption
    expect(data).toMatchSchema(TicketListSchema);
  });
  
  it('POST /api/tickets accepts valid form data', async () => {
    const ticketData = createValidTicketPayload();
    const response = await fetch('/api/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData)
    });
    
    // Backend: Validates and processes
    // Frontend: Confirms submission success
    expect(response.status).toBe(201);
  });
});
```

### **Real-time Integration Tests**
```typescript
describe('Real-time Subscriptions', () => {
  it('broadcasts ticket updates to subscribers', async () => {
    // Backend: Triggers update event
    await updateTicketStatus(ticketId, 'approved');
    
    // Frontend: Receives update via WebSocket
    await waitForRealtimeUpdate();
    expect(receivedUpdate.status).toBe('approved');
  });
});
```

### **Weekly Integration Schedule**
- **Monday**: API contract validation
- **Wednesday**: Real-time features testing  
- **Friday**: End-to-end workflow testing

## 📊 **DEPLOYMENT COORDINATION**

### **Deployment Sequence** *(CRITICAL)*
1. **Backend APIs First**: Deploy and validate all endpoints
2. **Database Migration**: Execute production data migration
3. **Integration Validation**: Test external API connections
4. **Frontend Deployment**: Deploy UI consuming production APIs
5. **User Acceptance Testing**: Coordinated testing with both teams

### **Rollback Strategy**
```bash
# Backend rollback triggers Frontend rollback
if backend_deployment_fails:
  rollback_database_migration()
  revert_api_deployment()
  notify_frontend_team("Backend rollback initiated")
  
# Frontend can rollback independently
if frontend_deployment_fails:
  rollback_frontend_deployment()
  backend_apis_remain_stable()
```

### **Production Validation Checklist**
- [ ] **API Health**: All endpoints return 2xx status codes
- [ ] **Database**: Migration completed with data integrity validation
- [ ] **Authentication**: Google OAuth flow working in production
- [ ] **File Upload**: Supabase storage accepting uploads
- [ ] **Real-time**: WebSocket connections established
- [ ] **External APIs**: Google Workspace, Zenefits, Deputy connections verified

---

**Project Sponsor**: Anand Ganger  
**Backend Lead**: Backend Development Team  
**Stakeholders**: Frontend Team, HR Department, IT Support Team  
**Estimated Timeline**: 10 weeks backend development  
**Estimated Effort**: 300-400 backend development hours  

*This Backend PRD ensures complete API and database infrastructure for the modernized staff management platform with clear team boundaries and zero conflicts with frontend development.*