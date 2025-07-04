module.exports = {
  apps: [{
    name: 'eos-l10',
    script: 'npm',
    args: 'start',
    cwd: '/home/anand/ganger-apps/eos-l10',
    env: {
      NODE_ENV: 'production',
      PORT: 3010
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
