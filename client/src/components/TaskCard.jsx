import { TASK_COLUMNS } from '../utils/constants'
import { formatDate } from '../utils/format'

export default function TaskCard({ task, onMove, onDelete, busy }) {
  const index = TASK_COLUMNS.findIndex((column) => column.status === task.status)
  const previous = TASK_COLUMNS[index - 1]
  const next = TASK_COLUMNS[index + 1]

  return (
    <article className="task">
      <h3>{task.title}</h3>
      {task.description && <p>{task.description}</p>}
      <p className="meta">
        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
        {task.dueDate && <span> Due {formatDate(task.dueDate)}</span>}
      </p>

      <div className="row">
        {previous && (
          <button
            type="button"
            className="btn btn-small btn-secondary"
            disabled={busy}
            onClick={() => onMove(task, previous.status)}
          >
            ← {previous.label}
          </button>
        )}
        {next && (
          <button
            type="button"
            className="btn btn-small"
            disabled={busy}
            onClick={() => onMove(task, next.status)}
          >
            {next.label} →
          </button>
        )}
        <button
          type="button"
          className="btn btn-small btn-danger"
          disabled={busy}
          onClick={() => onDelete(task)}
        >
          Delete
        </button>
      </div>
    </article>
  )
}
