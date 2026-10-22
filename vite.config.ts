import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { resolveWorkspaceTarget, workspaceProxyPrefixes } from './src/core/compatibility/workspace.js'

const workspaceTarget = resolveWorkspaceTarget(process.env)
const workspaceProxy: import('vite').ProxyOptions = {
  target: workspaceTarget, ws: true, changeOrigin: true,
  configure(proxy) {
    proxy.on('proxyReq', (outgoing, request) => {
      if (request.headers.origin === `http://${request.headers.host}`) outgoing.setHeader('Origin', workspaceTarget)
    })
    proxy.on('proxyReqWs', (outgoing, request, socket) => {
      if (request.headers.origin !== `http://${request.headers.host}`) { outgoing.destroy(); socket.destroy(); return }
      outgoing.setHeader('Origin', workspaceTarget)
    })
  },
}

export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        docs: path.resolve(import.meta.dirname, 'index.html'),
        svelteDocs: path.resolve(import.meta.dirname, 'svelte-docs.html'),
        designLab: path.resolve(import.meta.dirname, 'design-lab.html'),
        demos: path.resolve(import.meta.dirname, 'demos.html'),
        discordBotPanel: path.resolve(import.meta.dirname, 'discord-bot-panel.html'),
        discordModPanel: path.resolve(import.meta.dirname, 'discord-mod-panel.html'),
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 45173,
    strictPort: true,
    proxy: Object.fromEntries(workspaceProxyPrefixes.map(prefix => [prefix, workspaceProxy])),
    allowedHosts: ['tint.localhost'],
  },
  preview: {
    host: '127.0.0.1',
    port: 45174,
    strictPort: true,
    proxy: Object.fromEntries(workspaceProxyPrefixes.map(prefix => [prefix, workspaceProxy])),
  },
  resolve: {
    alias: {
      yjs: new URL("./src/vendor/yjs/index.js", import.meta.url).pathname,
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  // Keep the vendored Yjs module as one browser module. Vite otherwise copies
  // it into optimized y-protocols/y-indexeddb chunks while Tint loads it from src.
  optimizeDeps: {
    exclude: ['yjs'],
  },
})
