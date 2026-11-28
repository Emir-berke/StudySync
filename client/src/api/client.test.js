import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { request, setUnauthorizedHandler, tokenStore } from './client'

beforeEach(() => { localStorage.clear(); tokenStore.clear(); vi.stubGlobal('fetch', vi.fn()) })
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); setUnauthorizedHandler(() => {}) })

describe('authenticated requests', () => {
  it('ignores a stale token if storage writes and removal are blocked', () => {
    localStorage.setItem('studysync_token', 'stale')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('blocked') })
    tokenStore.set('current')
    expect(tokenStore.get()).toBe('current')
    tokenStore.clear()
    expect(tokenStore.get()).toBeNull()
  })
  it('keeps sending the token when browser storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    tokenStore.set('page-only-token')
    fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) })
    await request('/users/me')
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/users/me'), expect.objectContaining({ headers: { Authorization: 'Bearer page-only-token' } }))
    tokenStore.clear()
    expect(tokenStore.get()).toBeNull()
  })

  it('logs out on a protected 401, but not on an incorrect login', async () => {
    const logout = vi.fn()
    setUnauthorizedHandler(logout)
    tokenStore.set('expired')
    fetch.mockResolvedValue({ ok: false, status: 401, json: async () => ({ message: 'Invalid credentials' }) })
    await expect(request('/auth/login', { auth: false })).rejects.toMatchObject({ status: 401 })
    expect(logout).not.toHaveBeenCalled()
    await expect(request('/users/me')).rejects.toMatchObject({ status: 401 })
    expect(logout).toHaveBeenCalledOnce()
  })

  it('reports network errors without inventing validation results', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(request('/users/me')).rejects.toMatchObject({ status: 0, message: expect.stringContaining('Cannot reach') })
  })
})
