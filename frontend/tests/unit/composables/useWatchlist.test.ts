// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { mapWatchlistSaveFailure } from '~/composables/useWatchlist'

describe('useWatchlist save failure mapping', () => {
  it('maps 401 failures to unauthorized reason and preserves request id', () => {
    const result = mapWatchlistSaveFailure({
      statusCode: 401,
      data: {
        error: 'missing_token',
        message: 'Unauthorized',
      },
      requestId: 'req_unauthorized',
    })

    expect(result).toMatchObject({
      status: 'error',
      reason: 'unauthorized',
      message: 'Unauthorized',
      requestId: 'req_unauthorized',
    })
  })

  it('maps thrown 403 limit_reached responses to error reason limit_reached', () => {
    const result = mapWatchlistSaveFailure({
      statusCode: 403,
      data: {
        error: 'limit_reached',
        message: 'Free plan supports up to 3 saved items.',
        limit: 3,
      },
      requestId: 'req_limit',
    })

    expect(result).toMatchObject({
      status: 'error',
      reason: 'limit_reached',
      message: 'Free plan supports up to 3 saved items.',
      requestId: 'req_limit',
    })
  })

  it('maps 403 account_deleted responses to account_deleted reason', () => {
    const result = mapWatchlistSaveFailure({
      statusCode: 403,
      data: {
        error: 'account_deleted',
      },
    })

    expect(result).toMatchObject({
      status: 'error',
      reason: 'account_deleted',
      message: 'This account has been deleted and can no longer save watchlist items.',
    })
  })

  it('maps 503 responses to service_unavailable reason', () => {
    const result = mapWatchlistSaveFailure({
      statusCode: 503,
      data: {
        error: 'service_unavailable',
      },
      cloudfrontRequestId: 'cf_123',
    })

    expect(result).toMatchObject({
      status: 'error',
      reason: 'service_unavailable',
      message: 'Watchlist service is temporarily unavailable. Please try again.',
      cloudfrontRequestId: 'cf_123',
    })
  })

  it('falls back to unknown reason for non-classified errors', () => {
    const result = mapWatchlistSaveFailure(new Error('Unexpected watchlist failure'))

    expect(result).toMatchObject({
      status: 'error',
      reason: 'unknown',
      message: 'Unexpected watchlist failure',
    })
  })
})
