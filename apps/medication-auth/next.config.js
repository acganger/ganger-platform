/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for deployment
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
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