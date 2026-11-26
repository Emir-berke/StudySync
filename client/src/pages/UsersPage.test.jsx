import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listUsers } from '../api/users'
import UsersPage from './UsersPage'

vi.mock('../api/users', () => ({ listUsers: vi.fn() }))

beforeEach(() => {
  listUsers.mockReset()
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
})
