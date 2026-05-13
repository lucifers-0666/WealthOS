import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite config with dev proxy so frontend can call /api/* -> FastAPI (no CORS)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})
