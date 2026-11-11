import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import ErrorMessage from '../components/ErrorMessage'
import { validateLogin } from '../utils/validation'

export default function LoginPage() {
  const { user, login } = useAuth()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Send the user back to the page they originally asked for.
  const destination = location.state?.from?.pathname ?? '/sessions'

  // Already signed in (or just signed in): leave the login page.
  if (user) return <Navigate to={destination} replace />

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    const problems = validateLogin(form)
    if (problems.length > 0) {
      setError({ message: 'Please fix the following:', fieldErrors: problems })
      return
    }

    setSubmitting(true)
    try {
      await login({ email: form.email.trim(), password: form.password })
    } catch (err) {
      setError(err)
      setSubmitting(false)
    }
  }

  return (
    <section className="card narrow">
      <h1>Log in</h1>
      <form onSubmit={handleSubmit} noValidate>
        <ErrorMessage error={error} />

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
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
        />

        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p>
        New to StudySync? <Link to="/register">Create an account</Link>
      </p>
    </section>
  )
}
