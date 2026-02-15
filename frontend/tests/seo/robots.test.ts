import { describe, expect, it } from 'vitest'

import { buildRobots } from '~/server/routes/robots.txt'

describe('robots.txt', () => {
  it('blocks indexing in non-production envs', () => {
    const txt = buildRobots('https://example.com', 'staging')
    expect(txt).toContain('User-agent: *')
    expect(txt).toContain('Disallow: /')
    expect(txt).not.toContain('Allow: /')
  })

  it('allows indexing in production but disallows sensitive routes', () => {
    const txt = buildRobots('https://example.com', 'production')
    expect(txt).toContain('Allow: /')
    expect(txt).toContain('Disallow: /admin/')
    expect(txt).toContain('Disallow: /preview/')
    expect(txt).toContain('Disallow: /embed/')
    expect(txt).toContain('Disallow: /go/')
    expect(txt).toContain('Disallow: /api/')
    expect(txt).toContain('Disallow: /sign-in')
    expect(txt).toContain('Sitemap: https://example.com/sitemap.xml')
  })
})
