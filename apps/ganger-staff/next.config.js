/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ganger/ui', '@ganger/auth', '@ganger/deps'],
};

module.exports = nextConfig;
