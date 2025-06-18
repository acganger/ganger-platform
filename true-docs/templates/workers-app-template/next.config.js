/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    runtime: 'edge',
  },
  images: {
    unoptimized: true,
  },
  basePath: '/[APP_PATH]',
  assetPrefix: '/[APP_PATH]',
}

module.exports = nextConfig