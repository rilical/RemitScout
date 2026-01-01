import { describe, expect, it } from 'vitest'

import { XE_SUPPORTED_CORRIDORS } from '../plane-b/src/providers/xe/supported-corridors'

describe('xe supported corridors', () => {
  it('includes core corridors', () => {
    expect(XE_SUPPORTED_CORRIDORS).toEqual(
      expect.arrayContaining([
        'US-IN-USD-INR',
        'GB-IN-GBP-INR',
        'CA-PH-CAD-PHP',
      ]),
    )
  })

  it('does not include duplicates', () => {
    expect(new Set(XE_SUPPORTED_CORRIDORS).size).toBe(XE_SUPPORTED_CORRIDORS.length)
  })
})
