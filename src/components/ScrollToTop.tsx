import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * Scrolls the window to the top whenever the route pathname changes
 * (e.g. clicking a Footer/Navbar link to a new page). Skips POP
 * navigation (back/forward) so the browser's native scroll restoration
 * for those cases is preserved, and skips pure hash changes on the
 * same page so in-page anchor links keep working.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (hash) return
    if (navigationType === 'POP') return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, hash, navigationType])

  return null
}
