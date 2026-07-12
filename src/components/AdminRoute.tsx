import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import SplashLoader from '@/components/SplashLoader'

export default function AdminRoute({
  children,
  requireRole,
}: {
  children: React.ReactNode
  /** When set, only this exact admin role may render children (e.g. 'ceo' for CEO-only pages). */
  requireRole?: string
}) {
  const { session, loading, emailVerified, user, isAdmin, role } = useAuth()
  const location = useLocation()

  if (loading) return <SplashLoader message="Verifying access…" />

  if (!session) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  if (!emailVerified) {
    return <Navigate to="/verify-email" state={{ email: user?.email, from: location }} replace />
  }

  if (!isAdmin) {
    return <Navigate to="/app/feed" replace />
  }

  if (requireRole && role !== requireRole) {
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}
