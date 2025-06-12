# API Response Standardization

## Overview

The Ganger Platform implements standardized API response formats across all applications to ensure consistency, improve client development experience, and provide comprehensive error information for debugging and monitoring.

## Response Format Standards

### Success Response Format

```typescript
{
  "success": true,
  "data": any,              // The actual response data
  "timestamp": string,      // ISO 8601 timestamp
  "requestId": string,      // Unique request identifier
  "path": string,          // API endpoint path
  "method": string,        // HTTP method
  "statusCode": number,    // HTTP status code
  "meta": {                // Optional metadata
    "pagination": {
      "page": number,
      "limit": number,
      "total": number,
      "totalPages": number
    },
    "performance": {
      "duration_ms": number,
      "cached": boolean
    }
  }
}
```

### Error Response Format

```typescript
{
  "error": string,         // Error message
  "code": string,          // Standardized error code
  "message": string,       // User-friendly message
  "details": any,          // Additional error details
  "timestamp": string,     // ISO 8601 timestamp
  "requestId": string,     // Unique request identifier
  "path": string,          // API endpoint path
  "method": string,        // HTTP method
  "statusCode": number     // HTTP status code
}
```

### Validation Error Response Format

```typescript
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "message": "One or more fields contain invalid values",
  "details": [
    {
      "field": string,     // Field name that failed validation
      "message": string,   // Validation error message
      "code": string,      // Validation error code
      "value": any         // The invalid value (optional)
    }
  ],
  "timestamp": string,
  "requestId": string,
  "path": string,
  "method": string,
  "statusCode": 400
}
```

## Standard Error Codes

### Authentication & Authorization
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Access denied
- `TOKEN_EXPIRED` - Session expired
- `INVALID_CREDENTIALS` - Login failed

### Validation
- `VALIDATION_ERROR` - Input validation failed
- `MISSING_REQUIRED_FIELD` - Required field missing
- `INVALID_FORMAT` - Format validation failed

### Resources
- `NOT_FOUND` - Resource not found
- `ALREADY_EXISTS` - Resource already exists
- `RESOURCE_CONFLICT` - Resource conflict

### Rate Limiting
- `RATE_LIMIT_EXCEEDED` - Too many requests

### Server Errors
- `INTERNAL_SERVER_ERROR` - Unhandled server error
- `DATABASE_ERROR` - Database operation failed
- `EXTERNAL_SERVICE_ERROR` - External service unavailable

### Business Logic
- `BUSINESS_RULE_VIOLATION` - Business rule violated
- `INSUFFICIENT_PERMISSIONS` - Insufficient permissions
- `OPERATION_NOT_ALLOWED` - Operation not allowed

### HIPAA Specific
- `PHI_ACCESS_DENIED` - Protected health information access denied
- `AUDIT_LOG_REQUIRED` - Audit logging required
- `CONSENT_REQUIRED` - Patient consent required

## Implementation Examples

### Basic Success Response

```typescript
import { respondWithSuccess } from '@ganger/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const data = { message: 'Hello World' };
  
  return respondWithSuccess(res, data, req);
}
```

Response:
```json
{
  "success": true,
  "data": { "message": "Hello World" },
  "timestamp": "2025-01-08T15:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "path": "/api/hello",
  "method": "GET",
  "statusCode": 200
}
```

### Error Response with Details

```typescript
import { respondWithError, ErrorCodes } from '@ganger/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return respondWithError(
    res,
    'User not found',
    404,
    ErrorCodes.NOT_FOUND,
    req,
    { userId: req.query.id }
  );
}
```

Response:
```json
{
  "error": "User not found",
  "code": "NOT_FOUND",
  "message": "The requested resource was not found",
  "details": { "userId": "123" },
  "timestamp": "2025-01-08T15:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440001",
  "path": "/api/users/123",
  "method": "GET",
  "statusCode": 404
}
```

### Validation Error Response

```typescript
import { transformZodErrors } from '@ganger/utils';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  age: z.number().min(0)
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const validation = schema.safeParse(req.body);
  
  if (!validation.success) {
    throw transformZodErrors(validation.error);
  }
  
  // Continue with valid data...
}
```

Response:
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "message": "One or more fields contain invalid values",
  "details": [
    {
      "field": "email",
      "message": "Invalid email",
      "code": "invalid_string",
      "value": "not-an-email"
    },
    {
      "field": "age",
      "message": "Number must be greater than or equal to 0",
      "code": "too_small",
      "value": -5
    }
  ],
  "timestamp": "2025-01-08T15:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440002",
  "path": "/api/users",
  "method": "POST",
  "statusCode": 400
}
```

### Using Standard Error Handling Middleware

```typescript
import { withStandardErrorHandling, NotFoundError } from '@ganger/utils';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await findUser(req.query.id);
  
  if (!user) {
    throw new NotFoundError('User');
  }
  
  return respondWithSuccess(res, user, req);
}

// Apply standard error handling
export default withStandardErrorHandling(handler);
```

### Paginated Response

```typescript
import { respondWithSuccess } from '@ganger/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  const { data, total } = await getUsers(page, limit);
  
  return respondWithSuccess(res, data, req, 200, {
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    performance: {
      duration_ms: 42,
      cached: false
    }
  });
}
```

Response:
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "John Doe" },
    { "id": 2, "name": "Jane Smith" }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    },
    "performance": {
      "duration_ms": 42,
      "cached": false
    }
  },
  "timestamp": "2025-01-08T15:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440003",
  "path": "/api/users",
  "method": "GET",
  "statusCode": 200
}
```

## Custom Error Classes

### API Error

```typescript
import { ApiError, ErrorCodes, ErrorSeverity } from '@ganger/utils';

throw new ApiError(
  'Custom error message',
  422,
  ErrorCodes.BUSINESS_RULE_VIOLATION,
  { customDetails: 'Additional info' },
  ErrorSeverity.HIGH
);
```

### Authentication Error

```typescript
import { AuthenticationError } from '@ganger/utils';

throw new AuthenticationError('Invalid token', { tokenType: 'Bearer' });
```

### HIPAA Error

```typescript
import { HIPAAError, ErrorCodes } from '@ganger/utils';

throw new HIPAAError(
  'Patient consent required for this operation',
  ErrorCodes.CONSENT_REQUIRED,
  { patientId: '12345', operation: 'view_medical_records' }
);
```

## HTTP Status Code Guidelines

- **200** - Success (GET, PUT, PATCH)
- **201** - Created (POST)
- **204** - No Content (DELETE)
- **400** - Bad Request (validation errors)
- **401** - Unauthorized (authentication required)
- **403** - Forbidden (access denied)
- **404** - Not Found
- **409** - Conflict (resource already exists)
- **422** - Unprocessable Entity (business rule violation)
- **429** - Too Many Requests (rate limited)
- **500** - Internal Server Error
- **503** - Service Unavailable (external service down)

## Error Transformation

### Zod Validation Errors

```typescript
import { transformZodErrors } from '@ganger/utils';

const validation = schema.safeParse(data);
if (!validation.success) {
  throw transformZodErrors(validation.error);
}
```

### Supabase Database Errors

```typescript
import { transformSupabaseError } from '@ganger/utils';

try {
  await supabase.from('users').insert(data);
} catch (error) {
  throw transformSupabaseError(error);
}
```

## Method Not Allowed Handling

```typescript
import { handleMethodNotAllowed } from '@ganger/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return handleMethodNotAllowed(req, res, ['GET']);
  }
  
  // Handle GET request...
}
```

## Client Error Handling

### JavaScript/TypeScript Client

```typescript
async function apiCall(endpoint: string) {
  try {
    const response = await fetch(endpoint);
    const data = await response.json();
    
    if (!data.success) {
      // Handle error response
      console.error(`API Error [${data.code}]:`, data.message);
      
      if (data.code === 'VALIDATION_ERROR') {
        // Handle validation errors
        data.details.forEach(error => {
          console.error(`${error.field}: ${error.message}`);
        });
      }
      
      throw new Error(data.message);
    }
    
    return data.data;
    
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}
```

### React Hook for API Calls

```typescript
import { useState } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: StandardErrorResponse | null;
}

function useApi<T>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  });
  
  const call = async (endpoint: string, options?: RequestInit) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch(endpoint, options);
      const result = await response.json();
      
      if (result.success) {
        setState({ data: result.data, loading: false, error: null });
      } else {
        setState({ data: null, loading: false, error: result });
      }
    } catch (error) {
      setState({ 
        data: null, 
        loading: false, 
        error: { 
          error: error.message,
          code: 'NETWORK_ERROR',
          message: 'Network request failed'
        } 
      });
    }
  };
  
  return { ...state, call };
}
```

## Migration Guide

### Converting Existing Endpoints

1. **Install standardized utilities**:
   ```typescript
   import { 
     withStandardErrorHandling,
     respondWithSuccess,
     respondWithError,
     ErrorCodes
   } from '@ganger/utils';
   ```

2. **Wrap handlers with error middleware**:
   ```typescript
   export default withStandardErrorHandling(handler);
   ```

3. **Replace custom error responses**:
   ```typescript
   // Before
   return res.status(404).json({ error: 'Not found' });
   
   // After
   return respondWithError(res, 'User not found', 404, ErrorCodes.NOT_FOUND, req);
   ```

4. **Replace custom success responses**:
   ```typescript
   // Before
   return res.status(200).json({ data: user });
   
   // After
   return respondWithSuccess(res, user, req);
   ```

### Testing Standardized Responses

```typescript
import { createMocks } from 'node-mocks-http';
import handler from '../api/users';

test('returns standardized success response', async () => {
  const { req, res } = createMocks({
    method: 'GET',
    url: '/api/users'
  });
  
  await handler(req, res);
  
  const data = JSON.parse(res._getData());
  
  expect(data.success).toBe(true);
  expect(data.data).toBeDefined();
  expect(data.timestamp).toBeDefined();
  expect(data.requestId).toBeDefined();
  expect(data.statusCode).toBe(200);
});

test('returns standardized error response', async () => {
  const { req, res } = createMocks({
    method: 'GET',
    url: '/api/users/invalid-id'
  });
  
  await handler(req, res);
  
  const data = JSON.parse(res._getData());
  
  expect(data.success).toBeUndefined();
  expect(data.error).toBeDefined();
  expect(data.code).toBe('NOT_FOUND');
  expect(data.message).toBeDefined();
  expect(data.statusCode).toBe(404);
});
```

## Benefits

1. **Consistency** - All APIs use the same response format
2. **Debugging** - Request IDs and timestamps for tracing
3. **Client Development** - Predictable error handling
4. **Monitoring** - Standardized error codes for alerting
5. **Documentation** - Self-documenting error responses
6. **HIPAA Compliance** - Proper error handling for PHI access

---

**Implementation Status: ✅ Complete**
**Next Steps: Apply to all existing API endpoints across applications**