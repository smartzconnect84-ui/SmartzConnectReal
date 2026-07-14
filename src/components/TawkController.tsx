import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { recomputeTawkVisibility } from '@/lib/tawk'

/**
 * Drives Tawk.to widget visibility based on route only.
 * - Shown on all public marketing pages (/, /pricing, /team, etc.)
 * - Hidden inside /app and /admin (no distraction for logged-in users)
 * - No dismiss, no greeting bubble — widget is always accessible on public site.
 */
export default function TawkController() {
  const { pathname } = useLocation()

  useEffect(() => {
    recomputeTawkVisibility()
  }, [pathname])

  return null
}
