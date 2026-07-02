import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings, ToggleLeft, ToggleRight, Globe, Shield, Bell, CreditCard,
  Smartphone, Save, RefreshCw, Palette, Sliders, Zap, Sun, Moon, Monitor
} from 'lucide-react'

const SETTINGS_KEY = 'smartz_admin_settings'

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveSettings(data: object) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data))
  } catch { /* ignore storage error */ }
}

interface Toggle {
  id: string; label: string; description: string; enabled: boolean; category: string
}

const defaultToggles: Toggle[] = [
  { id: 't1',  label: 'User Registration',       description: 'Allow new users to register',                    enabled: true,  category: 'Platform' },
  { id: 't2',  label: 'Email Verification',       description: 'Require email verification on signup',           enabled: true,  category: 'Platform' },
  { id: 't3',  label: 'Social Login',             description: 'Allow Google/Facebook login',                    enabled: true,  category: 'Platform' },
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
  { id: 't21', label: 'Maintenance Mode',         description: 'Put platform in maintenance mode',               enabled: false, category: 'Platform' },
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
  { id: 'love',   label: 'Love (Default)',  gradient: 'from-pink-500 to-rose-500',   preview: '#ec4899' },
  { id: 'ocean',  label: 'Ocean',           gradient: 'from-blue-500 to-cyan-500',   preview: '#3b82f6' },
  { id: 'forest', label: 'Forest',          gradient: 'from-emerald-500 to-teal-500',preview: '#10b981' },
  { id: 'sunset', label: 'Sunset',          gradient: 'from-orange-500 to-amber-500',preview: '#f97316' },
  { id: 'royal',  label: 'Royal',           gradient: 'from-purple-500 to-violet-600',preview: '#a855f7' },
  { id: 'carbon', label: 'Carbon',          gradient: 'from-gray-700 to-gray-900',   preview: '#374151' },
]

const colorOptions = [
  { id: 'pink',    label: 'Pink',     hex: '#ec4899' },
  { id: 'purple',  label: 'Purple',   hex: '#a855f7' },
  { id: 'blue',    label: 'Blue',     hex: '#3b82f6' },
  { id: 'green',   label: 'Green',    hex: '#22c55e' },
  { id: 'amber',   label: 'Amber',    hex: '#f59e0b' },
  { id: 'red',     label: 'Red',      hex: '#ef4444' },
  { id: 'teal',    label: 'Teal',     hex: '#14b8a6' },
  { id: 'indigo',  label: 'Indigo',   hex: '#6366f1' },
]

const categories = ['All', 'Platform', 'Features', 'Payments', 'Notifications', 'Safety', 'Privacy']
const categoryIcons: Record<string, React.ElementType> = {
  Platform: Globe, Features: Smartphone, Payments: CreditCard,
  Notifications: Bell, Safety: Shield, Privacy: Shield
}

export default function AdminSettings() {
  const [toggles, setToggles] = useState(defaultToggles)
  const [activeCategory, setActiveCategory] = useState('All')
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'features' | 'appearance'>('features')
  const [selectedTheme, setSelectedTheme] = useState('love')
  const [selectedColor, setSelectedColor] = useState('pink')
  const [defaultMode, setDefaultMode] = useState<'dark' | 'light' | 'system'>('dark')
  const [borderRadius, setBorderRadius] = useState('rounded')
  const [fontScale, setFontScale] = useState('normal')

  // Load persisted settings on mount
  useEffect(() => {
    const stored = loadSettings()
    if (!stored) return
    if (stored.toggles) setToggles(stored.toggles)
    if (stored.selectedTheme) setSelectedTheme(stored.selectedTheme)
    if (stored.selectedColor) setSelectedColor(stored.selectedColor)
    if (stored.defaultMode) setDefaultMode(stored.defaultMode)
    if (stored.borderRadius) setBorderRadius(stored.borderRadius)
    if (stored.fontScale) setFontScale(stored.fontScale)
  }, [])

  const toggle = (id: string) => setToggles(prev => prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t))

  const handleSave = () => {
    saveSettings({ toggles, selectedTheme, selectedColor, defaultMode, borderRadius, fontScale })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const filtered = toggles.filter(t => activeCategory === 'All' || t.category === activeCategory)

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-black text-2xl dark:text-white text-gray-900">Platform Settings</h1>
          <p className="text-sm dark:text-gray-400 text-gray-500 mt-0.5">Configure features, appearance, and platform behavior</p>
        </div>
        <button onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-all ${saved ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-love-gradient text-white shadow-pink-500/20 hover:opacity-90'}`}>
          {saved ? <><RefreshCw className="w-3.5 h-3.5" /> Saved!</> : <><Save className="w-3.5 h-3.5" /> Save Changes</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 dark:bg-[#130E1E] bg-gray-100 rounded-xl w-fit">
        {[{ id: 'features', icon: Sliders, label: 'Features & Toggles' }, { id: 'appearance', icon: Palette, label: 'Theme & Colors' }].map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as 'features' | 'appearance')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-love-gradient text-white shadow-md' : 'dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Features & Toggles tab ── */}
      {activeTab === 'features' && (
        <>
          {/* Category filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeCategory === cat ? 'bg-love-gradient text-white' : 'dark:bg-[#130E1E] bg-white border dark:border-white/8 border-gray-200 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
                {cat}
              </button>
            ))}
          </div>

          {/* Toggles */}
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

      {/* ── Theme & Colors tab ── */}
      {activeTab === 'appearance' && (
        <div className="space-y-5">

          {/* Theme Presets */}
          <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b dark:border-white/5 border-gray-100">
              <Palette className="w-4 h-4 text-brand-pink" />
              <h3 className="font-bold text-sm dark:text-white text-gray-900">Theme Presets</h3>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {themes.map(theme => (
                <button key={theme.id} onClick={() => setSelectedTheme(theme.id)}
                  className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                    selectedTheme === theme.id
                      ? 'border-brand-pink dark:bg-pink-500/10 bg-pink-50'
                      : 'dark:border-white/8 border-gray-200 dark:hover:border-white/20 hover:border-gray-300'
                  }`}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${theme.gradient} shadow-md`} />
                  <span className="text-xs font-semibold dark:text-white text-gray-900">{theme.label}</span>
                  {selectedTheme === theme.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-pink flex items-center justify-center">
                      <Zap className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b dark:border-white/5 border-gray-100">
              <div className="w-4 h-4 rounded-full" style={{ background: colorOptions.find(c => c.id === selectedColor)?.hex }} />
              <h3 className="font-bold text-sm dark:text-white text-gray-900">Accent Color</h3>
            </div>
            <div className="p-5 flex flex-wrap gap-3">
              {colorOptions.map(color => (
                <button key={color.id} onClick={() => setSelectedColor(color.id)}
                  title={color.label}
                  className={`w-10 h-10 rounded-xl transition-all ${selectedColor === color.id ? 'ring-2 ring-offset-2 dark:ring-offset-[#130E1E] ring-offset-white scale-110' : 'hover:scale-105'}`}
                  style={{ background: color.hex, boxShadow: selectedColor === color.id ? `0 0 12px ${color.hex}60` : undefined }}
                />
              ))}
            </div>
            <div className="px-5 pb-4">
              <p className="text-xs dark:text-gray-400 text-gray-500">Selected: <span className="font-bold dark:text-white text-gray-900">{colorOptions.find(c => c.id === selectedColor)?.label}</span></p>
            </div>
          </div>

          {/* Default Mode */}
          <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b dark:border-white/5 border-gray-100">
              <Moon className="w-4 h-4 text-brand-pink" />
              <h3 className="font-bold text-sm dark:text-white text-gray-900">Default Display Mode</h3>
            </div>
            <div className="p-5 grid grid-cols-3 gap-3">
              {[
                { id: 'dark',   icon: Moon,    label: 'Dark Mode' },
                { id: 'light',  icon: Sun,     label: 'Light Mode' },
                { id: 'system', icon: Monitor, label: 'System' },
              ].map(mode => {
                const Icon = mode.icon
                return (
                  <button key={mode.id} onClick={() => setDefaultMode(mode.id as 'dark' | 'light' | 'system')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      defaultMode === mode.id
                        ? 'border-brand-pink dark:bg-pink-500/10 bg-pink-50'
                        : 'dark:border-white/8 border-gray-200 dark:hover:border-white/20 hover:border-gray-300'
                    }`}>
                    <Icon className={`w-5 h-5 ${defaultMode === mode.id ? 'text-brand-pink' : 'dark:text-gray-400 text-gray-500'}`} />
                    <span className={`text-xs font-semibold ${defaultMode === mode.id ? 'text-brand-pink' : 'dark:text-gray-300 text-gray-600'}`}>{mode.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Border Radius */}
          <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b dark:border-white/5 border-gray-100">
              <Settings className="w-4 h-4 text-brand-pink" />
              <h3 className="font-bold text-sm dark:text-white text-gray-900">Border Radius Style</h3>
            </div>
            <div className="p-5 flex flex-wrap gap-3">
              {[
                { id: 'sharp',    label: 'Sharp',    preview: 'rounded-none' },
                { id: 'rounded',  label: 'Rounded',  preview: 'rounded-xl' },
                { id: 'pill',     label: 'Pill',     preview: 'rounded-full' },
              ].map(r => (
                <button key={r.id} onClick={() => setBorderRadius(r.id)}
                  className={`flex flex-col items-center gap-2 px-5 py-3 border-2 transition-all ${r.preview} ${
                    borderRadius === r.id
                      ? 'border-brand-pink dark:bg-pink-500/10 bg-pink-50'
                      : 'dark:border-white/8 border-gray-200 dark:hover:border-white/20 hover:border-gray-300'
                  }`}>
                  <span className={`text-sm font-semibold ${borderRadius === r.id ? 'text-brand-pink' : 'dark:text-gray-300 text-gray-600'}`}>{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Scale */}
          <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b dark:border-white/5 border-gray-100">
              <Settings className="w-4 h-4 text-brand-pink" />
              <h3 className="font-bold text-sm dark:text-white text-gray-900">Font Scale</h3>
            </div>
            <div className="p-5 flex flex-wrap gap-3">
              {[
                { id: 'small',   label: 'Small',   size: 'text-xs' },
                { id: 'normal',  label: 'Normal',  size: 'text-sm' },
                { id: 'large',   label: 'Large',   size: 'text-base' },
              ].map(f => (
                <button key={f.id} onClick={() => setFontScale(f.id)}
                  className={`flex flex-col items-center gap-2 px-5 py-3 rounded-xl border-2 transition-all ${
                    fontScale === f.id
                      ? 'border-brand-pink dark:bg-pink-500/10 bg-pink-50'
                      : 'dark:border-white/8 border-gray-200 dark:hover:border-white/20 hover:border-gray-300'
                  }`}>
                  <span className={`font-semibold ${f.size} ${fontScale === f.id ? 'text-brand-pink' : 'dark:text-gray-300 text-gray-600'}`}>{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
