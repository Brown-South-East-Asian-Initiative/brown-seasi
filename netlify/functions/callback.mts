// Step 2 of the editor login: GitHub sends the user back here with a one-time code.
// We swap it (plus the client secret, which never leaves the server) for a user access token,
// then hand the token to /edit in the URL fragment (fragments are never sent to servers or logs).
import { STATE_COOKIE, callbackUrl, readCookie, safeReturnPath, stateCookie, trustedOrigin } from '../lib/oauth.mts'

export default async (req: Request) => {
  const origin = trustedOrigin(req)
  const fail = (message: string) => new Response(null, {
    status: 302,
    headers: {
      Location: `${origin}/edit#${new URLSearchParams({ error: message })}`,
      'Set-Cookie': stateCookie('', origin, 0),
      'Cache-Control': 'no-store',
    },
  })

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret) return fail('The editor login is not configured (missing GitHub App credentials).')

  const params = new URL(req.url).searchParams
  const code = params.get('code')
  // state = "<nonce>.<encoded return path>"; the nonce is a UUID, so split on the first dot only.
  const state = params.get('state') ?? ''
  const dot = state.indexOf('.')
  const nonce = dot === -1 ? state : state.slice(0, dot)
  const encodedReturn = dot === -1 ? '' : state.slice(dot + 1)
  const cookieNonce = readCookie(req, STATE_COOKIE)

  if (!code) return fail('GitHub did not return a login code. Please try again.')
  if (!nonce || !cookieNonce || nonce !== cookieNonce) {
    return fail('This login link expired or did not start on this site. Please try again.')
  }

  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: callbackUrl(origin),
    }),
  })
  const data = await res.json().catch(() => ({})) as { access_token?: string; expires_in?: number; error_description?: string }

  if (!res.ok || !data.access_token) {
    return fail(data.error_description ?? 'GitHub login failed. Please try again.')
  }

  // The refresh token is intentionally dropped: editors log in again when the 8-hour token expires.
  const fragment = new URLSearchParams({
    access_token: data.access_token,
    expires_in: String(data.expires_in ?? 28800),
    return: safeReturnPath(decodeURIComponent(encodedReturn)),
  })

  return new Response(null, {
    status: 302,
    headers: {
      Location: `${origin}/edit#${fragment}`,
      'Set-Cookie': stateCookie('', origin, 0),
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
    },
  })
}
