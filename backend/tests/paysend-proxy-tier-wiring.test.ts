import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('paysend proxy tier wiring', () => {
  it('uses one resolved proxy tier for bootstrap and quote requests', () => {
    const file = path.join(process.cwd(), 'plane-b', 'src', 'providers', 'paysend', 'fetch.ts')
    const content = readFileSync(file, 'utf8')

    expect(content).toContain("const proxyTier = options.proxyTier ?? 'NONE'")
    expect(content).toContain('const loadCurrencyMap = async (proxyTier: ProxyTier = \'NONE\')')
    expect(content).toContain('await loadCurrencyMap(proxyTier)')
    expect(content).toContain('resolveCurrencyId(sourceCurrency, proxyTier)')
    expect(content).toContain('resolveCurrencyId(destCurrency, proxyTier)')
    expect(content).toContain('body: \'\',\n      proxyTier,')
  })
})
