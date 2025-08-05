/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: '/clinical-staffing',
  transpilePackages: ['@ganger/types', '@ganger/db', '@ganger/auth', '@ganger/cache', '@ganger/utils', '@ganger/ui', '@ganger/config', '@ganger/ai', '@ganger/deps', '@ganger/docs', '@ganger/integrations', '@ganger/monitoring', '@ganger/ui-catalyst'],

  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: false,
  },
  
  images: {
    domains: ['pfqtzmxxxhhsxmlddrta.supabase.co'],
    unoptimized: true,
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        dns: false,
        net: false,
        tls: false,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        util: false,
        child_process: false,
        module: false,
        http2: false,
        worker_threads: false,
        perf_hooks: false,
        inspector: false,
        cluster: false,
        dgram: false,
        readline: false,
        repl: false,
        tty: false,
        v8: false,
        vm: false,
        constants: false,
        punycode: false,
        timers: false,
        console: false,
        process: false,
        buffer: false,
        querystring: false,
        events: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
