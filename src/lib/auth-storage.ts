export type AuthType = 'ADMIN' | 'CUSTOMER'

const TOKEN_KEY = 'ticket_access_token'
const AUTH_TYPE_KEY = 'ticket_auth_type'

export function getAccessToken() {
  if (typeof window === 'undefined') {
    return null
  }

  return localStorage.getItem(TOKEN_KEY)
}

export function getAuthType(): AuthType | null {
  if (typeof window === 'undefined') {
    return null
  }

  const value = localStorage.getItem(AUTH_TYPE_KEY)
  if (value === 'ADMIN' || value === 'CUSTOMER') {
    return value
  }

  return null
}

export function saveAuthSession(accessToken: string, authType: AuthType) {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.setItem(TOKEN_KEY, accessToken)
  localStorage.setItem(AUTH_TYPE_KEY, authType)
}

export function clearAuthSession() {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(AUTH_TYPE_KEY)
}
