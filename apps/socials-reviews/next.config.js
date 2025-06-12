/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    typedRoutes: true,
  },
  images: {
    domains: [
      'lh3.googleusercontent.com', // Google Business Profile images
      'platform-lookaside.fbsbx.com', // Facebook/Instagram images
      'pbs.twimg.com', // Twitter images
      'media.licdn.com', // LinkedIn images
      'cdn.tiktok.com', // TikTok images
    ],
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'Socials & Reviews',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
}

module.exports = nextConfig