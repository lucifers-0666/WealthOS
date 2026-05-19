import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    strictPort: true,
    proxy: {
      '/holdings': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/portfolio': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/transactions': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/prices': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/upload': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/ai': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/watchlist': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/profile': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/target-allocation': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/health': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    }
  }
})
