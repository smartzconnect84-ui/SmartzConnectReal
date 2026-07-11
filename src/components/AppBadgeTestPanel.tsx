import { useState } from 'react'
import { BellRing, BellOff } from 'lucide-react'
import { updateAppBadge, clearAppBadge } from '@/lib/appBadge'

/**
 * TEMPORARY test panel for the App Badging API.
 *
 * Lets you manually trigger/clear the home-screen/taskbar icon badge to see
 * how it renders on your device (install the PWA first — badges only show
 * up on an installed app icon, not a regular browser tab).
 *
 * Safe to delete this file + its one usage in FeedPage.tsx once you're done
 * testing — it isn't part of the permanent product UI.
 */
export default function AppBadgeTestPanel() {
  const [count, setCount] = useState(3)
  const supported = typeof navigator !== 'undefined' && 'setAppBadge' in navigator

  return (
    <div className="w-full flex items-center gap-3 p-3 mb-3 rounded-2xl border border-dashed dark:border-amber-500/40 border-amber-400 dark:bg-amber-500/5 bg-amber-50">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold dark:text-amber-400 text-amber-700">
          🧪 App Badge test (temporary — remove after testing)
        </p>
        <p className="text-[11px] dark:text-gray-400 text-gray-500 mt-0.5">
          {supported
            ? 'Badging API supported. Install the app to your home screen to see the badge on the icon.'
            : 'Badging API not supported in this browser — try an installed PWA on Chrome/Edge (Android or desktop).'}
        </p>
      </div>
      <input
        type="number"
        min={0}
        max={99}
        value={count}
        onChange={e => setCount(Math.max(0, Number(e.target.value) || 0))}
        className="w-14 px-2 py-1.5 rounded-lg text-sm text-center dark:bg-white/10 bg-white border dark:border-white/10 border-gray-200"
      />
      <button
        onClick={() => updateAppBadge(count)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-love-gradient text-white text-xs font-bold hover:opacity-90 transition-opacity flex-shrink-0"
      >
        <BellRing className="w-3.5 h-3.5" />
        Set badge
      </button>
      <button
        onClick={() => clearAppBadge()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg dark:bg-white/10 bg-gray-200 dark:text-gray-200 text-gray-700 text-xs font-bold hover:opacity-80 transition-opacity flex-shrink-0"
      >
        <BellOff className="w-3.5 h-3.5" />
        Clear
      </button>
    </div>
  )
}
