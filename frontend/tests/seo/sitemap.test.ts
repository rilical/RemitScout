import { describe, expect, it } from 'vitest'

import { PROVIDER_SCORES } from '~/lib/providerScores'
import { buildSitemapXml } from '~/server/routes/sitemap.xml'

describe('sitemap.xml', () => {
  it('includes key public routes', () => {
    const xml = buildSitemapXml('https://example.com')

    expect(xml).toContain('<loc>https://example.com/</loc>')
    expect(xml).toContain('<loc>https://example.com/send-money</loc>')
    expect(xml).toContain('<loc>https://example.com/exchange-rates</loc>')
    expect(xml).toContain('<loc>https://example.com/corridors</loc>')
    expect(xml).toContain('<loc>https://example.com/learn</loc>')
    expect(xml).toContain('<loc>https://example.com/learn/all</loc>')
    expect(xml).toContain('<loc>https://example.com/learn/providers</loc>')
    expect(xml).toContain('<loc>https://example.com/about</loc>')
    expect(xml).toContain('<loc>https://example.com/plus</loc>')
    expect(xml).toContain('<loc>https://example.com/faq</loc>')
    expect(xml).toContain('<loc>https://example.com/methodology</loc>')
    expect(xml).toContain('<loc>https://example.com/indices-methodology</loc>')
    expect(xml).toContain('<loc>https://example.com/research</loc>')
    expect(xml).toContain('<loc>https://example.com/contact</loc>')
    expect(xml).toContain('<loc>https://example.com/media-kit</loc>')
    expect(xml).toContain('<loc>https://example.com/partnerships</loc>')

    expect(xml).toContain('<loc>https://example.com/legal</loc>')
    expect(xml).toContain('<loc>https://example.com/legal/privacy</loc>')
    expect(xml).toContain('<loc>https://example.com/legal/terms</loc>')
    expect(xml).toContain('<loc>https://example.com/legal/disclosure</loc>')
    expect(xml).toContain('<loc>https://example.com/legal/how-we-make-money</loc>')

    expect(xml).toContain('<loc>https://example.com/corrections</loc>')
    expect(xml).toContain('<loc>https://example.com/cookies</loc>')
  })

  it('includes at least one provider review route from PROVIDER_SCORES', () => {
    const xml = buildSitemapXml('https://example.com')
    const anyProviderSlug = Object.values(PROVIDER_SCORES).find(p => p.slug)?.slug
    expect(anyProviderSlug).toBeTruthy()
    expect(xml).toContain(`<loc>https://example.com/learn/providers/${anyProviderSlug}</loc>`)
  })
})
