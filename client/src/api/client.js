import { API_BASE_URL } from './config'

const TOKEN_KEY = 'studysync_token'

// The JWT lives in localStorage so a page refresh keeps the user signed in.
export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      // Storage unavailable: the user stays signed in for this page view only.
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      // Nothing to clear.
    }
  },
}

// Error thrown for every failed request. `fieldErrors` mirrors the backend's
// validate middleware: [{ field, message }].
export class ApiError extends Error {
  constructor(message, status, fieldErrors = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

// AuthProvider registers a callback so an expired token signs the user out.
let onUnauthorized = () => {}
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

/**
 * Single entry point for every API call.
 * - Sends JSON and the `Authorization: Bearer <token>` header.
 * - Returns the parsed JSON body on success.
 * - Throws ApiError on failure (network, 4xx, 5xx).
 */
export async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {}
  const token = tokenStore.get()

  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Cannot reach the server. Check that the backend is running.', 0)
  }

  const data = await response.json().catch(() => null)

  // The Vite dev proxy answers 502/503/504 (plain text) when Express is not running.
  if (!response.ok && !data && [502, 503, 504].includes(response.status)) {
    throw new ApiError('Cannot reach the server. Check that the backend is running.', response.status)
  }

  if (!response.ok) {
    // A 401 on a protected call means the token is missing, invalid or expired.
    if (response.status === 401 && auth && token) onUnauthorized()

    throw new ApiError(
      data?.message ?? `Request failed (${response.status})`,
      response.status,
      data?.errors ?? [],
    )
  }

  return data
}
