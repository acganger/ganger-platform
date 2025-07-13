/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ganger/types', '@ganger/db', '@ganger/auth', '@ganger/cache', '@ganger/utils', '@ganger/ui', '@ganger/config', '@ganger/ai', '@ganger/deps', '@ganger/docs', '@ganger/integrations', '@ganger/monitoring'],
  env: {
    NEXT_PUBLIC_APP_NAME: 'AI Model Comparison Demo',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3020',
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig