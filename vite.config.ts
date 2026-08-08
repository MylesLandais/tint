import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 45173,
    strictPort: true,
    allowedHosts: ['tint.localhost'],
    hmr: {
      host: 'tint.localhost',
      clientPort: 80,
      protocol: 'ws',
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 45174,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
