import { createContext, useEffect, useState, type ReactNode } from 'react'
import { type User, type Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { linkOneSignalUser, unlinkOneSignalUser } from '@/lib/onesignal'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  emailVerified: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  resendVerification: (email: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]               = useState<User | null>(null)
  const [session, setSession]         = useState<Session | null>(null)
  const [loading, setLoading]         = useState(true)
  const [emailVerified, setEmailVerified] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setEmailVerified(!!session?.user?.email_confirmed_at)
      setLoading(false)
    })

    // Listen for ALL auth state changes and route accordingly
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setEmailVerified(!!session?.user?.email_confirmed_at)
      setLoading(false)

      // Handle specific events — navigation is done in the pages themselves
      // but we expose the event via a custom DOM event for App.tsx to catch
      if (event === 'SIGNED_IN') {
        window.dispatchEvent(new CustomEvent('supabase:signed_in', { detail: { session } }))
        if (session?.user?.id) linkOneSignalUser(session.user.id)
      }
      if (event === 'PASSWORD_RECOVERY') {
        // User clicked the reset link in their email — redirect to set new password
        window.dispatchEvent(new CustomEvent('supabase:password_recovery', { detail: { session } }))
      }
      if (event === 'USER_UPDATED') {
        window.dispatchEvent(new CustomEvent('supabase:user_updated', { detail: { session } }))
      }
      if (event === 'SIGNED_OUT') {
        window.dispatchEvent(new CustomEvent('supabase:signed_out'))
        unlinkOneSignalUser()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    // Block unverified users
    if (data.user && !data.user.email_confirmed_at) {
      await supabase.auth.signOut()
      throw new Error('EMAIL_NOT_VERIFIED')
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name || '' },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
    // After signUp, user must verify email — no session yet
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

  return (
    <AuthContext.Provider value={{
      user, session, loading, emailVerified,
      signIn, signUp, signOut, resetPassword, updatePassword, resendVerification,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

