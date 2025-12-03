import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      },
    },
  },
  preview: {
    port: 3000,
    host: true,
    allowedHosts: ['exonmotor.ir', 'www.exonmotor.ir'],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
