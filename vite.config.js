import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = (env.VITE_DEV_API_TARGET || `http://127.0.0.1:${env.PORT || 5050}`).replace(/\/$/, '')

  return {
    plugins: [react()],
    build: {
      // Vendor code changes far less often than app code; splitting it keeps
      // the large, stable dependencies in separately cacheable chunks.
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-firebase': ['firebase/app', 'firebase/auth'],
            'vendor-icons': ['lucide-react'],
          },
        },
      },
      chunkSizeWarningLimit: 900,
    },
    server: {
      port: 3000,
      open: false,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
})
