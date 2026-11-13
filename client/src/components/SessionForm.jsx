import { useState } from 'react'
import { SESSION_STATUSES } from '../utils/constants'
import { toDateTimeLocal } from '../utils/format'
import ErrorMessage from './ErrorMessage'

// Used for both "create" (no `session`) and "edit" (`session` provided).
export default function SessionForm({ session, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    title: session?.title ?? '',
    description: session?.description ?? '',
    scheduledAt: toDateTimeLocal(session?.scheduledAt),
    status: session?.status ?? 'upcoming',
  })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    const problems = []
    if (!form.title.trim()) problems.push({ field: 'title', message: 'Title is required' })
    if (!form.scheduledAt) {
      problems.push({ field: 'scheduledAt', message: 'Choose a date and time' })
    }
    if (problems.length > 0) {
      setError({ message: 'Please fix the following:', fieldErrors: problems })
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        title: form.title.trim(),
        description: form.description.trim(),
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        ...(session ? { status: form.status } : {}),
      })
    } catch (err) {
      setError(err)
      setSubmitting(false)
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit} noValidate>
      <h2>{session ? 'Edit session' : 'New study session'}</h2>
      <ErrorMessage error={error} />

      <label htmlFor="title">Title</label>
      <input id="title" name="title" value={form.title} onChange={handleChange} />

      <label htmlFor="description">Description</label>
      <textarea
        id="description"
        name="description"
        rows="3"
        value={form.description}
        onChange={handleChange}
      />

      <label htmlFor="scheduledAt">Date and time</label>
      <input
        id="scheduledAt"
        name="scheduledAt"
        type="datetime-local"
        value={form.scheduledAt}
        onChange={handleChange}
      />

      {session && (
        <>
          <label htmlFor="status">Status</label>
          <select id="status" name="status" value={form.status} onChange={handleChange}>
            {SESSION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </>
      )}

      <div className="row">
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save session'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
