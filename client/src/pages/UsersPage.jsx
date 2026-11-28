import { useEffect, useState } from 'react'
import { listUsers } from '../api/users'
import { deleteUser, updateUser } from '../api/auth'
import { useAuth } from '../auth/useAuth'
import ErrorMessage from '../components/ErrorMessage'
import { validateProfile } from '../utils/validation'

// Keep SCRUM-10's admin list and extend it with the existing User API.
export default function UsersPage() {
  const { user, updateProfile, deleteAccount } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'student' })
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let cancelled = false
    listUsers()
      .then((data) => {
        if (!cancelled) setUsers(data)
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

  function editUser(selected) {
    setEditing(selected.id ?? selected._id)
    setForm({ name: selected.name, email: selected.email, role: selected.role })
    setError(null)
    setNotice('')
  }

  async function saveUser(event) {
    event.preventDefault()
    setError(null)
    const problems = validateProfile(form)
    if (problems.length) {
      setError({ message: 'Please fix the following:', fieldErrors: problems })
      return
    }
    setBusy(true)
    const updates = { ...form, name: form.name.trim(), email: form.email.trim() }
    try {
      // Self-edits must also refresh the navbar and role-based route guards.
      const updated = editing === user.id
        ? await updateProfile(editing, updates)
        : (await updateUser(editing, updates)).user
      setUsers((current) => current.map((entry) =>
        (entry.id ?? entry._id) === editing ? updated : entry))
      setEditing(null)
      setNotice('User updated.')
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  async function removeUser(selected) {
    if (!window.confirm(`Permanently delete ${selected.name}'s account? This cannot be undone.`)) return
    const id = selected.id ?? selected._id
    setBusy(true)
    setError(null)
    setNotice('')
    try {
      if (id === user.id) await deleteAccount(id)
      else await deleteUser(id)
      setUsers((current) => current.filter((entry) => (entry.id ?? entry._id) !== id))
      if (editing === id) setEditing(null)
      setNotice('User deleted.')
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Users</h1>
      </div>
      <ErrorMessage error={error} />
      {notice && <p className="alert alert-success" role="status">{notice}</p>}
      {editing && (
        <form className="card narrow" onSubmit={saveUser} noValidate>
          <h2>Edit user</h2>
          <label htmlFor="user-name">Name</label>
          <input id="user-name" value={form.name} disabled={busy}
            onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <label htmlFor="user-email">Email</label>
          <input id="user-email" type="email" value={form.email} disabled={busy}
            onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <label htmlFor="user-role">Role</label>
          <select id="user-role" value={form.role} disabled={busy}
            onChange={(event) => setForm({ ...form, role: event.target.value })}>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>
          <div className="form-actions">
            <button className="btn" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save user'}</button>
            <button className="btn btn-secondary" type="button" disabled={busy}
              onClick={() => { setEditing(null); setError(null) }}>Cancel</button>
          </div>
        </form>
      )}
      {loading && <p className="status">Loading users…</p>}
      {!loading && !error && users.length === 0 && <p className="status">No users yet.</p>}
      {users.length > 0 && (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id ?? u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    <button type="button" className="btn btn-secondary" disabled={busy}
                      aria-label={`Edit ${u.name}`} onClick={() => editUser(u)}>Edit</button>{' '}
                    <button type="button" className="btn btn-danger" disabled={busy}
                      aria-label={`Delete ${u.name}`} onClick={() => removeUser(u)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
