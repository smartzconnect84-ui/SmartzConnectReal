import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Ban } from 'lucide-react'
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext'

/**
 * Central map: app route prefix -> feature-toggle id from
 * Admin → Settings → Features. Single source of truth so nav,
 * routes and paywalls all agree on what "disabled" means.
 */
export const FEATURE_ROUTE_MAP: Record<string, string> = {
  '/app/discover': 't4',
  '/app/spin': 't5',
  '/app/smartztv': 't6',
  '/smartztv': 't6',
  '/app/marketplace': 't7',
  '/smartzmarket': 't7',
  '/app/ride': 't8',
  '/smartzride': 't8',
  '/app/groups': 't9',
  '/app/worldchat': 't9',
}

/** Payment-method toggles (Subscriptions / Pricing / checkout). */
export const PAYMENT_TOGGLE_MAP = {
  mtn: 't13',
  orange: 't14',
  card: 't15',
  stripe: 't15',
  wallet: 't16',
} as const

export function FeatureUnavailable({ label }: { label?: string }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="w-14 h-14 rounded-2xl dark:bg-white/5 bg-gray-100 flex items-center justify-center mb-4">
        <Ban className="w-6 h-6 dark:text-gray-500 text-gray-400" />
      </div>
      <h2 className="font-display font-black text-xl dark:text-white text-gray-900">
        {label ?? 'Feature unavailable'}
      </h2>
      <p className="text-sm dark:text-gray-400 text-gray-500 mt-2 max-w-sm">
        This feature is currently turned off by the platform administrator.
        Please check back later.
      </p>
      <Link
        to="/app/feed"
        className="mt-6 px-5 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold shadow-lg shadow-pink-500/20 hover:opacity-90"
      >
        Back to Home
      </Link>
    </div>
  )
}

/**
 * Route-level gate. When the mapped toggle is off, render an
 * "unavailable" notice instead of the page. Unknown routes pass through.
 */
export default function FeatureGate({
  route,
  toggleId,
  label,
  children,
}: {
  route?: string
  toggleId?: string
  label?: string
  children: ReactNode
}) {
  const { isEnabled } = useFeatureFlags()
  const id =
    toggleId ??
    (route ? FEATURE_ROUTE_MAP[route] : undefined)
  if (id && !isEnabled(id)) {
    return <FeatureUnavailable label={label} />
  }
  return <>{children}</>
}
