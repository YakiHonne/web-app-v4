import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  define: {
    'process.env': {},
    'process': { env: {} },
  },
  plugins: [react()],
  server: {
    proxy: {
      // This will proxy all requests starting with /api to your backend
      '/api': 'http://localhost:4000',
      // If your backend is not using /api, use '/' but be careful with websockets/static files
      // '/': 'http://localhost:4000',
    }
  }
})
