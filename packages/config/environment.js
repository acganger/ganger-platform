// packages/config/environment.js
/**
 * Environment Configuration for Ganger Platform
 * Provides standardized environment utilities and security headers
 */

/**
 * Check if we're in development mode
 * @returns {boolean}
 */
function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if we're in production mode
 * @returns {boolean}
 */
function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * Get allowed domains for images and CORS
 * @returns {string[]}
 */
function getAllowedDomains() {
  const baseDomains = [
    'gangerdermatology.com',
    '*.gangerdermatology.com',
    'supabase.co',
    '*.supabase.co',
    'cloudflare.com',
    '*.cloudflare.com',
  ];

  if (isDevelopment()) {
    baseDomains.push(
      'localhost',
      '127.0.0.1',
      '*.localhost',
      'dev.gangerdermatology.com'
    );
  }

  return baseDomains;
}

/**
 * Get security headers for Next.js configuration
 * @returns {Array<{key: string, value: string}>}
 */
function getSecurityHeaders() {
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.gangerdermatology.com *.supabase.co",
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "img-src 'self' data: blob: *.gangerdermatology.com *.supabase.co",
    "font-src 'self' fonts.gstatic.com",
    "connect-src 'self' *.gangerdermatology.com *.supabase.co wss://*.supabase.co",
    "frame-src 'self' *.gangerdermatology.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ];

  if (isDevelopment()) {
    // Relax CSP for development
    cspDirectives[1] = "script-src 'self' 'unsafe-inline' 'unsafe-eval' *";
    cspDirectives[4] = "connect-src 'self' *";
  }

  return [
    {
      key: 'X-DNS-Prefetch-Control',
      value: 'on'
    },
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload'
    },
    {
      key: 'X-Frame-Options',
      value: 'SAMEORIGIN'
    },
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff'
    },
    {
      key: 'X-XSS-Protection',
      value: '1; mode=block'
    },
    {
      key: 'Referrer-Policy',
      value: 'origin-when-cross-origin'
    },
    {
      key: 'Content-Security-Policy',
      value: cspDirectives.join('; ')
    },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=()'
    }
  ];
}

/**
 * Get the current deployment environment
 * @returns {string}
 */
function getDeploymentEnvironment() {
  return process.env.DEPLOYMENT_ENV || process.env.NODE_ENV || 'development';
}

/**
 * Get the app URL based on environment and app name
 * @param {string} appName 
 * @returns {string}
 */
function getAppUrl(appName) {
  if (isDevelopment()) {
    const portMap = {
      'staff': '3001',
      'reps': '3002', 
      'kiosk': '3003',
      'medication-auth': '3005',
      'integration-status': '3006',
      'platform-dashboard': '3007'
    };
    const port = portMap[appName] || '3000';
    return `http://localhost:${port}`;
  }
  
  return `https://${appName}.gangerdermatology.com`;
}

module.exports = {
  isDevelopment,
  isProduction,
  getAllowedDomains,
  getSecurityHeaders,
  getDeploymentEnvironment,
  getAppUrl
};