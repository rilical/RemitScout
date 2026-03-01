import { describe, expect, it } from 'vitest'
import { generateApiKeyToken, hashApiKey } from '../plane-a/src/services/api-keys'

describe('api keys service', () => {
  it('generates URL-safe API key tokens with expected entropy length', () => {
    const token = generateApiKeyToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(token.length).toBeGreaterThanOrEqual(43) // 32 random bytes in base64url
  })

  it('hashes tokens deterministically and uniquely across different tokens', () => {
    const tokenA = generateApiKeyToken()
    const tokenB = generateApiKeyToken()

    const hashA1 = hashApiKey(tokenA)
    const hashA2 = hashApiKey(tokenA)
    const hashB = hashApiKey(tokenB)

    expect(hashA1).toBe(hashA2)
    expect(hashA1).toHaveLength(64) // sha256 hex
    expect(hashA1).not.toBe(hashB)
  })
})
