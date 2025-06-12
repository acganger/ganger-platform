/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export for now to allow server-side features
  // output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'dist',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'Medication Authorization Assistant',
    NEXT_PUBLIC_APP_VERSION: '1.0.0'
  },
  transpilePackages: [
    '@ganger/ui',
    '@ganger/auth', 
    '@ganger/db',
    '@ganger/integrations',
    '@ganger/utils'
  ],
  experimental: {
    optimizePackageImports: ['@ganger/ui', '@tanstack/react-query', 'recharts']
  },
  webpack: (config) => {
    // Handle chart libraries and AI processing
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
      encoding: false
    };
    return config;
  }
};

module.exports = nextConfig;