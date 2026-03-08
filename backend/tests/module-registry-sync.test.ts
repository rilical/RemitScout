import { describe, expect, it } from 'vitest'

import { buildModuleRegistrySeedRows } from '../shared/module-registry-sync'
import type { ModuleCatalogEntry } from '../shared/module-catalog'

describe('module registry seed row builder', () => {
  it('preserves split ownership metadata for signal modules', () => {
    const rows = buildModuleRegistrySeedRows([
      {
        module_id: 'signal:news-immigration',
        owner_kind: 'signal_source',
        owner_id: 'news-immigration',
        provider_id: 'news-immigration',
        collector_type: 'rss',
        display_name: 'News Immigration Feed',
        status: 'beta',
        signal_layer: 'factor',
        capture_method: 'rss',
        rollout_state: 'shadow',
        spec_version: 2,
        schema_version: 3,
        supported_corridors: ['US-MX-USD-MXN'],
        supported_amount_buckets: [],
        payin_method: null,
        payout_method: null,
        policy_flags: {
          auto_heal_enabled: false,
          emit_observations: true,
          include_in_gold: true,
        },
        lineage: {
          schema_ref: 'docs/signals/news-immigration.md',
          source_ref: 'https://example.com/news-feed',
        },
      } satisfies ModuleCatalogEntry,
    ])

    expect(rows).toHaveLength(1)
    expect(rows[0]?.owner_kind).toBe('signal_source')
    expect(rows[0]?.owner_id).toBe('news-immigration')
    expect(rows[0]?.signal_layer).toBe('factor')
    expect(rows[0]?.capture_method).toBe('rss')
    expect(rows[0]?.policy).toMatchObject({
      emit_observations: true,
      include_in_gold: true,
    })
  })
})
