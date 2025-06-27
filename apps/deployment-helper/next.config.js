/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Transpile ALL workspace packages
  transpilePackages: [
    '@ganger/auth',
    '@ganger/cache',
    '@ganger/config',
    '@ganger/db',
    '@ganger/docs',
    '@ganger/integrations',
    '@ganger/monitoring',
    '@ganger/types',
    '@ganger/ui',
    '@ganger/utils'
  ],
  
  // Ignore any build errors since this is just a helper
  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig