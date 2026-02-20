import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter } from 'k6/metrics'

const cacheReadFailures = new Counter('b2c_cache_read_failures')

const baseUrl = (__ENV.PLANE_A_BASE_URL || '').replace(/\/+$/, '')
const corridorId = __ENV.CORRIDOR_ID || 'US-IN-USD-INR'
const payin = __ENV.PAYIN_METHOD || 'bank'
const payout = __ENV.PAYOUT_METHOD || 'bank'
const bucket = __ENV.AMOUNT_BUCKET || '500'

if (!baseUrl) {
  throw new Error('PLANE_A_BASE_URL is required')
}

export const options = {
  scenarios: {
    cache_reads: {
      executor: 'ramping-vus',
      startVUs: 50,
      stages: [
        { duration: '2m', target: 300 },
        { duration: '3m', target: 700 },
        { duration: '3m', target: 900 },
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500', 'p(99)<1200'],
    b2c_cache_read_failures: ['count<25'],
  },
}

export default function () {
  const url =
    `${baseUrl}/api/v1/quotes/current` +
    `?corridor_id=${encodeURIComponent(corridorId)}` +
    `&amount_bucket=${encodeURIComponent(bucket)}` +
    `&payin=${encodeURIComponent(payin)}` +
    `&payout=${encodeURIComponent(payout)}` +
    `&live=false`

  const res = http.get(url, {
    headers: {
      'x-request-id': `k6-cache-${__VU}-${__ITER}`,
      'accept': 'application/json',
    },
    tags: {
      test: 'b2c-cache-reads',
      endpoint: '/api/v1/quotes/current',
    },
  })

  const ok = check(res, {
    'status is 200/304': (r) => r.status === 200 || r.status === 304,
  })

  if (!ok) {
    cacheReadFailures.add(1)
  }

  sleep(Math.random() * 0.2)
}

