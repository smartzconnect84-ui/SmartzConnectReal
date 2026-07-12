import { supabase } from '@/lib/supabase'

const REF_KEY = 'szc_referral_code'

/** Capture ?ref=CODE from the URL (if present) into sessionStorage so it
 * survives the multi-step register flow. Call once on RegisterPage mount. */
export function captureReferralCodeFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) sessionStorage.setItem(REF_KEY, ref.trim().toUpperCase())
  } catch { /* ignore */ }
}

export function getStoredReferralCode(): string | null {
  try {
    return sessionStorage.getItem(REF_KEY)
  } catch {
    return null
  }
}

export function clearStoredReferralCode() {
  try { sessionStorage.removeItem(REF_KEY) } catch { /* ignore */ }
}

/** Link a newly-created profile to whoever referred them, via the stored code. */
export async function applyStoredReferralCode(userId: string) {
  const code = getStoredReferralCode()
  if (!code) return
  try {
    const { error } = await supabase.rpc('apply_referral_code', { p_user_id: userId, p_code: code })
    // Only clear the stashed code once the RPC actually succeeded — otherwise
    // (e.g. migration not yet applied, transient network error) we'd silently
    // lose attribution forever since sessionStorage would already be empty on
    // the next SIGNED_IN retry.
    if (!error) clearStoredReferralCode()
  } catch {
    // Non-fatal — referral bonus is best-effort, account creation must not fail.
    // Code stays stored so the next SIGNED_IN event can retry.
  }
}

export function buildReferralLink(code: string): string {
  return `${window.location.origin}/register?ref=${code}`
}

export interface ReferralPerk {
  id: string
  perk_type: 'call_credit_minutes' | 'unlimited_messaging' | 'unlimited_spins'
  minutes: number
  granted_at: string
  expires_at: string
}

export interface ReferralRow {
  id: string
  referred_id: string
  status: 'pending' | 'confirmed'
  confirmed_at: string | null
  created_at: string
}

export async function fetchMyReferralCode(userId: string): Promise<string | null> {
  const { data } = await supabase.from('profiles').select('referral_code').eq('id', userId).single()
  return data?.referral_code ?? null
}

export async function fetchMyReferrals(userId: string): Promise<ReferralRow[]> {
  const { data } = await supabase
    .from('referrals')
    .select('id, referred_id, status, confirmed_at, created_at')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false })
  return (data as ReferralRow[]) ?? []
}

export async function fetchMyActivePerks(userId: string): Promise<ReferralPerk[]> {
  const { data } = await supabase
    .from('referral_perks')
    .select('id, perk_type, minutes, granted_at, expires_at')
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: false })
  return (data as ReferralPerk[]) ?? []
}

/** Total un-expired call-credit minutes a user has banked from referrals. */
export function sumCallCreditMinutes(perks: ReferralPerk[]): number {
  return perks.filter(p => p.perk_type === 'call_credit_minutes').reduce((sum, p) => sum + p.minutes, 0)
}

export function hasPerk(perks: ReferralPerk[], type: ReferralPerk['perk_type']): boolean {
  return perks.some(p => p.perk_type === type)
}

// ── Referral → subscription milestone rewards ──────────────────────────────
// Invite 10 confirmed friends → free Premium for 14 days.
// Invite 20 confirmed friends → free VIP for 14 days.
export const PREMIUM_REFERRAL_THRESHOLD = 10
export const VIP_REFERRAL_THRESHOLD = 20

export interface ReferralSubscriptionState {
  tier: 'free' | 'premium' | 'vip' | null
  source: 'free' | 'referral' | 'payment' | 'admin' | null
  expiresAt: string | null
}

export async function fetchMySubscriptionState(userId: string): Promise<ReferralSubscriptionState> {
  const { data } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_source, subscription_expires_at')
    .eq('id', userId)
    .single()
  return {
    tier: (data?.subscription_tier as ReferralSubscriptionState['tier']) ?? 'free',
    source: (data?.subscription_source as ReferralSubscriptionState['source']) ?? 'free',
    expiresAt: data?.subscription_expires_at ?? null,
  }
}
