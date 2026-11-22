// Helpers shared by the editor login functions.

export const STATE_COOKIE = 'seasi_oauth_state'

/**
 * Origin to send GitHub's redirect back to. Only trusted origins are allowed:
 * the primary domain (NUXT_PUBLIC_SITE_URL), Netlify's own URL, and local dev.
 * Anything else falls back to the primary domain.
 */
export function trustedOrigin(req: Request) {
  const primary = (process.env.NUXT_PUBLIC_SITE_URL || process.env.URL || '').replace(/\/$/, '')
  const allowed = new Set(
    [primary, process.env.URL, 'http://localhost:8888']
      .filter(Boolean)
      .map(o => o!.replace(/\/$/, '')),
  )
  const origin = new URL(req.url).origin
  return allowed.has(origin) ? origin : primary
}

export function callbackUrl(origin: string) {
  return `${origin}/.netlify/functions/callback`
}

/** Only allow same-site paths like "/speaker-series", never "//evil.com" or full URLs. */
export function safeReturnPath(value: string | null | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/'
  return value
}

export function readCookie(req: Request, name: string) {
  const header = req.headers.get('cookie') ?? ''
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return v.join('=')
  }
  return null
}

export function stateCookie(value: string, origin: string, maxAge: number) {
  const secure = origin.startsWith('https:') ? '; Secure' : ''
  return `${STATE_COOKIE}=${value}; Path=/.netlify/functions; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
}
