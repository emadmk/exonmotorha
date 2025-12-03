module.exports = {
  apps: [
    {
      name: 'exonmotor-backend',
      cwd: './backend',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
    {
      name: 'exonmotor-frontend',
      cwd: './frontend',
      script: 'node_modules/.bin/vite',
      args: 'preview --host 0.0.0.0 --port 3000',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
