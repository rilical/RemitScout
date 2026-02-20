import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter } from 'k6/metrics'

const publishFailures = new Counter('plane_c_publish_failures')

const baseUrl = (__ENV.PLANE_C_BASE_URL || '').replace(/\/+$/, '')
const token = __ENV.PLANE_C_INTERNAL_TOKEN || ''
const corridorId = __ENV.CORRIDOR_ID || 'US-IN-USD-INR'

if (!baseUrl) {
  throw new Error('PLANE_C_BASE_URL is required')
}

export const options = {
  scenarios: {
    publisher_ramp: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '2m', target: 200 },
        { duration: '3m', target: 500 },
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.03'],
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    plane_c_publish_failures: ['count<30'],
  },
}

export default function () {
  const headers = {
    'content-type': 'application/json',
    'x-request-id': `k6-plane-c-${__VU}-${__ITER}`,
  }

  if (token) {
    headers['x-plane-c-internal-token'] = token
  }

  const payload = JSON.stringify({
    corridor_id: corridorId,
    contributor_count: 4,
    top_provider_share: 0.45,
    top_two_share: 0.65,
  })

  const res = http.post(`${baseUrl}/internal/publisher/validate`, payload, {
    headers,
    tags: {
      test: 'plane-c-publisher',
      endpoint: '/internal/publisher/validate',
    },
  })

  const ok = check(res, {
    'status is 200': (r) => r.status === 200,
  })

  if (!ok) {
    publishFailures.add(1)
  }

  sleep(Math.random() * 0.25)
}

