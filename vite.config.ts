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
    // Pre-bundle heavy deps so the dev server never re-optimises them on
    // navigation and the first cold-start is as fast as possible.
    include: [
      'react', 'react-dom', 'react-router-dom',
      'framer-motion',
      'lucide-react',
      '@supabase/supabase-js',
      'stream-chat',
      'livekit-client',
      'hls.js',
      'date-fns',
    ],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    target: 'es2020',
    // Lower the warning threshold now that we're code-splitting
    chunkSizeWarningLimit: 600,
    // NOTE: manual vendor chunking (splitting node_modules by package name
    // into 'vendor'/'router'/'deps'/etc.) was removed. Hand-rolled
    // manualChunks repeatedly produced circular chunk dependencies (e.g.
    // "vendor" <-> "deps" <-> "router") that Rollup resolves by hoisting
    // `var` declarations across chunk boundaries. When minified this turns
    // into "Cannot access 'X' before initialization" (TDZ) errors that only
    // appear in the production build (never in dev, since Vite dev doesn't
    // bundle/minify) — this was the recurring "stuck on Loading
    // SmartzConnect..." bug on the deployed site. Rollup's automatic
    // chunking (still split per-route via React.lazy() in App.tsx) is safe
    // and avoids this class of bug entirely.
  },
})
