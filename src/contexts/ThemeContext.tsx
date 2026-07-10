import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'dark' | 'light'
type FontScale = 'small' | 'normal' | 'large' | 'xl'
type FontStyle = 'default' | 'serif' | 'mono'
type BorderRadius = 'sharp' | 'rounded' | 'pill'
type ThemePreset = 'love' | 'ocean' | 'forest' | 'sunset' | 'royal' | 'carbon'

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
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
  appearance: DEFAULT_APPEARANCE,
  setAppearance: () => {},
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

const APPEARANCE_KEY = 'sc-appearance'
const THEME_KEY = 'sc-theme'

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

  const toggleTheme = useCallback(() => setThemeState(t => t === 'dark' ? 'light' : 'dark'), [])
  const setTheme = useCallback((t: Theme) => setThemeState(t), [])

  const setAppearance = useCallback((partial: Partial<AppearanceSettings>) => {
    setAppearanceState(prev => ({ ...prev, ...partial }))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, appearance, setAppearance }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
