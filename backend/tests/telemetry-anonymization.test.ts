import { describe, expect, it, vi } from 'vitest'
import type { Pool } from 'pg'
import { anonymizeTelemetryData } from '../plane-a/src/services/telemetry-anonymization'
import { query } from '../shared/db'

vi.mock('../shared/db', () => ({
  query: vi.fn(),
}))

describe('telemetry-anonymization', () => {
  it('updates all telemetry tables for user', async () => {
    vi.mocked(query).mockResolvedValue({ rows: [], rowCount: 0 })

    await anonymizeTelemetryData({} as Pool, 'user-1')

    const calls = vi.mocked(query).mock.calls
    expect(calls).toHaveLength(4)
    for (const call of calls) {
      expect(call[1]).toEqual(['user-1'])
    }
    expect(calls[0][0]).toContain('silver.telemetry_search_event')
    expect(calls[1][0]).toContain('silver.telemetry_outbound_click')
    expect(calls[2][0]).toContain('silver.telemetry_session')
    expect(calls[3][0]).toContain('silver.telemetry_provider_visit')
  })
})
