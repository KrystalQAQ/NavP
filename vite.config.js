import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://nav.254253.xyz:3080',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://nav.254253.xyz:3080',
        changeOrigin: true,
      }
    }
  }
})
