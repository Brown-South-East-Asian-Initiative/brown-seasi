// Step 1 of the editor login: send the user to GitHub to approve the "SEASI Website Editor" app.
// GitHub then redirects back to /.netlify/functions/callback (must be listed in the App's Callback URLs).
import { callbackUrl, safeReturnPath, stateCookie, trustedOrigin } from '../lib/oauth.mts'

export default async (req: Request) => {
  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) return new Response('GITHUB_CLIENT_ID is not set', { status: 500 })

  const origin = trustedOrigin(req)
  const returnTo = safeReturnPath(new URL(req.url).searchParams.get('return'))

  // Random value tied to this browser, checked in the callback to block forged logins.
  const nonce = crypto.randomUUID()

  const authorize = new URL('https://github.com/login/oauth/authorize')
  authorize.searchParams.set('client_id', clientId)
  authorize.searchParams.set('redirect_uri', callbackUrl(origin))
  authorize.searchParams.set('state', `${nonce}.${encodeURIComponent(returnTo)}`)

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.toString(),
      'Set-Cookie': stateCookie(nonce, origin, 600),
      'Cache-Control': 'no-store',
    },
  })
}
