/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ganger/auth', '@ganger/db', '@ganger/integrations', '@ganger/ui', '@ganger/utils'],
  
  // Cloudflare Workers runtime
  experimental: {
    runtime: 'edge',
  },
  
  // Staff portal integration
  basePath: '/l10',
  assetPrefix: '/l10',
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  images: {
    domains: ['pfqtzmxxxhhsxmlddrta.supabase.co'],
    unoptimized: true,
  },
};

module.exports = nextConfig;