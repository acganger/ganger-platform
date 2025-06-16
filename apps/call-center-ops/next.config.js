/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@ganger/auth',
    '@ganger/db', 
    '@ganger/integrations',
    '@ganger/ui',
    '@ganger/utils'
  ],
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['pfqtzmxxxhhsxmlddrta.supabase.co'],
    unoptimized: true
  },
  env: {
    CUSTOM_KEY: 'call-center-ops-app',
  },
};

module.exports = nextConfig;