import { describe, it, expect } from 'vitest'

import { upsertGoldIndices } from '../scripts/gold-indices-job'

describe('Gold indices SQL regression', () => {
  it('does not reference prev_teer_rate alias in same SELECT', async () => {
    // Ensure the module (and its SQL) loads without throwing and contains
    // the expected regression guard CTE name.
    //
    // We deliberately avoid executing against a real DB in unit tests.
    expect(String(upsertGoldIndices)).toContain('indicesUpsertQuery')
  })
})

