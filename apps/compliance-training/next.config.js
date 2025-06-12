/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for dashboard performance
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com']
  },
  
  // Enable real-time features
  experimental: {
    serverActions: true
  },
  
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
  
  experimental: {
    serverComponentsExternalPackages: [
      'puppeteer',
      'googleapis', 
      '@ganger/db'
    ]
  }
};

module.exports = nextConfig;