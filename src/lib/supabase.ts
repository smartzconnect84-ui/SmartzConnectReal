// ─────────────────────────────────────────────────────────────────────────────
// Replit-native replacement for the Supabase JS client.
//
// This module keeps the same import surface (`import { supabase } from
// '@/lib/supabase'`) so the rest of the app does not need to be rewritten
// file-by-file. Under the hood it talks to our own Express API
// (`/api/db/:table`, `/api/auth/*`, `/api/functions/*`) instead of Supabase.
//
// Supported subset:
//   supabase.from(table).select().eq().neq().gt().gte().lt().lte()
//     .like().ilike().in().is().order().limit().range().match()
//     .single() / .maybeSingle() / await (thenable)
//   supabase.from(table).insert(payload).select()
//   supabase.from(table).update(payload).eq(...)
//   supabase.from(table).upsert(payload)
//   supabase.from(table).delete().eq(...)
//   supabase.auth.getSession() / getUser() / onAuthStateChange()
//   supabase.auth.signOut() -- redirects to /api/logout
//   supabase.functions.invoke(name, { body })
//   supabase.channel(name).on('postgres_changes', cfg, cb).subscribe()
//     -- implemented as lightweight polling, not true realtime.
// ─────────────────────────────────────────────────────────────────────────────

export interface SupaUser {
  id: string
  email?: string
  email_confirmed_at?: string
  user_metadata?: Record<string, any>
}

export interface SupaSession {
  user: SupaUser
  access_token: string
}

type AuthChangeEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED' | 'PASSWORD_RECOVERY' | 'INITIAL_SESSION'
type AuthListener = (event: AuthChangeEvent, session: SupaSession | null) => void

const authListeners = new Set<AuthListener>()
let cachedSession: SupaSession | null | undefined = undefined

async function fetchCurrentSession(): Promise<SupaSession | null> {
  try {
    const res = await fetch('/api/auth/user', { credentials: 'include' })
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.id) return null
    return {
      user: {
        id: data.id,
        email: data.email,
        email_confirmed_at: data.email ? new Date().toISOString() : undefined,
        user_metadata: { full_name: data.profile?.fullName },
      },
      access_token: 'replit-session',
    }
  } catch {
    return null
  }
}

function emit(event: AuthChangeEvent, session: SupaSession | null) {
  authListeners.forEach((cb) => cb(event, session))
}

// ── Query builder ───────────────────────────────────────────────────────────

type Filter = { col: string; op: string; value: any }

class QueryBuilder<T = any> implements PromiseLike<{ data: T; error: any; count: number | null }> {
  private table: string
  private filters: Filter[] = []
  private orders: { col: string; ascending: boolean }[] = []
  private limitVal?: number
  private rangeVal?: [number, number]
  private mode: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select'
  private payload: any
  private wantSingle: 'one' | 'maybe' | null = null
  private countMode: 'exact' | null = null
  private headOnly = false

  constructor(table: string) {
    this.table = table
  }

  select(_columns?: string, opts?: { count?: 'exact'; head?: boolean }) {
    if (opts?.count) this.countMode = opts.count
    if (opts?.head) this.headOnly = true
    return this
  }

  insert(payload: any) {
    this.mode = 'insert'
    this.payload = payload
    return this
  }

  update(payload: any) {
    this.mode = 'update'
    this.payload = payload
    return this
  }

  upsert(payload: any, _opts?: any) {
    this.mode = 'upsert'
    this.payload = payload
    return this
  }

  delete() {
    this.mode = 'delete'
    return this
  }

  eq(col: string, value: any) { this.filters.push({ col, op: 'eq', value }); return this }
  neq(col: string, value: any) { this.filters.push({ col, op: 'neq', value }); return this }
  gt(col: string, value: any) { this.filters.push({ col, op: 'gt', value }); return this }
  gte(col: string, value: any) { this.filters.push({ col, op: 'gte', value }); return this }
  lt(col: string, value: any) { this.filters.push({ col, op: 'lt', value }); return this }
  lte(col: string, value: any) { this.filters.push({ col, op: 'lte', value }); return this }
  like(col: string, value: any) { this.filters.push({ col, op: 'like', value }); return this }
  ilike(col: string, value: any) { this.filters.push({ col, op: 'ilike', value }); return this }
  is(col: string, value: any) { this.filters.push({ col, op: 'is', value }); return this }
  in(col: string, values: any[]) { this.filters.push({ col, op: 'in', value: values }); return this }
  contains(col: string, value: any) { this.filters.push({ col, op: 'contains', value }); return this }
  not(col: string, op: string, value: any) { this.filters.push({ col, op: `not.${op}`, value }); return this }
  match(criteria: Record<string, any>) {
    Object.entries(criteria).forEach(([col, value]) => this.filters.push({ col, op: 'eq', value }))
    return this
  }
  or(_expr: string) { return this }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orders.push({ col, ascending: opts?.ascending !== false })
    return this
  }

  limit(n: number) { this.limitVal = n; return this }
  range(from: number, to: number) { this.rangeVal = [from, to]; return this }

  single() { this.wantSingle = 'one'; return this }
  maybeSingle() { this.wantSingle = 'maybe'; return this }

  private buildQueryString() {
    const params = new URLSearchParams()
    if (this.filters.length) params.set('filters', JSON.stringify(this.filters))
    if (this.orders.length) params.set('order', JSON.stringify(this.orders))
    if (this.limitVal != null) params.set('limit', String(this.limitVal))
    if (this.rangeVal) params.set('range', JSON.stringify(this.rangeVal))
    if (this.countMode) params.set('count', this.countMode)
    if (this.headOnly) params.set('head', '1')
    return params.toString()
  }

  private async execute(): Promise<{ data: any; error: any; count: number | null }> {
    try {
      let res: Response
      if (this.mode === 'select') {
        const qs = this.buildQueryString()
        res = await fetch(`/api/db/${this.table}${qs ? `?${qs}` : ''}`, { credentials: 'include' })
      } else if (this.mode === 'insert') {
        res = await fetch(`/api/db/${this.table}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(this.payload),
        })
      } else if (this.mode === 'upsert') {
        res = await fetch(`/api/db/${this.table}/upsert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(this.payload),
        })
      } else if (this.mode === 'update') {
        res = await fetch(`/api/db/${this.table}?${this.buildQueryString()}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(this.payload),
        })
      } else {
        res = await fetch(`/api/db/${this.table}?${this.buildQueryString()}`, {
          method: 'DELETE',
          credentials: 'include',
        })
      }

      if (!res.ok) {
        let message = `Request failed (${res.status})`
        try {
          const body = await res.json()
          message = body?.message || message
        } catch { /* ignore */ }
        return { data: this.wantSingle ? null : [], error: { message }, count: null }
      }

      if (res.status === 204) return { data: null, error: null, count: null }

      const body = await res.json()
      const rows = Array.isArray(body) ? body : body?.rows ?? body
      const count = Array.isArray(body) ? null : body?.count ?? null

      if (this.wantSingle) {
        const row = Array.isArray(rows) ? rows[0] : rows
        if (!row && this.wantSingle === 'one') {
          return { data: null, error: { message: 'No rows found' }, count }
        }
        return { data: row ?? null, error: null, count }
      }

      return { data: rows, error: null, count }
    } catch (err: any) {
      return { data: this.wantSingle ? null : [], error: { message: err?.message || 'Network error' }, count: null }
    }
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: { data: T; error: any; count: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled as any, onrejected as any)
  }
}

// ── Fake realtime channel (polling-based) ───────────────────────────────────

class FakeChannel {
  private callbacks: Array<(payload?: any) => void> = []
  private timer: ReturnType<typeof setInterval> | null = null

  on(_event: string, _config: any, callback: (payload?: any) => void) {
    this.callbacks.push(callback)
    return this
  }

  subscribe(cb?: (status: string) => void) {
    this.timer = setInterval(() => this.callbacks.forEach((c) => c({})), 6000)
    cb?.('SUBSCRIBED')
    return this
  }

  unsubscribe() {
    if (this.timer) clearInterval(this.timer)
    return Promise.resolve('ok')
  }
}

// ── Public client ────────────────────────────────────────────────────────────

export const supabase = {
  from(table: string) {
    return new QueryBuilder(table)
  },

  auth: {
    async getSession() {
      if (cachedSession === undefined) cachedSession = await fetchCurrentSession()
      return { data: { session: cachedSession }, error: null }
    },

    async getUser() {
      const { data } = await this.getSession()
      return { data: { user: data.session?.user ?? null }, error: null }
    },

    onAuthStateChange(callback: AuthListener) {
      authListeners.add(callback)
      fetchCurrentSession().then((session) => {
        cachedSession = session
        callback(session ? 'SIGNED_IN' : 'INITIAL_SESSION', session)
      })
      return { data: { subscription: { unsubscribe: () => authListeners.delete(callback) } } }
    },

    async signOut() {
      cachedSession = null
      emit('SIGNED_OUT', null)
      window.location.href = '/api/logout'
      return { error: null }
    },

    async refreshSession() {
      cachedSession = await fetchCurrentSession()
      return { data: { session: cachedSession }, error: null }
    },
  },

  functions: {
    async invoke<T = any>(name: string, opts?: { body?: any; headers?: Record<string, string> }) {
      try {
        const res = await fetch(`/api/functions/${name}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
          credentials: 'include',
          body: JSON.stringify(opts?.body ?? {}),
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) {
          return { data: null as any, error: { message: data?.error || `Request failed (${res.status})` } }
        }
        return { data: data as T, error: null }
      } catch (err: any) {
        return { data: null as any, error: { message: err?.message || 'Network error' } }
      }
    },
  },

  storage: {
    from(_bucket: string) {
      return {
        async upload() {
          return { data: null, error: { message: 'Direct storage upload not supported — use uploadToSufy()' } }
        },
        getPublicUrl(path: string) {
          return { data: { publicUrl: path } }
        },
      }
    },
  },

  channel(name: string) {
    return new FakeChannel()
  },

  removeChannel(channel: FakeChannel) {
    channel.unsubscribe()
  },
}

// Called once a Replit-Auth session becomes active (see AuthContext) to
// invalidate the cached session snapshot so the next read is fresh.
export function invalidateSessionCache() {
  cachedSession = undefined
}

export default supabase
