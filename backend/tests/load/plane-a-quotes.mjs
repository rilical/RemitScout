import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter } from 'k6/metrics'

const quoteFailures = new Counter('plane_a_quote_failures')

const baseUrl = (__ENV.PLANE_A_BASE_URL || '').replace(/\/+$/, '')
const corridorId = __ENV.CORRIDOR_ID || 'US-IN-USD-INR'
const payin = __ENV.PAYIN_METHOD || 'bank'
const payout = __ENV.PAYOUT_METHOD || 'bank'
const amount = __ENV.AMOUNT || '500'

if (!baseUrl) {
  throw new Error('PLANE_A_BASE_URL is required')
}

export const options = {
  scenarios: {
    quotes_ramp: {
      executor: 'ramping-vus',
      startVUs: 20,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '3m', target: 300 },
        { duration: '4m', target: 600 },
        { duration: '5m', target: 1000 },
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    plane_a_quote_failures: ['count<50'],
  },
}

export default function () {
  const url =
    `${baseUrl}/api/v1/quotes/current` +
    `?corridor_id=${encodeURIComponent(corridorId)}` +
    `&amount=${encodeURIComponent(amount)}` +
    `&payin=${encodeURIComponent(payin)}` +
    `&payout=${encodeURIComponent(payout)}` +
    `&live=false`

  const res = http.get(url, {
    headers: {
      'x-request-id': `k6-plane-a-${__VU}-${__ITER}`,
      'accept': 'application/json',
    },
    tags: {
      test: 'plane-a-quotes',
      endpoint: '/api/v1/quotes/current',
    },
  })

  const ok = check(res, {
    'status is 200/304': (r) => r.status === 200 || r.status === 304,
  })

  if (!ok) {
    quoteFailures.add(1)
  }

  sleep(Math.random() * 0.35)
}

