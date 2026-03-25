import { describe, it, expect } from 'vitest'
import { getSendCountries, generateMacroCorridors, getMacroRepresentative } from '../shared/macro-corridors'
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

    it('returns only DE and FR for EUR (override collapses 31 eurozone countries)', () => {
      const countries = getSendCountries()
      // EUR override limits send countries to DE and FR
      expect(countries).toContain('DE')
      expect(countries).toContain('FR')
      // Other eurozone countries should be excluded by the override
      expect(countries).not.toContain('IT')
      expect(countries).not.toContain('ES')
      expect(countries).not.toContain('AT')
      expect(countries).not.toContain('BE')
      expect(countries).not.toContain('NL')
      expect(countries).not.toContain('PT')
      expect(countries).not.toContain('IE')
      expect(countries).not.toContain('GR')
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

  describe('getMacroRepresentative', () => {
    it('remaps Austria (AT) to Germany (DE) for EUR', () => {
      expect(getMacroRepresentative('AT', 'EUR')).toBe('DE')
    })

    it('returns null for Germany (already a EUR representative)', () => {
      expect(getMacroRepresentative('DE', 'EUR')).toBeNull()
    })

    it('returns null for France (already a EUR representative)', () => {
      expect(getMacroRepresentative('FR', 'EUR')).toBeNull()
    })

    it('returns null for US (already a USD representative)', () => {
      expect(getMacroRepresentative('US', 'USD')).toBeNull()
    })

    it('returns null for GBP (no override defined)', () => {
      expect(getMacroRepresentative('GB', 'GBP')).toBeNull()
    })

    it('remaps Spain (ES) to Germany (DE) for EUR', () => {
      expect(getMacroRepresentative('ES', 'EUR')).toBe('DE')
    })
  })
})
