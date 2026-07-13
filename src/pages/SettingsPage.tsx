import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Lock, Shield, Crown, Settings, ChevronRight, ChevronDown,
  Sun, Moon, Download, Trash2, LogOut, AlertTriangle,
  Palette, Globe, Check, Save, X, RefreshCw, Wifi, MessageCircle
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme, CHAT_THEME_PRESETS } from '@/contexts/ThemeContext'
import type { ChatTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useOfflineDraft } from '@/lib/offlineDraft'

interface NotifPrefs {
  push_messages: boolean
  push_likes: boolean
  push_follows: boolean
  push_mentions: boolean
  email_digest: boolean
  email_marketing: boolean
  sound_enabled: boolean
}

interface PrivacyPrefs {
  show_online: boolean
  show_last_seen: boolean
  allow_dms: 'everyone' | 'followers' | 'none'
  profile_visibility: 'public' | 'private'
}

interface AppearancePrefs {
  accent_color: string
  font_size: string
}

const DEFAULT_NOTIF: NotifPrefs = {
  push_messages: true,
  push_likes: true,
  push_follows: true,
  push_mentions: true,
  email_digest: false,
  email_marketing: false,
  sound_enabled: true,
}

const DEFAULT_PRIVACY: PrivacyPrefs = {
  show_online: true,
  show_last_seen: true,
  allow_dms: 'everyone',
  profile_visibility: 'public',
}

const DEFAULT_APPEARANCE: AppearancePrefs = {
  accent_color: 'pink',
  font_size: 'Medium',
}

const ACCENT_COLORS = [
  { name: 'Pink (Default)', value: 'pink',    class: 'bg-pink-500' },
  { name: 'Purple',         value: 'purple',  class: 'bg-purple-500' },
  { name: 'Blue',           value: 'blue',    class: 'bg-blue-500' },
  { name: 'Emerald',        value: 'emerald', class: 'bg-emerald-500' },
  { name: 'Orange',         value: 'orange',  class: 'bg-orange-500' },
  { name: 'Rose',           value: 'rose',    class: 'bg-rose-500' },
]

const FONT_SIZES = ['Small', 'Medium', 'Large', 'Extra Large']
const FONT_SCALE: Record<string, string> = {
  Small: '87.5%', Medium: '100%', Large: '112.5%', 'Extra Large': '125%',
}

export default function SettingsPage() {
  const { user, signOut, role } = useAuth()
  const { theme, toggleTheme, chatTheme, setChatTheme } = useTheme()
  const navigate = useNavigate()

  const [openSection, setOpenSection] = useState<string | null>('notifications')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [signOutConfirm, setSignOutConfirm] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [exportDone, setExportDone] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyDone, setVerifyDone] = useState(false)
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'pending' | 'verified'>('idle')
  const [verifyReason, setVerifyReason] = useState('')

  const [notifPrefs,   setNotifPrefs]   = useState<NotifPrefs>(DEFAULT_NOTIF)
  const [privacyPrefs, setPrivacyPrefs] = useState<PrivacyPrefs>(DEFAULT_PRIVACY)
  const [appearance,   setAppearance]   = useState<AppearancePrefs>(DEFAULT_APPEARANCE)

  // Offline draft — persists unsaved pref changes across disconnects
  const draftData = { notifPrefs, privacyPrefs, appearance }
  const setDraftData = useCallback((d: typeof draftData) => {
    if (d.notifPrefs)   setNotifPrefs(d.notifPrefs)
    if (d.privacyPrefs) setPrivacyPrefs(d.privacyPrefs)
    if (d.appearance)   setAppearance(d.appearance)
  }, [])
  const { isOnline, isDirty: hasPendingDraft } = useOfflineDraft('settings-prefs', draftData, setDraftData)

  // ── Load preferences from DB ──────────────────────────────────────────────
  const loadPrefs = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('profiles')
      .select('preferences, is_verified')
      .eq('id', user.id)
      .single()
    if (error) { setLoadError('Could not load preferences.'); return }
    const prefs = (data?.preferences as Record<string, any>) || {}
    if (prefs.notifications) setNotifPrefs({ ...DEFAULT_NOTIF, ...prefs.notifications })
    if (prefs.privacy)       setPrivacyPrefs({ ...DEFAULT_PRIVACY, ...prefs.privacy })
    if (prefs.appearance)    setAppearance({ ...DEFAULT_APPEARANCE, ...prefs.appearance })

    // Check verification status
    if (data?.is_verified) {
      setVerifyStatus('verified')
    } else {
      const { data: req } = await supabase
        .from('verification_requests')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle()
      if (req) setVerifyStatus('pending')
      else setVerifyStatus('idle')
    }
  }, [user])

  useEffect(() => { loadPrefs() }, [loadPrefs])

  // Apply font-size preference globally
  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SCALE[appearance.font_size] || '100%'
    return () => { document.documentElement.style.fontSize = '' }
  }, [appearance.font_size])

  // ── Save all preferences to DB ────────────────────────────────────────────
  const savePrefs = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        preferences: {
          notifications: notifPrefs,
          privacy:       privacyPrefs,
          appearance,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    // Keep the "Marketing Emails" toggle in sync with the real subscriber
    // list — toggling it on subscribes this account's email, toggling it
    // off unsubscribes it. Non-fatal if it fails (best-effort side sync).
    if (user.email) {
      try {
        if (notifPrefs.email_marketing) {
          await supabase.rpc('newsletter_subscribe', {
            p_email: user.email,
            p_name: null,
            p_categories: ['general', 'product-updates'],
            p_source: 'settings',
          })
        } else {
          await supabase.rpc('newsletter_unsubscribe', { p_email: user.email })
        }
      } catch { /* best-effort — don't block the main preferences save */ }
    }

    setSaving(false)
    if (error) {
      setLoadError('Save failed: ' + error.message)
      setTimeout(() => setLoadError(null), 4000)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  // ── Export user data ──────────────────────────────────────────────────────
  const handleExportData = async () => {
    if (!user) return
    setExportLoading(true)
    try {
      const [profileRes, postsRes, followersRes, storiesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('posts').select('*').eq('author_id', user.id),
        supabase.from('follows').select('*').eq('follower_id', user.id),
        supabase.from('stories').select('*').eq('user_id', user.id),  // live DB column is user_id
      ])
      const exportData = {
        exported_at: new Date().toISOString(),
        profile:    profileRes.data,
        posts:      postsRes.data   || [],
        following:  followersRes.data || [],
        stories:    storiesRes.data || [],
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `smartzconnect-data-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      setExportDone(true)
      setTimeout(() => setExportDone(false), 3000)
    } catch (err) { console.error(err) }
    setExportLoading(false)
  }

  // ── Delete account ────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (!user) return
    await supabase.from('profiles').update({ is_active: false }).eq('id', user.id)
    await signOut()
    navigate('/login')
  }

  // ── Submit verification request ───────────────────────────────────────────
  const handleVerificationRequest = async () => {
    if (!user) return
    setVerifyLoading(true)
    try {
      const { error } = await supabase.from('verification_requests').insert({
        user_id: user.id,
        status: 'pending',
        submitted_at: new Date().toISOString(),
        notes: verifyReason,
      })
      if (error) throw error
      setVerifyStatus('pending')
      setVerifyDone(true)
      setTimeout(() => setVerifyDone(false), 4000)
    } catch (err: any) {
      console.error('Verification request error:', err)
      setLoadError(err?.message || 'Could not submit verification request.')
      setTimeout(() => setLoadError(null), 4000)
    }
    setVerifyLoading(false)
  }

  // ── UI helpers ────────────────────────────────────────────────────────────
  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-love-gradient' : 'dark:bg-white/10 bg-gray-200'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )

  const Section = ({ id, icon: Icon, color, title, desc, children }: any) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-100 overflow-hidden">
      <button onClick={() => setOpenSection(openSection === id ? null : id)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-love-soft/20 transition-colors">
        <div className="w-10 h-10 rounded-xl dark:bg-white/5 bg-gray-50 flex items-center justify-center flex-shrink-0">
          <Icon className={`w-4.5 h-4.5 ${color}`} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold dark:text-white text-gray-900">{title}</p>
          <p className="text-xs dark:text-gray-400 text-gray-500">{desc}</p>
        </div>
        <motion.div animate={{ rotate: openSection === id ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 dark:text-gray-500 text-gray-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {openSection === id && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t dark:border-white/6 border-gray-100">
            <div className="p-4 space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )

  const PrefRow = ({ label, desc, children }: any) => (
    <div className="flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold dark:text-white text-gray-900">{label}</p>
        {desc && <p className="text-xs dark:text-gray-400 text-gray-500">{desc}</p>}
      </div>
      {children}
    </div>
  )

  return (
    <div className="h-full flex flex-col dark:bg-[#0D0A14] bg-gray-50">
      {/* Header */}
      <div className="px-4 py-4 dark:bg-[#130E1E] bg-white border-b dark:border-white/6 border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-black dark:text-white text-gray-900">Settings</h1>
          <div className="flex items-center gap-2">
            {loadError && (
              <span className="text-xs text-red-400">{loadError}</span>
            )}
            {saved && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-xs font-bold text-emerald-500">Saved!</span>
              </motion.div>
            )}
            {!isOnline && (
              <span className="flex items-center gap-1 text-[10px] text-amber-500 font-semibold">
                <Wifi className="w-3 h-3" /> Offline — changes saved locally
              </span>
            )}
            {hasPendingDraft && isOnline && (
              <span className="text-[10px] text-gray-400">Draft saved</span>
            )}
            <button onClick={savePrefs} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-love-gradient text-white text-xs font-bold shadow-md shadow-pink-500/20 disabled:opacity-60">
              {saving ? <div className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Saving…' : 'Save All'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">

        {/* Notifications */}
        <Section id="notifications" icon={Bell} color="text-blue-500" title="Notifications" desc="Push, email & sound alerts">
          <PrefRow label="Push — New Messages" desc="Get notified of new chat messages">
            <Toggle value={notifPrefs.push_messages} onChange={v => setNotifPrefs(p => ({ ...p, push_messages: v }))} />
          </PrefRow>
          <PrefRow label="Push — Likes & Reactions" desc="When someone reacts to your posts">
            <Toggle value={notifPrefs.push_likes} onChange={v => setNotifPrefs(p => ({ ...p, push_likes: v }))} />
          </PrefRow>
          <PrefRow label="Push — New Followers" desc="When someone follows you">
            <Toggle value={notifPrefs.push_follows} onChange={v => setNotifPrefs(p => ({ ...p, push_follows: v }))} />
          </PrefRow>
          <PrefRow label="Push — Mentions" desc="When you're tagged or mentioned">
            <Toggle value={notifPrefs.push_mentions} onChange={v => setNotifPrefs(p => ({ ...p, push_mentions: v }))} />
          </PrefRow>
          <PrefRow label="Email Digest" desc="Weekly summary of your activity">
            <Toggle value={notifPrefs.email_digest} onChange={v => setNotifPrefs(p => ({ ...p, email_digest: v }))} />
          </PrefRow>
          <PrefRow label="Marketing Emails" desc="News, updates and promotions">
            <Toggle value={notifPrefs.email_marketing} onChange={v => setNotifPrefs(p => ({ ...p, email_marketing: v }))} />
          </PrefRow>
          <PrefRow label="Sound Effects" desc="Play sounds for notifications">
            <Toggle value={notifPrefs.sound_enabled} onChange={v => setNotifPrefs(p => ({ ...p, sound_enabled: v }))} />
          </PrefRow>
        </Section>

        {/* Appearance / Theme */}
        <Section id="appearance" icon={Palette} color="text-purple-500" title="Appearance & Theme" desc="Colors, dark mode, font size">
          <PrefRow label="Dark Mode" desc="Switch between light and dark theme">
            <button onClick={toggleTheme} className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${theme === 'dark' ? 'bg-love-gradient' : 'dark:bg-white/10 bg-gray-200'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </PrefRow>

          <div>
            <p className="text-sm font-semibold dark:text-white text-gray-900 mb-2">Accent Color</p>
            <div className="flex flex-wrap gap-2">
              {ACCENT_COLORS.map(c => (
                <button key={c.value} onClick={() => setAppearance(a => ({ ...a, accent_color: c.value }))}
                  title={c.name}
                  className={`w-8 h-8 rounded-full ${c.class} flex items-center justify-center transition-all hover:scale-110 ${appearance.accent_color === c.value ? 'ring-2 ring-offset-2 dark:ring-offset-[#130E1E] ring-offset-white ring-white scale-110' : ''}`}>
                  {appearance.accent_color === c.value && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold dark:text-white text-gray-900 mb-2">Text Size</p>
            <div className="grid grid-cols-4 gap-2">
              {FONT_SIZES.map(s => (
                <button key={s} onClick={() => setAppearance(a => ({ ...a, font_size: s }))}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${appearance.font_size === s ? 'bg-love-gradient text-white shadow-md' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
                  Aa<br /><span className="text-[9px]">{s}</span>
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Chat Theme */}
        <Section id="chat-theme" icon={MessageCircle} color="text-pink-500" title="Chat Theme" desc="Bubble colors for all your chats">
          <p className="text-xs dark:text-gray-400 text-gray-500 -mt-1 mb-1">Choose a color theme for chat bubbles. Applied to direct messages, group chats, and world chat.</p>
          <div className="flex flex-wrap gap-3">
            {(Object.entries(CHAT_THEME_PRESETS) as [ChatTheme, typeof CHAT_THEME_PRESETS[ChatTheme]][]).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => setChatTheme(key)}
                className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl transition-all ${chatTheme === key ? 'ring-2 ring-offset-2 dark:ring-offset-[#130E1E] ring-offset-white ring-purple-400 scale-105 shadow-lg' : 'opacity-60 hover:opacity-90 hover:scale-105'}`}
                style={{ background: preset.vars.bubbleMine }}
              >
                <span className="text-2xl leading-none">{preset.emoji}</span>
                <span className="text-white text-[10px] font-bold drop-shadow-sm">{preset.label}</span>
                {chatTheme === key && <Check className="w-3 h-3 text-white" />}
              </button>
            ))}
          </div>
        </Section>

        {/* Privacy & Safety */}
        <Section id="privacy" icon={Lock} color="text-emerald-500" title="Privacy & Safety" desc="Control who sees your profile">
          <PrefRow label="Show Online Status" desc="Let others see when you're online">
            <Toggle value={privacyPrefs.show_online} onChange={v => setPrivacyPrefs(p => ({ ...p, show_online: v }))} />
          </PrefRow>
          <PrefRow label="Show Last Seen" desc="Display when you were last active">
            <Toggle value={privacyPrefs.show_last_seen} onChange={v => setPrivacyPrefs(p => ({ ...p, show_last_seen: v }))} />
          </PrefRow>

          <div>
            <p className="text-sm font-semibold dark:text-white text-gray-900 mb-1">Who Can Message Me</p>
            <p className="text-xs dark:text-gray-400 text-gray-500 mb-2">Control who can send you direct messages</p>
            <div className="grid grid-cols-3 gap-2">
              {(['everyone', 'followers', 'none'] as const).map(opt => (
                <button key={opt} onClick={() => setPrivacyPrefs(p => ({ ...p, allow_dms: opt }))}
                  className={`py-2 px-1 rounded-xl text-xs font-bold capitalize transition-all ${privacyPrefs.allow_dms === opt ? 'bg-love-gradient text-white shadow-md' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold dark:text-white text-gray-900 mb-1">Profile Visibility</p>
            <div className="grid grid-cols-2 gap-2">
              {(['public', 'private'] as const).map(opt => (
                <button key={opt} onClick={() => setPrivacyPrefs(p => ({ ...p, profile_visibility: opt }))}
                  className={`py-2 rounded-xl text-xs font-bold capitalize transition-all ${privacyPrefs.profile_visibility === opt ? 'bg-love-gradient text-white shadow-md' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
                  {opt === 'public' ? '🌍 Public' : '🔒 Private'}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Verification */}
        <Section id="verification" icon={Shield} color="text-purple-500" title="Verification" desc="Verify your identity for a badge">
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center">
              <Shield className="w-7 h-7 text-purple-500" />
            </div>

            {verifyStatus === 'verified' ? (
              <div className="flex flex-col items-center gap-2">
                <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-bold text-sm">
                  <Check className="w-4 h-4" /> Verified ✓
                </span>
                <p className="text-xs dark:text-gray-400 text-gray-500 text-center">Your profile has a verified badge visible to all members.</p>
              </div>
            ) : verifyStatus === 'pending' ? (
              <div className="flex flex-col items-center gap-2">
                <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 font-bold text-sm">
                  <RefreshCw className="w-4 h-4" /> Under Review
                </span>
                <p className="text-xs dark:text-gray-400 text-gray-500 text-center">Your verification request is being reviewed. We'll notify you within 48 hours.</p>
              </div>
            ) : (
              <>
                <p className="text-sm dark:text-gray-300 text-gray-700 text-center">
                  Get a verified badge on your profile to build trust with other members. Our team reviews requests within 48 hours.
                </p>
                <div className="w-full space-y-2">
                  <label className="text-xs font-semibold dark:text-gray-400 text-gray-600">Why do you want verification?</label>
                  <textarea
                    value={verifyReason}
                    onChange={e => setVerifyReason(e.target.value)}
                    placeholder="Briefly explain why you'd like a verified badge…"
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>
                <button onClick={handleVerificationRequest} disabled={verifyLoading || verifyDone || !verifyReason.trim()}
                  className="px-6 py-2.5 rounded-xl bg-purple-500 text-white text-sm font-bold hover:bg-purple-600 transition-colors disabled:opacity-60 flex items-center gap-2">
                  {verifyLoading ? <div className="w-4 h-4 border border-white/40 border-t-white rounded-full animate-spin" /> : verifyDone ? <Check className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                  {verifyLoading ? 'Submitting…' : verifyDone ? 'Request Submitted!' : 'Apply for Verification'}
                </button>
              </>
            )}
          </div>
        </Section>

        {/* Subscription */}
        <Section id="subscription" icon={Crown} color="text-amber-500" title="Subscription" desc="Manage your plan & features">
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <Crown className="w-7 h-7 text-amber-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold dark:text-white text-gray-900">Upgrade to Premium</p>
              <p className="text-xs dark:text-gray-400 text-gray-500 mt-1">Unlock unlimited messaging, profile boosts, and ad-free experience.</p>
            </div>
            <button onClick={() => navigate('/app/subscriptions')}
              className="px-6 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors">
              View Plans
            </button>
          </div>
        </Section>

        {/* Account Settings */}
        <Section id="account" icon={Settings} color="text-gray-500" title="Account Settings" desc="Email, password & data management">
          <div className="space-y-3">
            <div className="p-3 rounded-xl dark:bg-white/5 bg-gray-50 flex items-center justify-between">
              <div>
                <p className="text-xs dark:text-gray-400 text-gray-500 mb-0.5">Email</p>
                <p className="text-sm font-semibold dark:text-white text-gray-900">{user?.email}</p>
              </div>
              {role && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-love-soft text-brand-pink border border-pink-500/20 capitalize">{role}</span>
              )}
            </div>

            <button onClick={() => navigate('/forgot-password')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 dark:text-white text-gray-900 text-sm font-semibold hover:text-brand-pink transition-colors">
              Change Password <ChevronRight className="w-4 h-4" />
            </button>

            <div className="border-t dark:border-white/6 border-gray-100 pt-3 space-y-2">
              <p className="text-xs font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider">Data & Export</p>
              <button onClick={handleExportData} disabled={exportLoading}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl dark:bg-blue-500/10 bg-blue-50 text-blue-500 border dark:border-blue-500/20 border-blue-200 text-sm font-semibold hover:bg-blue-500/20 transition-all disabled:opacity-60">
                {exportLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : exportDone ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                {exportLoading ? 'Exporting…' : exportDone ? 'Downloaded!' : 'Export My Data (JSON)'}
              </button>
            </div>

            <div className="border-t dark:border-white/6 border-gray-100 pt-3 space-y-2">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">Danger Zone</p>

              {!signOutConfirm ? (
                <button onClick={() => setSignOutConfirm(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-all">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={async () => { await signOut(); navigate('/login') }}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors">
                    Confirm Sign Out
                  </button>
                  <button onClick={() => setSignOutConfirm(false)}
                    className="px-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 text-sm font-semibold hover:text-brand-pink transition-colors">
                    Cancel
                  </button>
                </div>
              )}

              {!deleteConfirm ? (
                <button onClick={() => setDeleteConfirm(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 text-red-500 text-sm font-semibold hover:bg-red-500/10 transition-all">
                  <AlertTriangle className="w-4 h-4" /> Delete Account
                </button>
              ) : (
                <div className="space-y-2 p-3 rounded-xl border border-red-500/30 bg-red-500/5">
                  <p className="text-xs text-red-400 font-semibold">This will permanently deactivate your account. Are you sure?</p>
                  <div className="flex gap-2">
                    <button onClick={handleDeleteAccount}
                      className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors">
                      Yes, Delete
                    </button>
                    <button onClick={() => setDeleteConfirm(false)}
                      className="px-3 py-2 rounded-xl dark:bg-white/5 bg-gray-100 text-xs font-semibold hover:text-brand-pink transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}
