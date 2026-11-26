import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { publicSessionsApi } from '../api/publicSessions'
import { USE_MOCK_PUBLIC } from '../api/config'
import { useAuth } from '../auth/useAuth'
import ErrorMessage from '../components/ErrorMessage'
import { formatDateTime } from '../utils/format'

export default function LandingPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    publicSessionsApi
      .list()
      .then((data) => {
        if (!cancelled) setSessions(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-text">
          <h1 id="hero-title">StudySync</h1>
          <p className="hero-tagline">
            Plan study sessions with your classmates, split the work into tasks and see what is done at a glance.
          </p>
          <div className="hero-actions">
            {user ? (
              <Link to="/sessions" className="btn btn-primary">
                Go to my sessions
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary">
                  Sign Up
                </Link>
                <Link to="/login" className="btn btn-secondary">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
        <picture className="hero-logo">
          <source srcSet="/team-logo.webp" type="image/webp" />
          <img src="/team-logo.png" alt="CRUD Operators team logo" width="180" height="283" />
        </picture>
      </section>

      <section aria-labelledby="sessions-title" className="sessions-section">
        <h2 id="sessions-title">Upcoming study sessions</h2>
        {USE_MOCK_PUBLIC && (
          <p className="hint">Sample sessions are shown here. Sign in to see and join real ones.</p>
        )}
        <ErrorMessage error={error} />
        {loading && <p className="status">Loading sessions…</p>}
        {!loading && !error && sessions.length === 0 && (
          <p className="status">No upcoming sessions yet. Sign up and create the first one.</p>
        )}
        {sessions.length > 0 && (
          <ul className="session-grid">
            {sessions.map((s) => (
              <li key={s.id} className="card session-card">
                <h3>{s.title}</h3>
                <p className="meta">{formatDateTime(s.scheduledAt)}</p>
                {s.description && <p>{s.description}</p>}
                <p className="meta">
                  {s.participantCount} {s.participantCount === 1 ? 'person' : 'people'} joined
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
