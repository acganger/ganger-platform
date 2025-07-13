/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: '/platform-dashboard',
  transpilePackages: ['@ganger/types', '@ganger/db', '@ganger/auth', '@ganger/cache', '@ganger/utils', '@ganger/ui', '@ganger/config', '@ganger/ai', '@ganger/deps', '@ganger/docs', '@ganger/integrations', '@ganger/monitoring'],
  // Ensure no static export
  trailingSlash: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig