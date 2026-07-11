import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    allowedHosts: true,
    cors: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    target: 'es2020',
    // Lower the warning threshold now that we're code-splitting
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          // Heavy third-party SDKs — each in its own chunk so they're only
          // downloaded when the feature is first used (chat, video, etc.)
          if (id.includes('stream-chat') || id.includes('stream-io')) return 'stream'
          if (id.includes('framer-motion'))                            return 'motion'
          if (id.includes('@supabase'))                                return 'supabase'
          if (id.includes('livekit'))                                  return 'livekit'

          // React core — separate from react-router to break the circular dep
          // that caused the 1.7 MB "deps" mega-chunk in the previous build.
          // The cycle was: react-router (vendor) → react (vendor) → back into
          // deps which also imported react-router → Rollup loop.
          if (id.includes('/react/') || id.includes('/react-dom/'))    return 'vendor'
          if (id.includes('react-router'))                             return 'router'

          // UI primitives
          if (id.includes('@radix-ui') || id.includes('lucide-react')) return 'ui'

          // Data-fetching / state
          if (id.includes('@tanstack'))                                return 'query'

          // Everything else (date-fns, zod, clsx, etc.) goes here.
          // With pages lazy-loaded this chunk is now much smaller because
          // page-only deps ship inside their own async chunk.
          return 'deps'
        },
      },
    },
  },
})
