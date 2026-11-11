import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import ErrorMessage from '../components/ErrorMessage'
import { validateRegister } from '../utils/validation'

export default function RegisterPage() {
  const { user, register } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/sessions" replace />

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    const problems = validateRegister(form)
    if (problems.length > 0) {
      setError({ message: 'Please fix the following:', fieldErrors: problems })
      return
    }

    setSubmitting(true)
    try {
      // confirmPassword is a UI-only field: the API rejects unknown keys.
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      })
    } catch (err) {
      setError(err)
      setSubmitting(false)
    }
  }

  return (
    <section className="card narrow">
      <h1>Create your account</h1>
      <form onSubmit={handleSubmit} noValidate>
        <ErrorMessage error={error} />

        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          value={form.name}
          onChange={handleChange}
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
        />
        <p className="hint">8-72 characters with an uppercase letter, a lowercase letter and a number.</p>

        <label htmlFor="confirmPassword">Confirm password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
        />

        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Register'}
        </button>
      </form>
      <p>
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </section>
  )
}
