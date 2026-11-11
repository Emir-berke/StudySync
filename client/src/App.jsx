import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from './api';
import './App.css';

const emptyForm = {
  title: '',
  description: '',
  scheduledAt: '',
  status: 'upcoming',
};
const getId = (user) => String(user?._id ?? user?.id ?? user ?? '');

const readAuth = () => {
  try {
    return JSON.parse(localStorage.getItem('studysync.auth'));
  } catch {
    return null;
  }
};

const localDateTime = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const formatDateTime = (value) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

function App() {
  const [auth, setAuth] = useState(readAuth);
  const [authMode, setAuthMode] = useState('login');
  const [sessions, setSessions] = useState([]);
  const [screen, setScreen] = useState('list');
  const [selectedId, setSelectedId] = useState('');
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(() => Boolean(readAuth()?.token));
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!auth?.token) return undefined;

    let cancelled = false;
    apiRequest('/sessions', { token: auth.token })
      .then(({ sessions: results }) => {
        if (!cancelled) setSessions(results);
      })
      .catch((requestError) => {
        if (cancelled) return;
        if (requestError.status === 401) {
          localStorage.removeItem('studysync.auth');
          setAuth(null);
        }
        setError(requestError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [auth?.token]);

  const currentUserId = getId(auth?.user);
  const selectedSession = sessions.find(
    (session) => getId(session) === selectedId,
  );
  const visibleSessions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sessions
      .filter((session) => {
        const matchesQuery = `${session.title} ${session.description}`
          .toLowerCase()
          .includes(query);
        const isMember = (session.participants || []).some(
          (member) => getId(member) === currentUserId,
        );
        const isOwner = getId(session.createdBy) === currentUserId;
        const matchesFilter =
          filter === 'all' ||
          (filter === 'joined' && isMember) ||
          (filter === 'hosting' && isOwner);
        return matchesQuery && matchesFilter;
      })
      .sort(
        (left, right) =>
          new Date(left.scheduledAt) - new Date(right.scheduledAt),
      );
  }, [currentUserId, filter, search, sessions]);

  const handleAuth = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = { email: data.get('email'), password: data.get('password') };
    if (authMode === 'register') body.name = data.get('name');

    setBusy(true);
    setError('');
    try {
      const result = await apiRequest(
        `/auth/${authMode === 'register' ? 'register' : 'login'}`,
        {
          method: 'POST',
          body,
        },
      );
      const savedAuth = { token: result.token, user: result.user };
      localStorage.setItem('studysync.auth', JSON.stringify(savedAuth));
      setLoading(true);
      setAuth(savedAuth);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem('studysync.auth');
    setAuth(null);
    setSessions([]);
    setLoading(false);
    setSelectedId('');
    setScreen('list');
    setNotice('');
    setError('');
  };

  const startCreate = () => {
    setForm(emptyForm);
    setEditingId('');
    setError('');
    setScreen('form');
  };

  const startEdit = (session) => {
    setForm({
      title: session.title,
      description: session.description || '',
      scheduledAt: localDateTime(new Date(session.scheduledAt)),
      status: session.status,
    });
    setEditingId(getId(session));
    setError('');
    setScreen('form');
  };

  const openSession = async (session) => {
    const id = getId(session);
    setSelectedId(id);
    setScreen('details');
    setDetailsLoading(true);
    setError('');
    try {
      const result = await apiRequest(`/sessions/${id}`, { token: auth.token });
      setSessions((current) =>
        current.map((item) => (getId(item) === id ? result.session : item)),
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const saveSession = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const body = {
      ...form,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
    };

    try {
      const result = await apiRequest(
        editingId ? `/sessions/${editingId}` : '/sessions',
        {
          token: auth.token,
          method: editingId ? 'PATCH' : 'POST',
          body,
        },
      );
      const session = result.session;
      setSessions((current) => {
        const exists = current.some((item) => getId(item) === getId(session));
        return exists ?
            current.map((item) =>
              getId(item) === getId(session) ? session : item,
            )
          : [...current, session];
      });
      setSelectedId(getId(session));
      setScreen('details');
      setNotice(editingId ? 'Session updated.' : 'Session created.');
      setEditingId('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const changeMembership = async (session) => {
    const isMember = (session.participants || []).some(
      (member) => getId(member) === currentUserId,
    );
    setBusy(true);
    setError('');
    try {
      const result = await apiRequest(
        `/sessions/${getId(session)}/${isMember ? 'leave' : 'join'}`,
        {
          token: auth.token,
          method: 'POST',
        },
      );
      setSessions((current) =>
        current.map((item) =>
          getId(item) === getId(session) ? result.session : item,
        ),
      );
      setNotice(isMember ? 'You left the session.' : 'You joined the session.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteSession = async (session) => {
    if (!window.confirm(`Delete the ${session.title} session?`)) return;
    setBusy(true);
    setError('');
    try {
      await apiRequest(`/sessions/${getId(session)}`, {
        token: auth.token,
        method: 'DELETE',
      });
      setSessions((current) =>
        current.filter((item) => getId(item) !== getId(session)),
      );
      setSelectedId('');
      setScreen('list');
      setNotice('Session deleted.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  if (!auth?.token) {
    return (
      <main className='auth-page'>
        <h1>StudySync</h1>
        <section className='auth-panel' aria-labelledby='auth-title'>
          <h2 id='auth-title'>
            {authMode === 'login' ? 'Sign in' : 'Create an account'}
          </h2>
          <p>Sign in to browse and manage study sessions.</p>
          <div className='mode-switch' aria-label='Account mode'>
            <button
              type='button'
              aria-pressed={authMode === 'login'}
              onClick={() => {
                setAuthMode('login');
                setError('');
              }}
            >
              Sign in
            </button>
            <button
              type='button'
              aria-pressed={authMode === 'register'}
              onClick={() => {
                setAuthMode('register');
                setError('');
              }}
            >
              Register
            </button>
          </div>
          <form onSubmit={handleAuth}>
            {authMode === 'register' && (
              <label>
                Name
                <input
                  name='name'
                  minLength='2'
                  maxLength='80'
                  autoComplete='name'
                  required
                />
              </label>
            )}
            <label>
              Email
              <input name='email' type='email' autoComplete='email' required />
            </label>
            <label>
              Password
              <input
                name='password'
                type='password'
                minLength={authMode === 'register' ? 8 : undefined}
                autoComplete={
                  authMode === 'register' ? 'new-password' : 'current-password'
                }
                required
              />
            </label>
            {authMode === 'register' && (
              <p className='hint'>
                Use at least 8 characters with uppercase, lowercase, and a
                number.
              </p>
            )}
            {error && (
              <p className='error' role='alert'>
                {error}
              </p>
            )}
            <button type='submit' disabled={busy}>
              {busy ?
                'Please wait...'
              : authMode === 'login' ?
                'Sign in'
              : 'Create account'}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className='app-page'>
      <header className='app-header'>
        <div>
          <h1>StudySync</h1>
          <p>
            Signed in as {auth.user.name} ({auth.user.email})
          </p>
        </div>
        <nav aria-label='Session navigation'>
          <button
            type='button'
            onClick={() => {
              setScreen('list');
              setNotice('');
              setError('');
            }}
          >
            Sessions
          </button>
          <button type='button' onClick={startCreate}>
            Create session
          </button>
          <button type='button' onClick={signOut}>
            Sign out
          </button>
        </nav>
      </header>

      {notice && (
        <p className='notice' role='status'>
          {notice}
        </p>
      )}
      {error && (
        <p className='error' role='alert'>
          {error}
        </p>
      )}

      {screen === 'list' && (
        <section aria-labelledby='sessions-heading'>
          <h2 id='sessions-heading'>Study sessions</h2>
          <div className='list-controls'>
            <label>
              Filter
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option value='all'>All sessions</option>
                <option value='joined'>Joined</option>
                <option value='hosting'>Hosting</option>
              </select>
            </label>
            <label>
              Search title or description
              <input
                type='search'
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>
          {loading ?
            <p>Loading sessions...</p>
          : visibleSessions.length ?
            <ul className='session-list'>
              {visibleSessions.map((session) => (
                <li key={getId(session)}>
                  <button
                    className='session-link'
                    type='button'
                    onClick={() => openSession(session)}
                  >
                    <strong>{session.title}</strong>
                    <span>{formatDateTime(session.scheduledAt)}</span>
                    <span>{session.status}</span>
                    <span>
                      {(session.participants || []).length} participants
                    </span>
                    <span>{(session.tasks || []).length} tasks</span>
                  </button>
                </li>
              ))}
            </ul>
          : <p>No sessions found. Create one to get started.</p>}
        </section>
      )}

      {screen === 'form' && (
        <section aria-labelledby='form-heading'>
          <button
            type='button'
            onClick={() => setScreen(editingId ? 'details' : 'list')}
          >
            Back
          </button>
          <h2 id='form-heading'>
            {editingId ? 'Edit session' : 'Create a session'}
          </h2>
          <form className='session-form' onSubmit={saveSession}>
            <label>
              Title
              <input
                required
                maxLength='120'
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
              />
            </label>
            <label>
              Description
              <textarea
                maxLength='2000'
                rows='3'
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
              />
            </label>
            <label>
              Scheduled date
              <input
                required
                type='datetime-local'
                value={form.scheduledAt}
                onChange={(event) =>
                  setForm({ ...form, scheduledAt: event.target.value })
                }
              />
            </label>
            <label>
              Status
              <select
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value })
                }
              >
                <option value='upcoming'>Upcoming</option>
                <option value='active'>Active</option>
                <option value='completed'>Completed</option>
              </select>
            </label>
            <div className='form-actions'>
              <button type='submit' disabled={busy}>
                {busy ?
                  'Saving...'
                : editingId ?
                  'Save changes'
                : 'Create session'}
              </button>
              <button
                type='button'
                onClick={() => setScreen(editingId ? 'details' : 'list')}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {screen === 'details' && (
        <section aria-labelledby='details-heading'>
          <button type='button' onClick={() => setScreen('list')}>
            Back to sessions
          </button>
          {detailsLoading && <p>Loading session...</p>}
          {selectedSession && (
            <>
              <h2 id='details-heading'>{selectedSession.title}</h2>
              <dl className='session-details'>
                <dt>Creator</dt>
                <dd>{selectedSession.createdBy?.name || 'Unknown'}</dd>
                <dt>Scheduled date</dt>
                <dd>{formatDateTime(selectedSession.scheduledAt)}</dd>
                <dt>Status</dt>
                <dd>{selectedSession.status}</dd>
                <dt>Description</dt>
                <dd>
                  {selectedSession.description || 'No description provided.'}
                </dd>
              </dl>
              <h3>
                Participants ({(selectedSession.participants || []).length})
              </h3>
              <ul>
                {(selectedSession.participants || []).map((participant) => (
                  <li key={getId(participant)}>
                    {participant.name || participant.email}
                  </li>
                ))}
              </ul>
              <h3>Tasks ({(selectedSession.tasks || []).length})</h3>
              {(selectedSession.tasks || []).length ?
                <ul>
                  {selectedSession.tasks.map((task) => (
                    <li key={getId(task)}>
                      <strong>{task.title}</strong>
                      {task.description && `: ${task.description}`} (
                      {task.status}, {task.priority}; assigned to{' '}
                      {task.assignedTo?.name || 'unassigned'}; due{' '}
                      {task.dueDate ? formatDateTime(task.dueDate) : 'no date'})
                    </li>
                  ))}
                </ul>
              : <p>No tasks are associated with this session.</p>}
              <div className='detail-actions'>
                {getId(selectedSession.createdBy) === currentUserId ?
                  <>
                    <button
                      type='button'
                      onClick={() => startEdit(selectedSession)}
                    >
                      Edit session
                    </button>
                    <button
                      type='button'
                      disabled={busy}
                      onClick={() => deleteSession(selectedSession)}
                    >
                      Delete session
                    </button>
                  </>
                : <button
                    type='button'
                    disabled={busy}
                    onClick={() => changeMembership(selectedSession)}
                  >
                    {(
                      (selectedSession.participants || []).some(
                        (participant) => getId(participant) === currentUserId,
                      )
                    ) ?
                      'Leave session'
                    : 'Join session'}
                  </button>
                }
              </div>
            </>
          )}
          {!detailsLoading && !selectedSession && <p>Session not found.</p>}
        </section>
      )}
    </main>
  );
}

export default App;
