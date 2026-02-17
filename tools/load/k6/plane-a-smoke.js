import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:4000/api/v1'
const AUTH_TOKEN = __ENV.AUTH_TOKEN || ''

export const options = {
  vus: Number(__ENV.VUS || 5),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
}

const withBase = (path) => `${BASE_URL.replace(/\\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`

export default function () {
  const health = http.get(withBase('/healthz'))
  check(health, { 'healthz: 200': (r) => r.status === 200 })

  const providers = http.get(withBase('/providers?from=US&to=MX&amount=500&method=bank'))
  check(providers, { 'providers: 200': (r) => r.status === 200 })

  if (AUTH_TOKEN) {
    const me = http.get(withBase('/me'), { headers: { authorization: `Bearer ${AUTH_TOKEN}` } })
    check(me, { 'me: 200|401': (r) => r.status === 200 || r.status === 401 })
  }

  sleep(1)
}

