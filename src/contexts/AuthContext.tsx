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

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    setRole(data?.role ?? 'user')
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setEmailVerified(!!session?.user?.email_confirmed_at)
      if (session?.user?.id) fetchRole(session.user.id)
      setLoading(false)
    })

    // Listen for ALL auth state changes and route accordingly
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setEmailVerified(!!session?.user?.email_confirmed_at)
      setLoading(false)

      if (event === 'SIGNED_IN') {
        if (session?.user?.id) {
          fetchRole(session.user.id)
          linkOneSignalUser(session.user.id)
        }
        window.dispatchEvent(new CustomEvent('supabase:signed_in', { detail: { session } }))
      }
      if (event === 'PASSWORD_RECOVERY') {
        window.dispatchEvent(new CustomEvent('supabase:password_recovery', { detail: { session } }))
      }
      if (event === 'USER_UPDATED') {
        window.dispatchEvent(new CustomEvent('supabase:user_updated', { detail: { session } }))
      }
      if (event === 'SIGNED_OUT') {
        setRole('user')
        window.dispatchEvent(new CustomEvent('supabase:signed_out'))
        unlinkOneSignalUser()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name || '' },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      throw new Error(
        typeof error.message === 'string' && error.message
          ? error.message
          : (error as any).code
          ? `Sign up error: ${(error as any).code}`
          : 'Sign up failed. Please try again.'
      )
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

