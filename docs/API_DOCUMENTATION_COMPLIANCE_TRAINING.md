# Compliance Training Backend API Documentation

## Overview

The Compliance Training Backend provides a comprehensive REST API for managing employee compliance training data, synchronizing with external systems (Zenefits and Google Classroom), and generating reports. This API is built on Next.js with Supabase as the backend database and includes real-time functionality, automated background jobs, and extensive monitoring capabilities.

## Base URL

```
https://compliance-training.gangerdermatology.com/api
```

## Authentication

All API endpoints require authentication using Bearer tokens. Include the authorization header in all requests:

```http
Authorization: Bearer <your-access-token>
```

### Role-Based Access Control

The API implements role-based access control with the following roles:

- **superadmin**: Full access to all endpoints and data
- **hr_admin**: Access to all compliance data and administrative functions
- **manager**: Access to their department's data only
- **employee**: Limited access to their own compliance data

## API Endpoints

### 1. Dashboard Data

Get comprehensive compliance dashboard data with statistics, department summaries, and alerts.

```http
GET /compliance/dashboard
```

**Query Parameters:**
- `department` (optional): Filter by specific department
- `location` (optional): Filter by specific location
- `includeHistory` (optional): Include historical trends (true/false)

**Response:**
```json
{
  "success": true,
  "data": {
    "overallStats": {
      "totalEmployees": 150,
      "avgComplianceRate": 87.5,
      "totalTrainings": 450,
      "overdueTrainings": 12
    },
    "departmentSummary": [
      {
        "department": "Dermatology",
        "total_employees": 45,
        "avg_compliance_rate": 92.1,
        "compliant_employees": 41,
        "pending_employees": 3,
        "non_compliant_employees": 1,
        "total_overdue_trainings": 2,
        "next_department_deadline": "2025-01-25"
      }
    ],
    "overdueAlerts": [
      {
        "employee_id": "emp-123",
        "employee_name": "John Doe",
        "department": "Dermatology",
        "module_name": "HIPAA Training",
        "overdue_days": 5
      }
    ],
    "complianceTrends": [
      {
        "date": "2025-01-01",
        "compliance_rate": 85.2
      }
    ]
  }
}
```

**Required Roles:** manager, hr_admin, superadmin

---

### 2. Employee Compliance Details

Get detailed compliance information for a specific employee.

```http
GET /compliance/employee/{employeeId}
```

**Path Parameters:**
- `employeeId`: UUID of the employee

**Query Parameters:**
- `includeHistory` (optional): Include compliance history (true/false)
- `status` (optional): Filter trainings by status (completed, overdue, pending)
- `limit` (optional): Limit number of training records returned

**Response:**
```json
{
  "success": true,
  "data": {
    "employee": {
      "id": "emp-123",
      "full_name": "John Doe",
      "email": "john@gangerdermatology.com",
      "department": "Dermatology",
      "location": "Main Office",
      "job_title": "Dermatologist",
      "start_date": "2024-01-15",
      "status": "active"
    },
    "complianceStats": {
      "totalTrainings": 8,
      "requiredTrainings": 6,
      "completedTrainings": 5,
      "overdueTrainings": 1,
      "pendingTrainings": 0,
      "complianceRate": 83.33,
      "averageScore": 91.2
    },
    "trainingCompletions": [
      {
        "id": "completion-123",
        "module": {
          "id": "module-1",
          "module_name": "HIPAA Training",
          "month_key": "2024-12"
        },
        "status": "completed",
        "completion_date": "2024-12-15T10:30:00Z",
        "due_date": "2024-12-31",
        "score": 95,
        "is_required": true,
        "time_spent_minutes": 45,
        "attempts_count": 1
      }
    ],
    "upcomingDeadlines": [
      {
        "module_name": "Safety Training",
        "due_date": "2025-01-31",
        "days_remaining": 20
      }
    ]
  }
}
```

**Required Roles:** 
- superadmin, hr_admin: Access to any employee
- manager: Access to employees in their department
- employee: Access to their own data only

---

### 3. Data Synchronization

Trigger manual synchronization with external systems.

```http
POST /compliance/sync
```

**Request Body:**
```json
{
  "syncType": "zenefits_employees|google_classroom_completions|both",
  "options": {
    "batchSize": 50,
    "skipExisting": false,
    "daysSince": 7,
    "assignNewHireTraining": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "syncLogId": "sync-log-123",
    "results": {
      "zenefits": {
        "processed": 45,
        "total": 45,
        "added": 3,
        "updated": 42,
        "skipped": 0,
        "errors": [],
        "newHires": 2
      },
      "classroom": {
        "processed": 128,
        "total": 128,
        "coursesProcessed": 5,
        "completionsFound": 128,
        "gradesUpdated": 115,
        "errors": []
      }
    },
    "duration": 15432,
    "status": "completed"
  }
}
```

**Required Roles:** hr_admin, superadmin

---

### 4. Data Export

Export compliance data in CSV or PDF format.

```http
GET /compliance/export?format=csv&type=summary&department=Dermatology
```

**Query Parameters:**
- `format`: Export format (csv, pdf)
- `type`: Export type (summary, detailed, overdue, compliance_matrix)
- `department` (optional): Filter by department
- `location` (optional): Filter by location
- `status` (optional): Filter by status
- `includePersonalInfo` (optional): Include employee names and emails (true/false)

**Response:**
Returns file download with appropriate Content-Type and Content-Disposition headers.

**CSV Export Example:**
```csv
department,totalEmployees,avgComplianceRate,compliantEmployees,nonCompliantEmployees
Dermatology,45,92.1%,41,4
Administration,25,88.0%,22,3
```

**Required Roles:** manager, hr_admin, superadmin

---

### 5. Health Check

Get system health status and service availability.

```http
GET /health
```

**Response:**
```json
{
  "overall": "healthy",
  "timestamp": "2025-01-10T15:30:00Z",
  "uptime": 86400,
  "services": [
    {
      "service": "database",
      "status": "healthy",
      "responseTime": 25,
      "lastCheck": "2025-01-10T15:30:00Z",
      "metadata": {
        "activeConnections": 5
      }
    },
    {
      "service": "zenefits",
      "status": "healthy",
      "responseTime": 250,
      "lastCheck": "2025-01-10T15:30:00Z"
    },
    {
      "service": "google-classroom",
      "status": "healthy",
      "responseTime": 180,
      "lastCheck": "2025-01-10T15:30:00Z"
    }
  ],
  "performance": {
    "memoryUsage": {
      "rss": 67108864,
      "heapTotal": 29360128,
      "heapUsed": 20471808,
      "external": 1089536
    }
  },
  "backgroundJobs": {
    "status": "running",
    "lastExecuted": "2025-01-10T06:00:00Z",
    "nextScheduled": "2025-01-11T06:00:00Z",
    "activeJobs": 5
  }
}
```

**No authentication required** (public health check)

---

### 6. Performance Metrics

Get detailed system and compliance metrics for monitoring.

```http
GET /monitoring/metrics?period=1h
```

**Query Parameters:**
- `period`: Time period for metrics (1h, 24h, 7d)

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2025-01-10T15:30:00Z",
    "period": "1h",
    "system": {
      "uptime": 86400,
      "memory": {
        "used": 20471808,
        "free": 8888320,
        "total": 29360128,
        "usagePercent": 69.7
      },
      "cpu": {
        "userTime": 1250.5,
        "systemTime": 485.2
      }
    },
    "compliance": {
      "totalEmployees": 150,
      "complianceRate": 87.5,
      "overdueTrainings": 12,
      "syncStatus": {
        "lastZenefitsSync": "2025-01-10T06:00:00Z",
        "lastClassroomSync": "2025-01-10T07:00:00Z",
        "syncErrors": 0
      }
    },
    "backgroundJobs": {
      "totalJobs": 24,
      "successfulJobs": 24,
      "failedJobs": 0,
      "avgExecutionTime": 15432
    }
  }
}
```

**Required Roles:** hr_admin, superadmin

---

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error details (development only)"
  }
}
```

### Common Error Codes

- `UNAUTHORIZED`: Missing or invalid authentication token
- `INSUFFICIENT_PERMISSIONS`: User lacks required role/permissions
- `VALIDATION_ERROR`: Invalid request parameters or body
- `RESOURCE_NOT_FOUND`: Requested resource does not exist
- `DATABASE_ERROR`: Database operation failed
- `EXTERNAL_API_ERROR`: External service (Zenefits/Google) error
- `RATE_LIMIT_EXCEEDED`: Too many requests from client
- `SYNC_IN_PROGRESS`: Sync operation already running
- `EXPORT_FAILED`: Data export generation failed

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `405`: Method Not Allowed
- `409`: Conflict (e.g., sync already in progress)
- `429`: Too Many Requests
- `500`: Internal Server Error
- `503`: Service Unavailable

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **General endpoints**: 100 requests per minute per user
- **Export endpoints**: 10 requests per minute per user
- **Sync endpoints**: 5 requests per minute per user
- **Health check**: No rate limit

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1641811200
```

---

## Real-time Updates

The API supports real-time updates via WebSocket connections using Supabase Realtime:

### Subscription Channels

- `compliance-updates`: General compliance data changes
- `sync-updates`: Synchronization progress and status
- `compliance-alerts`: Overdue training alerts
- `employee-{employeeId}`: Employee-specific updates

### Event Types

- `training_status_changed`: Training completion status updated
- `employee_update`: Employee information changed
- `sync_started`: Data synchronization started
- `sync_completed`: Data synchronization completed
- `overdue_alert`: New overdue training detected

---

## Background Jobs

The system runs automated background jobs for data synchronization and maintenance:

### Job Schedules

- **Daily Zenefits Sync**: 6:00 AM daily
- **Daily Google Classroom Sync**: 7:00 AM daily
- **Hourly Compliance Check**: Every hour
- **Weekly Reports**: 8:00 AM every Monday
- **Daily Maintenance**: 2:00 AM daily

### Job Management

Jobs can be monitored and controlled via the monitoring endpoints:

```http
GET /monitoring/jobs
POST /monitoring/jobs/{jobId}/trigger
PUT /monitoring/jobs/{jobId}/toggle
```

---

## Integration Setup

### Zenefits Integration

1. Obtain API token from Zenefits developer portal
2. Set environment variables:
   ```bash
   ZENEFITS_API_TOKEN=your_token_here
   ZENEFITS_API_BASE_URL=https://api.zenefits.com/core
   ```
3. Configure employee field mapping in database
4. Test connection via health check endpoint

### Google Classroom Integration

1. Create service account in Google Cloud Console
2. Enable Classroom API
3. Set environment variables:
   ```bash
   GOOGLE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   GOOGLE_CLASSROOM_DOMAIN=gangerdermatology.com
   ```
4. Configure course and coursework mapping
5. Test connection via health check endpoint

### Database Configuration

Required Supabase environment variables:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Deployment

### Environment Setup

1. Configure all required environment variables
2. Run database migrations:
   ```bash
   npm run db:migrate
   ```
3. Seed initial data if needed:
   ```bash
   npm run db:seed
   ```
4. Start the application:
   ```bash
   npm run start
   ```

### Health Verification

After deployment, verify system health:

1. Check health endpoint: `GET /health`
2. Verify external service connections
3. Test authentication with a sample request
4. Trigger a manual sync to verify integrations

### Monitoring Setup

1. Configure monitoring dashboard access
2. Set up alerting for critical metrics
3. Review background job schedules
4. Test export functionality

---

## Security Considerations

- All endpoints require authentication
- Role-based access control enforced
- Sensitive data filtered based on user permissions
- API rate limiting implemented
- Audit logging for all data access
- HTTPS required in production
- Environment variables for sensitive configuration

---

## Support and Troubleshooting

For issues with the Compliance Training API:

1. Check system health endpoint for service status
2. Review API logs for error details
3. Verify authentication and permissions
4. Test external service connectivity
5. Check background job status

Common issues:
- **Authentication failures**: Verify token validity and user permissions
- **Sync errors**: Check external service API credentials and connectivity
- **Performance issues**: Monitor metrics endpoint for system resources
- **Export failures**: Verify user permissions and data availability

---

*Last Updated: January 10, 2025*
*API Version: 1.0.0*