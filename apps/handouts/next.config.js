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
    NEXT_PUBLIC_APP_NAME: 'Handouts Generator',
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
    optimizePackageImports: ['@ganger/ui', 'jspdf']
  },
  webpack: (config) => {
    // Handle PDF generation libraries and Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
      canvas: false,
      encoding: false,
      dns: false,
      module: false,
      child_process: false
    };
    
    // Ignore server-side only packages
    config.externals = config.externals || {};
    config.externals.puppeteer = 'puppeteer';
    config.externals['puppeteer-core'] = 'puppeteer-core';
    
    return config;
  }
};

module.exports = nextConfig;