/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ganger/auth', '@ganger/db', '@ganger/integrations', '@ganger/ui', '@ganger/utils'],
  
  // Static export for R2 deployment
  // output: 'export', // Commented out for dynamic rendering
  
  // Staff portal integration
  basePath: '/inventory',
  assetPrefix: '/inventory',
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    // Skip TypeScript errors during production builds
    ignoreBuildErrors: true,
  },
  
  images: {
    domains: ['pfqtzmxxxhhsxmlddrta.supabase.co'],
    unoptimized: true,
  },
};

module.exports = nextConfig;