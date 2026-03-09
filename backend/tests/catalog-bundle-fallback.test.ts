import { afterEach, describe, expect, it, vi } from 'vitest'

const ORIGINAL_ENV = {
  REMIT_SCOUT_REPO_ROOT: process.env.REMIT_SCOUT_REPO_ROOT,
  MODULE_CATALOG_PATH: process.env.MODULE_CATALOG_PATH,
  PROVIDER_VOLUME_POLICY_PATH: process.env.PROVIDER_VOLUME_POLICY_PATH,
}

const forceMissingRepoRoot = () => {
  process.env.REMIT_SCOUT_REPO_ROOT = '/tmp/remit-scout-bundle-fallback-missing'
  delete process.env.MODULE_CATALOG_PATH
  delete process.env.PROVIDER_VOLUME_POLICY_PATH
}

const restoreEnv = () => {
  const entries = Object.entries(ORIGINAL_ENV)
  for (const [key, value] of entries) {
    if (value === undefined) {
      delete process.env[key]
      continue
    }
    process.env[key] = value
  }
}

afterEach(() => {
  restoreEnv()
  vi.resetModules()
})

describe('catalog bundle fallback', () => {
  it('loads provider catalog from bundled JSON when repo files are unavailable', async () => {
    forceMissingRepoRoot()

    const { loadProviderCatalog } = await import('../shared/provider-catalog')
    const catalog = loadProviderCatalog()

    expect(catalog.version).toBeGreaterThan(0)
    expect(catalog.providers.length).toBeGreaterThan(0)
  })

  it('loads module catalog from bundled JSON when repo files are unavailable', async () => {
    forceMissingRepoRoot()

    const { loadModuleCatalog } = await import('../shared/module-catalog')
    const catalog = loadModuleCatalog()

    expect(catalog.version).toBeGreaterThan(0)
    expect(catalog.modules.length).toBeGreaterThan(0)
  })

  it('loads provider volume policy from bundled JSON when repo files are unavailable', async () => {
    forceMissingRepoRoot()

    const { loadProviderVolumePolicyCatalog } = await import('../shared/provider-volume-policy')
    const catalog = loadProviderVolumePolicyCatalog()

    expect(catalog.version).toBeGreaterThan(0)
    expect(catalog.default_policy).toBeTruthy()
  })
})
