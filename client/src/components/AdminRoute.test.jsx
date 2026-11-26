import { screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminRoute from './AdminRoute'

const auth = { user: null, loading: false }
vi.mock('../auth/useAuth', () => ({ useAuth: () => auth }))

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/users']}>
      <Routes>
        <Route element={<AdminRoute />}>
          <Route path="/users" element={<p>Admin page</p>} />
        </Route>
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/sessions" element={<p>Sessions page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  auth.user = null
  auth.loading = false
})

describe('AdminRoute', () => {
  it('sends a signed-out visitor to the sign-in page', () => {
    renderApp()
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('sends a signed-in non-admin to their sessions', () => {
    auth.user = { id: 'u1', role: 'student' }
    renderApp()
    expect(screen.getByText('Sessions page')).toBeInTheDocument()
  })

  it('lets an admin through', () => {
    auth.user = { id: 'u2', role: 'admin' }
    renderApp()
    expect(screen.getByText('Admin page')).toBeInTheDocument()
  })

  it('waits while the saved session is checked', () => {
    auth.loading = true
    renderApp()
    expect(screen.getByText('Checking your session…')).toBeInTheDocument()
  })
})
