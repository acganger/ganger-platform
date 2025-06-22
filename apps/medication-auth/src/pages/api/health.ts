import { createHealthCheckEndpoint, withRateLimit, RateLimits } from '../../lib/utils/mock-health-check';


// Health check endpoint for Medication Authorization Service
// Monitors database, AI services, and external integrations
const healthCheckHandler = createHealthCheckEndpoint('medication-authorization', {
  'openai-api': 'https://api.openai.com/v1/models',
  'modmed-fhir': process.env.MODMED_FHIR_BASE_URL || 'https://api.modmed.com/fhir',
  'supabase': process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/',
});

// Apply rate limiting to health check
export default withRateLimit(healthCheckHandler, RateLimits.MONITORING);