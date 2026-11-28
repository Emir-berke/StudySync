import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listUsers } from '../api/users'
import UsersPage from './UsersPage'
import { updateUser, deleteUser } from '../api/auth'
import { useAuth } from '../auth/useAuth'

vi.mock('../api/users', () => ({ listUsers: vi.fn() }))
vi.mock('../api/auth', () => ({ updateUser: vi.fn(), deleteUser: vi.fn() }))
vi.mock('../auth/useAuth', () => ({ useAuth: vi.fn() }))

beforeEach(() => {
  listUsers.mockReset()
  useAuth.mockReturnValue({ user: { id: 'admin', role: 'admin' }, updateProfile: vi.fn(), deleteAccount: vi.fn() })
  vi.restoreAllMocks()
})

describe('UsersPage', () => {
  it('lists each user with name, email and role', async () => {
    listUsers.mockResolvedValue([
      { id: '1', name: 'Francis Torres', email: 'francis@example.com', role: 'student' },
      { id: '2', name: 'Ada Admin', email: 'ada@example.com', role: 'admin' },
    ])
    render(<UsersPage />)
    expect(await screen.findByText('Francis Torres')).toBeInTheDocument()
    expect(screen.getByText('ada@example.com')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Role' })).toBeInTheDocument()
  })

  it('never renders a password column', async () => {
    listUsers.mockResolvedValue([{ id: '1', name: 'A', email: 'a@example.com', role: 'student', password: 'hash' }])
    render(<UsersPage />)
    await screen.findByText('a@example.com')
    expect(screen.queryByText(/password/i)).not.toBeInTheDocument()
    expect(screen.queryByText('hash')).not.toBeInTheDocument()
  })

  it('shows the server error, such as access denied', async () => {
    listUsers.mockImplementation(() => Promise.reject(new Error('Forbidden')))
    render(<UsersPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Forbidden')
  })

  it('shows an empty message when there are no users', async () => {
    listUsers.mockResolvedValue([])
    render(<UsersPage />)
    expect(await screen.findByText('No users yet.')).toBeInTheDocument()
  })

  it('saves an edited user through PATCH and refreshes the table', async () => {
    listUsers.mockResolvedValue([{ id: '1', name: 'Student', email: 'student@example.com', role: 'student' }])
    updateUser.mockResolvedValue({ user: { id: '1', name: 'Updated', email: 'student@example.com', role: 'student' } })
    render(<UsersPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Edit Student' }))
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Updated' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save user' }))
    expect(await screen.findByText('User updated.')).toBeInTheDocument()
    expect(updateUser).toHaveBeenCalledWith('1', { name: 'Updated', email: 'student@example.com', role: 'student' })
    expect(screen.getByRole('cell', { name: 'Updated' })).toBeInTheDocument()
  })

  it('keeps the form open after a duplicate email error', async () => {
    listUsers.mockResolvedValue([{ id: '1', name: 'Student', email: 'student@example.com', role: 'student' }])
    updateUser.mockRejectedValue(new Error('An account with this email already exists'))
    render(<UsersPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Edit Student' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save user' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('already exists')
    expect(screen.getByLabelText('Email')).toHaveValue('student@example.com')
  })

  it('requires confirmation before deleting and removes a successfully deleted row', async () => {
    listUsers.mockResolvedValue([{ id: '1', name: 'Student', email: 'student@example.com', role: 'student' }])
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    deleteUser.mockClear()
    deleteUser.mockResolvedValue({ success: true })
    render(<UsersPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Delete Student' }))
    expect(deleteUser).not.toHaveBeenCalled()
    confirm.mockReturnValue(true)
    fireEvent.click(screen.getByRole('button', { name: 'Delete Student' }))
    await waitFor(() => expect(deleteUser).toHaveBeenCalledWith('1'))
    expect(await screen.findByText('User deleted.')).toBeInTheDocument()
    expect(screen.queryByText('student@example.com')).not.toBeInTheDocument()
  })

  it('refreshes auth context when the admin edits their own account', async () => {
    const updateProfile = vi.fn().mockResolvedValue({ id: 'admin', name: 'Me', email: 'me@example.com', role: 'student' })
    useAuth.mockReturnValue({ user: { id: 'admin', role: 'admin' }, updateProfile })
    listUsers.mockResolvedValue([{ id: 'admin', name: 'Me', email: 'me@example.com', role: 'admin' }])
    render(<UsersPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Edit Me' }))
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'student' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save user' }))
    await waitFor(() => expect(updateProfile).toHaveBeenCalledWith('admin', expect.objectContaining({ role: 'student' })))
  })
})
