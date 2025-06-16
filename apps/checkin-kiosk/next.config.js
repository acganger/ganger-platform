// apps/checkin-kiosk/next.config.js
/**
 * Check-in Kiosk Next.js Configuration
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

  // Note: headers and redirects removed for static export compatibility

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

// Merge app-specific config with base config
const finalConfig = {
  ...nextConfig,
  ...appSpecificConfig,
  transpilePackages: [
    ...nextConfig.transpilePackages,
    '@stripe/stripe-js',
    '@stripe/react-stripe-js',
  ],
};

module.exports = finalConfig;