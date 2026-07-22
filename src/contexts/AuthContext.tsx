import { createContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { type User, type Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { linkOneSignalUser, unlinkOneSignalUser } from '@/lib/onesignal'
import { applyStoredReferralCode } from '@/lib/referral'
import { saveSwitchableAccount, removeSwitchableAccount } from '@/lib/accountSwitcher'

interface AdminProfile {
  fullName: string | null
  avatarUrl: string | null
  email: string | null
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  emailVerified: boolean
  role: string
  isAdmin: boolean
  adminProfile: AdminProfile | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string, extra?: { dateOfBirth?: string; avatarFile?: File | null; country?: string }) => Promise<{ needsVerification: boolean }>
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
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null)
  // Tracks the latest active user ID so stale async role fetches
  // from prior auth events can't overwrite the current user's role.
  const currentUserIdRef = useRef<string | null>(null)

  // Fetch role + display profile in a SINGLE round-trip.
  // Returns null on any failure so callers can preserve the existing role
  // rather than demoting to 'user' on a transient DB error.
  const resolveProfileData = async (userId: string): Promise<{
    role: string; fullName: string | null; avatarUrl: string | null
  } | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, full_name, avatar_url')
        .eq('id', userId)
        .single()
      if (error) return null
      return {
        role:      data?.role       ?? 'user',
        fullName:  data?.full_name  ?? null,
        avatarUrl: data?.avatar_url ?? null,
      }
    } catch {
      return null
    }
  }

  // Persist a refreshable session for the admin account switcher (allow-listed
  // emails only — see src/lib/accountSwitcher.ts).
  const persistSwitchableSession = (s: Session, roleValue: string, profile: AdminProfile) => {
    if (!s.user.email || !s.refresh_token) return
    saveSwitchableAccount({
      email: s.user.email,
      userId: s.user.id,
      refreshToken: s.refresh_token,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
      role: roleValue,
    })
  }

  useEffect(() => {
    let isMounted = true

    // ── Safety timeout ────────────────────────────────────────────────────────
    // If Supabase is unreachable (cold start, DNS failure, CF block) getSession()
    // may hang indefinitely, leaving loading=true and the app stuck on the
    // splash screen. After 10 seconds we clear loading so the user can at least
    // see the public/unauthenticated view instead of a spinner forever.
    const loadingTimer = setTimeout(() => {
      if (isMounted) setLoading(false)
    }, 10_000)

    // ── Initial session ───────────────────────────────────────────────────────
    // Await role resolution before clearing loading so AdminRoute never sees
    // a stale role on page refresh and redirects admins to /app/feed.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(loadingTimer)
      if (!isMounted) return
      const uid = session?.user?.id ?? null
      currentUserIdRef.current = uid
      setSession(session)
      setUser(session?.user ?? null)
      setEmailVerified(!!session?.user?.email_confirmed_at)
      if (uid) {
        // Single DB round-trip fetches role + display profile together
        const profileData = await resolveProfileData(uid)
        // Guard: only apply if still mounted AND still the same user
        if (isMounted && currentUserIdRef.current === uid) {
          const roleValue = profileData?.role ?? 'user'
          setRole(roleValue)
          const profile: AdminProfile = {
            fullName:  profileData?.fullName  ?? null,
            avatarUrl: profileData?.avatarUrl ?? null,
            email:     session?.user?.email   ?? null,
          }
          setAdminProfile(profile)
          if (session) persistSwitchableSession(session, roleValue, profile)
        }
      }
      if (isMounted) setLoading(false)
    }).catch(() => {
      // getSession() itself threw (network error, malformed response, etc.)
      clearTimeout(loadingTimer)
      if (isMounted) setLoading(false)
    })

    // ── Auth state events ────────────────────────────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      const uid = session?.user?.id ?? null
      currentUserIdRef.current = uid
      setSession(session)
      setUser(session?.user ?? null)
      setEmailVerified(!!session?.user?.email_confirmed_at)

      if (event === 'SIGNED_IN') {
        if (uid) {
          // Single query for role + display profile — awaited so any admin
          // redirect that follows SIGNED_IN sees the correct isAdmin value.
          const profileData = await resolveProfileData(uid)
          // Guard: mounted + same user (rapid sign-out/sign-in safety)
          if (!isMounted || currentUserIdRef.current !== uid) return
          const roleValue = profileData?.role ?? 'user'
          setRole(roleValue)
          const profile: AdminProfile = {
            fullName:  profileData?.fullName  ?? null,
            avatarUrl: profileData?.avatarUrl ?? null,
            email:     session?.user?.email   ?? null,
          }
          setAdminProfile(profile)
          if (session) persistSwitchableSession(session, roleValue, profile)
          linkOneSignalUser(uid)
          if (session?.user?.email) applyPendingProfile(uid, undefined, session.user.email)
          applyStoredReferralCode(uid)
          // Opportunistic cleanup: revert any referral-granted Premium/VIP
          // subscription that has passed its 14-day validity window. Cheap,
          // idempotent, best-effort — safe to fire on every sign-in since it
          // only touches rows with subscription_source = 'referral' that are
          // already expired.
          supabase.rpc('revert_expired_referral_subscriptions').then(() => {}, () => {})
          // NOTE: do NOT auto-call requestNotificationPermission() here.
          // Calling Notification.requestPermission() without a user gesture
          // gets silently queued (never resolved) by most browsers, and a
          // second, user-gesture-triggered call (from NotificationPrompt's
          // "Allow" button) then queues behind the stuck first call and also
          // never resolves — this was the "loads forever, no live push"
          // symptom. Permission must only ever be requested from a real
          // click, which NotificationPrompt already does.
        }
        if (isMounted) setLoading(false)
        window.dispatchEvent(new CustomEvent('supabase:signed_in', { detail: { session } }))
      }
      if (event === 'TOKEN_REFRESHED') {
        // Re-sync role from DB on every token refresh (~hourly). This ensures
        // that if an admin's role is changed mid-session (granted or revoked),
        // the in-memory isAdmin value updates without requiring a page reload.
        // On fetch failure (null), preserve the existing role — never demote
        // an admin due to a transient network or policy error.
        if (uid) {
          // Re-sync role only (no need to re-fetch display profile on token refresh)
          const profileData = await resolveProfileData(uid)
          // Guard: mounted + same user; skip update if null (transient failure)
          if (isMounted && currentUserIdRef.current === uid && profileData !== null) {
            setRole(profileData.role)
          }
        }
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
          setAdminProfile(null)
          setLoading(false)
        }
        window.dispatchEvent(new CustomEvent('supabase:signed_out'))
        unlinkOneSignalUser()
      }
      // INITIAL_SESSION — handled by getSession() above with awaited role fetch.
    })

    return () => {
      isMounted = false
      clearTimeout(loadingTimer)
      subscription.unsubscribe()
    }
  }, [])

  // ── Pending profile (DOB + avatar) captured at signup but only appliable once
  // an authenticated session exists (avatar upload requires auth; email
  // confirmation may delay that session past the signup call itself). ──
  const PENDING_KEY_PREFIX = 'szc_pending_profile:'

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const stashPendingProfile = async (email: string, extra?: { dateOfBirth?: string; avatarFile?: File | null; country?: string }) => {
    try {
      const avatarDataUrl = extra?.avatarFile ? await fileToDataUrl(extra.avatarFile) : null
      localStorage.setItem(
        PENDING_KEY_PREFIX + email.toLowerCase(),
        JSON.stringify({ dateOfBirth: extra?.dateOfBirth || null, country: extra?.country || null, avatarDataUrl }),
      )
    } catch {
      // Non-fatal — worst case the user sets DOB/photo later from Settings.
    }
  }

  const applyPendingProfile = async (
    userId: string,
    extra?: { dateOfBirth?: string; avatarFile?: File | null; country?: string },
    email?: string,
  ) => {
    try {
      let dateOfBirth = extra?.dateOfBirth || null
      let country = extra?.country || null
      let avatarFile: File | Blob | null = extra?.avatarFile ?? null
      let stashKey: string | null = null

      if (!avatarFile && email) {
        stashKey = PENDING_KEY_PREFIX + email.toLowerCase()
        const raw = localStorage.getItem(stashKey)
        if (raw) {
          const pending = JSON.parse(raw) as { dateOfBirth?: string | null; country?: string | null; avatarDataUrl?: string | null }
          dateOfBirth = dateOfBirth || pending.dateOfBirth || null
          country = country || pending.country || null
          if (pending.avatarDataUrl) {
            const res = await fetch(pending.avatarDataUrl)
            avatarFile = await res.blob()
          }
        }
      }

      const updates: Record<string, any> = {}
      if (dateOfBirth) updates.date_of_birth = dateOfBirth
      if (country) updates.country = country

      if (avatarFile) {
        const { uploadToSufy } = await import('@/lib/sufy')
        const fileForUpload = avatarFile instanceof File
          ? avatarFile
          : new File([avatarFile], 'avatar.jpg', { type: (avatarFile as Blob).type || 'image/jpeg' })
        updates.avatar_url = await uploadToSufy(fileForUpload, 'avatars')
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from('profiles').update(updates).eq('id', userId)
      }

      if (stashKey) localStorage.removeItem(stashKey)
    } catch {
      // Non-fatal — the account is created either way; user can retry from Settings.
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (
    email: string,
    password: string,
    name?: string,
    extra?: { dateOfBirth?: string; avatarFile?: File | null; country?: string },
  ) => {
    // Only pass emailRedirectTo when on the production domain.
    // In dev/preview the Replit origin is not in Supabase's allowed redirect list
    // and will cause a "Redirect URL not allowed" rejection.
    const isProd = !import.meta.env.DEV && window.location.hostname !== 'localhost'
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name || '',
          date_of_birth: extra?.dateOfBirth || null,
          country: extra?.country || null,
        },
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
    // sign in is complete: apply the profile picture + DOB now that we're authenticated.
    if (data.session && data.user) {
      await applyPendingProfile(data.user.id, extra)
      return { needsVerification: false }
    }

    // Email confirmation is ON — no session yet, so the avatar upload (which requires
    // auth) can't run now. Stash it locally and apply it once the user verifies & signs in.
    if (extra?.avatarFile || extra?.dateOfBirth) {
      await stashPendingProfile(email, extra)
    }

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

  const signOutClearSwitcher = async () => {
    if (user?.email) removeSwitchableAccount(user.email)
    await signOut()
  }

  return (
    <AuthContext.Provider value={{
      user, session, loading, emailVerified, role, isAdmin, adminProfile,
      signIn, signUp, signOut: signOutClearSwitcher, resetPassword, updatePassword, resendVerification,
      signInWithGoogle,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

