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
  experimental: {
    esmExternals: true
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'AI Receptionist Demo',
    NEXT_PUBLIC_APP_VERSION: '1.0.0'
  },
  // Static export for Cloudflare Workers deployment
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  images: {
    domains: ['pfqtzmxxxhhsxmlddrta.supabase.co'],
    unoptimized: true // Required for static export
  },
  // Redirects removed for static export compatibility
}

module.exports = nextConfig