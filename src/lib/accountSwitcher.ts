// ─── Admin Account Switcher ────────────────────────────────────────────────
// Lets an authorised admin flip between the two designated admin accounts
// (ceo@smartzconnect.com and shedrickknungehn@gmail.com) without re-entering
// a password each time. We never store the password itself — only the
// Supabase refresh token, which Supabase can exchange for a fresh session.
// Sessions are namespaced separately from Supabase's own auth storage key so
// switching does not clobber the "currently active" session until requested.
import { supabase } from './supabase'

const STORAGE_KEY = 'szc_switchable_accounts'

// Only these admin identities may be offered in the switcher, regardless of
// what happens to be cached — this is a UX allow-list, not a security
// boundary (RLS/role checks still gate actual admin access server-side).
export const SWITCHABLE_ADMIN_EMAILS = [
  'ceo@smartzconnect.com',
  'shedrickknungehn@gmail.com',
]

export interface SwitchableAccount {
  email: string
  userId: string
  refreshToken: string
  fullName: string | null
  avatarUrl: string | null
  role: string
  savedAt: string
}

function readStore(): Record<string, SwitchableAccount> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeStore(store: Record<string, SwitchableAccount>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Storage full/unavailable — non-fatal, switching just won't persist.
  }
}

export function saveSwitchableAccount(account: Omit<SwitchableAccount, 'savedAt'>) {
  const email = account.email.toLowerCase()
  if (!SWITCHABLE_ADMIN_EMAILS.includes(email)) return
  const store = readStore()
  store[email] = { ...account, email, savedAt: new Date().toISOString() }
  writeStore(store)
}

export function removeSwitchableAccount(email: string) {
  const store = readStore()
  delete store[email.toLowerCase()]
  writeStore(store)
}

export function listSwitchableAccounts(): SwitchableAccount[] {
  const store = readStore()
  return SWITCHABLE_ADMIN_EMAILS
    .map(email => store[email])
    .filter((a): a is SwitchableAccount => !!a)
}

// Exchanges a saved refresh token for a fresh session and makes it the
// active Supabase session. Throws if the token has been revoked/expired —
// callers should fall back to the normal password login in that case.
export async function switchToAccount(email: string): Promise<void> {
  const store = readStore()
  const account = store[email.toLowerCase()]
  if (!account) throw new Error('No saved session for this account. Please sign in with a password once.')
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: account.refreshToken })
  if (error || !data.session) {
    removeSwitchableAccount(email)
    throw new Error('That saved sign-in has expired. Please sign in again with your password.')
  }
}
