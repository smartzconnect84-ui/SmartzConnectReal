import { useState, useEffect, type ElementType } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings, ToggleLeft, ToggleRight, Globe, Shield, Bell, CreditCard,
  Smartphone, Save, RefreshCw, Palette, Sliders, Zap, Sun, Moon, Monitor,
  Megaphone, Plus, Edit, Trash2, X, Link, CheckCircle, AlertCircle, Info,
  AlertTriangle, Gift
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAnnouncement } from '@/contexts/AnnouncementContext'
import type { AnnouncementType, Announcement } from '@/contexts/AnnouncementContext'

// ── Feature Toggles ────────────────────────────────────────────────────────────

const SETTINGS_KEY = 'smartz_admin_settings'

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveSettings(data: object) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(data)) } catch { /* ignore */ }
}

interface Toggle {
  id: string; label: string; description: string; enabled: boolean; category: string
}

const defaultToggles: Toggle[] = [
  { id: 't1',  label: 'User Registration',       description: 'Allow new users to register',                    enabled: true,  category: 'Platform' },
  { id: 't2',  label: 'Email Verification',       description: 'Require email verification on signup',           enabled: true,  category: 'Platform' },
  { id: 't3',  label: 'Social Login',             description: 'Allow Google/Facebook login',                    enabled: true,  category: 'Platform' },
  { id: 't21', label: 'Maintenance Mode',         description: 'Put platform in maintenance mode',               enabled: false, category: 'Platform' },
  { id: 't4',  label: 'Discover / Matching',      description: 'Enable the Tinder-style swipe feature',          enabled: true,  category: 'Features' },
  { id: 't5',  label: 'Spin & Chat',              description: 'Enable random matching feature',                 enabled: true,  category: 'Features' },
  { id: 't6',  label: 'SmartzTV Live Streaming',  description: 'Allow users to go live',                         enabled: true,  category: 'Features' },
  { id: 't7',  label: 'Marketplace',              description: 'Enable product listings and sales',              enabled: true,  category: 'Features' },
  { id: 't8',  label: 'SmartzRide',               description: 'Enable ride-hailing service',                    enabled: true,  category: 'Features' },
  { id: 't9',  label: 'Group Chat Rooms',         description: 'Enable community group chat feature',            enabled: true,  category: 'Features' },
  { id: 't10', label: 'Stories Feature',          description: 'Allow users to post 24h stories',               enabled: true,  category: 'Features' },
  { id: 't11', label: 'Profile Boosts',           description: 'Allow users to purchase profile boosts',        enabled: true,  category: 'Features' },
  { id: 't12', label: 'Super Likes',              description: 'Enable Super Like swipe action',                 enabled: true,  category: 'Features' },
  { id: 't13', label: 'MTN MoMo Payments',        description: 'Accept MTN Mobile Money payments',               enabled: true,  category: 'Payments' },
  { id: 't14', label: 'Orange Money Payments',    description: 'Accept Orange Money payments',                   enabled: true,  category: 'Payments' },
  { id: 't15', label: 'Stripe Payments',          description: 'Accept international card payments',             enabled: false, category: 'Payments' },
  { id: 't16', label: 'In-App Wallet',            description: 'Enable user wallet & credits system',           enabled: false, category: 'Payments' },
  { id: 't17', label: 'Push Notifications',       description: 'Send push notifications via OneSignal',          enabled: true,  category: 'Notifications' },
  { id: 't18', label: 'Email Notifications',      description: 'Send email notifications to users',              enabled: true,  category: 'Notifications' },
  { id: 't19', label: 'Match Alerts',             description: 'Notify users instantly when matched',            enabled: true,  category: 'Notifications' },
  { id: 't20', label: 'Promotional Emails',       description: 'Send promotional and offer emails',              enabled: false, category: 'Notifications' },
  { id: 't22', label: 'Profile Verification',     description: 'Allow users to request verification badge',      enabled: true,  category: 'Safety' },
  { id: 't23', label: 'Content Moderation AI',    description: 'Auto-flag inappropriate content with AI',        enabled: true,  category: 'Safety' },
  { id: 't24', label: 'Screenshot Prevention',    description: 'Block screenshots in private chats',             enabled: false, category: 'Safety' },
  { id: 't25', label: 'Age Verification',         description: 'Require age verification for signup',            enabled: false, category: 'Safety' },
  { id: 't26', label: 'User Exports',             description: 'Allow users to export their own data (GDPR)',    enabled: true,  category: 'Privacy' },
  { id: 't27', label: 'Admin CSV Export',         description: 'Allow admins to export user/order data as CSV',  enabled: true,  category: 'Privacy' },
  { id: 't28', label: 'Data Deletion Requests',   description: 'Process user account deletion requests',         enabled: true,  category: 'Privacy' },
  { id: 't29', label: 'Audit Logging',            description: 'Log all admin actions for compliance',           enabled: true,  category: 'Privacy' },
]

const themes = [
  { id: 'love',    label: 'Love (Default)',  gradient: 'from-pink-500 to-rose-500',    preview: '#ec4899' },
  { id: 'ocean',   label: 'Ocean',           gradient: 'from-blue-500 to-cyan-500',    preview: '#3b82f6' },
  { id: 'forest',  label: 'Forest',          gradient: 'from-emerald-500 to-teal-500', preview: '#10b981' },
  { id: 'sunset',  label: 'Sunset',          gradient: 'from-orange-500 to-amber-500', preview: '#f97316' },
  { id: 'royal',   label: 'Royal',           gradient: 'from-purple-500 to-violet-600',preview: '#a855f7' },
  { id: 'carbon',  label: 'Carbon',          gradient: 'from-gray-700 to-gray-900',    preview: '#374151' },
]

const fontScaleOptions = [
  { id: 'small',  label: 'Small',   preview: 'text-[11px]' },
  { id: 'normal', label: 'Normal',  preview: 'text-[13px]' },
  { id: 'large',  label: 'Large',   preview: 'text-[15px]' },
  { id: 'xl',     label: 'XL',      preview: 'text-[17px]' },
]

const fontStyleOptions = [
  { id: 'default', label: 'Inter (Default)', preview: 'font-sans' },
  { id: 'serif',   label: 'Georgia (Serif)', preview: 'font-serif' },
  { id: 'mono',    label: 'Mono',            preview: 'font-mono' },
]

const borderRadiusOptions = [
  { id: 'sharp',   label: 'Sharp',   cls: 'rounded-none' },
  { id: 'rounded', label: 'Rounded', cls: 'rounded-xl' },
  { id: 'pill',    label: 'Pill',    cls: 'rounded-full' },
]

const categories = ['All', 'Platform', 'Features', 'Payments', 'Notifications', 'Safety', 'Privacy']
const categoryIcons: Record<string, ElementType> = {
  Platform: Globe, Features: Smartphone, Payments: CreditCard,
  Notifications: Bell, Safety: Shield, Privacy: Shield,
}

// ── Announcement helpers ───────────────────────────────────────────────────────

const ANN_TYPE_CONFIG: Record<AnnouncementType, { icon: ElementType; label: string; color: string }> = {
  info:    { icon: Info,          label: 'Info',    color: 'text-blue-400' },
  warning: { icon: AlertTriangle, label: 'Warning', color: 'text-amber-400' },
  success: { icon: CheckCircle,   label: 'Success', color: 'text-emerald-400' },
  error:   { icon: AlertCircle,   label: 'Error',   color: 'text-red-400' },
  promo:   { icon: Gift,          label: 'Promo',   color: 'text-pink-400' },
}

const ANN_TYPES: AnnouncementType[] = ['info', 'warning', 'success', 'error', 'promo']

const EMPTY_ANN = { message: '', type: 'info' as AnnouncementType, is_active: true, link_text: '', link_url: '', created_by: 'Admin' }

const inp = 'w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm placeholder:dark:text-gray-500 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors'

// ── Component ──────────────────────────────────────────────────────────────────

export default function AdminSettings() {
  const { appearance, setAppearance, theme, setTheme } = useTheme()
  const {
    announcements, bannerEnabled, setBannerEnabled,
    addAnnouncement, updateAnnouncement, deleteAnnouncement, toggleAnnouncement, refetch,
  } = useAnnouncement()

  const [toggles, setToggles]               = useState(defaultToggles)
  const [activeCategory, setActiveCategory] = useState('All')
  const [saved, setSaved]                   = useState(false)
  const [activeTab, setActiveTab]           = useState<'features' | 'appearance' | 'announcements'>('features')

  // Announcement form
  const [showAnnForm, setShowAnnForm]         = useState(false)
  const [editAnn, setEditAnn]                 = useState<Announcement | null>(null)
  const [annForm, setAnnForm]                 = useState(EMPTY_ANN)
  const [annSaving, setAnnSaving]             = useState(false)
  const [annToast, setAnnToast]               = useState<string | null>(null)

  useEffect(() => {
    const stored = loadSettings()
    if (!stored) return
    if (stored.toggles) setToggles(stored.toggles)
  }, [])

  useEffect(() => { refetch() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: string) => setToggles(prev => prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t))

  const handleSave = () => {
    saveSettings({ toggles })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const filtered = toggles.filter(t => activeCategory === 'All' || t.category === activeCategory)

  // ── Announcement handlers ──────────────────────────────────────────────────

  const showAnnToast = (msg: string) => {
    setAnnToast(msg)
    setTimeout(() => setAnnToast(null), 2500)
  }

  const openAddAnn = () => {
    setEditAnn(null)
    setAnnForm(EMPTY_ANN)
    setShowAnnForm(true)
  }

  const openEditAnn = (a: Announcement) => {
    setEditAnn(a)
    setAnnForm({ message: a.message, type: a.type, is_active: a.is_active, link_text: a.link_text || '', link_url: a.link_url || '', created_by: a.created_by || 'Admin' })
    setShowAnnForm(true)
  }

  const handleSaveAnn = async () => {
    if (!annForm.message.trim()) return
    setAnnSaving(true)
    const payload = {
      ...annForm,
      link_text: annForm.link_text || null,
      link_url: annForm.link_url || null,
    }
    if (editAnn) {
      await updateAnnouncement(editAnn.id, payload)
      showAnnToast('Announcement updated')
    } else {
      await addAnnouncement(payload)
      showAnnToast('Announcement created')
    }
    setShowAnnForm(false)
    setAnnSaving(false)
  }

  const handleDeleteAnn = async (id: string) => {
    await deleteAnnouncement(id)
    showAnnToast('Announcement deleted')
  }

  const handleToggleAnn = async (a: Announcement) => {
    await toggleAnnouncement(a.id, !a.is_active)
    showAnnToast(a.is_active ? 'Announcement hidden' : 'Announcement activated')
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">

      {/* Ann Toast */}
      <AnimatePresence>
        {annToast && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="fixed top-4 right-4 z-[200] flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white bg-emerald-500">
            <CheckCircle className="w-4 h-4" /> {annToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-black text-2xl dark:text-white text-gray-900">Platform Settings</h1>
          <p className="text-sm dark:text-gray-400 text-gray-500 mt-0.5">Configure features, appearance, announcements, and platform behavior</p>
        </div>
        {activeTab === 'features' && (
          <button onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-all ${saved ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-love-gradient text-white shadow-pink-500/20 hover:opacity-90'}`}>
            {saved ? <><RefreshCw className="w-3.5 h-3.5" /> Saved!</> : <><Save className="w-3.5 h-3.5" /> Save Changes</>}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 dark:bg-[#130E1E] bg-gray-100 rounded-xl w-fit">
        {[
          { id: 'features',      icon: Sliders,    label: 'Features' },
          { id: 'appearance',    icon: Palette,    label: 'Appearance' },
          { id: 'announcements', icon: Megaphone,  label: 'Announcements' },
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-love-gradient text-white shadow-md' : 'dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Features Tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'features' && (
        <>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeCategory === cat ? 'bg-love-gradient text-white' : 'dark:bg-[#130E1E] bg-white border dark:border-white/8 border-gray-200 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
                {cat}
              </button>
            ))}
          </div>

          {(activeCategory === 'All' ? categories.slice(1) : [activeCategory]).map(cat => {
            const catToggles = filtered.filter(t => t.category === cat)
            if (catToggles.length === 0) return null
            const CatIcon = categoryIcons[cat] || Settings
            return (
              <div key={cat} className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b dark:border-white/5 border-gray-100">
                  <CatIcon className="w-4 h-4 text-brand-pink" />
                  <h3 className="font-bold text-sm dark:text-white text-gray-900">{cat}</h3>
                  <span className="ml-auto text-xs dark:text-gray-500 text-gray-400">{catToggles.filter(t => t.enabled).length}/{catToggles.length} active</span>
                </div>
                <div className="divide-y dark:divide-white/4 divide-gray-50">
                  {catToggles.map((t, i) => (
                    <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="flex items-center justify-between px-5 py-4 hover:dark:bg-white/2 hover:bg-pink-50/30 transition-colors">
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold dark:text-white text-gray-900">{t.label}</p>
                          {t.enabled && <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-bold">ON</span>}
                        </div>
                        <p className="text-xs dark:text-gray-400 text-gray-500 mt-0.5">{t.description}</p>
                      </div>
                      <button onClick={() => toggle(t.id)} className="flex-shrink-0 transition-transform hover:scale-110">
                        {t.enabled
                          ? <ToggleRight className="w-8 h-8 text-brand-pink" />
                          : <ToggleLeft className="w-8 h-8 dark:text-gray-600 text-gray-400" />
                        }
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* ── Appearance Tab ────────────────────────────────────────────────────── */}
      {activeTab === 'appearance' && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl dark:bg-emerald-500/8 bg-emerald-50 border dark:border-emerald-500/15 border-emerald-200">
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <p className="text-xs dark:text-emerald-400 text-emerald-700 font-semibold">Changes apply instantly — all users see updates in real time</p>
          </div>

          {/* Dark / Light Mode */}
          <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b dark:border-white/5 border-gray-100">
              <Moon className="w-4 h-4 text-brand-pink" />
              <h3 className="font-bold text-sm dark:text-white text-gray-900">Display Mode</h3>
            </div>
            <div className="p-5 grid grid-cols-3 gap-3">
              {([
                { id: 'dark',   icon: Moon,    label: 'Dark' },
                { id: 'light',  icon: Sun,     label: 'Light' },
                { id: 'system', icon: Monitor, label: 'System' },
              ] as { id: 'dark' | 'light' | 'system'; icon: ElementType; label: string }[]).map(mode => {
                const Icon = mode.icon
                const active = theme === mode.id || (mode.id === 'system' && false)
                return (
                  <button key={mode.id}
                    onClick={() => { if (mode.id !== 'system') setTheme(mode.id) }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      theme === mode.id ? 'border-brand-pink dark:bg-pink-500/10 bg-pink-50' : 'dark:border-white/8 border-gray-200 dark:hover:border-white/20 hover:border-gray-300'
                    }`}>
                    <Icon className={`w-5 h-5 ${theme === mode.id ? 'text-brand-pink' : 'dark:text-gray-400 text-gray-500'}`} />
                    <span className={`text-xs font-semibold ${theme === mode.id ? 'text-brand-pink' : 'dark:text-gray-300 text-gray-600'}`}>{mode.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Theme Presets */}
          <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b dark:border-white/5 border-gray-100">
              <Palette className="w-4 h-4 text-brand-pink" />
              <h3 className="font-bold text-sm dark:text-white text-gray-900">Color Theme</h3>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {themes.map(t => (
                <button key={t.id} onClick={() => setAppearance({ themePreset: t.id as any, accentColor: t.preview })}
                  className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                    appearance.themePreset === t.id
                      ? 'border-brand-pink dark:bg-pink-500/10 bg-pink-50'
                      : 'dark:border-white/8 border-gray-200 dark:hover:border-white/20 hover:border-gray-300'
                  }`}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.gradient} shadow-md`} />
                  <span className="text-xs font-semibold dark:text-white text-gray-900">{t.label}</span>
                  {appearance.themePreset === t.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-pink flex items-center justify-center">
                      <Zap className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Font Scale */}
          <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b dark:border-white/5 border-gray-100">
              <Settings className="w-4 h-4 text-brand-pink" />
              <h3 className="font-bold text-sm dark:text-white text-gray-900">Font Size</h3>
              <span className="ml-auto text-xs dark:text-gray-500 text-gray-400 capitalize">{appearance.fontScale}</span>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {fontScaleOptions.map(f => (
                <button key={f.id} onClick={() => setAppearance({ fontScale: f.id as any })}
                  className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                    appearance.fontScale === f.id
                      ? 'border-brand-pink dark:bg-pink-500/10 bg-pink-50'
                      : 'dark:border-white/8 border-gray-200 dark:hover:border-white/20 hover:border-gray-300'
                  }`}>
                  <span className={`font-black ${f.preview} ${appearance.fontScale === f.id ? 'text-brand-pink' : 'dark:text-gray-300 text-gray-600'}`}>Aa</span>
                  <span className={`text-[10px] font-semibold ${appearance.fontScale === f.id ? 'text-brand-pink' : 'dark:text-gray-400 text-gray-500'}`}>{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Style */}
          <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b dark:border-white/5 border-gray-100">
              <Settings className="w-4 h-4 text-brand-pink" />
              <h3 className="font-bold text-sm dark:text-white text-gray-900">Font Style</h3>
              <span className="ml-auto text-xs dark:text-gray-500 text-gray-400 capitalize">{appearance.fontStyle}</span>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {fontStyleOptions.map(f => (
                <button key={f.id} onClick={() => setAppearance({ fontStyle: f.id as any })}
                  className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl border-2 transition-all ${
                    appearance.fontStyle === f.id
                      ? 'border-brand-pink dark:bg-pink-500/10 bg-pink-50'
                      : 'dark:border-white/8 border-gray-200 dark:hover:border-white/20 hover:border-gray-300'
                  }`}>
                  <span className={`text-lg font-bold ${f.preview} ${appearance.fontStyle === f.id ? 'text-brand-pink' : 'dark:text-gray-200 text-gray-700'}`}>
                    The quick brown fox
                  </span>
                  <span className={`text-[10px] font-semibold ${appearance.fontStyle === f.id ? 'text-brand-pink' : 'dark:text-gray-400 text-gray-500'}`}>{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Border Radius */}
          <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b dark:border-white/5 border-gray-100">
              <Settings className="w-4 h-4 text-brand-pink" />
              <h3 className="font-bold text-sm dark:text-white text-gray-900">Border Radius Style</h3>
              <span className="ml-auto text-xs dark:text-gray-500 text-gray-400 capitalize">{appearance.borderRadius}</span>
            </div>
            <div className="p-5 flex flex-wrap gap-3">
              {borderRadiusOptions.map(r => (
                <button key={r.id} onClick={() => setAppearance({ borderRadius: r.id as any })}
                  className={`flex flex-col items-center gap-2 px-6 py-3 border-2 transition-all ${r.cls} ${
                    appearance.borderRadius === r.id
                      ? 'border-brand-pink dark:bg-pink-500/10 bg-pink-50'
                      : 'dark:border-white/8 border-gray-200 dark:hover:border-white/20 hover:border-gray-300'
                  }`}>
                  <span className={`text-sm font-semibold ${appearance.borderRadius === r.id ? 'text-brand-pink' : 'dark:text-gray-300 text-gray-600'}`}>{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reset */}
          <button onClick={() => setAppearance({
            fontScale: 'normal', fontStyle: 'default', accentColor: '#ec4899',
            borderRadius: 'rounded', themePreset: 'love',
          })} className="flex items-center gap-2 px-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 text-sm font-semibold hover:text-brand-pink transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Reset to defaults
          </button>
        </div>
      )}

      {/* ── Announcements Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'announcements' && (
        <div className="space-y-5">

          {/* Global Banner Toggle */}
          <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-love-soft flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-brand-pink" />
                </div>
                <div>
                  <p className="font-bold text-sm dark:text-white text-gray-900">Announcement Banner</p>
                  <p className="text-xs dark:text-gray-400 text-gray-500 mt-0.5">Show scrolling banner to all users and admins platform-wide</p>
                </div>
              </div>
              <button onClick={() => setBannerEnabled(!bannerEnabled)} className="transition-transform hover:scale-110">
                {bannerEnabled
                  ? <ToggleRight className="w-9 h-9 text-brand-pink" />
                  : <ToggleLeft className="w-9 h-9 dark:text-gray-600 text-gray-400" />
                }
              </button>
            </div>
            {bannerEnabled && (
              <div className="mt-4 pt-4 border-t dark:border-white/5 border-gray-100 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${announcements.some(a => a.is_active) ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                <p className="text-xs dark:text-gray-400 text-gray-500">
                  {announcements.some(a => a.is_active)
                    ? `Banner live: "${announcements.find(a => a.is_active)?.message?.substring(0, 60)}${(announcements.find(a => a.is_active)?.message?.length ?? 0) > 60 ? '…' : ''}"`
                    : 'No active announcement — activate one below'}
                </p>
              </div>
            )}
          </div>

          {/* Announcements list */}
          <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/5 border-gray-100">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-brand-pink" />
                <h3 className="font-bold text-sm dark:text-white text-gray-900">Announcement Messages</h3>
                <span className="text-xs dark:text-gray-500 text-gray-400">({announcements.length})</span>
              </div>
              <button onClick={openAddAnn}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-love-gradient text-white text-xs font-bold shadow-md shadow-pink-500/20 hover:opacity-90 transition-opacity">
                <Plus className="w-3 h-3" /> New
              </button>
            </div>

            {announcements.length === 0 ? (
              <div className="py-12 text-center">
                <Megaphone className="w-8 h-8 dark:text-gray-600 text-gray-300 mx-auto mb-3 opacity-50" />
                <p className="text-sm dark:text-gray-500 text-gray-400">No announcements yet</p>
                <button onClick={openAddAnn} className="mt-3 text-xs text-brand-pink font-semibold hover:underline">+ Create first announcement</button>
              </div>
            ) : (
              <div className="divide-y dark:divide-white/4 divide-gray-50">
                {announcements.map((ann, i) => {
                  const tc = ANN_TYPE_CONFIG[ann.type] || ANN_TYPE_CONFIG.info
                  const TIcon = tc.icon
                  return (
                    <motion.div key={ann.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      className="flex items-start gap-4 px-5 py-4 hover:dark:bg-white/2 hover:bg-gray-50 transition-colors">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${ann.is_active ? 'bg-love-soft' : 'dark:bg-white/5 bg-gray-100'}`}>
                        <TIcon className={`w-4 h-4 ${ann.is_active ? 'text-brand-pink' : 'dark:text-gray-500 text-gray-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className={`text-[10px] font-black uppercase tracking-wide ${tc.color}`}>{tc.label}</span>
                          {ann.is_active && bannerEnabled && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 text-[9px] font-black">
                              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> LIVE
                            </span>
                          )}
                        </div>
                        <p className="text-sm dark:text-white text-gray-900 font-semibold line-clamp-2">{ann.message}</p>
                        {ann.link_text && ann.link_url && (
                          <p className="text-[10px] dark:text-gray-500 text-gray-400 mt-0.5 flex items-center gap-1">
                            <Link className="w-2.5 h-2.5" /> {ann.link_text} → {ann.link_url}
                          </p>
                        )}
                        <p className="text-[10px] dark:text-gray-600 text-gray-400 mt-1">
                          {ann.created_at ? new Date(ann.created_at).toLocaleString() : 'Just now'} · by {ann.created_by || 'Admin'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => handleToggleAnn(ann)} title={ann.is_active ? 'Deactivate' : 'Activate'} className="transition-transform hover:scale-110">
                          {ann.is_active
                            ? <ToggleRight className="w-7 h-7 text-brand-pink" />
                            : <ToggleLeft className="w-7 h-7 dark:text-gray-600 text-gray-400" />
                          }
                        </button>
                        <button onClick={() => openEditAnn(ann)} className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
                          <Edit className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleDeleteAnn(ann.id)} className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-red-500 transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* SQL tip */}
          <div className="flex items-start gap-3 p-4 rounded-2xl dark:bg-blue-500/8 bg-blue-50 border dark:border-blue-500/15 border-blue-200">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold dark:text-blue-400 text-blue-600">Persistent storage</p>
              <p className="text-xs dark:text-blue-400/70 text-blue-600/70 mt-0.5">
                For announcements to persist across all user sessions, run the SQL migration in <code className="font-mono bg-blue-500/10 px-1 rounded">supabase/announcements_migration.sql</code> in your Supabase SQL editor.
                Until then, announcements are stored locally in this browser.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Announcement Form Modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAnnForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAnnForm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg dark:bg-[#1A1228] bg-white rounded-3xl p-6 border dark:border-white/8 border-gray-200 shadow-2xl">

              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-black text-lg dark:text-white text-gray-900">
                  {editAnn ? 'Edit Announcement' : 'New Announcement'}
                </h3>
                <button onClick={() => setShowAnnForm(false)} className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Type */}
                <div>
                  <label className="text-xs font-bold dark:text-gray-400 text-gray-600 mb-2 block">Type</label>
                  <div className="grid grid-cols-5 gap-2">
                    {ANN_TYPES.map(type => {
                      const tc = ANN_TYPE_CONFIG[type]
                      const TIcon = tc.icon
                      return (
                        <button key={type} onClick={() => setAnnForm(p => ({ ...p, type }))}
                          className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all ${
                            annForm.type === type ? 'border-brand-pink dark:bg-pink-500/10 bg-pink-50' : 'dark:border-white/8 border-gray-200'
                          }`}>
                          <TIcon className={`w-4 h-4 ${annForm.type === type ? 'text-brand-pink' : tc.color}`} />
                          <span className={`text-[9px] font-bold ${annForm.type === type ? 'text-brand-pink' : 'dark:text-gray-400 text-gray-500'}`}>{tc.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="text-xs font-bold dark:text-gray-400 text-gray-600 mb-1.5 block">Message *</label>
                  <textarea value={annForm.message} onChange={e => setAnnForm(p => ({ ...p, message: e.target.value }))}
                    rows={3} placeholder="Announcement text shown in the scrolling banner…"
                    className={inp + ' resize-none'} />
                </div>

                {/* Link (optional) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold dark:text-gray-400 text-gray-600 mb-1.5 block">Link Text <span className="font-normal opacity-60">(optional)</span></label>
                    <input value={annForm.link_text} onChange={e => setAnnForm(p => ({ ...p, link_text: e.target.value }))}
                      placeholder="Learn more" className={inp} />
                  </div>
                  <div>
                    <label className="text-xs font-bold dark:text-gray-400 text-gray-600 mb-1.5 block">Link URL <span className="font-normal opacity-60">(optional)</span></label>
                    <input value={annForm.link_url} onChange={e => setAnnForm(p => ({ ...p, link_url: e.target.value }))}
                      placeholder="https://…" className={inp} />
                  </div>
                </div>

                {/* Active */}
                <div className="flex items-center justify-between p-4 rounded-xl dark:bg-white/3 bg-gray-50 border dark:border-white/5 border-gray-100">
                  <div>
                    <p className="text-sm font-semibold dark:text-white text-gray-900">Activate immediately</p>
                    <p className="text-xs dark:text-gray-400 text-gray-500 mt-0.5">This will replace any currently active announcement</p>
                  </div>
                  <button onClick={() => setAnnForm(p => ({ ...p, is_active: !p.is_active }))}>
                    {annForm.is_active
                      ? <ToggleRight className="w-8 h-8 text-brand-pink" />
                      : <ToggleLeft className="w-8 h-8 dark:text-gray-600 text-gray-400" />
                    }
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAnnForm(false)} className="flex-1 py-3 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-white text-gray-900 text-sm font-semibold">Cancel</button>
                <button onClick={handleSaveAnn} disabled={annSaving || !annForm.message.trim()}
                  className="flex-1 py-3 rounded-xl bg-love-gradient text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 hover:opacity-90 disabled:opacity-50">
                  {annSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {annSaving ? 'Saving…' : editAnn ? 'Update' : 'Create'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
