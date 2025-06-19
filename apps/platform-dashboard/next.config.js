/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure no static export
  trailingSlash: false,
  basePath: '/dashboard',
  assetPrefix: '/dashboard'
}

module.exports = nextConfig