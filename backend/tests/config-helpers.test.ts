import { describe, it, expect } from 'vitest'
import { toBoolean } from '../shared/config-helpers'

describe('config-helpers', () => {
  describe('toBoolean', () => {
    it('parses truthy values', () => {
      expect(toBoolean('1')).toBe(true)
      expect(toBoolean('true')).toBe(true)
      expect(toBoolean('yes')).toBe(true)
    })

    it('parses falsy values', () => {
      expect(toBoolean('0')).toBe(false)
      expect(toBoolean('false')).toBe(false)
      expect(toBoolean('no')).toBe(false)
      expect(toBoolean('')).toBe(false)
      expect(toBoolean(undefined)).toBe(false)
    })

    it('treats unrecognized values as false', () => {
      expect(toBoolean('enabled')).toBe(false)
      expect(toBoolean('on')).toBe(false)
      expect(toBoolean('truee')).toBe(false)
    })
  })
})

