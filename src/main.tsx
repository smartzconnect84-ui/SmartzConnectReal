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
