import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const logoImg = '/logo.png'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your account…')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // ── 1. Read params from BOTH query string (PKCE) and hash (implicit) ──
        const searchParams = new URLSearchParams(window.location.search)
        const hashParams   = new URLSearchParams(window.location.hash.replace('#', '?'))

        const code      = searchParams.get('code')
        const errorDesc = searchParams.get('error_description') || hashParams.get('error_description')
        const type      = searchParams.get('type') || hashParams.get('type')
        const accessToken = hashParams.get('access_token')

        // ── 2. Surface any Supabase-reported error first ──────────────────────
        if (errorDesc) {
          setStatus('error')
          setMessage(decodeURIComponent(errorDesc.replace(/\+/g, ' ')))
          return
        }

        // ── 3. PKCE flow — exchange the code for a session ────────────────────
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            setStatus('error')
            setMessage(error.message || 'Link expired or already used. Please request a new one.')
            return
          }
        }
        // ── 4. Implicit flow — access_token already in hash ───────────────────
        else if (accessToken) {
          // supabase-js picks this up automatically via onAuthStateChange;
          // just wait for the session to be set.
          await new Promise(r => setTimeout(r, 500))
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) {
            setStatus('error')
            setMessage('Could not establish session. Please try signing in.')
            return
          }
        }
        // ── 5. Neither code nor token ─────────────────────────────────────────
        else {
          // Maybe the session is already set (user clicked a link that was
          // pre-verified by the browser, e.g. a native mail app deep link).
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) {
            setStatus('error')
            setMessage('Invalid or expired link. Please request a new confirmation email.')
            return
          }
        }

        // ── 6. Redirect based on link type ────────────────────────────────────
        if (type === 'recovery') {
          setMessage('Link verified! Redirecting to password reset…')
          setTimeout(() => navigate('/reset-password', { replace: true }), 800)
        } else {
          setStatus('success')
          setMessage('Email confirmed! Welcome to SmartzConnect 🎉')
          setTimeout(() => navigate('/app/feed?welcome=1', { replace: true }), 1800)
        }
      } catch (err: any) {
        setStatus('error')
        setMessage(err?.message || 'Something went wrong. Please try again.')
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-screen dark:bg-[#080510] bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm w-full">
        <img src={logoImg} alt="SmartzConnect" className="w-12 h-12 object-contain mx-auto mb-8" />

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-pink-500/30 border-t-brand-pink rounded-full animate-spin" />
            </div>
            <p className="text-sm dark:text-gray-400 text-gray-600 font-medium">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-emerald-500" />
            </div>
            <div>
              <h2 className="font-bold text-lg dark:text-white text-gray-900 mb-1">You're verified!</h2>
              <p className="text-sm dark:text-gray-400 text-gray-600">{message}</p>
            </div>
            <Loader2 className="w-4 h-4 text-brand-pink animate-spin mt-2" />
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <XCircle className="w-7 h-7 text-red-400" />
            </div>
            <div>
              <h2 className="font-bold text-lg dark:text-white text-gray-900 mb-1">Verification failed</h2>
              <p className="text-sm dark:text-gray-400 text-gray-600">{message}</p>
            </div>
            <div className="flex gap-3 mt-2">
              <a
                href="/verify-email"
                className="px-4 py-2 rounded-xl dark:bg-white/5 bg-gray-100 text-sm font-semibold dark:text-gray-300 text-gray-700 hover:text-brand-pink transition-colors"
              >
                Resend Email
              </a>
              <a
                href="/login"
                className="px-4 py-2 rounded-xl bg-love-gradient text-white text-sm font-semibold shadow-md shadow-pink-500/20"
              >
                Sign In
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
