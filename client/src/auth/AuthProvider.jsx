import { useCallback, useEffect, useMemo, useState } from 'react'
import * as authApi from '../api/auth'
import { setUnauthorizedHandler, tokenStore } from '../api/client'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // Only "loading" when a saved token still has to be checked with the server.
  const [loading, setLoading] = useState(() => Boolean(tokenStore.get()))

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  // Any 401 from a protected call (expired token) signs the user out everywhere.
  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(() => {})
  }, [logout])

  // Restore the session after a page refresh.
  useEffect(() => {
    if (!tokenStore.get()) return undefined

    let cancelled = false
    authApi
      .fetchCurrentUser()
      .then((data) => {
        if (!cancelled) setUser(data.user)
      })
      .catch(() => {
        // A 401 is already handled by logout(); other errors leave the user signed out.
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const data = await authApi.loginUser(credentials)
    tokenStore.set(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (details) => {
    const data = await authApi.registerUser(details)
    tokenStore.set(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const updateProfile = useCallback(async (id, updates) => {
    const data = await authApi.updateUser(id, updates)
    setUser(data.user)
    return data.user
  }, [])

  const deleteAccount = useCallback(
    async (id) => {
      await authApi.deleteUser(id)
      logout()
    },
    [logout],
  )

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateProfile, deleteAccount }),
    [user, loading, login, register, logout, updateProfile, deleteAccount],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
