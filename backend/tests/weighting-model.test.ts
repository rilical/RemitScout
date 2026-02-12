import { describe, expect, it } from 'vitest'
import {
  DEFAULT_WEIGHT_MODEL,
  GLOBAL_WEIGHT_CORRIDOR_ID,
  INDICES_METHODOLOGY_VERSION,
} from '../shared/weighting-model'

describe('weighting model', () => {
  it('exports default weighting model identifier', () => {
    expect(typeof DEFAULT_WEIGHT_MODEL).toBe('string')
  })

  it('exports stable indices metadata constants', () => {
    expect(typeof INDICES_METHODOLOGY_VERSION).toBe('string')
    expect(GLOBAL_WEIGHT_CORRIDOR_ID).toBe('__global__')
  })
})
