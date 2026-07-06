import { createClient } from '@supabase/supabase-js'

// ─── Supabase Configuration ───────────────────────────────────────────────────
// These values are read from environment variables.
// Create a .env file at the project root with:
//
//   VITE_SUPABASE_URL=https://your-project-id.supabase.co
//   VITE_SUPABASE_ANON_KEY=your-anon-key-here
//
// Get these from: https://supabase.com/dashboard → Your Project → Settings → API
// For Cloudflare Pages: set these in Pages → Settings → Environment Variables
// ─────────────────────────────────────────────────────────────────────────────

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️  Supabase environment variables not set.\n' +
    'Create /workspace/smartzconnect/.env with:\n' +
    '  VITE_SUPABASE_URL=https://your-project.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=your-anon-key\n' +
    'Get these from: supabase.com/dashboard → Project → Settings → API'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)

export default supabase
