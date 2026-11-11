import { request } from './client'
import { USE_MOCK } from './config'
import { mockTasks } from './mock'

// PROPOSED CONTRACT - confirm with the Tasks lead before switching off mock mode.
// Every response is { success, task } or { success, tasks }.
//   GET    /api/sessions/:sessionId/tasks   list a session's tasks
//   POST   /api/sessions/:sessionId/tasks   create
//   PUT    /api/tasks/:id                   update (status, title, priority, ...)
//   DELETE /api/tasks/:id                   delete
const realTasks = {
  listForSession: async (sessionId) =>
    (await request(`/sessions/${sessionId}/tasks`)).tasks,
  create: async (sessionId, body) =>
    (await request(`/sessions/${sessionId}/tasks`, { method: 'POST', body })).task,
  update: async (id, body) =>
    (await request(`/tasks/${id}`, { method: 'PUT', body })).task,
  remove: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
}

export const tasksApi = USE_MOCK ? mockTasks : realTasks
