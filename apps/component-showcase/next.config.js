const nextConfig = {
  transpilePackages: ['@ganger/ui', '@ganger/auth', '@ganger/utils'],
  experimental: {
    turbo: {
      resolveExtensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
  },
  env: {
    CUSTOM_KEY: 'component-showcase',
  },
  // Add no-cache headers for development
  async headers() {
    return [
      {
        source: '/(.*)',
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
    ]
  },
};

module.exports = nextConfig;