import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X, Settings, Check, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

interface CookiePrefs {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  functional: boolean
}

const STORAGE_KEY = 'smartz_cookie_consent'

function loadConsent(): CookiePrefs | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveConsent(prefs: CookiePrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

export function useCookieConsent() {
  const consent = loadConsent()
  return {
    hasConsented: consent !== null,
    analytics: consent?.analytics ?? false,
    marketing: consent?.marketing ?? false,
    functional: consent?.functional ?? true,
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [prefs, setPrefs] = useState<CookiePrefs>({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: true,
  })

  useEffect(() => {
    const existing = loadConsent()
    if (!existing) {
      const timer = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const accept = (all: boolean) => {
    const final: CookiePrefs = all
      ? { necessary: true, analytics: true, marketing: true, functional: true }
      : prefs
    saveConsent(final)
    setVisible(false)
  }

  const rejectAll = () => {
    saveConsent({ necessary: true, analytics: false, marketing: false, functional: false })
    setVisible(false)
  }

  const Toggle = ({ active, onChange }: { active: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-10 h-5.5 rounded-full transition-colors ${active ? 'bg-brand-pink' : 'dark:bg-white/15 bg-gray-200'}`}>
      <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform ${active ? 'translate-x-4.5' : ''}`} />
    </button>
  )

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 z-[200] max-w-xl mx-auto"
        >
          <div className="dark:bg-[#1A1228] bg-white rounded-3xl border dark:border-white/10 border-gray-200 shadow-2xl shadow-black/30 overflow-hidden">

            {!showSettings ? (
              <div className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-love-gradient flex items-center justify-center flex-shrink-0 shadow-lg shadow-pink-500/20">
                    <Cookie className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm dark:text-white text-gray-900">We use cookies</h3>
                    <p className="text-xs dark:text-gray-400 text-gray-600 mt-0.5 leading-relaxed">
                      We use cookies to improve your experience, analyse traffic, and personalise content. See our{' '}
                      <Link to="/cookie-policy" className="text-brand-pink hover:underline">Cookie Policy</Link> and{' '}
                      <Link to="/privacy" className="text-brand-pink hover:underline">Privacy Policy</Link>.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => accept(true)}
                    className="flex-1 py-2.5 rounded-xl bg-love-gradient text-white text-xs font-bold shadow-lg shadow-pink-500/20">
                    Accept All
                  </button>
                  <button onClick={rejectAll}
                    className="flex-1 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-300 text-gray-700 text-xs font-semibold">
                    Reject All
                  </button>
                  <button onClick={() => setShowSettings(true)}
                    className="px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-300 text-gray-700 text-xs font-semibold flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5" /> Manage
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-sm dark:text-white text-gray-900">Cookie Preferences</h3>
                  <button onClick={() => setShowSettings(false)} className="w-7 h-7 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  {[
                    {
                      key: 'necessary' as const,
                      label: 'Strictly Necessary',
                      desc: 'Required for the site to function. Cannot be disabled.',
                      locked: true,
                    },
                    {
                      key: 'functional' as const,
                      label: 'Functional',
                      desc: 'Enables enhanced features like chat and preferences.',
                      locked: false,
                    },
                    {
                      key: 'analytics' as const,
                      label: 'Analytics',
                      desc: 'Helps us understand how users interact with the platform.',
                      locked: false,
                    },
                    {
                      key: 'marketing' as const,
                      label: 'Marketing',
                      desc: 'Used to deliver personalised ads and track campaign performance.',
                      locked: false,
                    },
                  ].map(c => (
                    <div key={c.key} className="flex items-start gap-3 p-3 rounded-xl dark:bg-white/3 bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold dark:text-white text-gray-900">{c.label}</p>
                          {c.locked && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-500">Always On</span>
                          )}
                        </div>
                        <p className="text-[10px] dark:text-gray-500 text-gray-400 mt-0.5 leading-relaxed">{c.desc}</p>
                      </div>
                      {c.locked ? (
                        <div className="w-10 h-5.5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-emerald-500" />
                        </div>
                      ) : (
                        <Toggle
                          active={prefs[c.key]}
                          onChange={() => setPrefs(p => ({ ...p, [c.key]: !p[c.key] }))}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => accept(false)}
                    className="flex-1 py-2.5 rounded-xl bg-love-gradient text-white text-xs font-bold shadow-lg shadow-pink-500/20">
                    Save Preferences
                  </button>
                  <button onClick={() => accept(true)}
                    className="flex-1 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-300 text-gray-700 text-xs font-semibold">
                    Accept All
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <Shield className="w-3 h-3 dark:text-gray-500 text-gray-400" />
                  <span className="text-[10px] dark:text-gray-500 text-gray-400">GDPR Compliant · Your privacy matters</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
