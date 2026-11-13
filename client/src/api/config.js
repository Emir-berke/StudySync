// Base URL for the Express API. The Vite dev server proxies /api to localhost:5000.
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

// Auth and user calls ALWAYS use the real API.
// Sessions: the Session API is merged, so set VITE_USE_MOCK=false in
// client/.env.local to use it (default is demo data).
// Tasks: the Task API is not merged yet, so tasks stay on demo data until you
// also set VITE_USE_MOCK_TASKS=false.
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
export const USE_MOCK_TASKS = import.meta.env.VITE_USE_MOCK_TASKS !== 'false'
