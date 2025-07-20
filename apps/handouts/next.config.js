/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: '/handouts',
  transpilePackages: ['@ganger/types', '@ganger/db', '@ganger/auth', '@ganger/cache', '@ganger/utils', '@ganger/ui', '@ganger/config', '@ganger/ai', '@ganger/deps', '@ganger/docs', '@ganger/integrations', '@ganger/monitoring'],

  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: false,
  },
  
  images: {
    domains: ['pfqtzmxxxhhsxmlddrta.supabase.co'],
    unoptimized: true,
  },
};

module.exports = nextConfig;
