/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export configuration for R2 deployment
  reactStrictMode: true,
  transpilePackages: ['@ganger/auth', '@ganger/db', '@ganger/integrations', '@ganger/ui', '@ganger/utils'],
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  eslint: { ignoreDuringBuilds: true },
  images: { domains: ['pfqtzmxxxhhsxmlddrta.supabase.co'], unoptimized: true },
  
  // Bundle optimization for compliance dashboard
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side optimization
      config.resolve.fallback = {
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
        '@ganger/db',
        '@ganger/integrations/server',
        'googleapis',
        'ioredis',
        'stripe' // Server Stripe SDK
      ];
    }
    
    return config;
  },
  
  // Note: serverActions removed for static export compatibility
};

module.exports = nextConfig;