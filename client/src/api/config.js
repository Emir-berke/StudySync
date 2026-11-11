// Base URL for the Express API. The Vite dev server proxies /api to localhost:5000.
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

// Sessions and tasks use mock data until the real endpoints are merged.
// Auth and user calls ALWAYS use the real API.
// When the Sessions and Tasks endpoints are on main, either create
// client/.env.local containing VITE_USE_MOCK=false, or change this line to
// `=== 'true'` so the real API becomes the default.
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
