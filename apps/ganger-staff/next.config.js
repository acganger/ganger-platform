/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ganger/types', '@ganger/db', '@ganger/auth', '@ganger/cache', '@ganger/utils', '@ganger/ui', '@ganger/config', '@ganger/ai', '@ganger/deps', '@ganger/docs', '@ganger/integrations', '@ganger/monitoring'],
  
  // Router app - rewrites traffic to individual apps
  async rewrites() {
    return [
      // Core Medical Apps
      { source: '/inventory/:path*', destination: 'https://ganger-inventory-na2t6dogs-ganger.vercel.app/inventory/:path*' },
      { source: '/handouts/:path*', destination: 'https://ganger-handouts-e2d69160i-ganger.vercel.app/handouts/:path*' },
      { source: '/l10/:path*', destination: 'https://ganger-eos-l10-chpqq1d72-ganger.vercel.app/l10/:path*' },
      
      // Staff Operations Apps  
      { source: '/actions/:path*', destination: 'https://ganger-actions-pnqy0jk6s-ganger.vercel.app/actions/:path*' },
      { source: '/clinical-staffing/:path*', destination: 'https://ganger-clinical-staffing-rjnjibls2-ganger.vercel.app/clinical-staffing/:path*' },
      { source: '/call-center/:path*', destination: 'https://ganger-call-center-ops-o6luqqlmn-ganger.vercel.app/call-center/:path*' },
      
      // Business Systems Apps
      { source: '/batch/:path*', destination: 'https://ganger-batch-closeout-b89h45uet-ganger.vercel.app/batch/:path*' },
      { source: '/compliance/:path*', destination: 'https://ganger-compliance-training-5logoemhm-ganger.vercel.app/compliance/:path*' },
      { source: '/socials/:path*', destination: 'https://ganger-socials-reviews-41drr4zkp-ganger.vercel.app/socials/:path*' },
      
      // Infrastructure Apps
      { source: '/platform-dashboard/:path*', destination: 'https://ganger-platform-dashboard-r977c7isb-ganger.vercel.app/platform-dashboard/:path*' },
      { source: '/config/:path*', destination: 'https://ganger-config-dashboard-csg4swqsq-ganger.vercel.app/config/:path*' },
      { source: '/status/:path*', destination: 'https://ganger-integration-status-7ax1b5q4y-ganger.vercel.app/status/:path*' },
      { source: '/component-showcase/:path*', destination: 'https://ganger-component-showcase-orrx3hram-ganger.vercel.app/component-showcase/:path*' },
      { source: '/ai-receptionist/:path*', destination: 'https://ganger-ai-receptionist-46vo3v0z1-ganger.vercel.app/ai-receptionist/:path*' },
    ];
  },
  
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        // Specific headers for the index page
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
