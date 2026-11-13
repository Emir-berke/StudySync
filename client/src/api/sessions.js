import { request } from './client'
import { USE_MOCK } from './config'
import { mockSessions } from './mock'

// CONTRACT - matches the merged Session API (server/routes/sessionRoutes.js).
// Every response is { success, session } or { success, sessions }.
// A session also carries `tasks` (populated), `createdBy` and `participants`.
//   GET    /api/sessions            list
//   POST   /api/sessions            create
//   GET    /api/sessions/:id        read
//   PATCH  /api/sessions/:id        update (owner only)
//   DELETE /api/sessions/:id        delete (owner only)
//   POST   /api/sessions/:id/join   join
//   POST   /api/sessions/:id/leave  leave
const realSessions = {
  list: async () => (await request('/sessions')).sessions,
  get: async (id) => (await request(`/sessions/${id}`)).session,
  create: async (body) => (await request('/sessions', { method: 'POST', body })).session,
  update: async (id, body) =>
    (await request(`/sessions/${id}`, { method: 'PATCH', body })).session,
  remove: (id) => request(`/sessions/${id}`, { method: 'DELETE' }),
  join: async (id) => (await request(`/sessions/${id}/join`, { method: 'POST' })).session,
  leave: async (id) =>
    (await request(`/sessions/${id}/leave`, { method: 'POST' })).session,
}

export const sessionsApi = USE_MOCK ? mockSessions : realSessions
