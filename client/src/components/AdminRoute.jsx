import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

// Pages only an admin may open. The server enforces this too; this just keeps
// everyone else from seeing a page that would only show an error.
export default function AdminRoute() {
  const { user, loading } = useAuth()

  if (loading) return <p className="status">Checking your session…</p>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/sessions" replace />

  return <Outlet />
}
