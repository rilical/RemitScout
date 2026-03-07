import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ModuleCatalogEntry } from '../shared/module-catalog'

const sampleModule: ModuleCatalogEntry = {
  module_id: 'wise:http',
  owner_kind: 'provider',
  owner_id: 'wise',
  provider_id: 'wise',
  collector_type: 'http',
  display_name: 'wise:http',
  status: 'production',
  signal_layer: 'quote',
  capture_method: 'http',
  rollout_state: 'enabled',
  spec_version: 2,
  schema_version: 3,
  supported_corridors: ['US-MX-USD-MXN'],
  supported_amount_buckets: [100, 500],
  payin_method: 'bank_transfer',
  payout_method: 'bank_deposit',
  policy_flags: {
    auto_heal_enabled: true,
    emit_observations: true,
    include_in_gold: true,
  },
  lineage: {
    schema_ref: 'docs/providers/wise.md',
    source_ref: 'https://wise.example.test',
  },
}

afterEach(() => {
  vi.resetModules()
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe('module registry sync SQL', () => {
  it('uses a jsonb recordset payload so numeric arrays survive sync', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ synced: 1 }] })
    vi.doMock('../shared/db', () => ({
      query,
    }))

    const { moduleRegistrySyncSql, syncModuleRegistry } = await import('../shared/module-registry-sync')

    const fakePool = {} as never
    const synced = await syncModuleRegistry(fakePool, [sampleModule])

    expect(synced).toBe(1)
    expect(moduleRegistrySyncSql).toContain('jsonb_to_recordset')
    expect(moduleRegistrySyncSql).not.toContain('numeric[][]')
    expect(query).toHaveBeenCalledTimes(1)
    expect(query.mock.calls[0]?.[0]).toBe(moduleRegistrySyncSql)

    const payload = query.mock.calls[0]?.[1]?.[0]
    expect(typeof payload).toBe('string')
    expect(JSON.parse(payload)).toEqual([
      expect.objectContaining({
        module_id: 'wise:http',
        supported_amount_buckets: [100, 500],
      }),
    ])
  })
})
