import { describe, it, expect } from 'vitest'
import { getSendCountries, generateMacroCorridors } from '../shared/macro-corridors'
import { isUsdOriginCorridor } from '../shared/corridor-tiers'

describe('macro-corridors', () => {
  describe('getSendCountries', () => {
    it('returns US for USD, not other USD-currency countries', () => {
      const countries = getSendCountries()
      expect(countries).toContain('US')
      // These countries use USD but should be excluded by the override
      expect(countries).not.toContain('AS')
      expect(countries).not.toContain('EC')
      expect(countries).not.toContain('SV')
      expect(countries).not.toContain('GU')
      expect(countries).not.toContain('VG')
      expect(countries).not.toContain('MH')
      expect(countries).not.toContain('FM')
      expect(countries).not.toContain('PW')
      expect(countries).not.toContain('PA')
      expect(countries).not.toContain('PR')
      expect(countries).not.toContain('TL')
      expect(countries).not.toContain('TC')
      expect(countries).not.toContain('VI')
    })

    it('still returns all EUR countries (no override)', () => {
      const countries = getSendCountries()
      // EUR countries should still be present (no override for EUR)
      // At minimum the major eurozone countries should appear
      expect(countries).toContain('DE')
      expect(countries).toContain('FR')
      expect(countries).toContain('IT')
      expect(countries).toContain('ES')
    })
  })

  describe('generateMacroCorridors', () => {
    it('does not produce EC-PH-USD-PHP', () => {
      const corridors = generateMacroCorridors()
      const ids = corridors.map(c => c.corridorId)
      expect(ids).not.toContain('EC-PH-USD-PHP')
    })

    it('still produces US-PH-USD-PHP', () => {
      const corridors = generateMacroCorridors()
      const ids = corridors.map(c => c.corridorId)
      expect(ids).toContain('US-PH-USD-PHP')
    })
  })

  describe('isUsdOriginCorridor', () => {
    it('returns true for US-PH-USD-PHP', () => {
      expect(isUsdOriginCorridor('US-PH-USD-PHP')).toBe(true)
    })

    it('returns false for EC-PH-USD-PHP', () => {
      expect(isUsdOriginCorridor('EC-PH-USD-PHP')).toBe(false)
    })
  })
})
