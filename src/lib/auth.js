import { apiUrl } from './api'

const SESSION_KEY = 'ecowatch-community-session'

export function getCommunitySession() {
  if (typeof window === 'undefined') return null
  try {
    const session = JSON.parse(window.localStorage.getItem(SESSION_KEY) || 'null')
    return session?.token && session?.user ? session : null
  } catch {
    return null
  }
}

export function saveCommunitySession(session) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export async function clearCommunitySession() {
  const session = getCommunitySession()
  if (session) {
    const response = await fetch(apiUrl('/auth/logout'), {
      method: 'POST', headers: { Authorization: `Bearer ${session.token}` },
    })
    if (!response.ok && response.status !== 401) throw new Error('Sign out failed. Please try again.')
  }
  window.localStorage.removeItem(SESSION_KEY)
}
