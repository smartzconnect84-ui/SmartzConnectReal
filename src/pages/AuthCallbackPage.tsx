import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, CheckCircle } from 'lucide-react'
const logoImg = '/logo.png'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your account...')

  useEffect(() => {
    const handleCallback = async () => {
      const hash = window.location.hash
      const params = new URLSearchParams(hash.replace('#', '?'))
      const type = params.get('type')
      const errorDesc = params.get('error_description')

      if (errorDesc) {
        setStatus('error')
        setMessage(decodeURIComponent(errorDesc.replace(/\+/g, ' ')))
        return
      }

      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        const code = params.get('code')
        if (code) {
          const { error: exchErr } = await supabase.auth.exchangeCodeForSession(code)
          if (exchErr) {
            setStatus('error')
            setMessage(exchErr.message)
            return
          }
        } else {
          setStatus('error')
          setMessage('Invalid or expired link. Please request a new one.')
          return
        }
      }

      if (type === 'recovery') {
        setMessage('Link verified! Redirecting to password reset...')
        setTimeout(() => navigate('/reset-password', { replace: true }), 800)
      } else {
        // New signup — email confirmed
        setStatus('success')
        setMessage('Email confirmed! Welcome to SmartzConnect 🎉')
        setTimeout(() => navigate('/app/feed?welcome=1', { replace: true }), 1500)
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-screen dark:bg-[#080510] bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <img src={logoImg} alt="SmartzConnect" className="w-12 h-12 object-contain mx-auto mb-6" />

        {status === 'loading' && (
          <>
            <div className="w-10 h-10 border-2 border-pink-500/30 border-t-brand-pink rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm dark:text-gray-400 text-gray-600 font-medium">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="font-display font-black text-xl dark:text-white text-gray-900 mb-2">You're verified!</h2>
            <p className="text-sm dark:text-gray-400 text-gray-600 mb-4">{message}</p>
            <div className="flex justify-center">
              <Loader2 className="w-4 h-4 text-brand-pink animate-spin" />
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <p className="text-red-500 font-semibold mb-2">Something went wrong</p>
            <p className="text-sm dark:text-gray-400 text-gray-600 mb-5">{message}</p>
            <div className="flex gap-3 justify-center">
              <a href="/login" className="px-4 py-2 rounded-xl dark:bg-white/5 bg-gray-100 text-sm font-semibold dark:text-gray-300 text-gray-700 hover:text-brand-pink transition-colors">
                Sign In
              </a>
              <a href="/forgot-password" className="px-4 py-2 rounded-xl bg-love-gradient text-white text-sm font-semibold shadow-md shadow-pink-500/20">
                Reset Password
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
