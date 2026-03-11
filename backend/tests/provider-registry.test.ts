import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { listProviders } from '../shared/provider-catalog'

const providersDir = path.resolve(import.meta.dirname, '../plane-b/src/providers')
const providerDefinitionsSource = fs.readFileSync(
  path.join(providersDir, 'provider-definitions.ts'),
  'utf8',
)

describe('provider registry wiring', () => {
  it('matches provider catalog IDs exactly', () => {
    const registryIds = Array.from(
      providerDefinitionsSource.matchAll(/providerId:\s*'([^']+)'/g),
      match => match[1],
    ).sort()
    const catalogIds = listProviders().slice().sort()
    expect(registryIds).toEqual(catalogIds)
  })

  it('wires a collector, corridor map, and limits file for every provider source folder', () => {
    const providerIds = listProviders()
    expect(providerIds.length).toBeGreaterThan(0)

    for (const providerId of providerIds) {
      const providerDir = path.join(providersDir, providerId)
      expect(fs.existsSync(providerDir)).toBe(true)
      expect(fs.existsSync(path.join(providerDir, 'collector.ts'))).toBe(true)
      expect(fs.existsSync(path.join(providerDir, 'supported-corridors.ts'))).toBe(true)
      expect(fs.existsSync(path.join(providerDir, 'limits.ts'))).toBe(true)
      expect(providerDefinitionsSource).toContain(`providerId: '${providerId}'`)
    }
  })
})
