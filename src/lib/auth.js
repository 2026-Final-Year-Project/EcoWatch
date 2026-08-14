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

export function clearCommunitySession() {
  window.localStorage.removeItem(SESSION_KEY)
}
