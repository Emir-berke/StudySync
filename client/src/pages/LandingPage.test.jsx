import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { publicSessionsApi } from '../api/publicSessions'
import { renderAt } from '../test/renderWithRouter'
import LandingPage from './LandingPage'

const auth = { user: null }
vi.mock('../auth/useAuth', () => ({ useAuth: () => auth }))
vi.mock('../api/publicSessions', () => ({ publicSessionsApi: { list: vi.fn() } }))

const sessions = [
  { id: 's1', title: 'Midterm Review', description: 'Routing and models.', scheduledAt: '2026-12-01T18:00:00.000Z', status: 'upcoming', participantCount: 1 },
  { id: 's2', title: 'API Testing Workshop', description: '', scheduledAt: '2026-12-03T18:00:00.000Z', status: 'upcoming', participantCount: 4 },
]

beforeEach(() => {
  auth.user = null
  publicSessionsApi.list.mockReset()
  publicSessionsApi.list.mockResolvedValue(sessions)
})

describe('LandingPage', () => {
  it('shows the StudySync name, the team logo and the sign-up and sign-in links', async () => {
    renderAt(<LandingPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'StudySync' })).toBeInTheDocument()
    expect(screen.getByAltText('CRUD Operators team logo')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign Up' })).toHaveAttribute('href', '/register')
    expect(screen.getByRole('link', { name: 'Sign In' })).toHaveAttribute('href', '/login')
    await screen.findByText('Midterm Review')
  })

  it('lists the public study sessions with their participant counts', async () => {
    renderAt(<LandingPage />)
    expect(await screen.findByText('Midterm Review')).toBeInTheDocument()
    expect(screen.getByText('API Testing Workshop')).toBeInTheDocument()
    expect(screen.getByText('1 person joined')).toBeInTheDocument()
    expect(screen.getByText('4 people joined')).toBeInTheDocument()
  })

  it('shows a loading message before the sessions arrive', async () => {
    renderAt(<LandingPage />)
    expect(screen.getByText('Loading sessions…')).toBeInTheDocument()
    await screen.findByText('Midterm Review')
  })

  it('shows a friendly message when there are no sessions', async () => {
    publicSessionsApi.list.mockResolvedValue([])
    renderAt(<LandingPage />)
    expect(await screen.findByText(/No upcoming sessions yet/)).toBeInTheDocument()
  })

  it('shows an error message when the sessions cannot be loaded', async () => {
    publicSessionsApi.list.mockImplementation(() => Promise.reject(new Error('Cannot reach the server')))
    renderAt(<LandingPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the server')
  })

  it('offers a link to the signed-in sessions instead of sign-up links when signed in', async () => {
    auth.user = { id: 'u1', name: 'Francis Torres', role: 'student' }
    renderAt(<LandingPage />)
    expect(screen.getByRole('link', { name: 'Go to my sessions' })).toHaveAttribute('href', '/sessions')
    expect(screen.queryByRole('link', { name: 'Sign Up' })).not.toBeInTheDocument()
    await screen.findByText('Midterm Review')
  })

  it('does not show private details such as emails', async () => {
    renderAt(<LandingPage />)
    await screen.findByText('Midterm Review')
    expect(document.body.textContent).not.toMatch(/@/)
  })
})
