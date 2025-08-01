/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ganger/types', '@ganger/db', '@ganger/auth', '@ganger/cache', '@ganger/utils', '@ganger/ui', '@ganger/config', '@ganger/ai', '@ganger/deps', '@ganger/docs', '@ganger/integrations', '@ganger/monitoring', '@ganger/ui-catalyst'],
  
  // This app is served at /actions through the staff portal router
  basePath: '/actions',
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    domains: ['pfqtzmxxxhhsxmlddrta.supabase.co'],
    unoptimized: true,
  },
  output: 'standalone',
  
  // Generate source maps in production for better error tracking
  // These will be uploaded by Vercel's Sentry integration
  productionBrowserSourceMaps: true,

  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve these Node.js modules on the client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        dns: false,
        net: false,
        tls: false,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

// Export the config directly without Sentry webpack plugin
// Sentry will be initialized at runtime based on environment variables
// Source maps and releases will be handled by Vercel's Sentry integration
module.exports = nextConfig;
