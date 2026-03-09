import { readFileSync } from 'node:fs'

import Ajv2020 from 'ajv/dist/2020'
import { describe, expect, it } from 'vitest'
import { resolveRepoPath } from './support/repo-paths'

type ProviderCatalog = {
  providers: Array<{
    provider_id: string
  }>
}

describe('module catalog contract', () => {
  const catalogPath = resolveRepoPath(__dirname, '.remit-scout', 'modules', 'catalog.json')
  const schemaPath = resolveRepoPath(__dirname, '.remit-scout', 'schema', 'module-catalog.schema.json')
  const providerCatalogPath = resolveRepoPath(__dirname, '.remit-scout', 'providers', 'catalog.json')
  const providerVolumePath = resolveRepoPath(__dirname, '.remit-scout', 'providers', 'volume-policy.json')
  const providerVolumeSchemaPath = resolveRepoPath(__dirname, '.remit-scout', 'schema', 'provider-volume-policy.schema.json')
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')) as any
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8')) as any
  const providerCatalog = JSON.parse(readFileSync(providerCatalogPath, 'utf8')) as ProviderCatalog
  const providerVolumeCatalog = JSON.parse(readFileSync(providerVolumePath, 'utf8')) as any
  const providerVolumeSchema = JSON.parse(readFileSync(providerVolumeSchemaPath, 'utf8')) as any

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

  it('validates the provider volume policy catalog schema', () => {
    const ajv = new Ajv2020({
      allErrors: true,
      strict: false,
      allowUnionTypes: true,
    })
    const validate = ajv.compile(providerVolumeSchema)
    const ok = validate(providerVolumeCatalog)
    if (!ok) {
      const details = (validate.errors || [])
        .map((error) => `${error.instancePath || '(root)'}: ${error.message || 'invalid'}`)
        .join('; ')
      throw new Error(details)
    }
  })

  it('keeps release-cut strategy constraints on provider volume policies', () => {
    const policies = [
      providerVolumeCatalog.default_policy,
      ...(providerVolumeCatalog.providers || []).map((entry: any) => entry.volume),
    ].filter(Boolean)

    expect(policies.length).toBeGreaterThan(0)

    for (const policy of policies) {
      expect(policy.strategy).toBe('synthetic_seed')
      expect(policy.model_version).toBe('synthetic_seed_v1')
      expect(policy.reported.enabled).toBe(false)
      expect(policy.inferred_proxy.enabled).toBe(false)
      expect(typeof policy.synthetic_seed.default_weight).toBe('number')
      expect(policy.synthetic_seed.default_weight).toBeGreaterThanOrEqual(0)
      expect(policy.synthetic_seed.default_weight).toBeLessThanOrEqual(1)
      expect(typeof policy.synthetic_seed.default_confidence).toBe('number')
      expect(policy.synthetic_seed.default_confidence).toBeGreaterThanOrEqual(0)
      expect(policy.synthetic_seed.default_confidence).toBeLessThanOrEqual(1)
    }
  })
})
