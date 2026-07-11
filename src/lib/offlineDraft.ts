// ── Offline Draft Persistence ─────────────────────────────────────────────────
// Saves form data to localStorage so work is never lost on disconnect.
// Usage:
//   saveDraft('post-composer', { text, images })
//   const draft = loadDraft<PostDraft>('post-composer')
//   clearDraft('post-composer')

const PREFIX = 'szc_draft:'

export interface DraftRecord<T> {
  key: string
  data: T
  savedAt: string
  version: number
}

export function saveDraft<T>(key: string, data: T): void {
  try {
    const existing = loadDraftRecord<T>(key)
    const record: DraftRecord<T> = {
      key,
      data,
      savedAt: new Date().toISOString(),
      version: (existing?.version ?? 0) + 1,
    }
    localStorage.setItem(PREFIX + key, JSON.stringify(record))
  } catch {
    // Storage full or unavailable — fail silently
  }
}

export function loadDraft<T>(key: string): T | null {
  return loadDraftRecord<T>(key)?.data ?? null
}

export function loadDraftRecord<T>(key: string): DraftRecord<T> | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    return JSON.parse(raw) as DraftRecord<T>
  } catch {
    return null
  }
}

export function clearDraft(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch { /* ignore */ }
}

export function listDrafts(): DraftRecord<unknown>[] {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(PREFIX))
    return keys
      .map(k => {
        try { return JSON.parse(localStorage.getItem(k) || '') } catch { return null }
      })
      .filter(Boolean) as DraftRecord<unknown>[]
  } catch {
    return []
  }
}

// ── React hook ────────────────────────────────────────────────────────────────
// Automatically saves form state as a draft and restores it on mount.
//
// const { isDirty, lastSaved, restore, clear } = useOfflineDraft('post-composer', formState, setFormState)

import { useCallback, useEffect, useRef, useState } from 'react'

interface OfflineDraftOptions {
  /** How often to auto-save in ms (default 3000) */
  interval?: number
  /** Don't save if form matches this predicate (e.g. empty form) */
  isEmpty?: (data: unknown) => boolean
}

export function useOfflineDraft<T extends object>(
  key: string,
  data: T,
  setData: (d: T) => void,
  opts: OfflineDraftOptions = {},
) {
  const { interval = 3000, isEmpty } = opts
  const [isDirty, setIsDirty] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const prevDataRef = useRef<string>('')

  // Track online/offline
  useEffect(() => {
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  // Auto-save at interval when data changes or offline
  useEffect(() => {
    const json = JSON.stringify(data)
    if (json === prevDataRef.current) return
    prevDataRef.current = json

    if (isEmpty && isEmpty(data as unknown)) return

    const id = setTimeout(() => {
      saveDraft(key, data)
      setLastSaved(new Date())
      setIsDirty(true)
    }, interval)

    return () => clearTimeout(id)
  }, [data, key, interval, isEmpty]) // eslint-disable-line react-hooks/exhaustive-deps

  // Also save immediately when going offline
  useEffect(() => {
    if (isOnline) return
    if (isEmpty && isEmpty(data as unknown)) return
    saveDraft(key, data)
    setLastSaved(new Date())
    setIsDirty(true)
  }, [isOnline]) // eslint-disable-line react-hooks/exhaustive-deps

  const restore = useCallback(() => {
    const draft = loadDraft<T>(key)
    if (draft) { setData(draft); setIsDirty(false) }
  }, [key, setData])

  const clear = useCallback(() => {
    clearDraft(key)
    setIsDirty(false)
    setLastSaved(null)
    prevDataRef.current = ''
  }, [key])

  const hasDraft = !!loadDraft(key)

  return { isDirty, lastSaved, isOnline, hasDraft, restore, clear }
}
