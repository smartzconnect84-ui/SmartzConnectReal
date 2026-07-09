import { useState, useRef, useEffect, useCallback } from 'react'
import { Languages, Loader2, ChevronDown, X, AlertCircle } from 'lucide-react'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'ar', label: 'Arabic' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'sw', label: 'Swahili' },
  { code: 'ha', label: 'Hausa' },
  { code: 'yo', label: 'Yoruba' },
  { code: 'zu', label: 'Zulu' },
  { code: 'am', label: 'Amharic' },
  { code: 'ig', label: 'Igbo' },
  { code: 'de', label: 'German' },
]

const CONSENT_KEY = 'sc_translate_consent'

interface TranslateButtonProps {
  text: string
  /** Additional wrapper class */
  className?: string
  /** Compact pill style — for hover toolbars */
  compact?: boolean
}

export default function TranslateButton({ text, className = '', compact = false }: TranslateButtonProps) {
  const [translated, setTranslated] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [targetLang, setTargetLang] = useState('en')
  const [showPicker, setShowPicker] = useState(false)
  const [error, setError] = useState(false)
  const [showConsent, setShowConsent] = useState(false)

  // Abort controller ref — cancel stale requests when a new one starts
  const abortRef = useRef<AbortController | null>(null)
  // Request version counter — ignores responses from outdated requests
  const versionRef = useRef(0)
  // Dropdown wrapper ref — for outside-click dismissal
  const pickerRef = useRef<HTMLDivElement>(null)

  // Close picker on outside click / touch
  useEffect(() => {
    if (!showPicker) return
    const handler = (e: MouseEvent | TouchEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [showPicker])

  // Close picker on Escape key
  useEffect(() => {
    if (!showPicker) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowPicker(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [showPicker])

  const doTranslate = useCallback(async (lang: string) => {
    if (!text.trim()) return

    // Cancel any in-flight request
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    // Bump version; capture locally so this invocation can check it
    const myVersion = ++versionRef.current

    setLoading(true)
    setError(false)
    setTranslated(null)

    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${lang}`,
        { signal: ctrl.signal }
      )
      const json = await res.json()

      // Discard if a newer request has already started
      if (myVersion !== versionRef.current) return

      const result = json?.responseData?.translatedText
      if (json?.responseStatus === 200 && result && result !== text) {
        setTranslated(result)
      } else if (result === text) {
        setTranslated('(Already in this language)')
      } else {
        setError(true)
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return // cancelled — not an error
      if (myVersion !== versionRef.current) return
      setError(true)
    } finally {
      if (myVersion === versionRef.current) setLoading(false)
    }
  }, [text])

  const handleTranslate = (lang = targetLang) => {
    const consented = localStorage.getItem(CONSENT_KEY)
    if (!consented) {
      setShowConsent(true)
      return
    }
    doTranslate(lang)
  }

  const handleAcceptConsent = (remember: boolean) => {
    if (remember) localStorage.setItem(CONSENT_KEY, '1')
    setShowConsent(false)
    doTranslate(targetLang)
  }

  const handleLangChange = (lang: string) => {
    setTargetLang(lang)
    setShowPicker(false)
    const consented = localStorage.getItem(CONSENT_KEY)
    if (!consented) {
      setShowConsent(true)
      return
    }
    doTranslate(lang)
  }

  // ── Consent prompt ──────────────────────────────────────────────────────
  if (showConsent) {
    return (
      <div className={`mt-1.5 px-2.5 py-2 rounded-xl dark:bg-amber-500/10 bg-amber-50 border dark:border-amber-500/20 border-amber-200 ${className}`}>
        <div className="flex items-start gap-1.5 mb-2">
          <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] dark:text-amber-200 text-amber-800 leading-relaxed">
            This message will be sent to a third-party translation service (MyMemory). Do not translate sensitive content.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAcceptConsent(true)}
            className="px-2.5 py-1 rounded-lg bg-brand-pink text-white text-[10px] font-bold"
          >
            Translate &amp; Remember
          </button>
          <button
            onClick={() => handleAcceptConsent(false)}
            className="px-2.5 py-1 rounded-lg dark:bg-white/5 bg-gray-100 dark:text-gray-300 text-gray-600 text-[10px]"
          >
            Just once
          </button>
          <button
            onClick={() => setShowConsent(false)}
            className="ml-auto text-[10px] text-gray-400 hover:text-red-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // ── Translation result ──────────────────────────────────────────────────
  if (translated) {
    return (
      <div className={`mt-1.5 px-2.5 py-2 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 ${className}`}>
        <p className="text-xs dark:text-gray-300 text-gray-700 italic leading-relaxed">{translated}</p>
        <button
          onClick={() => setTranslated(null)}
          className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-brand-pink transition-colors mt-1"
        >
          <X className="w-2.5 h-2.5" /> Close
        </button>
      </div>
    )
  }

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`flex items-center gap-1 text-[10px] text-gray-400 mt-1 ${className}`}>
        <Loader2 className="w-3 h-3 animate-spin" /> Translating…
      </div>
    )
  }

  // ── Error ───────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className={`flex items-center gap-1.5 mt-1 ${className}`}>
        <span className="text-[10px] text-red-400">Translation failed.</span>
        <button
          onClick={() => { setError(false); handleTranslate() }}
          className="text-[10px] text-brand-pink hover:opacity-80"
        >
          Retry
        </button>
      </div>
    )
  }

  // ── Default: translate trigger + language picker ─────────────────────────
  return (
    <div className={`flex items-center gap-1.5 mt-1 ${className}`}>
      <button
        onClick={() => handleTranslate()}
        className={`flex items-center gap-1 text-[10px] text-gray-400 hover:text-brand-pink transition-colors ${compact ? 'px-1.5 py-0.5 rounded-full dark:bg-white/5 bg-gray-100' : ''}`}
      >
        <Languages className="w-3 h-3" />
        {!compact && <span>Translate</span>}
      </button>

      {/* Language picker */}
      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setShowPicker(p => !p)}
          className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-brand-pink transition-colors"
        >
          <span>{LANGUAGES.find(l => l.code === targetLang)?.label ?? 'English'}</span>
          <ChevronDown className="w-2.5 h-2.5" />
        </button>

        {showPicker && (
          <div className="absolute bottom-full mb-1 left-0 z-50 dark:bg-[#1A1326] bg-white rounded-xl shadow-xl border dark:border-white/10 border-gray-200 py-1 min-w-[130px] max-h-52 overflow-y-auto">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => handleLangChange(l.code)}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                  targetLang === l.code
                    ? 'text-brand-pink font-semibold dark:bg-white/5 bg-gray-50'
                    : 'dark:text-gray-300 text-gray-700 hover:dark:bg-white/5 hover:bg-gray-50'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
