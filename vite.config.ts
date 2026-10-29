import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    strictPort: true,
    // 前端只认相对路径 /api/xxx，由 Vite 转发到后端。
    // 不配这个的话，fetch('/api/items') 会被当成 5175 上的静态资源，直接 404。
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
