import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**']
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true
    },
    proxy: {
      '/api': {
        target: 'http://backend:4000',
        changeOrigin: true
      }
    }
  }
});
