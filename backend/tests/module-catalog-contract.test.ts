import { readFileSync } from 'node:fs'
import path from 'node:path'

import Ajv2020 from 'ajv/dist/2020'
import { describe, expect, it } from 'vitest'

type ProviderCatalog = {
  providers: Array<{
    provider_id: string
  }>
}

describe('module catalog contract', () => {
  const repoRoot = path.resolve(process.cwd(), '..')
  const catalogPath = path.join(repoRoot, '.remit-scout', 'modules', 'catalog.json')
  const schemaPath = path.join(repoRoot, '.remit-scout', 'schema', 'module-catalog.schema.json')
  const providerCatalogPath = path.join(repoRoot, '.remit-scout', 'providers', 'catalog.json')
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')) as any
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8')) as any
  const providerCatalog = JSON.parse(readFileSync(providerCatalogPath, 'utf8')) as ProviderCatalog

  it('validates against the module catalog schema', () => {
    const ajv = new Ajv2020({
      allErrors: true,
      strict: false,
      allowUnionTypes: true,
    })
    const validate = ajv.compile(schema)
    const ok = validate(catalog)
    if (!ok) {
      const details = (validate.errors || [])
        .map((error) => `${error.instancePath || '(root)'}: ${error.message || 'invalid'}`)
        .join('; ')
      throw new Error(details)
    }
  })

  it('covers every production provider with a production module', () => {
    const providers = new Set(providerCatalog.providers.map((entry) => entry.provider_id))
    const productionModules = (catalog.modules || []).filter((entry: any) => entry.status === 'production')

    expect(providers.size).toBe(24)
    expect(productionModules.length).toBe(24)

    const moduleProviders = new Set(productionModules.map((entry: any) => entry.provider_id))
    expect(moduleProviders).toEqual(providers)
  })

  it('keeps release-cut strategy constraints on production modules', () => {
    const productionModules = (catalog.modules || []).filter((entry: any) => entry.status === 'production')
    for (const module of productionModules) {
      expect(module.volume.strategy).toBe('synthetic_seed')
      expect(module.volume.model_version).toBe('synthetic_seed_v1')
      expect(module.volume.reported.enabled).toBe(false)
      expect(module.volume.inferred_proxy.enabled).toBe(false)
      expect(typeof module.volume.synthetic_seed.default_weight).toBe('number')
      expect(module.volume.synthetic_seed.default_weight).toBeGreaterThanOrEqual(0)
      expect(module.volume.synthetic_seed.default_weight).toBeLessThanOrEqual(1)
      expect(typeof module.volume.synthetic_seed.default_confidence).toBe('number')
      expect(module.volume.synthetic_seed.default_confidence).toBeGreaterThanOrEqual(0)
      expect(module.volume.synthetic_seed.default_confidence).toBeLessThanOrEqual(1)
    }
  })
})
