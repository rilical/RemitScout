import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const existsSyncMock = vi.fn<(path: string) => boolean>()
const readFileSyncMock = vi.fn<(path: string, encoding: BufferEncoding) => string>()

vi.mock('node:fs', () => ({
  default: {
    existsSync: existsSyncMock,
    readFileSync: readFileSyncMock,
  },
  existsSync: existsSyncMock,
  readFileSync: readFileSyncMock,
}))

describe('shared catalog bundled fallbacks', () => {
  beforeEach(() => {
    vi.resetModules()
    existsSyncMock.mockReset()
    readFileSyncMock.mockReset()
    existsSyncMock.mockReturnValue(false)
    readFileSyncMock.mockImplementation(() => {
      throw new Error('repo-native catalog should not be read when file is absent')
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('loads the bundled provider catalog when repo-native metadata is unavailable', async () => {
    const module = await import('../shared/provider-catalog')
    module.clearProviderCatalogCache()

    const catalog = module.loadProviderCatalog()

    expect(catalog.providers.length).toBeGreaterThan(0)
    expect(readFileSyncMock).not.toHaveBeenCalled()
  })

  it('loads the bundled module catalog when repo-native metadata is unavailable', async () => {
    const module = await import('../shared/module-catalog')
    module.clearModuleCatalogCache()

    const catalog = module.loadModuleCatalog()

    expect(catalog.modules.length).toBeGreaterThan(0)
    expect(readFileSyncMock).not.toHaveBeenCalled()
  })

  it('loads the bundled provider volume policy when repo-native metadata is unavailable', async () => {
    const module = await import('../shared/provider-volume-policy')
    module.clearProviderVolumePolicyCatalogCache()

    const catalog = module.loadProviderVolumePolicyCatalog()

    expect(catalog.version).toBeGreaterThan(0)
    expect(module.getDefaultProviderVolumePolicy().strategy).toBe('synthetic_seed')
    expect(readFileSyncMock).not.toHaveBeenCalled()
  })
})
