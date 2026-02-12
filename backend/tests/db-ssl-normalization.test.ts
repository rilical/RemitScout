import { describe, expect, it } from 'vitest'
import { normalizeConnectionStringForSslMode } from '../shared/db'

describe('normalizeConnectionStringForSslMode', () => {
  it('strips ssl query params when ssl mode is require', () => {
    const input = 'postgresql://user:pass@localhost:5432/remit?sslmode=verify-full&sslrootcert=/tmp/ca.pem'
    const normalized = normalizeConnectionStringForSslMode(input, 'require')

    expect(normalized).toBe('postgresql://user:pass@localhost:5432/remit')
  })

  it('strips ssl query params when ssl mode is disable', () => {
    const input = 'postgresql://user:pass@localhost:5432/remit?ssl=true&sslmode=require'
    const normalized = normalizeConnectionStringForSslMode(input, 'disable')

    expect(normalized).toBe('postgresql://user:pass@localhost:5432/remit')
  })

  it('keeps connection string unchanged for verify-full mode', () => {
    const input = 'postgresql://user:pass@localhost:5432/remit?sslmode=verify-full'
    const normalized = normalizeConnectionStringForSslMode(input, 'verify-full')

    expect(normalized).toBe(input)
  })

  it('keeps invalid urls unchanged', () => {
    const input = 'postgres://not-a-real-url%%'
    const normalized = normalizeConnectionStringForSslMode(input, 'require')

    expect(normalized).toBe(input)
  })
})
