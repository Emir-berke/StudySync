import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { renderAt } from '../test/renderWithRouter'
import { useAuth } from '../auth/useAuth'
import RegisterPage from './RegisterPage'
import LoginPage from './LoginPage'
import AccountPage from './AccountPage'

vi.mock('../auth/useAuth', () => ({ useAuth: vi.fn() }))
let auth
beforeEach(() => {
  vi.restoreAllMocks()
  auth = { user: null, register: vi.fn(), login: vi.fn(), updateProfile: vi.fn(), deleteAccount: vi.fn() }
  useAuth.mockImplementation(() => auth)
})
const fill = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } })

it('validates registration before calling the API', async () => {
  renderAt(<RegisterPage />)
  fill('Password', 'Password123')
  fill('Confirm password', 'Different123')
  fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match')
  expect(auth.register).not.toHaveBeenCalled()
})

it('submits registration without the UI-only confirmation and shows duplicate errors', async () => {
  auth.register.mockRejectedValue(new Error('An account with this email already exists'))
  renderAt(<RegisterPage />)
  fill('Name', ' Student ')
  fill('Email', ' student@example.com ')
  fill('Password', 'Password123')
  fill('Confirm password', 'Password123')
  fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('already exists')
  expect(auth.register).toHaveBeenCalledWith({ name: 'Student', email: 'student@example.com', password: 'Password123' })
  expect(screen.getByRole('button', { name: 'Sign Up' })).toBeEnabled()
})

it('shows incorrect login credentials and allows retry', async () => {
  auth.login.mockRejectedValue(new Error('Invalid email or password'))
  renderAt(<LoginPage />)
  fill('Email', 'student@example.com')
  fill('Password', 'WrongPassword123')
  fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password')
  expect(screen.getByRole('button', { name: 'Sign In' })).toBeEnabled()
})

it('saves a validated profile and reports success', async () => {
  auth.user = { id: '1', name: 'Student', email: 'student@example.com', role: 'student' }
  auth.updateProfile.mockResolvedValue({ ...auth.user, name: 'Updated' })
  renderAt(<AccountPage />)
  fill('Name', ' Updated ')
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
  expect(await screen.findByRole('status')).toHaveTextContent('Profile updated.')
  expect(auth.updateProfile).toHaveBeenCalledWith('1', { name: 'Updated', email: 'student@example.com' })
})

it('prevents repeated deletion while pending and lets the user cancel first', async () => {
  auth.user = { id: '1', name: 'Student', email: 'student@example.com', role: 'student' }
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  auth.deleteAccount.mockImplementation(() => new Promise(() => {}))
  renderAt(<AccountPage />)
  fireEvent.click(screen.getByRole('button', { name: 'Delete my account' }))
  expect(auth.deleteAccount).not.toHaveBeenCalled()
  confirm.mockReturnValue(true)
  fireEvent.click(screen.getByRole('button', { name: 'Delete my account' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled())
  expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
  expect(auth.deleteAccount).toHaveBeenCalledOnce()
})
