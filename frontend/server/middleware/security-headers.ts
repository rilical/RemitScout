import { randomBytes } from 'node:crypto'
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
  const nonce = randomBytes(16).toString('base64')
  ;(event.context as any).cspNonce = nonce
  const frameAncestors = isEmbed ? '*' : '\'none\''
  const csp = [
    'default-src \'self\'',
    `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.clarity.ms https://snap.licdn.com https://www.redditstatic.com https://static.ads-twitter.com https://analytics.tiktok.com https://www.ezojs.com https://*.ezoic.net https://cmp.gatekeeperconsent.com https://the.gatekeeperconsent.com`,
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
    'img-src \'self\' data: https: blob:',
    'font-src \'self\' https://fonts.gstatic.com',
    'connect-src \'self\' https://*.supabase.co https://www.google-analytics.com https://www.clarity.ms https://www.facebook.com https://www.reddit.com https://px.ads.linkedin.com https://static.ads-twitter.com https://analytics.tiktok.com https://*.ezoic.net https://*.ingest.sentry.io wss://*.supabase.co https://cmp.gatekeeperconsent.com https://the.gatekeeperconsent.com',
    'frame-src \'self\' https://js.stripe.com https://*.ezoic.net',
    'object-src \'none\'',
    'base-uri \'self\'',
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
