import { createRateLimitStatusEndpoint } from '@ganger/utils';

// Rate limit status endpoint - shows current rate limit status for the requesting IP
export default createRateLimitStatusEndpoint();
// Cloudflare Workers Edge Runtime
export const runtime = 'edge';
