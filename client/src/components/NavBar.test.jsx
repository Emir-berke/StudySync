import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderAt } from '../test/renderWithRouter'
import NavBar from './NavBar'

const auth = { user: null, logout: vi.fn() }
vi.mock('../auth/useAuth', () => ({ useAuth: () => auth }))

const student = { id: 'u1', name: 'Francis Torres', role: 'student' }
const admin = { id: 'u2', name: 'Ada Admin', role: 'admin' }

beforeEach(() => {
  auth.user = null
  auth.logout.mockReset()
})

describe('NavBar when signed out', () => {
  it('shows the brand, Home, Sign In and Sign Up', () => {
    renderAt(<NavBar />)
    expect(screen.getByRole('link', { name: /StudySync/ })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign In' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Sign Up' })).toHaveAttribute('href', '/register')
  })

  it('hides every signed-in link', () => {
    renderAt(<NavBar />)
    expect(screen.queryByRole('link', { name: 'My Profile' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sign Out' })).not.toBeInTheDocument()
  })
})

describe('NavBar when signed in', () => {
  it('shows Sessions, My Profile, the user name and Sign Out to a student', () => {
    auth.user = student
    renderAt(<NavBar />)
    expect(screen.getByRole('link', { name: 'Sessions' })).toHaveAttribute('href', '/sessions')
    expect(screen.getByRole('link', { name: 'My Profile' })).toHaveAttribute('href', '/account')
    expect(screen.getByText('Francis Torres')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Sign In' })).not.toBeInTheDocument()
  })

  it('hides the Users link from a non-admin', () => {
    auth.user = student
    renderAt(<NavBar />)
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument()
  })

  it('shows the Users link to an admin', () => {
    auth.user = admin
    renderAt(<NavBar />)
    expect(screen.getByRole('link', { name: 'Users' })).toHaveAttribute('href', '/users')
  })

  it('calls logout when Sign Out is pressed', async () => {
    auth.user = student
    renderAt(<NavBar />)
    await userEvent.click(screen.getByRole('button', { name: 'Sign Out' }))
    expect(auth.logout).toHaveBeenCalledTimes(1)
  })
})

describe('NavBar current location', () => {
  it('marks only the link for the current page', () => {
    auth.user = student
    renderAt(<NavBar />, '/account')
    expect(screen.getByRole('link', { name: 'My Profile' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Sessions' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
  })

  it('marks Home on the landing page', () => {
    renderAt(<NavBar />, '/')
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
  })

  it('keeps Sessions active on a nested session page', () => {
    auth.user = student
    renderAt(<NavBar />, '/sessions/abc123')
    expect(screen.getByRole('link', { name: 'Sessions' })).toHaveAttribute('aria-current', 'page')
  })
})

describe('NavBar menu button for narrow screens', () => {
  it('toggles the menu and reports its state', async () => {
    renderAt(<NavBar />)
    const button = screen.getByRole('button', { name: 'Menu' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(button)
    expect(screen.getByRole('button', { name: 'Close' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toHaveClass('open')
  })

  it('closes the menu after choosing a link', async () => {
    renderAt(<NavBar />)
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }))
    await userEvent.click(screen.getByRole('link', { name: 'Sign In' }))
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false')
  })
})
