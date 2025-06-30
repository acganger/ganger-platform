/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  // No basePath - nginx handles /l10 routing
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Transpile workspace packages
  transpilePackages: [
    '@ganger/auth',
    '@ganger/ui',
    '@ganger/db',
    '@ganger/utils',
    '@ganger/types',
    '@ganger/integrations'
  ],
}

module.exports = nextConfig
