import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const mockNavigateTo = vi.hoisted(() => vi.fn())
const mockRequest = vi.hoisted(() => vi.fn())
const mockSignOut = vi.hoisted(() => vi.fn())

describe('useAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    mockNavigateTo.mockResolvedValue(undefined)
    mockSignOut.mockResolvedValue({ ok: true })

    const state = new Map<string, ReturnType<typeof ref>>()
    vi.stubGlobal('useState', (key: string, init: () => unknown) => {
      if (!state.has(key)) {
        state.set(key, ref(init()))
      }
      return state.get(key)
    })
    vi.stubGlobal('useApi', () => ({
      request: (...args: unknown[]) => mockRequest(...args),
    }))
    vi.stubGlobal('useAuth', () => ({
      signOut: (...args: unknown[]) => mockSignOut(...args),
    }))
    vi.stubGlobal('navigateTo', (...args: unknown[]) => mockNavigateTo(...args))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('signs out and navigates home after successful deletion, preserving warnings', async () => {
    mockRequest.mockResolvedValue({
      deleted: true,
      anonymized: true,
      warnings: ['exports_bucket_not_configured'],
    })

    const { useAccount } = await import('~/composables/useAccount')
    const account = useAccount()
    const result = await account.deleteAccount()

    expect(mockRequest).toHaveBeenCalledWith('/account', {
      method: 'DELETE',
      body: { confirm: true },
    })
    expect(account.warnings.value).toEqual(['exports_bucket_not_configured'])
    expect(mockSignOut).toHaveBeenCalledTimes(1)
    expect(mockNavigateTo).toHaveBeenCalledWith('/')
    expect(result).toMatchObject({
      ok: true,
    })
  })

  it('surfaces backend deletion errors without signing the user out', async () => {
    mockRequest.mockResolvedValue({
      deleted: false,
      anonymized: false,
      errors: ['pending_request_exists'],
    })

    const { useAccount } = await import('~/composables/useAccount')
    const account = useAccount()
    const result = await account.deleteAccount()

    expect(result).toMatchObject({
      ok: false,
      error: 'pending_request_exists',
    })
    expect(account.error.value).toBe('pending_request_exists')
    expect(mockSignOut).not.toHaveBeenCalled()
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })
})
