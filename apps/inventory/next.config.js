/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'dist',
  images: {
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'Inventory Management',
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
    optimizePackageImports: ['@ganger/ui']
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