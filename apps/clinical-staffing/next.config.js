// apps/clinical-staffing/next.config.js
/**
 * Clinical Staffing Next.js Configuration
 * Uses standardized configuration from @ganger/config
 */

// Static export configuration for R2 deployment
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ganger/auth', '@ganger/db', '@ganger/integrations', '@ganger/ui', '@ganger/utils'],
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  eslint: { ignoreDuringBuilds: true },
  images: { domains: ['pfqtzmxxxhhsxmlddrta.supabase.co'], unoptimized: true },
};

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

  // Note: redirects removed for static export compatibility
};

// Merge app-specific config with base config
const finalConfig = {
  ...nextConfig,
  ...appSpecificConfig,
  transpilePackages: [
    ...nextConfig.transpilePackages,
    'react-beautiful-dnd',
    '@dnd-kit/core',
    '@dnd-kit/sortable',
    '@dnd-kit/utilities',
  ],
};

module.exports = finalConfig;