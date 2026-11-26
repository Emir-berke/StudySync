import { request } from './client'
import { USE_MOCK_TASKS } from './config'
import { mockTasks } from './mock'
import { refId } from '../utils/format'

// CONTRACT - follows the Tasks API section of the project README (Michelle Green).
// Every response is { success, task } or { success, tasks }.
//   GET    /api/tasks              tasks from sessions the user belongs to
//   POST   /api/tasks              create (body: title, description, session, priority,
//                                  dueDate; `assignedTo` is NOT accepted here)
//   PUT    /api/tasks/:id          update details
//   PUT    /api/tasks/:id/status   change status  (body: { status })
//   PUT    /api/tasks/:id/assign   assign or unassign (body: { assignedTo })
//   DELETE /api/tasks/:id          delete
// Only the session owner may create, update, assign, change status or delete.
// The README does not list a ?session= filter, so the board filters by session here.
const realTasks = {
  listForSession: async (sessionId) =>
    (await request('/tasks')).tasks.filter((task) => refId(task.session) === sessionId),
  // The server rejects `assignedTo` on create, so assign in a second call.
  create: async (sessionId, { assignedTo, ...fields }) => {
    const { task } = await request('/tasks', {
      method: 'POST',
      body: { ...fields, session: sessionId },
    })
    if (!assignedTo) return task
    return (await request(`/tasks/${refId(task)}/assign`, { method: 'PUT', body: { assignedTo } })).task
  },
  update: async (id, body) =>
    (await request(`/tasks/${id}`, { method: 'PUT', body })).task,
  setStatus: async (id, status) =>
    (await request(`/tasks/${id}/status`, { method: 'PUT', body: { status } })).task,
  assign: async (id, assignedTo) =>
    (await request(`/tasks/${id}/assign`, { method: 'PUT', body: { assignedTo } })).task,
  remove: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
}

export const tasksApi = USE_MOCK_TASKS ? mockTasks : realTasks
