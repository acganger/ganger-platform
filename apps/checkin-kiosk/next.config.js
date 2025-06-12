// apps/checkin-kiosk/next.config.js
/**
 * Check-in Kiosk Next.js Configuration
 * Uses standardized configuration from @ganger/config
 */

const { createNextConfig } = require('@ganger/config/next-config-template');

// App-specific configuration for check-in kiosk
const appSpecificConfig = {
  // Environment variables specific to check-in kiosk
  env: {
    NEXT_PUBLIC_APP_NAME: 'Check-in Kiosk',
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_ENABLE_PAYMENT_PROCESSING: process.env.NEXT_PUBLIC_ENABLE_PAYMENT_PROCESSING || 'true',
    NEXT_PUBLIC_KIOSK_MODE: process.env.NEXT_PUBLIC_KIOSK_MODE || 'true',
    NEXT_PUBLIC_AUTO_REFRESH_INTERVAL: process.env.NEXT_PUBLIC_AUTO_REFRESH_INTERVAL || '300000', // 5 minutes
  },

  // Additional transpile packages for payment processing
  transpilePackages: [
    '@stripe/stripe-js',
    '@stripe/react-stripe-js',
  ],

  // Additional security headers for kiosk mode
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    const headers = [];
    
    if (isProduction) {
      headers.push({
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Extra protection for kiosk
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate', // Prevent caching for kiosk
          },
        ],
      });
    }
    
    return headers;
  },

  // Kiosk-specific redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/',
        permanent: false, // Temporary redirect in kiosk mode
      },
      {
        source: '/settings',
        destination: '/',
        permanent: false,
      },
    ];
  },

  // Webpack optimizations for kiosk display
  webpack: (config, { isServer }) => {
    // Optimize for touch interfaces
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@kiosk': require('path').resolve(__dirname, 'src'),
      };
    }

    return config;
  },
};

module.exports = createNextConfig('checkin-kiosk', appSpecificConfig);