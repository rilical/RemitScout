import { describe, expect, it } from 'vitest'

import { REMITLY_SUPPORTED_CORRIDORS } from '../plane-b/src/providers/remitly/supported-corridors'

describe('remitly supported corridors include base currency variants', () => {
  it('includes US-MX USD -> MXN', () => {
    expect(REMITLY_SUPPORTED_CORRIDORS).toContain('US-MX-USD-MXN')
  })

  it('includes US-MX EUR -> MXN', () => {
    expect(REMITLY_SUPPORTED_CORRIDORS).toContain('US-MX-EUR-MXN')
  })

  it('includes US-MX GBP -> MXN', () => {
    expect(REMITLY_SUPPORTED_CORRIDORS).toContain('US-MX-GBP-MXN')
  })

  it('includes CA-IN CAD -> INR', () => {
    expect(REMITLY_SUPPORTED_CORRIDORS).toContain('CA-IN-CAD-INR')
  })

  it('includes CA-IN USD -> INR', () => {
    expect(REMITLY_SUPPORTED_CORRIDORS).toContain('CA-IN-USD-INR')
  })

  it('includes CA-IN EUR -> INR', () => {
    expect(REMITLY_SUPPORTED_CORRIDORS).toContain('CA-IN-EUR-INR')
  })

  it('includes CA-IN GBP -> INR', () => {
    expect(REMITLY_SUPPORTED_CORRIDORS).toContain('CA-IN-GBP-INR')
  })
})
