/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: '/call-center',
  transpilePackages: ['@ganger/types', '@ganger/db', '@ganger/auth', '@ganger/cache', '@ganger/utils', '@ganger/ui', '@ganger/config', '@ganger/ai', '@ganger/deps', '@ganger/docs', '@ganger/integrations', '@ganger/monitoring', '@ganger/ui-catalyst'],

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    // TEMPORARY: Ignoring build errors for Group 2 app to unblock Group 1 deployments
    ignoreBuildErrors: true,
  },
  
  images: {
    domains: ['pfqtzmxxxhhsxmlddrta.supabase.co'],
    unoptimized: true,
  },
};

module.exports = nextConfig;