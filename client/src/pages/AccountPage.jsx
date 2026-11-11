import { useState } from 'react'
import { useAuth } from '../auth/useAuth'
import ErrorMessage from '../components/ErrorMessage'
import { validateProfile } from '../utils/validation'

// Exercises the real user endpoints: GET /users/me (already loaded by
// AuthProvider), PATCH /users/:id and DELETE /users/:id.
export default function AccountPage() {
  const { user, updateProfile, deleteAccount } = useAuth()
  const [form, setForm] = useState({ name: user.name, email: user.email })
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  function handleChange(event) {
    setNotice('')
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSave(event) {
    event.preventDefault()
    setError(null)
    setNotice('')

    const problems = validateProfile(form)
    if (problems.length > 0) {
      setError({ message: 'Please fix the following:', fieldErrors: problems })
      return
    }

    setSaving(true)
    try {
      await updateProfile(user.id, { name: form.name.trim(), email: form.email.trim() })
      setNotice('Profile updated.')
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      'Delete your account permanently? This cannot be undone.',
    )
    if (!confirmed) return

    setError(null)
    try {
      await deleteAccount(user.id)
    } catch (err) {
      setError(err)
    }
  }

  return (
    <section className="card narrow">
      <h1>Your account</h1>
      <p className="hint">Role: {user.role}</p>

      <form onSubmit={handleSave} noValidate>
        <ErrorMessage error={error} />
        {notice && (
          <p className="alert alert-success" role="status">
            {notice}
          </p>
        )}

        <label htmlFor="name">Name</label>
        <input id="name" name="name" value={form.name} onChange={handleChange} />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
        />

        <button type="submit" className="btn" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <hr />
      <h2>Danger zone</h2>
      <button type="button" className="btn btn-danger" onClick={handleDelete}>
        Delete my account
      </button>
    </section>
  )
}
