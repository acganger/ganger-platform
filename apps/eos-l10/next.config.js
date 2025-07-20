/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: '/l10',
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: false,
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
