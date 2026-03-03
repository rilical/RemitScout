import { describe, expect, it } from 'vitest'

import { buildLlmsFullTxt } from '~/server/routes/llms-full.txt'

const BASE_URL = 'https://example.com'

describe('llms-full.txt', () => {
  it('includes key pages with the provided base URL', () => {
    const txt = buildLlmsFullTxt(BASE_URL)

    expect(txt).toContain(`${BASE_URL}/send-money`)
    expect(txt).toContain(`${BASE_URL}/corridors`)
    expect(txt).toContain(`${BASE_URL}/exchange-rates`)
    expect(txt).toContain(`${BASE_URL}/learn/providers`)
    expect(txt).toContain(`${BASE_URL}/methodology`)
  })

  it('includes provider reviews with scores', () => {
    const txt = buildLlmsFullTxt(BASE_URL)

    expect(txt).toContain('## Provider Reviews')
    // Every provider review should have a Remit-Score line
    expect(txt).toMatch(/Remit-Score: [\d.]+\/10/)
    // At least one provider review URL
    expect(txt).toMatch(new RegExp(`${BASE_URL}/learn/providers/\\w`))
  })

  it('includes at least one corridor URL', () => {
    const txt = buildLlmsFullTxt(BASE_URL)

    expect(txt).toContain('## Corridor Comparisons')
    // Should contain at least one send-money corridor link
    expect(txt).toMatch(new RegExp(`${BASE_URL}/send-money/[a-z]`))
  })

  it('includes FAQ section', () => {
    const txt = buildLlmsFullTxt(BASE_URL)

    expect(txt).toContain('## Frequently Asked Questions')
    expect(txt).toContain('### What is Remit-Scout?')
    expect(txt).toContain('### How does Remit-Scout make money?')
    expect(txt).toContain('### What is the Remit-Score?')
  })

  it('includes API documentation link', () => {
    const txt = buildLlmsFullTxt(BASE_URL)

    expect(txt).toContain('## API Documentation')
    expect(txt).toContain(`${BASE_URL}/api-docs/json`)
  })
})
