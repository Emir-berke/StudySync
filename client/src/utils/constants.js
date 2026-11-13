// Must match the Task model's status enum in server/models/Task.js.
export const TASK_COLUMNS = [
  { status: 'todo', label: 'To Do' },
  { status: 'in-progress', label: 'In Progress' },
  { status: 'done', label: 'Done' },
]

// Must match the Session model's status enum in server/models/Session.js.
export const SESSION_STATUSES = ['upcoming', 'active', 'completed']

// Must match the Task model's priority enum.
export const TASK_PRIORITIES = ['low', 'medium', 'high']
