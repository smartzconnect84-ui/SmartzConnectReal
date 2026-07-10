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

// Register PWA service worker (skipped in dev to avoid stale-cache issues)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch(err => console.warn('[SW] Registration failed:', err))
  })
}
