/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  transpilePackages: [
    '@ganger/ui',
    '@ganger/auth',
    '@ganger/db',
    '@ganger/utils',
    '@ganger/types',
    '@ganger/integrations'
  ],
  basePath: '/checkout-slips',
  experimental: {
    serverComponentsExternalPackages: [
      '@ganger/db'
    ]
  }
}

module.exports = nextConfig