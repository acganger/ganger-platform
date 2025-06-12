// apps/clinical-staffing/next.config.js
/**
 * Clinical Staffing Next.js Configuration
 * Uses standardized configuration from @ganger/config
 */

const { createNextConfig } = require('@ganger/config/next-config-template');

// App-specific configuration
const appSpecificConfig = {
  // Environment variables specific to clinical staffing
  env: {
    NEXT_PUBLIC_APP_NAME: 'Clinical Staffing',
    NEXT_PUBLIC_ENABLE_ADVANCED_SCHEDULING: process.env.NEXT_PUBLIC_ENABLE_ADVANCED_SCHEDULING || 'true',
    NEXT_PUBLIC_ENABLE_DRAG_DROP: process.env.NEXT_PUBLIC_ENABLE_DRAG_DROP || 'true',
    NEXT_PUBLIC_MAX_STAFF_PER_SHIFT: process.env.NEXT_PUBLIC_MAX_STAFF_PER_SHIFT || '10',
    NEXT_PUBLIC_MIN_STAFF_PER_SHIFT: process.env.NEXT_PUBLIC_MIN_STAFF_PER_SHIFT || '2',
  },

  // Additional transpile packages for clinical staffing
  transpilePackages: [
    'react-beautiful-dnd', // For drag and drop functionality
    '@dnd-kit/core', // Alternative DnD library
    '@dnd-kit/sortable',
    '@dnd-kit/utilities',
  ],

  // Webpack optimizations for clinical staffing
  webpack: (config, { isServer, dev }) => {
    // Add alias for clinical staffing specific modules
    config.resolve.alias = {
      ...config.resolve.alias,
      '@clinical': require('path').resolve(__dirname, 'src'),
    };

    return config;
  },

  // Redirects specific to clinical staffing
  async redirects() {
    return [
      {
        source: '/staffing',
        destination: '/',
        permanent: true,
      },
      {
        source: '/schedule',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

module.exports = createNextConfig('clinical-staffing', appSpecificConfig);