# Rate Limiting Implementation Guide

## Overview

The Ganger Platform now includes comprehensive API rate limiting to protect against abuse, DoS attacks, and to ensure fair usage of resources across all applications.

## Rate Limiting Strategy

### Protection Levels

1. **STRICT** - Sensitive operations (5 requests / 15 minutes)
2. **AUTH** - Authentication endpoints (10 requests / 15 minutes) 
3. **AI_PROCESSING** - AI/ML endpoints (20 requests / 5 minutes)
4. **STANDARD** - Regular API endpoints (100 requests / 15 minutes)
5. **LENIENT** - Public endpoints (300 requests / 15 minutes)
6. **MONITORING** - Health checks (60 requests / minute)

### Key Features

- **IP-based rate limiting** by default
- **User-based rate limiting** for authenticated endpoints
- **Endpoint-specific limits** for granular control
- **Standard HTTP headers** for client awareness
- **Graceful fallbacks** if rate limiting service fails
- **Redis support** for distributed rate limiting in production

## Implementation Examples

### 1. Basic API Endpoint Rate Limiting

```typescript
import { withRateLimit, RateLimits } from '@ganger/utils';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Your API logic here
}

export default withRateLimit(handler, RateLimits.STANDARD);
```

### 2. Authentication Endpoint

```typescript
import { withRateLimit, RateLimits } from '@ganger/utils';

async function loginHandler(req: NextApiRequest, res: NextApiResponse) {
  // Login logic here
}

// Uses IP + email for rate limiting key
export default withRateLimit(loginHandler, RateLimits.AUTH);
```

### 3. AI/ML Processing Endpoint

```typescript
import { withAuth } from '../../../lib/auth/middleware';
import { withRateLimit, RateLimits } from '@ganger/utils';

async function aiHandler(req: NextApiRequest, res: NextApiResponse) {
  // AI processing logic here
}

// Apply both authentication and rate limiting
export default withAuth(
  withRateLimit(aiHandler, RateLimits.AI_PROCESSING)
);
```

### 4. User-Specific Rate Limiting

```typescript
import { withAuth } from '../../../lib/auth/middleware';
import { withRateLimit, createUserRateLimit, RateLimits } from '@ganger/utils';

async function userDataHandler(req: NextApiRequest, res: NextApiResponse) {
  // User-specific operations
}

// Rate limit per authenticated user
export default withAuth(
  withRateLimit(
    userDataHandler, 
    createUserRateLimit(RateLimits.STANDARD)
  )
);
```

### 5. Custom Rate Limiting Configuration

```typescript
import { withRateLimit } from '@ganger/utils';

const customRateLimit = {
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // 50 requests per 10 minutes
  keyGenerator: (req) => {
    // Custom key generation logic
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return `custom:${ip}:${userAgent}`;
  },
  onLimitReached: (req, res) => {
    console.warn(`Rate limit exceeded for ${req.socket.remoteAddress}`);
  }
};

export default withRateLimit(handler, customRateLimit);
```

## Monitoring and Observability

### Rate Limit Headers

All rate-limited endpoints include standard headers:

```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 2025-01-08T15:30:00.000Z
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704723000
```

### Rate Limit Status Endpoint

Check current rate limit status:

```bash
GET /api/rate-limit-status
```

Response:
```json
{
  "timestamp": "2025-01-08T15:00:00.000Z",
  "rate_limit_status": {
    "key": "rate_limit:192.168.1.1",
    "current_count": 15,
    "reset_time": "2025-01-08T15:15:00.000Z",
    "rate_limiting_active": true
  }
}
```

### Health Check Integration

Rate limiting is integrated with health checks:

```bash
GET /api/health
```

Includes rate limiting status in response.

## Production Deployment

### Redis Configuration

For production environments with multiple instances, configure Redis:

```typescript
import { initializeRedisStore } from '@ganger/utils';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
initializeRedisStore(redis);
```

### Environment Variables

```bash
# Rate limiting configuration
RATE_LIMIT_REDIS_URL=redis://localhost:6379
RATE_LIMIT_ENABLED=true
RATE_LIMIT_TRUST_PROXY=true

# For Cloudflare deployments
RATE_LIMIT_HEADER_CF_CONNECTING_IP=true
```

## Application-Specific Implementation

### Medication Authorization App

✅ **Implemented Endpoints:**
- `/api/health` - MONITORING rate limit
- `/api/ai/analyze` - AI_PROCESSING rate limit 
- `/api/rate-limit-status` - Status endpoint

**TODO for other endpoints:**
- `/api/auth/*` - AUTH rate limit
- `/api/authorizations/*` - STANDARD rate limit
- `/api/patients/*` - STANDARD rate limit
- `/api/analytics/*` - STANDARD rate limit

### Other Applications

**Recommended Implementation Pattern:**

1. **Health checks** - MONITORING
2. **Authentication** - AUTH  
3. **Public APIs** - LENIENT
4. **Internal APIs** - STANDARD
5. **Resource-intensive operations** - STRICT
6. **AI/ML processing** - AI_PROCESSING

## Security Considerations

### DDoS Protection

Rate limiting provides first-line defense against:
- Brute force attacks on authentication
- API abuse and scraping
- Resource exhaustion attacks
- Accidental infinite loops in client code

### HIPAA Compliance

Rate limiting helps maintain HIPAA compliance by:
- Preventing unauthorized bulk data access
- Logging suspicious access patterns
- Protecting against data exfiltration attempts

### Monitoring and Alerting

**Recommended alerts:**
- High rate limit violation frequency
- Unusual access patterns from single IPs
- Rate limit service failures
- Performance degradation of rate limit checks

## Testing

### Unit Tests

```typescript
import { checkRateLimit, RateLimits } from '@ganger/utils';

test('rate limiting allows requests within limit', async () => {
  const mockReq = { socket: { remoteAddress: '127.0.0.1' }, url: '/test' };
  const result = await checkRateLimit(mockReq, RateLimits.STANDARD);
  
  expect(result.allowed).toBe(true);
  expect(result.remaining).toBe(99);
});
```

### Load Testing

```bash
# Test rate limiting with artillery
artillery run rate-limit-test.yml
```

## Migration Guide

### Existing Endpoints

1. Identify endpoint categories (auth, public, internal, etc.)
2. Apply appropriate rate limiting configuration
3. Update client applications to handle 429 responses
4. Monitor rate limit metrics post-deployment

### Gradual Rollout

1. Start with lenient limits
2. Monitor for false positives
3. Gradually tighten limits based on usage patterns
4. Implement user feedback mechanism for legitimate high-usage scenarios

## Performance Impact

- **Memory overhead**: ~1KB per active rate limit key
- **Processing overhead**: ~1-5ms per request
- **Redis dependency**: Optional but recommended for production
- **Fallback behavior**: Allows requests if rate limiting fails

## Troubleshooting

### Common Issues

1. **Rate limits too strict** - Monitor 429 error rates
2. **Key generation conflicts** - Ensure unique key patterns
3. **Redis connectivity** - Implement fallback to memory store
4. **Clock synchronization** - Important for distributed deployments

### Debug Endpoints

- `/api/rate-limit-status` - Current status
- `/api/health` - Overall system health including rate limiting
- Server logs include rate limiting events

---

**Implementation Status: ✅ Complete**
**Next Steps: Apply to remaining API endpoints across all applications**