import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

// Wraps every page that needs a signed-in user.
export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="status">Checking your session…</p>

  // Remember where the user was heading so login can send them back.
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  return <Outlet />
}
