import { defineEventHandler, setResponseHeader, setResponseHeaders } from 'h3'

export default defineEventHandler((event) => {
  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  setResponseHeaders(event, {
    'cache-control': 'public, max-age=86400, s-maxage=86400',
  })

  return `Contact: mailto:security@remit-scout.com
Preferred-Languages: en
Canonical: https://remit-scout.com/.well-known/security.txt
Expires: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}
`
})
