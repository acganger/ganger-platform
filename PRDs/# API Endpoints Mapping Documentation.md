# API Endpoints Mapping Documentation

## Current API Structure → Modern API Design

This document maps existing PHP API endpoints to the new modern stack equivalents, ensuring 100% feature parity during migration.

## Staff Portal API Endpoints

### Current PHP Structure (`/staff/api.php`)

#### Authentication & Session Management
```php
// Current: POST /staff/api.php
{
  "action": "get_users",
  "action": "test_as", 
  "action": "return_to_original"
}
```

**Modern Equivalent:**
```typescript
// Next.js API Routes
GET    /api/auth/users              // List users (admin only)
POST   /api/auth/impersonate        // Switch user (superadmin only)  
DELETE /api/auth/impersonate        // Return to original user
GET    /api/auth/session            // Get current session info
```

#### Ticket Management
```php
// Current: Various actions in api.php
{
  "action": "update_status",
  "action": "add_comment", 
  "action": "save_preference",
  "action": "archive_files",
  "action": "upload_stats"
}
```

**Modern Equivalent:**
```typescript
// RESTful API design
GET    /api/tickets                 // List tickets with filters
POST   /api/tickets                 // Create new ticket
GET    /api/tickets/[id]            // Get single ticket
PUT    /api/tickets/[id]            // Update ticket
DELETE /api/tickets/[id]            // Delete ticket (admin only)

PUT    /api/tickets/[id]/status     // Update status
POST   /api/tickets/[id]/comments   // Add comment
GET    /api/tickets/[id]/comments   // List comments

GET    /api/users/[email]/preferences  // Get user preferences
PUT    /api/users/[email]/preferences  // Save user preferences

POST   /api/files/archive           // Archive old files
GET    /api/admin/upload-stats      // Upload statistics
```

#### Form Submission
```php
// Current: /staff/submit.php
POST /submit.php
Content-Type: multipart/form-data
```

**Modern Equivalent:**
```typescript
POST   /api/forms/[formType]        // Submit specific form type
GET    /api/forms/config            // Get form configurations
POST   /api/uploads                 // Handle file uploads separately
```

### Current Response Format
```json
{
  "success": true|false,
  "data": {...},
  "error": "Error message if applicable"
}
```

**Enhanced Modern Format:**
```typescript
// Success Response
{
  "success": true,
  "data": T,
  "meta": {
    "timestamp": "2025-06-04T12:00:00Z",
    "requestId": "uuid-v4",
    "pagination"?: PaginationMeta
  }
}

// Error Response  
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": ValidationError[],
    "requestId": "uuid-v4"
  }
}
```

## Tickets System API Endpoints

### Current PHP Structure

#### Ticket Operations
```php
// Current: /tickets/api/tickets.php
GET  /api/tickets.php?page=1&limit=50&location[]=Ann Arbor
POST /api/tickets.php
PUT  /api/tickets.php  
GET  /api/tickets.php?id=123
```

**Modern Equivalent:**
```typescript
// Enhanced with better filtering and real-time
GET    /api/tickets?page=1&limit=50&location=ann-arbor&status=open
POST   /api/tickets
PUT    /api/tickets/[id]
GET    /api/tickets/[id]
PATCH  /api/tickets/bulk             // Bulk operations

// Real-time subscriptions
WS     /api/tickets/subscribe        // WebSocket for live updates
```

#### Comment System
```php
// Current: /tickets/api/comments.php
GET  /api/comments.php?ticket_id=123
POST /api/comments.php
```

**Modern Equivalent:**
```typescript
GET    /api/tickets/[id]/comments
POST   /api/tickets/[id]/comments
PUT    /api/tickets/[id]/comments/[commentId]
DELETE /api/tickets/[id]/comments/[commentId]

// Real-time comment updates
WS     /api/tickets/[id]/comments/subscribe
```

#### File Uploads
```php
// Current: /tickets/api/uploads.php
POST /api/uploads.php
Content-Type: multipart/form-data
```

**Modern Equivalent:**
```typescript
POST   /api/uploads                 // Single file upload
POST   /api/uploads/multiple        // Multiple file upload
GET    /api/uploads/[fileId]        // Get file metadata
DELETE /api/uploads/[fileId]        // Delete file

// Enhanced with upload progress
POST   /api/uploads/presigned       // Get presigned upload URL
```

## New App API Designs

### TimeTrader Clone API
```typescript
// Rep Management
GET    /api/reps                    // List pharmaceutical reps
POST   /api/reps                    // Create rep profile
GET    /api/reps/[id]               // Get rep details
PUT    /api/reps/[id]               // Update rep profile

// Appointment Scheduling
GET    /api/appointments            // List appointments
POST   /api/appointments            // Book appointment
GET    /api/appointments/[id]       // Get appointment
PUT    /api/appointments/[id]       // Update appointment
DELETE /api/appointments/[id]       // Cancel appointment

// Availability Management
GET    /api/locations/[id]/availability   // Check availability
POST   /api/locations/[id]/block          // Block time slots
DELETE /api/locations/[id]/block/[blockId] // Remove block

// Calendar Integration
POST   /api/calendar/sync           // Sync with Google Calendar
GET    /api/calendar/events         // Get calendar events
POST   /api/calendar/events         // Create calendar event

// Notifications
POST   /api/notifications/email     // Send email notification
GET    /api/notifications/history   // Notification history
```

### L10 (Ninety.io Clone) API
```typescript
// Meeting Management
GET    /api/meetings                // List meetings
POST   /api/meetings                // Create meeting
GET    /api/meetings/[id]           // Get meeting details
PUT    /api/meetings/[id]           // Update meeting
POST   /api/meetings/[id]/start     // Start meeting
POST   /api/meetings/[id]/end       // End meeting

// Scorecard Management
GET    /api/scorecards              // List scorecards
POST   /api/scorecards              // Create scorecard
GET    /api/scorecards/[id]         // Get scorecard
PUT    /api/scorecards/[id]         // Update scorecard
POST   /api/scorecards/[id]/metrics // Add metric data

// Rock/Goal Management
GET    /api/rocks                   // List quarterly rocks
POST   /api/rocks                   // Create rock
GET    /api/rocks/[id]              // Get rock details
PUT    /api/rocks/[id]              // Update rock progress

// Action Items
GET    /api/actions                 // List action items
POST   /api/actions                 // Create action item
PUT    /api/actions/[id]/complete   // Mark complete
```

## Authentication & Authorization

### Current System (Staff Portal)
```php
// Session-based with Google OAuth
session_start();
$_SESSION['user'] = [...];

// Role checking
function isManager($email) { ... }
function isSuperUser($email) { ... }
```

### Modern System (All Apps)
```typescript
// JWT-based with Supabase Auth
interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'staff' | 'manager' | 'superadmin';
  permissions: Permission[];
}

// Middleware for route protection
middleware: [
  'auth',           // Require authentication
  'role:manager',   // Require specific role
  'perm:tickets:write' // Require specific permission
]
```

## Real-time Features (New)

### WebSocket Subscriptions
```typescript
// Ticket updates
WS /api/tickets/[id]/subscribe
{
  "type": "status_changed",
  "ticketId": 123,
  "newStatus": "In Progress",
  "updatedBy": "user@example.com",
  "timestamp": "2025-06-04T12:00:00Z"
}

// Comment notifications  
WS /api/tickets/[id]/comments/subscribe
{
  "type": "comment_added",
  "ticketId": 123,
  "comment": CommentObject,
  "mentions": ["user1@example.com"]
}

// User presence (for collaboration)
WS /api/presence/[ticketId]
{
  "type": "user_joined",
  "user": UserObject,
  "activeUsers": UserObject[]
}
```

## Data Migration Mapping

### Current JSON Payload → Modern Schema
```typescript
// Current staff_tickets.payload (JSON)
{
  "location": "Ann Arbor",
  "priority": "Urgent + Important", 
  "request_type": "IT (network, computer, software)",
  "details": "Description",
  "submitter_name": "User Name",
  "photos": "url1,url2,url3"
}

// Modern normalized schema
interface Ticket {
  id: string;
  submitterEmail: string;
  submitterName: string;
  formType: FormType;
  status: TicketStatus;
  priority: Priority;
  location: Location;
  requestType: RequestType;
  details: string;
  attachments: Attachment[];
  createdAt: Date;
  updatedAt: Date;
  completedBy?: string;
  actionTakenAt?: Date;
}
```

### File Upload Migration
```typescript
// Current: Local filesystem
/uploads/active/ticket-123-timestamp-random.jpg
/uploads/archived/2025-06/ticket-123-timestamp-random.jpg

// Modern: Supabase Storage with CDN
/storage/v1/object/public/tickets/123/attachments/uuid.jpg
// With automatic optimization and CDN caching
```

## API Security Enhancements

### Rate Limiting
```typescript
// Per-endpoint rate limits
POST /api/tickets          // 10 req/min per user
GET  /api/tickets          // 100 req/min per user  
POST /api/uploads          // 5 req/min per user
POST /api/auth/impersonate // 3 req/hour per superadmin
```

### Input Validation
```typescript
// TypeScript schemas with runtime validation
import { z } from 'zod';

const CreateTicketSchema = z.object({
  location: z.enum(['ann-arbor', 'wixom', 'plymouth', 'vinya']),
  priority: z.enum(['urgent-important', 'not-urgent-important', ...]),
  requestType: z.string().min(1).max(100),
  details: z.string().min(10).max(5000),
  attachments: z.array(z.string().uuid()).max(10)
});
```

### Audit Logging
```typescript
// All API calls logged with context
interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;        // 'ticket.create', 'user.impersonate'
  resource: string;      // 'ticket:123', 'user:admin@example.com'
  changes?: object;      // Before/after state
  ipAddress: string;
  userAgent: string;
  requestId: string;
}
```

## Error Handling Standards

### HTTP Status Codes
```typescript
200 // Success with data
201 // Created successfully  
204 // Success with no content
400 // Bad request / validation error
401 // Unauthorized / not logged in
403 // Forbidden / insufficient permissions
404 // Resource not found
409 // Conflict / duplicate resource
422 // Unprocessable entity / business logic error
429 // Rate limit exceeded
500 // Internal server error
```

### Error Response Format
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable message
    details?: object;       // Additional error context
    requestId: string;      // For support tracking
    timestamp: Date;
  }
}
```

---

*This mapping ensures seamless migration while adding modern capabilities like real-time updates, better security, and enhanced developer experience.*