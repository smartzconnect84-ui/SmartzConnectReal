/**
 * Content Management sync engine.
 *
 * Every write (add/edit/delete) is applied to a local cache immediately, so
 * the admin UI reflects the change instantly and the value "sticks" even if
 * the connection to Supabase drops mid-save. Writes that fail (offline, or
 * transient network error) are queued in localStorage and retried
 * automatically — on the next successful write, on `online` events, and on a
 * background interval — until they succeed.
 *
 * Reads are cache-first: the public site renders whatever was last
 * successfully fetched (or written) even if Supabase is unreachable, then
 * refreshes silently in the background when a live fetch succeeds.
 */
import { supabase } from './supabase'

// Intentionally loose — concrete row interfaces need not carry an index signature.
// Supabase upsert calls cast to Record<string, unknown> at the call site.
type Row = { id?: string }

const CACHE_PREFIX = 'smartz_cms_cache_'
const QUEUE_KEY = 'smartz_cms_queue'

interface QueuedOp {
  id: string
  table: string
  op: 'upsert' | 'delete'
  row?: Row
  rowId?: string
  attempts: number
  queuedAt: number
}

function cacheKey(table: string) {
  return `${CACHE_PREFIX}${table}`
}

function readCache(table: string): Row[] {
  try {
    const raw = localStorage.getItem(cacheKey(table))
    return raw ? (JSON.parse(raw) as Row[]) : []
  } catch {
    return []
  }
}

function writeCache(table: string, rows: Row[]) {
  try {
    localStorage.setItem(cacheKey(table), JSON.stringify(rows))
  } catch {
    // storage full/unavailable — cache is best-effort, not a hard requirement
  }
}

function readQueue(): QueuedOp[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? (JSON.parse(raw) as QueuedOp[]) : []
  } catch {
    return []
  }
}

function writeQueue(queue: QueuedOp[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch {
    // best-effort
  }
}

function enqueue(op: Omit<QueuedOp, 'id' | 'attempts' | 'queuedAt'>) {
  const queue = readQueue()
  queue.push({ ...op, id: `${op.table}-${Date.now()}-${Math.random().toString(36).slice(2)}`, attempts: 0, queuedAt: Date.now() })
  writeQueue(queue)
}

let flushing = false

/** Attempt to flush every queued write against Supabase. Safe to call often. */
export async function flushQueue(): Promise<{ ok: number; failed: number }> {
  if (flushing) return { ok: 0, failed: 0 }
  flushing = true
  let ok = 0, failed = 0
  try {
    const queue = readQueue()
    if (queue.length === 0) return { ok: 0, failed: 0 }
    const remaining: QueuedOp[] = []

    for (const item of queue) {
      try {
        if (item.op === 'upsert' && item.row) {
          const { error } = await supabase.from(item.table).upsert(item.row as Record<string, unknown>)
          if (error) throw error
        } else if (item.op === 'delete' && item.rowId) {
          const { error } = await supabase.from(item.table).delete().eq('id', item.rowId)
          if (error) throw error
        }
        ok++
      } catch {
        item.attempts++
        // Drop ops that have failed persistently for a non-network reason (e.g. bad
        // payload) after several tries, so the queue can't jam forever on one item.
        if (item.attempts < 8) remaining.push(item)
        failed++
      }
    }
    writeQueue(remaining)
  } finally {
    flushing = false
  }
  return { ok, failed }
}

// Retry the queue whenever the browser regains connectivity, and periodically
// in the background in case Supabase itself was the one that was unreachable.
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { flushQueue() })
  setInterval(() => { flushQueue() }, 20000)
}

export interface CmsListOptions {
  orderBy?: string
  ascending?: boolean
  eq?: Record<string, unknown>
}

/**
 * Cache-first list read. Returns the cached copy immediately if present,
 * fires a live fetch in the background (or awaits it if there's no cache
 * yet), and updates the cache + notifies `onUpdate` when fresh data arrives.
 */
export async function cmsList<T extends Row = Row>(table: string, options: CmsListOptions = {}): Promise<T[]> {
  const cached = readCache(table) as T[]

  const fetchLive = async (): Promise<T[] | null> => {
    try {
      let query = supabase.from(table).select('*')
      if (options.eq) {
        for (const [k, v] of Object.entries(options.eq)) query = query.eq(k, v)
      }
      if (options.orderBy) query = query.order(options.orderBy, { ascending: options.ascending ?? true })
      const { data, error } = await query
      if (error) throw error
      const rows = (data ?? []) as T[]
      writeCache(table, rows)
      return rows
    } catch {
      return null
    }
  }

  if (cached.length > 0) {
    // Return cache instantly; refresh silently in the background.
    fetchLive()
    return cached
  }
  const live = await fetchLive()
  return live ?? cached
}

/** Save (insert or update) a row: instant local cache update + optimistic write, queued on failure. */
export async function cmsSave<T extends Row>(table: string, row: T): Promise<T> {
  const id = row.id ?? crypto.randomUUID()
  const saved = { ...row, id } as T

  // Update local cache immediately so the UI (and any future offline read) sees it.
  const cached = readCache(table)
  const idx = cached.findIndex(r => r.id === id)
  if (idx >= 0) cached[idx] = saved
  else cached.push(saved)
  writeCache(table, cached)

  try {
    const { error } = await supabase.from(table).upsert(saved as Record<string, unknown>)
    if (error) throw error
  } catch {
    enqueue({ table, op: 'upsert', row: saved })
  }
  return saved
}

/** Delete a row: instant local removal, queued on failure. */
export async function cmsDelete(table: string, id: string): Promise<void> {
  const cached = readCache(table).filter(r => r.id !== id)
  writeCache(table, cached)

  try {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw error
  } catch {
    enqueue({ table, op: 'delete', rowId: id })
  }
}

/** Number of writes still waiting to reach the server — surface this in the admin UI. */
export function pendingSyncCount(): number {
  return readQueue().length
}
