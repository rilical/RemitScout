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

    it('returns metadata for xoom', () => {
      const metadata = getProviderMetadata('xoom')

      expect(metadata).toBeDefined()
      expect(metadata?.id).toBe('xoom')
      expect(metadata?.remitScore).toBe(8.5)
    })

    it('returns metadata for instarem', () => {
      const metadata = getProviderMetadata('instarem')

      expect(metadata).toBeDefined()
      expect(metadata?.id).toBe('instarem')
      expect(metadata?.remitScore).toBe(8.4)
    })

    it('returns metadata for wirebarley', () => {
      const metadata = getProviderMetadata('wirebarley')

      expect(metadata).toBeDefined()
      expect(metadata?.id).toBe('wirebarley')
      expect(metadata?.remitScore).toBe(8.2)
    })

    it('returns metadata for alansari', () => {
      const metadata = getProviderMetadata('alansari')

      expect(metadata).toBeDefined()
      expect(metadata?.id).toBe('alansari')
      expect(metadata?.remitScore).toBe(7.9)
    })

    it('returns metadata for intermex', () => {
      const metadata = getProviderMetadata('intermex')

      expect(metadata).toBeDefined()
      expect(metadata?.id).toBe('intermex')
      expect(metadata?.remitScore).toBe(8.0)
    })

    it('returns metadata for ria', () => {
      const metadata = getProviderMetadata('ria')

      expect(metadata).toBeDefined()
      expect(metadata?.id).toBe('ria')
      expect(metadata?.remitScore).toBe(8.0)
    })

    it('returns metadata for dahabshiil', () => {
      const metadata = getProviderMetadata('dahabshiil')

      expect(metadata).toBeDefined()
      expect(metadata?.id).toBe('dahabshiil')
      expect(metadata?.remitScore).toBe(8.0)
    })

    it('returns metadata for sendwave', () => {
      const metadata = getProviderMetadata('sendwave')

      expect(metadata).toBeDefined()
      expect(metadata?.id).toBe('sendwave')
      expect(metadata?.remitScore).toBe(9.0)
    })

    it('returns metadata for mukuru', () => {
      const metadata = getProviderMetadata('mukuru')

      expect(metadata).toBeDefined()
      expect(metadata?.id).toBe('mukuru')
      expect(metadata?.remitScore).toBe(8.4)
    })

    it('returns metadata for transfergo', () => {
      const metadata = getProviderMetadata('transfergo')

      expect(metadata).toBeDefined()
      expect(metadata?.id).toBe('transfergo')
      expect(metadata?.remitScore).toBe(8.6)
    })

    it('returns metadata for paysend', () => {
      const metadata = getProviderMetadata('paysend')

      expect(metadata).toBeDefined()
      expect(metadata?.id).toBe('paysend')
      expect(metadata?.remitScore).toBe(8.1)
    })

    it('returns metadata for pangea', () => {
      const metadata = getProviderMetadata('pangea')

      expect(metadata).toBeDefined()
      expect(metadata?.id).toBe('pangea')
      expect(metadata?.remitScore).toBe(8.3)
    })

    it('returns metadata for bossmoney', () => {
      const metadata = getProviderMetadata('bossmoney')

      expect(metadata).toBeDefined()
      expect(metadata?.id).toBe('bossmoney')
      expect(metadata?.remitScore).toBe(8.8)
    })

    it('returns metadata for koronapay', () => {
      const metadata = getProviderMetadata('koronapay')

      expect(metadata).toBeDefined()
      expect(metadata?.id).toBe('koronapay')
      expect(metadata?.remitScore).toBe(8.3)
    })

    it('returns metadata for remitbee', () => {
      const metadata = getProviderMetadata('remitbee')

      expect(metadata).toBeDefined()
      expect(metadata?.id).toBe('remitbee')
      expect(metadata?.remitScore).toBe(8.3)
    })

    it('returns metadata for placid', () => {
      const metadata = getProviderMetadata('placid')

      expect(metadata).toBeDefined()
      expect(metadata?.id).toBe('placid')
      expect(metadata?.remitScore).toBe(8.2)
    })

    it('returns metadata for wellsfargo', () => {
      const metadata = getProviderMetadata('wellsfargo')

      expect(metadata).toBeDefined()
      expect(metadata?.id).toBe('wellsfargo')
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
      expect(providerIds).toContain('xoom')
      expect(providerIds).toContain('instarem')
      expect(providerIds).toContain('wirebarley')
      expect(providerIds).toContain('alansari')
      expect(providerIds).toContain('intermex')
      expect(providerIds).toContain('ria')
      expect(providerIds).toContain('dahabshiil')
      expect(providerIds).toContain('sendwave')
      expect(providerIds).toContain('mukuru')
      expect(providerIds).toContain('transfergo')
      expect(providerIds).toContain('paysend')
      expect(providerIds).toContain('pangea')
      expect(providerIds).toContain('bossmoney')
      expect(providerIds).toContain('koronapay')
      expect(providerIds).toContain('remitbee')
      expect(providerIds).toContain('placid')
      expect(providerIds).toContain('wellsfargo')
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

  describe('getProviderMetadataBySlug', () => {
    it('resolves slug variants', () => {
      const metadata = getProviderMetadataBySlug('westernunion')

      expect(metadata).toBeDefined()
      expect(metadata?.id).toBe('westernunion')
    })
  })
})
