// Base URL for the Express API. The Vite dev server proxies /api to localhost:5000.
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

// Auth, user, session and task calls all use the real API by default.
// For a demo without a backend, create client/.env.local containing:
//   VITE_USE_MOCK=true          (sessions use localStorage demo data)
//   VITE_USE_MOCK_TASKS=true    (tasks use localStorage demo data)
// Auth and user calls ALWAYS use the real API.
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
export const USE_MOCK_TASKS = import.meta.env.VITE_USE_MOCK_TASKS === 'true'

// Landing page session list. The public endpoint is proposed but not merged,
// so sample sessions are shown until VITE_USE_MOCK_PUBLIC=false is set.
export const USE_MOCK_PUBLIC = import.meta.env.VITE_USE_MOCK_PUBLIC !== 'false'
