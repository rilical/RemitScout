import { describe, expect, it } from 'vitest'

import {
  INSTITUTIONAL_EXPORT_RCI_HEADERS,
  INSTITUTIONAL_EXPORT_RVI_HEADERS,
  INSTITUTIONAL_EXPORT_TEER_HEADERS,
  buildInstitutionalIndicesKey,
  normalizeCorridorsAllowed,
  resolveExportDateUtc,
} from '../scripts/institutional-daily-export-job'

describe('institutional daily export helpers', () => {
  it('computes previous UTC day by default', () => {
    const now = new Date('2026-02-16T01:00:00.000Z')
    const exportDate = resolveExportDateUtc(now)
    expect(exportDate.toISOString().slice(0, 10)).toBe('2026-02-15')
  })

  it('supports explicit export date override (YYYY-MM-DD)', () => {
    const now = new Date('2026-02-16T01:00:00.000Z')
    const exportDate = resolveExportDateUtc(now, '2026-02-01')
    expect(exportDate.toISOString().slice(0, 10)).toBe('2026-02-01')
  })

  it('normalizes corridor allowlists (NULL means allow all)', () => {
    expect(normalizeCorridorsAllowed(null)).toBeNull()
    expect(normalizeCorridorsAllowed(undefined)).toBeNull()
  })

  it('normalizes corridor allowlists from arrays', () => {
    expect(normalizeCorridorsAllowed(['us-mx-usd-mxn'])).toEqual(['US-MX-USD-MXN'])
    expect(normalizeCorridorsAllowed(['US-MX-USD-MXN', 'us-mx-usd-mxn'])).toEqual([
      'US-MX-USD-MXN',
    ])
  })

  it('normalizes corridor allowlists from JSON strings (invalid => deny all)', () => {
    expect(normalizeCorridorsAllowed('["us-mx-usd-mxn"]')).toEqual(['US-MX-USD-MXN'])
    expect(normalizeCorridorsAllowed('not-json')).toEqual([])
    expect(normalizeCorridorsAllowed('{"oops":true}')).toEqual([])
  })

  it('builds deterministic S3 keys', () => {
    const exportDate = new Date('2026-02-15T00:00:00.000Z')
    expect(buildInstitutionalIndicesKey({
      clientPrefix: 'demo',
      exportDate,
      kind: 'teer',
    })).toBe('indices/demo/daily/2026/02/15/teer.csv')
    expect(buildInstitutionalIndicesKey({
      clientPrefix: 'demo',
      exportDate,
      kind: 'rci',
    })).toBe('indices/demo/daily/2026/02/15/rci.csv')
    expect(buildInstitutionalIndicesKey({
      clientPrefix: 'demo',
      exportDate,
      kind: 'rvi',
    })).toBe('indices/demo/daily/2026/02/15/rvi.csv')
  })

  it('keeps CSV headers stable', () => {
    expect(INSTITUTIONAL_EXPORT_TEER_HEADERS.join(',')).toBe(
      'date,corridor_id,amount_bucket,method_profile,teer_rate,mid_market_rate,provider_count,provider_count_binned,suppression_flag,suppression_reason,weight_confidence,weight_window_days,weighting_model,methodology_version,created_at',
    )
    expect(INSTITUTIONAL_EXPORT_RCI_HEADERS.join(',')).toBe(
      'date,corridor_id,amount_bucket,method_profile,rci_ratio,mid_market_rate,provider_count,provider_count_binned,suppression_flag,suppression_reason,weight_confidence,weight_window_days,weighting_model,methodology_version,created_at',
    )
    expect(INSTITUTIONAL_EXPORT_RVI_HEADERS.join(',')).toBe(
      'date,corridor_id,amount_bucket,method_profile,rvi_bps,mid_market_rate,provider_count,provider_count_binned,suppression_flag,suppression_reason,weight_confidence,weight_window_days,weighting_model,methodology_version,created_at',
    )
  })
})
