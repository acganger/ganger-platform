/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ganger/ui', '@ganger/db', '@ganger/auth'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    // Removed deprecated appDir option
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'Pharmaceutical Scheduling',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_PHARMA_URL || 'http://localhost:3004'
  },
  async rewrites() {
    return [
      {
        source: '/api/pharma-scheduling/:path*',
        destination: '/api/pharma/:path*'
      }
    ];
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' }
        ]
      }
    ];
  }
};

module.exports = nextConfig;