// packages/config/next-config-template.js
/**
 * Standardized Next.js Configuration Template for Ganger Platform
 * Use this as a base for all application next.config.js files
 */

const { getSecurityHeaders, getAllowedDomains, isDevelopment } = require('./environment');

/**
 * Creates a standardized Next.js configuration for Ganger Platform apps
 * @param {string} appName - The name of the application
 * @param {object} appSpecificConfig - App-specific configuration overrides
 * @returns {object} Next.js configuration object
 */
function createNextConfig(appName, appSpecificConfig = {}) {
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedDomains = getAllowedDomains();
  
  const baseConfig = {
    // Core Next.js settings
    reactStrictMode: true,
    swcMinify: true,
    output: 'standalone',
    
    // Experimental features
    experimental: {
      optimizeCss: true,
      scrollRestoration: true,
      serverComponentsExternalPackages: ['@supabase/supabase-js'],
    },
    
    // Package transpilation for monorepo
    transpilePackages: [
      '@ganger/ui',
      '@ganger/auth',
      '@ganger/db',
      '@ganger/integrations',
      '@ganger/utils',
      '@ganger/config',
      '@ganger/types',
    ],
    
    // Environment variables (public)
    env: {
      NEXT_PUBLIC_APP_NAME: appName,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || `https://${appName}.gangerdermatology.com`,
      NEXT_PUBLIC_DEPLOYMENT_ENV: process.env.DEPLOYMENT_ENV || process.env.NODE_ENV,
    },
    
    // Public runtime configuration
    publicRuntimeConfig: {
      APP_NAME: appName,
      NODE_ENV: process.env.NODE_ENV,
      BUILD_TIME: new Date().toISOString(),
    },
    
    // Image optimization
    images: {
      domains: allowedDomains,
      formats: ['image/webp', 'image/avif'],
      minimumCacheTTL: isProduction ? 86400 : 60,
      dangerouslyAllowSVG: true,
      contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
    
    // API routes configuration
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: '/api/:path*',
        },
      ];
    },
    
    // Security headers
    async headers() {
      const securityHeaders = getSecurityHeaders();
      
      return [
        {
          source: '/(.*)',
          headers: securityHeaders,
        },
        {
          source: '/api/:path*',
          headers: [
            {
              key: 'Access-Control-Allow-Origin',
              value: isDevelopment() ? '*' : 'https://*.gangerdermatology.com',
            },
            {
              key: 'Access-Control-Allow-Methods',
              value: 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
            },
            {
              key: 'Access-Control-Allow-Headers',
              value: 'Content-Type,Authorization,X-Requested-With,X-CSRF-Token',
            },
            {
              key: 'Access-Control-Allow-Credentials',
              value: 'true',
            },
          ],
        },
      ];
    },
    
    // Redirects for common patterns
    async redirects() {
      const redirects = [];
      
      // Redirect HTTP to HTTPS in production
      if (isProduction) {
        redirects.push({
          source: '/:path*',
          has: [
            {
              type: 'header',
              key: 'x-forwarded-proto',
              value: 'http',
            },
          ],
          destination: `https://${appName}.gangerdermatology.com/:path*`,
          permanent: true,
        });
      }
      
      return redirects;
    },
    
    // Webpack configuration
    webpack: (config, { isServer, dev }) => {
      // Bundle analyzer for production builds
      if (process.env.ANALYZE) {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: isServer 
              ? '../analyze/server-bundle-report.html' 
              : '../analyze/client-bundle-report.html',
          })
        );
      }
      
      // Optimization for production
      if (!dev && !isServer) {
        config.optimization.splitChunks.cacheGroups = {
          ...config.optimization.splitChunks.cacheGroups,
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          ganger: {
            test: /[\\/]packages[\\/](@ganger)[\\/]/,
            name: 'ganger-shared',
            chunks: 'all',
            priority: 20,
          },
        };
      }
      
      return config;
    },
    
    // Compiler optimizations
    compiler: {
      removeConsole: isProduction ? {
        exclude: ['error', 'warn'],
      } : false,
    },
    
    // TypeScript configuration
    typescript: {
      ignoreBuildErrors: false,
    },
    
    // ESLint configuration
    eslint: {
      ignoreDuringBuilds: false,
      dirs: ['src', 'pages', 'components', 'lib'],
    },
    
    // Build optimization
    optimizeFonts: true,
    compress: isProduction,
    
    // Power behavior for development
    poweredByHeader: false,
  };
  
  // Merge with app-specific configuration
  const finalConfig = {
    ...baseConfig,
    ...appSpecificConfig,
    
    // Merge complex objects properly
    env: {
      ...baseConfig.env,
      ...(appSpecificConfig.env || {}),
    },
    
    transpilePackages: [
      ...baseConfig.transpilePackages,
      ...(appSpecificConfig.transpilePackages || []),
    ],
    
    images: {
      ...baseConfig.images,
      ...(appSpecificConfig.images || {}),
      domains: [
        ...baseConfig.images.domains,
        ...((appSpecificConfig.images && appSpecificConfig.images.domains) || []),
      ],
    },
  };
  
  return finalConfig;
}

module.exports = { createNextConfig };