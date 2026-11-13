import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { sessionsApi } from '../api/sessions'
import { tasksApi } from '../api/tasks'
import { useAuth } from '../auth/useAuth'
import ErrorMessage from '../components/ErrorMessage'
import TaskCard from '../components/TaskCard'
import { TASK_COLUMNS, TASK_PRIORITIES } from '../utils/constants'
import { formatDateTime, refId } from '../utils/format'

const EMPTY_TASK = { title: '', description: '', priority: 'medium', dueDate: '', mine: false }

export default function SessionBoardPage() {
  const { sessionId } = useParams()
  const { user } = useAuth()
  const [session, setSession] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState(EMPTY_TASK)

  useEffect(() => {
    let cancelled = false
    Promise.all([sessionsApi.get(sessionId), tasksApi.listForSession(sessionId)])
      .then(([loadedSession, loadedTasks]) => {
        if (cancelled) return
        setSession(loadedSession)
        setTasks(loadedTasks)
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
  }, [sessionId])

  function handleChange(event) {
    const { name, type, checked, value } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleCreate(event) {
    event.preventDefault()
    setError(null)

    if (!form.title.trim()) {
      setError({ message: 'Please fix the following:', fieldErrors: [{ field: 'title', message: 'Task title is required' }] })
      return
    }

    setBusy(true)
    try {
      const created = await tasksApi.create(sessionId, {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        assignedTo: form.mine ? user.id : null,
      })
      setTasks((current) => [...current, created])
      setForm(EMPTY_TASK)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  async function handleMove(task, status) {
    setError(null)
    setBusy(true)
    try {
      const updated = await tasksApi.update(refId(task), { status })
      setTasks((current) =>
        current.map((item) => (refId(item) === refId(updated) ? updated : item)),
      )
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(task) {
    if (!window.confirm(`Delete task "${task.title}"?`)) return
    setError(null)
    setBusy(true)
    try {
      await tasksApi.remove(refId(task))
      setTasks((current) => current.filter((item) => refId(item) !== refId(task)))
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="status">Loading task board…</p>

  if (!session) {
    return (
      <section>
        <ErrorMessage error={error} />
        <Link to="/sessions">← Back to sessions</Link>
      </section>
    )
  }

  return (
    <section>
      <Link to="/sessions">← Back to sessions</Link>
      <div className="page-header">
        <div>
          <h1>{session.title}</h1>
          <p className="meta">
            {formatDateTime(session.scheduledAt)} · {session.status}
          </p>
        </div>
      </div>

      <ErrorMessage error={error} />

      <form className="card inline-form" onSubmit={handleCreate} noValidate>
        <h2>Add a task</h2>
        <div className="field">
          <label htmlFor="task-title">Title</label>
          <input id="task-title" name="title" value={form.title} onChange={handleChange} />
        </div>

        <div className="field">
          <label htmlFor="task-description">Description</label>
          <input
            id="task-description"
            name="description"
            value={form.description}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label htmlFor="task-priority">Priority</label>
          <select
            id="task-priority"
            name="priority"
            value={form.priority}
            onChange={handleChange}
          >
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="task-due">Due date</label>
          <input
            id="task-due"
            name="dueDate"
            type="date"
            value={form.dueDate}
            onChange={handleChange}
          />
        </div>

        <label className="checkbox">
          <input type="checkbox" name="mine" checked={form.mine} onChange={handleChange} />
          Assign to me
        </label>

        <button type="submit" className="btn" disabled={busy}>
          Add task
        </button>
      </form>

      <div className="board">
        {TASK_COLUMNS.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.status)
          return (
            <div key={column.status} className="column" aria-label={column.label}>
              <h2>
                {column.label} <span className="count">{columnTasks.length}</span>
              </h2>
              {columnTasks.length === 0 && <p className="hint">Nothing here yet.</p>}
              {columnTasks.map((task) => (
                <TaskCard
                  key={refId(task)}
                  task={task}
                  busy={busy}
                  onMove={handleMove}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )
        })}
      </div>
    </section>
  )
}
