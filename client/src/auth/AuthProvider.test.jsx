import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './useAuth'
import { tokenStore } from '../api/client'

const student = { id: 'student', name: 'Student', email: 'student@example.com', role: 'student' }
function SessionProbe() {
  const { user, loading, login, logout, updateProfile, deleteAccount } = useAuth()
  return <>
    <p>{loading ? 'Checking session' : user?.name ?? 'Signed out'}</p>
    <button onClick={() => login({ email: student.email, password: 'Password123' })}>Login</button>
    <button onClick={logout}>Logout</button>
    <button onClick={() => updateProfile(student.id, { name: 'Updated' })}>Update</button>
    <button onClick={() => deleteAccount(student.id)}>Delete</button>
  </>
}
const response = (data, status = 200) => ({ ok: status < 400, status, json: async () => data })
beforeEach(() => { tokenStore.clear(); vi.stubGlobal('fetch', vi.fn()) })
afterEach(() => vi.unstubAllGlobals())

it('restores a saved user through the real request module', async () => {
  tokenStore.set('saved-token')
  fetch.mockResolvedValue(response({ user: student }))
  render(<AuthProvider><SessionProbe /></AuthProvider>)
  expect(await screen.findByText('Student')).toBeInTheDocument()
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/users/me'), expect.objectContaining({ headers: { Authorization: 'Bearer saved-token' } }))
})

it('clears an expired token during restore', async () => {
  tokenStore.set('expired-token')
  fetch.mockResolvedValue(response({ message: 'Invalid or expired token' }, 401))
  render(<AuthProvider><SessionProbe /></AuthProvider>)
  expect(await screen.findByText('Signed out')).toBeInTheDocument()
  expect(tokenStore.get()).toBeNull()
})

it('logs in, updates the current user and clears auth after account deletion', async () => {
  fetch.mockResolvedValueOnce(response({ user: student, token: 'new-token' }))
  render(<AuthProvider><SessionProbe /></AuthProvider>)
  fireEvent.click(screen.getByText('Login'))
  await screen.findByText('Student')
  expect(tokenStore.get()).toBe('new-token')
  fetch.mockResolvedValueOnce(response({ user: { ...student, name: 'Updated' } }))
  fireEvent.click(screen.getByText('Update'))
  await screen.findByText('Updated')
  fetch.mockResolvedValueOnce(response({ success: true }))
  fireEvent.click(screen.getByText('Delete'))
  await screen.findByText('Signed out')
  expect(tokenStore.get()).toBeNull()
})

it('signs out and removes the saved token', async () => {
  fetch.mockResolvedValue(response({ user: student, token: 'new-token' }))
  render(<AuthProvider><SessionProbe /></AuthProvider>)
  fireEvent.click(screen.getByText('Login'))
  await screen.findByText('Student')
  fireEvent.click(screen.getByText('Logout'))
  await waitFor(() => expect(tokenStore.get()).toBeNull())
  expect(screen.getByText('Signed out')).toBeInTheDocument()
})
