/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@ganger/ui',
    '@ganger/auth',
    '@ganger/utils',
    '@ganger/types',
    '@ganger/db',
    '@ganger/integrations',
    '@ganger/monitoring',
    '@ganger/cache',
  ],
  images: {
    domains: [
      'pfqtzmxxxhhsxmlddrta.supabase.co',
      'images.unsplash.com',
      'www.henryschein.com',
      'images-na.ssl-images-amazon.com',
    ],
  },
  typescript: {
    // During development, we want to see errors
    // During deployment, use ignoreBuildErrors if needed
    ignoreBuildErrors: true,
  },
  eslint: {
    // During development, we want to see warnings
    // During deployment, use ignoreDuringBuilds if needed
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig