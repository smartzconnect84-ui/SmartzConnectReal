import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, emailVerified, user } = useAuth()
  const location = useLocation()

  // Show loading spinner while session is being determined
  if (loading) {
    return (
      <div className="min-h-screen dark:bg-[#0D0A14] bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-love-gradient flex items-center justify-center shadow-xl shadow-pink-500/30 animate-pulse">
            <span className="text-white text-2xl">💕</span>
          </div>
          <div className="w-6 h-6 border-2 border-pink-500/30 border-t-brand-pink rounded-full animate-spin" />
          <p className="text-sm dark:text-gray-500 text-gray-400">Loading SmartzConnect...</p>
        </div>
      </div>
    )
  }

  // Not logged in → go to login
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Logged in but email not verified → go to verify-email
  // (Skip this check for the /onboarding route so new users can complete setup)
  if (!emailVerified && !location.pathname.startsWith('/onboarding')) {
    return (
      <Navigate
        to="/verify-email"
        state={{ email: user?.email, from: location }}
        replace
      />
    )
  }

  return <>{children}</>
}
