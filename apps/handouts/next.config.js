/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ganger/auth', '@ganger/db', '@ganger/integrations', '@ganger/ui', '@ganger/utils'],
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['pfqtzmxxxhhsxmlddrta.supabase.co'],
    unoptimized: true,
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