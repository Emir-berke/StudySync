import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { USE_MOCK, USE_MOCK_TASKS } from '../api/config'
import { useAuth } from '../auth/useAuth'

export default function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  // Only matters on narrow screens, where the links collapse behind a button.
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    setMenuOpen(false)
    logout()
    navigate('/login')
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="navbar">
      <Link to="/" className="brand" onClick={closeMenu}>
        <img src="/team-mark.webp" alt="" width="36" height="36" />
        <span>StudySync</span>
      </Link>

      <button
        type="button"
        className="menu-toggle"
        aria-expanded={menuOpen}
        aria-controls="main-nav"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? 'Close' : 'Menu'}
      </button>

      <nav id="main-nav" aria-label="Main navigation" className={menuOpen ? 'open' : ''}>
        <NavLink to="/" end onClick={closeMenu}>
          Home
        </NavLink>
        {user ? (
          <>
            <NavLink to="/sessions" onClick={closeMenu}>
              Sessions
            </NavLink>
            {user.role === 'admin' && (
              <NavLink to="/users" onClick={closeMenu}>
                Users
              </NavLink>
            )}
            <NavLink to="/account" onClick={closeMenu}>
              My Profile
            </NavLink>
            <span className="nav-user">{user.name}</span>
            <button type="button" className="btn btn-secondary" onClick={handleLogout}>
              Sign Out
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" onClick={closeMenu}>
              Sign In
            </NavLink>
            <Link to="/register" className="btn btn-primary" onClick={closeMenu}>
              Sign Up
            </Link>
          </>
        )}
      </nav>

      {(USE_MOCK || USE_MOCK_TASKS) && user && (
        <p className="mock-banner">Demo data is on for {[USE_MOCK && 'sessions', USE_MOCK_TASKS && 'tasks'].filter(Boolean).join(' and ')}.</p>
      )}
    </header>
  )
}
