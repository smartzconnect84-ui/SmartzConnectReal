import { useEffect, useRef } from 'react'

interface TurnstileWidgetProps {
  onToken: (token: string) => void
  onError?: () => void
  className?: string
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
    onTurnstileLoad?: () => void
  }
}

export default function TurnstileWidget({ onToken, onError, className }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef  = useRef<string | null>(null)

  useEffect(() => {
    // Only render when the site key is configured
    if (!SITE_KEY || !containerRef.current) return

    const render = () => {
      if (!containerRef.current || !window.turnstile) return
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token: string) => onToken(token),
        'error-callback': () => onError?.(),
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
        size: 'normal',
      })
    }

    if (window.turnstile) {
      render()
    } else {
      // Load the Turnstile script once
      if (!document.getElementById('cf-turnstile-script')) {
        window.onTurnstileLoad = render
        const script = document.createElement('script')
        script.id  = 'cf-turnstile-script'
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad'
        script.async = true
        script.defer = true
        document.head.appendChild(script)
      } else {
        // Script is loading; poll until ready
        const poll = setInterval(() => {
          if (window.turnstile) { clearInterval(poll); render() }
        }, 100)
        return () => clearInterval(poll)
      }
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [onToken, onError])

  // If no site key, render nothing (zero impact)
  if (!SITE_KEY) return null

  return <div ref={containerRef} className={className} />
}
