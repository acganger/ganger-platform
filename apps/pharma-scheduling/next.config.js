/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ganger/auth', '@ganger/db', '@ganger/integrations', '@ganger/ui', '@ganger/utils'],
  // Removed 'output: export' to fix API routes and dev server startup
  trailingSlash: true,
  distDir: 'dist',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['pfqtzmxxxhhsxmlddrta.supabase.co'],
  },
};

module.exports = nextConfig;