import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// the demo server holds the API keys; the browser only talks to /api
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:8001' },
  },
})
