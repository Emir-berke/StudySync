import { request } from './client'

// Matches server/routes/authRoutes.js and server/routes/userRoutes.js.
// Auth responses look like { success, token, user }.

export const registerUser = ({ name, email, password }) =>
  request('/auth/register', { method: 'POST', body: { name, email, password }, auth: false })

export const loginUser = ({ email, password }) =>
  request('/auth/login', { method: 'POST', body: { email, password }, auth: false })

export const fetchCurrentUser = () => request('/users/me')

// The backend uses PATCH for users and only accepts name, email (and role for admins).
export const updateUser = (id, updates) =>
  request(`/users/${id}`, { method: 'PATCH', body: updates })

export const deleteUser = (id) => request(`/users/${id}`, { method: 'DELETE' })
