import { Link, NavLink, useNavigate } from 'react-router-dom'
import { USE_MOCK } from '../api/config'
import { useAuth } from '../auth/useAuth'

export default function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        StudySync
      </Link>

      <nav aria-label="Main navigation">
        {user ? (
          <>
            <NavLink to="/sessions">Sessions</NavLink>
            <NavLink to="/account">Account</NavLink>
            <span className="nav-user">{user.name}</span>
            <button type="button" className="btn btn-secondary" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">Log in</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
      </nav>

      {USE_MOCK && user && (
        <p className="mock-banner">Sessions and tasks are using demo data.</p>
      )}
    </header>
  )
}
