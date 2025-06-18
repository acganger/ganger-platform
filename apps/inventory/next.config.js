/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ganger/auth', '@ganger/db', '@ganger/integrations', '@ganger/ui', '@ganger/utils', 'date-fns'],
  
  // Cloudflare Workers runtime
  experimental: {
    runtime: 'edge',
  },
  
  // Staff portal integration
  basePath: '/inventory',
  assetPrefix: '/inventory',
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['pfqtzmxxxhhsxmlddrta.supabase.co'],
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude server-side modules from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
        url: false,
        querystring: false
      };
      
      // Ignore server-side modules in client bundle
      config.externals = config.externals || [];
      config.externals.push({
        'puppeteer': 'commonjs puppeteer',
        'puppeteer-core': 'commonjs puppeteer-core',
        'googleapis': 'commonjs googleapis'
      });
    }
    return config;
  }
};

module.exports = nextConfig;