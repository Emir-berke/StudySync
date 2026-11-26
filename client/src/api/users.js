import { request } from './client'

// GET /api/users is admin-only on the server (requireRole('admin')).
// Response: { success, users }. Password hashes are never returned.
export const listUsers = async () => (await request('/users')).users
