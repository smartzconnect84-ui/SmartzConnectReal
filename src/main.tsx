import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Remove the native HTML splash screen once React has mounted
const splash = document.getElementById('native-splash')
if (splash) {
  splash.style.transition = 'opacity 0.4s ease'
  splash.style.opacity = '0'
  setTimeout(() => splash.remove(), 420)
}

// Register PWA service worker (skipped in dev to avoid stale-cache issues).
//
// In a long-lived SPA the browser only re-checks sw.js for byte changes on
// its own schedule (typically full navigations/reloads), which almost never
// happens once a user is inside the app. Without an explicit registration.update()
// poll, new versions could sit undetected indefinitely — this is why the
// update prompt appeared to "never fire". We poll periodically and whenever
// the tab regains focus or the network comes back.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(registration => {
        const checkForUpdate = () => registration.update().catch(() => {})

        // Baseline periodic check.
        setInterval(checkForUpdate, 15 * 60 * 1000)

        // Check whenever the user comes back to the tab or regains connectivity.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') checkForUpdate()
        })
        window.addEventListener('online', checkForUpdate)
      })
      .catch(err => console.warn('[SW] Registration failed:', err))
  })
}
