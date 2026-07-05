import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import SplashLoader from '@/components/SplashLoader'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, emailVerified, user } = useAuth()
  const location = useLocation()

  if (loading) return <SplashLoader />

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
