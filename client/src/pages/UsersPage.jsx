import { useEffect, useState } from 'react'
import { listUsers } from '../api/users'
import ErrorMessage from '../components/ErrorMessage'

// Read-only list for admins. Editing and deleting users belongs to SCRUM-11.
export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  return (
    <>
      <div className="page-header">
        <h1>Users</h1>
      </div>
      <ErrorMessage error={error} />
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
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id ?? u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
