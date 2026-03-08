import { describe, expect, it } from 'vitest'
import { RIA_PROBE_DESTINATIONS } from '../plane-b/src/discovery/providers/ria'
import { RIA_SUPPORTED_CORRIDORS } from '../plane-b/src/providers/ria/supported-corridors'

describe('RIA discovery scope', () => {
  it('includes Albania in the discovery probe scope and supported corridor map', () => {
    expect(RIA_PROBE_DESTINATIONS).toContain('AL')
    expect(RIA_SUPPORTED_CORRIDORS).toContain('US-AL-USD-ALL')
  })
})
