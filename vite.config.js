import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: 'all',
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
  },
})
