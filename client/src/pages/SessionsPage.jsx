import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { sessionsApi } from '../api/sessions'
import { useAuth } from '../auth/useAuth'
import ErrorMessage from '../components/ErrorMessage'
import SessionForm from '../components/SessionForm'
import { formatDateTime, refId } from '../utils/format'

export default function SessionsPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // `null` = form hidden, 'new' = create form, a session object = edit form.
  const [formTarget, setFormTarget] = useState(null)

  useEffect(() => {
    let cancelled = false
    sessionsApi
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

  const replaceSession = (updated) =>
    setSessions((current) =>
      current.map((item) => (refId(item) === refId(updated) ? updated : item)),
    )

  async function handleSave(values) {
    if (formTarget === 'new') {
      const created = await sessionsApi.create(values)
      setSessions((current) => [created, ...current])
    } else {
      replaceSession(await sessionsApi.update(refId(formTarget), values))
    }
    setFormTarget(null)
  }

  async function runAction(action) {
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(err)
    }
  }

  const handleDelete = (session) =>
    runAction(async () => {
      if (!window.confirm(`Delete "${session.title}"? Its tasks will be removed too.`)) return
      await sessionsApi.remove(refId(session))
      setSessions((current) => current.filter((item) => refId(item) !== refId(session)))
    })

  const handleJoin = (session) =>
    runAction(async () => replaceSession(await sessionsApi.join(refId(session))))

  const handleLeave = (session) =>
    runAction(async () => replaceSession(await sessionsApi.leave(refId(session))))

  return (
    <section>
      <div className="page-header">
        <h1>Study sessions</h1>
        {!formTarget && (
          <button type="button" className="btn" onClick={() => setFormTarget('new')}>
            New session
          </button>
        )}
      </div>

      <ErrorMessage error={error} />

      {formTarget && (
        <SessionForm
          key={formTarget === 'new' ? 'new' : refId(formTarget)}
          session={formTarget === 'new' ? null : formTarget}
          onSubmit={handleSave}
          onCancel={() => setFormTarget(null)}
        />
      )}

      {loading && <p className="status">Loading sessions…</p>}
      {!loading && sessions.length === 0 && (
        <p className="status">No sessions yet. Create the first one.</p>
      )}

      <ul className="grid">
        {sessions.map((session) => {
          const isOwner = refId(session.createdBy) === user.id
          const isMember = session.participants.some((p) => refId(p) === user.id)

          return (
            <li key={refId(session)} className="card">
              <h2>{session.title}</h2>
              <p>{session.description}</p>
              <p className="meta">
                {formatDateTime(session.scheduledAt)} ·{' '}
                <span className={`badge badge-${session.status}`}>{session.status}</span> ·{' '}
                {session.participants.length} joined
              </p>

              <div className="row">
                <Link className="btn btn-small" to={`/sessions/${refId(session)}`}>
                  Open task board
                </Link>
                {!isOwner &&
                  (isMember ? (
                    <button
                      type="button"
                      className="btn btn-small btn-secondary"
                      onClick={() => handleLeave(session)}
                    >
                      Leave
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-small"
                      onClick={() => handleJoin(session)}
                    >
                      Join
                    </button>
                  ))}
                {isOwner && (
                  <>
                    <button
                      type="button"
                      className="btn btn-small btn-secondary"
                      onClick={() => setFormTarget(session)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-small btn-danger"
                      onClick={() => handleDelete(session)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
