/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Force dynamic runtime - NO static generation
  experimental: {
    runtime: 'edge'
  },
  // Ensure no static export
  trailingSlash: false,
  basePath: '/dashboard',
  assetPrefix: '/dashboard'
}

module.exports = nextConfig