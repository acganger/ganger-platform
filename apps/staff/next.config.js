/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Allow production builds to complete even with ESLint warnings
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@ganger/auth', '@ganger/db', '@ganger/integrations', '@ganger/ui', '@ganger/utils', '@ganger/types'],
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
        'puppeteer',
        'puppeteer-core', 
        'googleapis',
        'mysql2'
      ];
    }
    
    return config;
  },
  experimental: {
    esmExternals: true,
    serverComponentsExternalPackages: [
      'puppeteer',
      'googleapis',
      'mysql2'
    ]
  },
  images: {
    domains: ['pfqtzmxxxhhsxmlddrta.supabase.co'],
  },
};

module.exports = nextConfig;