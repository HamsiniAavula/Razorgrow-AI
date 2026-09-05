import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Choose backend target: Render (default) or Local (set VITE_BACKEND_URL=http://localhost:5000)
const BACKEND_TARGET = process.env.VITE_BACKEND_URL || 'https://razorgrow-ai-iez3.onrender.com';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: BACKEND_TARGET,
        changeOrigin: true,
        secure: false
      }
    }
  }
})
