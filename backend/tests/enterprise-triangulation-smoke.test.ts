import { describe, expect, it } from 'vitest'

import { readEnterpriseConfig } from '../scripts/ci/enterprise-triangulation-smoke'

describe('enterprise/triangulation smoke config', () => {
  it('defaults to a fail-closed enterprise smoke profile', () => {
    expect(readEnterpriseConfig({})).toEqual({
      corridorId: 'US-MX-USD-MXN',
      amountBucket: 500,
      methodProfile: 'standard_bank',
      allowEmptyTriangulation: false,
      allowExportPipelineDegraded: false,
    })
  })

  it('honors explicit smoke overrides when operators intentionally loosen the gate', () => {
    expect(readEnterpriseConfig({
      SMOKE_ENTERPRISE_CORRIDOR_ID: 'US-PH-USD-PHP',
      SMOKE_ENTERPRISE_AMOUNT_BUCKET: '750',
      SMOKE_ENTERPRISE_METHOD_PROFILE: 'wallet_priority',
      SMOKE_ALLOW_EMPTY_TRIANGULATION: '1',
      SMOKE_ALLOW_EXPORT_PIPELINE_DEGRADED: 'true',
    })).toEqual({
      corridorId: 'US-PH-USD-PHP',
      amountBucket: 750,
      methodProfile: 'wallet_priority',
      allowEmptyTriangulation: true,
      allowExportPipelineDegraded: true,
    })
  })
})
