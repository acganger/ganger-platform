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
  // Skip static generation for demo app that requires runtime environment
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig