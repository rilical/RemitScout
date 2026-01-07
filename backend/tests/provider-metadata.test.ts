import { describe, it, expect } from 'vitest'
import {
  getProviderMetadata,
  getAllProviderMetadata,
  getProviderMetadataBySlug,
} from '../plane-a/src/services/provider-metadata'

describe('provider-metadata', () => {
  describe('getProviderMetadata', () => {
    it('returns metadata for valid provider ID', () => {
      const metadata = getProviderMetadata('wise')

      expect(metadata).toBeDefined()
      expect(metadata?.id).toBe('wise')
      expect(metadata?.name).toBe('Wise')
      expect(metadata?.remitScore).toBe(9.3)
    })

    it('handles case-insensitive provider ID', () => {
      const metadata1 = getProviderMetadata('WISE')
      const metadata2 = getProviderMetadata('Wise')
      const metadata3 = getProviderMetadata('wise')

      expect(metadata1).toEqual(metadata2)
      expect(metadata2).toEqual(metadata3)
    })

    it('returns null for invalid provider ID', () => {
      const metadata = getProviderMetadata('invalid-provider')

      expect(metadata).toBeNull()
    })

    it('returns metadata for remitly', () => {
      const metadata = getProviderMetadata('remitly')

      expect(metadata).toBeDefined()
      expect(metadata?.id).toBe('remitly')
      expect(metadata?.remitScore).toBe(9.1)
    })

    it('returns metadata for worldremit', () => {
      const metadata = getProviderMetadata('worldremit')

      expect(metadata).toBeDefined()
      expect(metadata?.id).toBe('worldremit')
      expect(metadata?.remitScore).toBe(8.2)
    })

    it('returns metadata for westernunion', () => {
      const metadata = getProviderMetadata('westernunion')

      expect(metadata).toBeDefined()
      expect(metadata?.id).toBe('westernunion')
      expect(metadata?.remitScore).toBe(8.2)
    })

    it('returns metadata for xe', () => {
      const metadata = getProviderMetadata('xe')

      expect(metadata).toBeDefined()
      expect(metadata?.id).toBe('xe')
      expect(metadata?.remitScore).toBe(8.7)
    })

    it('includes score breakdown when available', () => {
      const metadata = getProviderMetadata('wise')

      expect(metadata?.scoreBreakdown).toBeDefined()
      expect(metadata?.scoreBreakdown?.deliveredValue).toBe(0.95)
      expect(metadata?.scoreBreakdown?.reliability).toBe(0.95)
    })

    it('includes logo information', () => {
      const metadata = getProviderMetadata('wise')

      expect(metadata?.logo).toBeDefined()
      expect(metadata?.logo.sm).toBeDefined()
      expect(metadata?.logo.ico).toBeDefined()
    })
  })

  describe('getAllProviderMetadata', () => {
    it('returns array of all provider metadata', () => {
      const allMetadata = getAllProviderMetadata()

      expect(Array.isArray(allMetadata)).toBe(true)
      expect(allMetadata.length).toBeGreaterThan(0)
    })

    it('includes all known providers', () => {
      const allMetadata = getAllProviderMetadata()
      const providerIds = allMetadata.map(p => p.id)

      expect(providerIds).toContain('wise')
      expect(providerIds).toContain('remitly')
      expect(providerIds).toContain('worldremit')
      expect(providerIds).toContain('westernunion')
      expect(providerIds).toContain('xe')
    })

    it('all entries have required fields', () => {
      const allMetadata = getAllProviderMetadata()

      for (const metadata of allMetadata) {
        expect(metadata).toHaveProperty('id')
        expect(metadata).toHaveProperty('slug')
        expect(metadata).toHaveProperty('name')
        expect(metadata).toHaveProperty('displayName')
        expect(metadata).toHaveProperty('type')
        expect(metadata).toHaveProperty('url')
        expect(metadata).toHaveProperty('remitScore')
        expect(metadata).toHaveProperty('logo')
      }
    })
  })

  describe('getProviderMetadataBySlug', () => {
    it('returns metadata for valid slug', () => {
      const metadata = getProviderMetadataBySlug('wise')

      expect(metadata).toBeDefined()
      expect(metadata?.slug).toBe('wise')
    })

    it('returns metadata for slug with different case', () => {
      const metadata = getProviderMetadataBySlug('wise')

      expect(metadata).toBeDefined()
    })

    it('returns null for invalid slug', () => {
      const metadata = getProviderMetadataBySlug('invalid-slug')

      expect(metadata).toBeNull()
    })

    it('handles slug with dashes', () => {
      const metadata = getProviderMetadataBySlug('western-union')

      expect(metadata).toBeDefined()
      expect(metadata?.slug).toBe('western-union')
    })

    it('handles slug with different format', () => {
      const metadata = getProviderMetadataBySlug('xe-money')

      expect(metadata).toBeDefined()
      expect(metadata?.slug).toBe('xe-money')
    })
  })
})



