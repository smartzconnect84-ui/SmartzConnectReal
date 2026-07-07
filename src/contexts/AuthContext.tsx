import { createContext, useEffect, useState, type ReactNode } from 'react'
import { type User, type Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { linkOneSignalUser, unlinkOneSignalUser } from '@/lib/onesignal'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  emailVerified: boolean
  role: string
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string) => Promise<{ needsVerification: boolean }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  resendVerification: (email: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ADMIN_ROLES = ['admin', 'superadmin', 'ceo', 'moderator', 'support']

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]               = useState<User | null>(null)
  const [session, setSession]         = useState<Session | null>(null)
  const [loading, setLoading]         = useState(true)
  const [emailVerified, setEmailVerified] = useState(false)
  const [role, setRole]               = useState<string>('user')

  // Fetch the user's role from DB. Returns the resolved role string.
  // All callers must guard on isMounted before applying the result to state.
  const resolveRole = async (userId: string): Promise<string> => {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    return data?.role ?? 'user'
  }

  useEffect(() => {
    let isMounted = true

    // ── Initial session ───────────────────────────────────────────────────────
    // Await role resolution before clearing loading so AdminRoute never sees
    // a stale role on page refresh and redirects admins to /app/feed.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return
      setSession(session)
      setUser(session?.user ?? null)
      setEmailVerified(!!session?.user?.email_confirmed_at)
      if (session?.user?.id) {
        const resolved = await resolveRole(session.user.id)
        if (isMounted) setRole(resolved)
      }
      if (isMounted) setLoading(false)
    })

    // ── Auth state events ────────────────────────────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      setSession(session)
      setUser(session?.user ?? null)
      setEmailVerified(!!session?.user?.email_confirmed_at)

      if (event === 'SIGNED_IN') {
        if (session?.user?.id) {
          // Await role so any admin redirect that follows SIGNED_IN sees the
          // correct isAdmin value, not the default 'user' fallback.
          const resolved = await resolveRole(session.user.id)
          if (!isMounted) return
          setRole(resolved)
          linkOneSignalUser(session.user.id)
        }
        if (isMounted) setLoading(false)
        window.dispatchEvent(new CustomEvent('supabase:signed_in', { detail: { session } }))
      }
      if (event === 'TOKEN_REFRESHED') {
        // Session is still the same user — no role re-fetch needed.
        if (isMounted) setLoading(false)
      }
      if (event === 'PASSWORD_RECOVERY') {
        if (isMounted) setLoading(false)
        window.dispatchEvent(new CustomEvent('supabase:password_recovery', { detail: { session } }))
      }
      if (event === 'USER_UPDATED') {
        if (isMounted) setLoading(false)
        window.dispatchEvent(new CustomEvent('supabase:user_updated', { detail: { session } }))
      }
      if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setRole('user')
          setLoading(false)
        }
        window.dispatchEvent(new CustomEvent('supabase:signed_out'))
        unlinkOneSignalUser()
      }
      // INITIAL_SESSION — handled by getSession() above with awaited role fetch.
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, name?: string) => {
    // Only pass emailRedirectTo when on the production domain.
    // In dev/preview the Replit origin is not in Supabase's allowed redirect list
    // and will cause a "Redirect URL not allowed" rejection.
    const isProd = !import.meta.env.DEV && window.location.hostname !== 'localhost'
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name || '' },
        ...(isProd ? { emailRedirectTo: `${window.location.origin}/auth/callback` } : {}),
      },
    })
    if (error) {
      const msg = (() => {
        const raw = typeof error.message === 'string' ? error.message.trim() : ''
        if (raw) {
          if (/email.*signup.*disabled|signup.*disabled/i.test(raw))
            return 'New account registration is currently disabled. Please contact support or try again later.'
          if (/redirect.*not.*allowed|invalid.*redirect/i.test(raw))
            return 'Sign-up failed due to a configuration issue. Please contact support.'
          if (/email.*not.*confirmed/i.test(raw))
            return 'Please confirm your email address before signing in.'
          if (/already.*registered|user.*already.*exists/i.test(raw))
            return 'An account with this email already exists. Try signing in instead.'
          return raw
        }
        const code = (error as any).code || (error as any).error_code || ''
        if (code === 'email_address_not_authorized') return 'This email address is not authorized to sign up.'
        if (code) return `Sign-up failed (${String(code).replace(/_/g, ' ')}).`
        return 'Sign up failed. Please try again.'
      })()
      throw new Error(msg)
    }

    // If Supabase returned a session immediately (email confirmation is OFF in the project),
    // sign in is complete — redirect straight to app.
    if (data.session) return { needsVerification: false }

    // Email confirmation is ON — user must click the link in their inbox.
    return { needsVerification: true }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  const resendVerification = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) throw error
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  }

  const isAdmin = ADMIN_ROLES.includes(role)

  return (
    <AuthContext.Provider value={{
      user, session, loading, emailVerified, role, isAdmin,
      signIn, signUp, signOut, resetPassword, updatePassword, resendVerification,
      signInWithGoogle,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

