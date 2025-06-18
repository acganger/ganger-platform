/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ganger/auth', '@ganger/db', '@ganger/integrations', '@ganger/ui', '@ganger/utils'],
  
  // Cloudflare Workers runtime
  experimental: {
    runtime: 'edge',
  },
  
  // Optimize for Workers (NO STATIC EXPORT)
  images: {
    domains: ['pfqtzmxxxhhsxmlddrta.supabase.co'],
    unoptimized: true,
  },
  
  // Staff portal integration
  basePath: '/socials',
  assetPrefix: '/socials',
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;