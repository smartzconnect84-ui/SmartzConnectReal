// ── DOM helpers for the Product Tour ────────────────────────────────────────
// Finds `[data-tour="<id>"]` elements, waiting for lazy-loaded / async
// content to mount, and only returns elements that are actually visible in
// the current responsive layout (many nav items exist twice — once in the
// desktop sidebar, once in the mobile drawer — and only one is ever visible).

function isVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) return false
  const style = window.getComputedStyle(el)
  if (style.visibility === 'hidden' || style.display === 'none') return false
  // offsetParent is null for display:none elements (and position:fixed, which
  // we don't use for nav items here, so this heuristic is safe).
  return true
}

export function findVisibleTourTarget(id: string): HTMLElement | null {
  const matches = document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`)
  for (const el of matches) {
    if (isVisible(el)) return el
  }
  return null
}

interface WaitOptions {
  timeoutMs?: number
  pollMs?: number
}

/**
 * Polls for a visible `[data-tour="id"]` element, to accommodate lazy-loaded
 * components and route transitions. Resolves with the element, or `null` if
 * it never appears within the timeout (caller falls back to a centered step).
 */
export function waitForTourTarget(id: string, opts: WaitOptions = {}): Promise<HTMLElement | null> {
  const { timeoutMs = 2500, pollMs = 120 } = opts
  return new Promise(resolve => {
    const existing = findVisibleTourTarget(id)
    if (existing) { resolve(existing); return }

    let settled = false
    const finish = (el: HTMLElement | null) => {
      if (settled) return
      settled = true
      clearInterval(interval)
      clearTimeout(timeout)
      resolve(el)
    }

    const interval = setInterval(() => {
      const found = findVisibleTourTarget(id)
      if (found) finish(found)
    }, pollMs)

    const timeout = setTimeout(() => finish(null), timeoutMs)
  })
}

export function scrollElementIntoView(el: HTMLElement) {
  el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
}
