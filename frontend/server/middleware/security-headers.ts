import { defineEventHandler, getRequestURL, setResponseHeaders } from 'h3'

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const isEmbed = url.pathname.startsWith('/embed/')
  const prodLike
    = process.env.NODE_ENV === 'production'
      || process.env.NODE_ENV === 'staging'
      || ['prod', 'production', 'staging'].includes((process.env.ENVIRONMENT ?? '').toLowerCase())
  const enforceCsp
    = (process.env.CSP_ENFORCE === '1' || process.env.CSP_ENFORCE === 'true')
      || prodLike

  // NOTE: If `/embed/*` pages must be iframe-embeddable on third-party sites,
  // `X-Frame-Options: SAMEORIGIN` will block them. In that case, omit XFO for
  // embed pages and rely on CSP `frame-ancestors` allowlisting instead.
  const xFrameOptions = isEmbed ? 'SAMEORIGIN' : 'DENY'

  // CSP: Start in Report-Only mode so we can observe violations before enforcing.
  // To enforce, switch to `Content-Security-Policy` instead of `...-Report-Only`.
  //
  // NOTE: This CSP currently includes `unsafe-inline` for scripts because some
  // analytics snippets are injected inline (see `frontend/app.vue`). Nonce-based
  // CSP is a follow-up. Doing it correctly requires:
  // 1) Generating a per-response nonce (must not be cached across responses).
  // 2) Passing that nonce to inline script tags (e.g. via `useRequestEvent().context`).
  // 3) Removing `unsafe-inline` from `script-src` only after the nonce is wired.
  //
  // Nuxt modules like `nuxt-security` can help with CSP/nonces, but we already
  // have bespoke header behavior here (embed exceptions, report-only rollout).
  // If/when we adopt a module, ensure it doesn't fight this middleware.
  const frameAncestors = isEmbed ? '*' : '\'none\''
  const csp = [
    'default-src \'self\'',
    'script-src \'self\' \'unsafe-inline\' \'unsafe-eval\' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.ezojs.com https://*.ezoic.net',
    'style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com',
    'img-src \'self\' data: https: blob:',
    'font-src \'self\' https://fonts.gstatic.com',
    'connect-src \'self\' https://*.supabase.co https://www.google-analytics.com https://*.ezoic.net https://*.ingest.sentry.io wss://*.supabase.co',
    'frame-src \'self\' https://js.stripe.com https://*.ezoic.net',
    `frame-ancestors ${frameAncestors}`,
  ].join('; ')

  const cspHeaderName = enforceCsp ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only'

  setResponseHeaders(event, {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': xFrameOptions,
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(self)',
    'X-DNS-Prefetch-Control': 'on',
    'X-Download-Options': 'noopen',
    'X-Permitted-Cross-Domain-Policies': 'none',
    [cspHeaderName]: csp,
  })
})
