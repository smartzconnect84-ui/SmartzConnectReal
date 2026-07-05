import { createContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, type SupaUser, type SupaSession } from '@/lib/supabase'
import { linkOneSignalUser, unlinkOneSignalUser } from '@/lib/onesignal'

interface AuthContextType {
  user: SupaUser | null
  session: SupaSession | null
  loading: boolean
  emailVerified: boolean
  role: string
  isAdmin: boolean
  signIn: () => void
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ADMIN_ROLES = ['admin', 'superadmin', 'ceo', 'moderator', 'support']

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]               = useState<SupaUser | null>(null)
  const [session, setSession]         = useState<SupaSession | null>(null)
  const [loading, setLoading]         = useState(true)
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
      if (session?.user?.id) fetchRole(session.user.id)
      setLoading(false)
    })

    // Listen for auth state changes (Replit Auth is redirect-based, so this
    // mainly fires once on mount and again after signOut()).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      if (event === 'SIGNED_IN') {
        if (session?.user?.id) {
          fetchRole(session.user.id)
          linkOneSignalUser(session.user.id)
        }
        window.dispatchEvent(new CustomEvent('supabase:signed_in', { detail: { session } }))
      }
      if (event === 'SIGNED_OUT') {
        setRole('user')
        window.dispatchEvent(new CustomEvent('supabase:signed_out'))
        unlinkOneSignalUser()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Replit Auth is a redirect flow — there's no email/password form.
  const signIn = () => {
    window.location.href = '/api/login'
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const isAdmin = ADMIN_ROLES.includes(role)
  const emailVerified = !!user?.email

  return (
    <AuthContext.Provider value={{
      user, session, loading, emailVerified, role, isAdmin,
      signIn, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
