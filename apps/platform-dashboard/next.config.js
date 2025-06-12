/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: [
      '@ganger/db',
      '@ganger/integrations/server'
    ]
  },
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  eslint: {
    dirs: ['src'],
    ignoreDuringBuilds: false,
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'Platform Dashboard',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
  webpack: (config, { isServer }) => {
    // Prevent server-only packages from being bundled in client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        dns: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        child_process: false,
      };
      
      config.externals = [
        ...config.externals,
        '@ganger/db',
        '@ganger/integrations/server',
        'puppeteer',
        'puppeteer-core',
        'googleapis',
        'ioredis'
      ];
    }
    
    return config;
  },
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/',
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;