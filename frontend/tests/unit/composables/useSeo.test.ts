import { describe, expect, it } from 'vitest'
import { sanitizeCanonical } from '~/composables/useSeo'

describe('sanitizeCanonical', () => {
  it('strips utm_* and known tracking params, and removes hash', () => {
    const siteUrl = 'https://remit-scout.com'
    const input = 'https://remit-scout.com/send-money?utm_source=x&gclid=y&foo=bar#section'
    expect(sanitizeCanonical(input, siteUrl)).toBe('https://remit-scout.com/send-money?foo=bar')
  })

  it('resolves relative URLs against siteUrl', () => {
    const siteUrl = 'https://remit-scout.com'
    const input = '/pulse?fbclid=abc'
    expect(sanitizeCanonical(input, siteUrl)).toBe('https://remit-scout.com/pulse')
  })
})
