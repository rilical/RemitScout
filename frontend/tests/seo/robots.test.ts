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

  it('includes AI crawler rules before the catch-all in production', () => {
    const txt = buildRobots('https://example.com', 'production')
    const aiCrawlers = ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended']
    for (const bot of aiCrawlers) {
      expect(txt).toContain(`User-agent: ${bot}`)
    }
    // AI crawler rules appear before the catch-all
    const gptBotIndex = txt.indexOf('User-agent: GPTBot')
    const catchAllIndex = txt.indexOf('User-agent: *')
    expect(gptBotIndex).toBeLessThan(catchAllIndex)
  })

  it('references llms.txt in production', () => {
    const txt = buildRobots('https://example.com', 'production')
    expect(txt).toContain('# See: https://example.com/llms.txt')
  })

  it('does not include AI crawler rules in non-production', () => {
    const txt = buildRobots('https://example.com', 'staging')
    expect(txt).not.toContain('GPTBot')
    expect(txt).not.toContain('ClaudeBot')
    expect(txt).not.toContain('llms.txt')
  })
})
