/** @type {import('next').NextConfig} */
const nextConfig = {
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
    NEXT_PUBLIC_APP_NAME: 'Staff Management System',
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
    optimizePackageImports: ['@ganger/ui', '@tanstack/react-query', 'lucide-react']
  },
  webpack: (config) => {
    // Handle modern React patterns and optimization
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  }
};

module.exports = nextConfig;