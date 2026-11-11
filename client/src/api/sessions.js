import { request } from './client'
import { USE_MOCK } from './config'
import { mockSessions } from './mock'

// PROPOSED CONTRACT - confirm with the Sessions lead before switching off mock mode.
// Every response is { success, session } or { success, sessions }, like the auth API.
//   GET    /api/sessions            list
//   POST   /api/sessions            create
//   GET    /api/sessions/:id        read
//   PUT    /api/sessions/:id        update (owner only)
//   DELETE /api/sessions/:id        delete (owner only)
//   POST   /api/sessions/:id/join   join
//   DELETE /api/sessions/:id/leave  leave
// If a path or method differs, change it here and nowhere else.
const realSessions = {
  list: async () => (await request('/sessions')).sessions,
  get: async (id) => (await request(`/sessions/${id}`)).session,
  create: async (body) => (await request('/sessions', { method: 'POST', body })).session,
  update: async (id, body) =>
    (await request(`/sessions/${id}`, { method: 'PUT', body })).session,
  remove: (id) => request(`/sessions/${id}`, { method: 'DELETE' }),
  join: async (id) => (await request(`/sessions/${id}/join`, { method: 'POST' })).session,
  leave: async (id) =>
    (await request(`/sessions/${id}/leave`, { method: 'DELETE' })).session,
}

export const sessionsApi = USE_MOCK ? mockSessions : realSessions
