import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api/rpc': {
        target: 'http://localhost:26657',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rpc/, ''),
      },
      '/api/rest': {
        target: 'http://localhost:1317',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rest/, ''),
      },
    },
  },
})
