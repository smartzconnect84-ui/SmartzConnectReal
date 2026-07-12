import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'dark' | 'light'
type FontScale = 'small' | 'normal' | 'large' | 'xl'
type FontStyle = 'default' | 'serif' | 'mono'
type BorderRadius = 'sharp' | 'rounded' | 'pill'
type ThemePreset = 'love' | 'ocean' | 'forest' | 'sunset' | 'royal' | 'carbon'

export type ChatTheme = 'classic' | 'midnight' | 'ocean' | 'sunset' | 'forest' | 'rose'

export interface ChatThemeVars {
  /** Sender bubble background (mine) */
  bubbleMine: string
  /** Sender bubble text */
  bubbleMineText: string
  /** Receiver bubble background */
  bubbleTheirs: string
  /** Receiver bubble text */
  bubbleTheirsText: string
  /** Chat background */
  chatBg: string
  /** Chat background (dark mode) */
  chatBgDark: string
  /** Accent / brand highlight within chat */
  chatAccent: string
}

export const CHAT_THEME_PRESETS: Record<ChatTheme, { label: string; emoji: string; vars: ChatThemeVars }> = {
  classic: {
    label: 'Classic Pink',
    emoji: '💕',
    vars: {
      bubbleMine:         'linear-gradient(135deg,#FF4D8D 0%,#9B5DE5 100%)',
      bubbleMineText:     '#ffffff',
      bubbleTheirs:       '#f3f4f6',
      bubbleTheirsText:   '#111827',
      chatBg:             '#f9fafb',
      chatBgDark:         '#0f0a1a',
      chatAccent:         '#EC4899',
    },
  },
  midnight: {
    label: 'Midnight',
    emoji: '🌙',
    vars: {
      bubbleMine:         'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)',
      bubbleMineText:     '#ffffff',
      bubbleTheirs:       '#1e1b4b',
      bubbleTheirsText:   '#e0e7ff',
      chatBg:             '#f8f7ff',
      chatBgDark:         '#0d0b1a',
      chatAccent:         '#818cf8',
    },
  },
  ocean: {
    label: 'Ocean',
    emoji: '🌊',
    vars: {
      bubbleMine:         'linear-gradient(135deg,#0ea5e9 0%,#06b6d4 100%)',
      bubbleMineText:     '#ffffff',
      bubbleTheirs:       '#ecfeff',
      bubbleTheirsText:   '#164e63',
      chatBg:             '#f0f9ff',
      chatBgDark:         '#050f1a',
      chatAccent:         '#0ea5e9',
    },
  },
  sunset: {
    label: 'Sunset',
    emoji: '🌅',
    vars: {
      bubbleMine:         'linear-gradient(135deg,#f97316 0%,#ef4444 100%)',
      bubbleMineText:     '#ffffff',
      bubbleTheirs:       '#fff7ed',
      bubbleTheirsText:   '#7c2d12',
      chatBg:             '#fffbf7',
      chatBgDark:         '#1a0a00',
      chatAccent:         '#f97316',
    },
  },
  forest: {
    label: 'Forest',
    emoji: '🌿',
    vars: {
      bubbleMine:         'linear-gradient(135deg,#10b981 0%,#059669 100%)',
      bubbleMineText:     '#ffffff',
      bubbleTheirs:       '#ecfdf5',
      bubbleTheirsText:   '#064e3b',
      chatBg:             '#f0fdf4',
      chatBgDark:         '#031a0a',
      chatAccent:         '#10b981',
    },
  },
  rose: {
    label: 'Rose Gold',
    emoji: '🌸',
    vars: {
      bubbleMine:         'linear-gradient(135deg,#fb7185 0%,#e11d48 100%)',
      bubbleMineText:     '#ffffff',
      bubbleTheirs:       '#fff1f2',
      bubbleTheirsText:   '#881337',
      chatBg:             '#fdf2f4',
      chatBgDark:         '#1a0510',
      chatAccent:         '#fb7185',
    },
  },
}

export interface AppearanceSettings {
  fontScale: FontScale
  fontStyle: FontStyle
  accentColor: string    // hex
  borderRadius: BorderRadius
  themePreset: ThemePreset
}

const DEFAULT_APPEARANCE: AppearanceSettings = {
  fontScale: 'normal',
  fontStyle: 'default',
  accentColor: '#ec4899',
  borderRadius: 'rounded',
  themePreset: 'love',
}

const THEME_PRESET_COLORS: Record<ThemePreset, { from: string; to: string; accent: string }> = {
  love:    { from: '#ec4899', to: '#f43f5e',  accent: '#ec4899' },
  ocean:   { from: '#3b82f6', to: '#06b6d4',  accent: '#3b82f6' },
  forest:  { from: '#10b981', to: '#14b8a6',  accent: '#10b981' },
  sunset:  { from: '#f97316', to: '#f59e0b',  accent: '#f97316' },
  royal:   { from: '#a855f7', to: '#7c3aed',  accent: '#a855f7' },
  carbon:  { from: '#6b7280', to: '#374151',  accent: '#6b7280' },
}

const FONT_SCALE_MAP: Record<FontScale, string> = {
  small:  '85%',
  normal: '93%',
  large:  '106%',
  xl:     '118%',
}

const FONT_FAMILY_MAP: Record<FontStyle, string> = {
  default: "'Inter', 'Sora', system-ui, sans-serif",
  serif:   "Georgia, 'Times New Roman', serif",
  mono:    "'Courier New', Courier, monospace",
}

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (t: Theme) => void
  appearance: AppearanceSettings
  setAppearance: (partial: Partial<AppearanceSettings>) => void
  chatTheme: ChatTheme
  setChatTheme: (t: ChatTheme) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
  appearance: DEFAULT_APPEARANCE,
  setAppearance: () => {},
  chatTheme: 'classic',
  setChatTheme: () => {},
})

function applyAppearance(appearance: AppearanceSettings) {
  const root = document.documentElement

  // Font scale — set html font-size (all rem units cascade)
  root.style.fontSize = FONT_SCALE_MAP[appearance.fontScale]

  // Font family
  root.style.fontFamily = FONT_FAMILY_MAP[appearance.fontStyle]

  // Accent color as CSS custom properties
  const preset = THEME_PRESET_COLORS[appearance.themePreset]
  const accent = preset.accent

  root.style.setProperty('--color-brand-from', preset.from)
  root.style.setProperty('--color-brand-to', preset.to)
  root.style.setProperty('--color-accent', accent)

  // Border radius class on html element
  root.classList.remove('radius-sharp', 'radius-rounded', 'radius-pill')
  root.classList.add(`radius-${appearance.borderRadius}`)
}

function applyChatTheme(chatTheme: ChatTheme) {
  const root = document.documentElement
  const vars = CHAT_THEME_PRESETS[chatTheme].vars
  root.style.setProperty('--chat-bubble-mine',          vars.bubbleMine)
  root.style.setProperty('--chat-bubble-mine-text',     vars.bubbleMineText)
  root.style.setProperty('--chat-bubble-theirs',        vars.bubbleTheirs)
  root.style.setProperty('--chat-bubble-theirs-text',   vars.bubbleTheirsText)
  root.style.setProperty('--chat-bg',                   vars.chatBg)
  root.style.setProperty('--chat-bg-dark',              vars.chatBgDark)
  root.style.setProperty('--chat-accent',               vars.chatAccent)
}

const APPEARANCE_KEY = 'sc-appearance'
const THEME_KEY = 'sc-theme'
const CHAT_THEME_KEY = 'sc-chat-theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(THEME_KEY)
    return (stored as Theme) || 'light'
  })

  const [appearance, setAppearanceState] = useState<AppearanceSettings>(() => {
    try {
      const raw = localStorage.getItem(APPEARANCE_KEY)
      return raw ? { ...DEFAULT_APPEARANCE, ...JSON.parse(raw) } : DEFAULT_APPEARANCE
    } catch {
      return DEFAULT_APPEARANCE
    }
  })

  const [chatTheme, setChatThemeState] = useState<ChatTheme>(() => {
    const stored = localStorage.getItem(CHAT_THEME_KEY)
    return (stored as ChatTheme) || 'classic'
  })

  // Apply theme (dark/light class)
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  // Apply appearance settings immediately on mount and on change
  useEffect(() => {
    applyAppearance(appearance)
    localStorage.setItem(APPEARANCE_KEY, JSON.stringify(appearance))
  }, [appearance])

  // Apply chat theme CSS vars on mount and on change
  useEffect(() => {
    applyChatTheme(chatTheme)
    localStorage.setItem(CHAT_THEME_KEY, chatTheme)
  }, [chatTheme])

  const toggleTheme = useCallback(() => setThemeState(t => t === 'dark' ? 'light' : 'dark'), [])
  const setTheme = useCallback((t: Theme) => setThemeState(t), [])

  const setAppearance = useCallback((partial: Partial<AppearanceSettings>) => {
    setAppearanceState(prev => ({ ...prev, ...partial }))
  }, [])

  const setChatTheme = useCallback((t: ChatTheme) => setChatThemeState(t), [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, appearance, setAppearance, chatTheme, setChatTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
