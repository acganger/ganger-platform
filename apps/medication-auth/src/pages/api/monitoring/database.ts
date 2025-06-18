import { createDatabaseStatsEndpoint } from '../../../lib/utils/mock-health-check';
import { withAuth } from '../../../lib/auth/middleware';

// Database monitoring endpoint - requires authentication
// Provides detailed database performance metrics
const handler = createDatabaseStatsEndpoint();

export default withAuth(handler, {
  requiredRole: 'manager',
  logPHIAccess: true
});
// Cloudflare Workers Edge Runtime
export const runtime = 'edge';
