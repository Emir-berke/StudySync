import { request } from './client'
import { USE_MOCK_PUBLIC } from './config'

// PROPOSED CONTRACT - to be agreed with the Sessions lead (SCRUM-12).
// A public, read-only list for the landing page. It must not expose private
// information: no emails, no participant lists, no task contents.
//   GET /api/public/sessions   (no token required)
//   -> { success: true, sessions: [{ id, title, description, scheduledAt,
//                                     status, participantCount }] }
const realPublic = {
  list: async () => (await request('/public/sessions', { auth: false })).sessions,
}

// Fixed sample content, used until the public endpoint exists. The landing page
// labels it as sample data so nobody mistakes it for real sessions.
const day = 24 * 60 * 60 * 1000
const samplePublic = {
  list: async () => {
    const now = Date.now()
    return [
      { id: 'sample-1', title: 'COMP 229 Midterm Review', description: 'Go over Express routing, Mongoose models and JWT auth.', scheduledAt: new Date(now + 2 * day).toISOString(), status: 'upcoming', participantCount: 6 },
      { id: 'sample-2', title: 'REST API Testing Workshop', description: 'Jest and Supertest practice for CRUD endpoints.', scheduledAt: new Date(now + 5 * day).toISOString(), status: 'upcoming', participantCount: 4 },
      { id: 'sample-3', title: 'React Hooks Study Group', description: 'State, effects and custom hooks with short exercises.', scheduledAt: new Date(now + 7 * day).toISOString(), status: 'upcoming', participantCount: 3 },
    ]
  },
}

export const publicSessionsApi = USE_MOCK_PUBLIC ? samplePublic : realPublic
