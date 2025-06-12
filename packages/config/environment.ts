// packages/config/environment.ts
/**
 * Centralized Environment Configuration for Ganger Platform
 * Handles environment-specific settings across all applications
 */

export interface AppEnvironmentConfig {
  // Application Identity
  name: string;
  url: string;
  version: string;
  
  // Core Infrastructure
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
  };
  
  // Authentication
  auth: {
    googleClientId: string;
    googleClientSecret?: string;
    domain: string;
  };
  
  // Feature Flags
  features: {
    enableAnalytics: boolean;
    enableDebug: boolean;
    enableRealtime: boolean;
    enableOfflineMode: boolean;
  };
  
  // External Services (app-specific)
  external?: {
    openaiApiKey?: string;
    stripePublishableKey?: string;
    stripeSecretKey?: string;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    slackWebhookUrl?: string;
    threecxApiUrl?: string;
    threecxApiToken?: string;
  };
  
  // Security & Compliance
  security: {
    enforceHTTPS: boolean;
    enableHIPAACompliance: boolean;
    sessionTimeout: number;
    csrfProtection: boolean;
  };
  
  // Performance & Caching
  performance: {
    enableRedis: boolean;
    redisUrl?: string;
    cacheTTL: number;
    enableCompression: boolean;
  };
}

/**
 * Environment variable validation and parsing
 */
function validateEnvironment(): void {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'GOOGLE_CLIENT_ID'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate URL formats
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !isValidUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must be a valid URL');
  }
}

/**
 * Get the current environment (development, staging, production)
 */
export function getEnvironment(): 'development' | 'staging' | 'production' {
  const env = process.env.NODE_ENV;
  const deployment = process.env.DEPLOYMENT_ENV;
  
  if (env === 'production' && deployment === 'staging') {
    return 'staging';
  }
  
  return (env as any) || 'development';
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return getEnvironment() === 'development';
}

/**
 * Check if running in production mode (including staging)
 */
export function isProduction(): boolean {
  return getEnvironment() !== 'development';
}

/**
 * Get API base URL based on environment
 */
export function getApiBaseUrl(appName?: string): string {
  const env = getEnvironment();
  
  if (env === 'development') {
    // In development, use localhost with appropriate port
    const portMap: Record<string, number> = {
      'staff': 3001,
      'clinical-staffing': 3002,
      'medication-auth': 3003,
      'call-center-ops': 3004,
      'integration-status': 3005,
      'platform-dashboard': 3006,
      'socials-reviews': 3007,
      'handouts': 3008,
      'inventory': 3009,
      'checkin-kiosk': 3010,
      'eos-l10': 3011,
      'pharma-scheduling': 3012,
      'compliance-training': 3013,
      'batch-closeout': 3014,
      'config-dashboard': 3015
    };
    
    const port = appName && portMap[appName] ? portMap[appName] : 3000;
    return `http://localhost:${port}`;
  }
  
  // Production URLs from environment or default patterns
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (baseUrl) {
    return baseUrl;
  }
  
  // Fallback to domain-based pattern
  const domain = 'gangerdermatology.com';
  if (appName) {
    return `https://${appName}.${domain}`;
  }
  
  return `https://${domain}`;
}

/**
 * Get complete app configuration based on app name and environment
 */
export function getAppConfig(appName: string): AppEnvironmentConfig {
  // Validate environment first
  validateEnvironment();
  
  const env = getEnvironment();
  const isProduction = env !== 'development';
  
  // Base configuration
  const config: AppEnvironmentConfig = {
    name: appName,
    url: getApiBaseUrl(appName),
    version: process.env.npm_package_version || '1.0.0',
    
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    
    auth: {
      googleClientId: process.env.GOOGLE_CLIENT_ID!,
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
      domain: process.env.GOOGLE_DOMAIN || 'gangerdermatology.com',
    },
    
    features: {
      enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
      enableDebug: !isProduction,
      enableRealtime: process.env.NEXT_PUBLIC_ENABLE_REALTIME !== 'false',
      enableOfflineMode: process.env.NEXT_PUBLIC_ENABLE_OFFLINE_MODE === 'true',
    },
    
    security: {
      enforceHTTPS: isProduction,
      enableHIPAACompliance: true, // Always enabled for medical platform
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '86400'),
      csrfProtection: isProduction,
    },
    
    performance: {
      enableRedis: process.env.REDIS_HOST !== undefined,
      redisUrl: process.env.REDIS_URL,
      cacheTTL: parseInt(process.env.CACHE_TTL || '300'),
      enableCompression: isProduction,
    },
  };
  
  // App-specific configurations
  if (appName === 'medication-auth') {
    config.external = {
      openaiApiKey: process.env.OPENAI_API_KEY,
    };
  }
  
  if (appName === 'checkin-kiosk') {
    config.external = {
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    };
  }
  
  if (appName === 'call-center-ops') {
    config.external = {
      threecxApiUrl: process.env.THREECX_API_URL,
      threecxApiToken: process.env.THREECX_API_TOKEN,
    };
  }
  
  // Add common external services
  config.external = {
    ...config.external,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
  };
  
  return config;
}

/**
 * Get environment-specific domains for CORS and security
 */
export function getAllowedDomains(): string[] {
  const env = getEnvironment();
  
  if (env === 'development') {
    return [
      'localhost',
      '127.0.0.1',
      'localhost:3000',
      'localhost:3001',
      'localhost:3002',
      'localhost:3003',
      'localhost:3004',
      'localhost:3005',
      'localhost:3006',
      'localhost:3007',
      'localhost:3008',
      'localhost:3009',
      'localhost:3010',
      'localhost:3011',
      'localhost:3012',
      'localhost:3013',
      'localhost:3014',
      'localhost:3015',
    ];
  }
  
  return [
    'gangerdermatology.com',
    '*.gangerdermatology.com',
    'pfqtzmxxxhhsxmlddrta.supabase.co', // Supabase domain
  ];
}

/**
 * Helper function to validate URLs
 */
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Get CORS configuration for the current environment
 */
export function getCorsConfig() {
  const env = getEnvironment();
  const allowedDomains = getAllowedDomains();
  
  return {
    origin: env === 'development' 
      ? true // Allow all origins in development
      : allowedDomains,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
      'X-Request-ID',
    ],
  };
}

/**
 * Get security headers for the current environment
 */
export function getSecurityHeaders() {
  const env = getEnvironment();
  const isProduction = env !== 'development';
  
  const headers = [
    {
      key: 'X-Frame-Options',
      value: 'DENY',
    },
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin',
    },
    {
      key: 'X-DNS-Prefetch-Control',
      value: 'on',
    },
  ];
  
  if (isProduction) {
    headers.push(
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
      },
      {
        key: 'Content-Security-Policy',
        value: `
          default-src 'self';
          script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com;
          style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
          img-src 'self' data: blob: https://pfqtzmxxxhhsxmlddrta.supabase.co;
          connect-src 'self' https://pfqtzmxxxhhsxmlddrta.supabase.co wss://pfqtzmxxxhhsxmlddrta.supabase.co;
          font-src 'self' https://fonts.gstatic.com;
          frame-src https://js.stripe.com;
        `.replace(/\s+/g, ' ').trim(),
      }
    );
  }
  
  return headers;
}

// Export default configuration for convenience
export default {
  getAppConfig,
  getEnvironment,
  isDevelopment,
  isProduction,
  getApiBaseUrl,
  getAllowedDomains,
  getCorsConfig,
  getSecurityHeaders,
};