import { describe, expect, it } from 'vitest'

import { CORRIDOR_HISTORY_HEADERS } from '../scripts/export-worker-constants'

describe('CORRIDOR_HISTORY_HEADERS', () => {
  it('includes weighted index columns required for exports', () => {
    expect(CORRIDOR_HISTORY_HEADERS).toContain('teer_rate')
    expect(CORRIDOR_HISTORY_HEADERS).toContain('rci_ratio')
    expect(CORRIDOR_HISTORY_HEADERS).toContain('rvi_bps')
  })
})
