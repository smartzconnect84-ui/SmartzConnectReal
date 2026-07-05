import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import SplashLoader from '@/components/SplashLoader'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) return <SplashLoader message="Verifying access…" />

  if (!session) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  if (!isAdmin) {
    return <Navigate to="/app/feed" replace />
  }

  return <>{children}</>
}
