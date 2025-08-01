/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ganger/types', '@ganger/db', '@ganger/auth', '@ganger/cache', '@ganger/utils', '@ganger/ui', '@ganger/config', '@ganger/ai', '@ganger/deps', '@ganger/docs', '@ganger/integrations', '@ganger/monitoring', '@ganger/ui-catalyst'],
  
  // Router app - rewrites traffic to individual apps
  async rewrites() {
    return [
      // Core Medical Apps
      { source: '/inventory/:path*', destination: 'https://ganger-inventory-ganger.vercel.app/inventory/:path*' },
      { source: '/handouts/:path*', destination: 'https://ganger-handouts-ganger.vercel.app/handouts/:path*' },
      { source: '/l10/:path*', destination: 'https://ganger-eos-l10-ganger.vercel.app/l10/:path*' },
      { source: '/medication-auth/:path*', destination: 'https://ganger-medication-auth-ganger.vercel.app/medication-auth/:path*' },
      
      // Staff Operations Apps  
      { source: '/actions/:path*', destination: 'https://ganger-actions-ganger.vercel.app/actions/:path*' },
      { source: '/clinical-staffing/:path*', destination: 'https://ganger-clinical-staffing-ganger.vercel.app/clinical-staffing/:path*' },
      { source: '/call-center/:path*', destination: 'https://ganger-call-center-ops-ganger.vercel.app/call-center/:path*' },
      { source: '/pharma/:path*', destination: 'https://ganger-pharma-scheduling-ganger.vercel.app/pharma/:path*' },
      
      // Business Systems Apps
      { source: '/batch/:path*', destination: 'https://ganger-batch-closeout-ganger.vercel.app/batch/:path*' },
      { source: '/compliance/:path*', destination: 'https://ganger-compliance-training-ganger.vercel.app/compliance/:path*' },
      { source: '/socials/:path*', destination: 'https://ganger-socials-reviews-ganger.vercel.app/socials/:path*' },
      
      // Infrastructure Apps
      { source: '/platform-dashboard/:path*', destination: 'https://ganger-platform-dashboard-ganger.vercel.app/platform-dashboard/:path*' },
      { source: '/config/:path*', destination: 'https://ganger-config-dashboard-ganger.vercel.app/config/:path*' },
      { source: '/status/:path*', destination: 'https://ganger-integration-status-ganger.vercel.app/status/:path*' },
      { source: '/component-showcase/:path*', destination: 'https://ganger-component-showcase-ganger.vercel.app/component-showcase/:path*' },
      { source: '/ai-receptionist/:path*', destination: 'https://ganger-ai-receptionist-ganger.vercel.app/ai-receptionist/:path*' },
      { source: '/kiosk/:path*', destination: 'https://ganger-checkin-kiosk-ganger.vercel.app/kiosk/:path*' },
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
