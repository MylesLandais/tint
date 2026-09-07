import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

const workbenchTarget = process.env.ENDLESS_WORKBENCH_URL ?? 'http://127.0.0.1:45177'
const workbenchProxy: import('vite').ProxyOptions = {
  target: workbenchTarget, ws: true, changeOrigin: true,
  configure(proxy) {
    proxy.on('proxyReq', (outgoing, request) => {
      if (request.headers.origin === `http://${request.headers.host}`) outgoing.setHeader('Origin', workbenchTarget)
    })
    proxy.on('proxyReqWs', (outgoing, request, socket) => {
      if (request.headers.origin !== `http://${request.headers.host}`) { outgoing.destroy(); socket.destroy(); return }
      outgoing.setHeader('Origin', workbenchTarget)
    })
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 45173,
    strictPort: true,
    proxy: {'/api/workbench': workbenchProxy},
    allowedHosts: ['tint.localhost'],
  },
  preview: {
    host: '127.0.0.1',
    port: 45174,
    strictPort: true,
    proxy: {'/api/workbench': workbenchProxy},
  },
  resolve: {
    alias: {
      yjs: new URL("./src/vendor/yjs/index.js", import.meta.url).pathname,
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
