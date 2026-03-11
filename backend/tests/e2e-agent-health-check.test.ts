import { describe, expect, it, vi } from 'vitest'

import { rewriteDbConnectionStringForIpv4 } from '../shared/db-ipv4'

describe('rewriteDbConnectionStringForIpv4', () => {
  it('rewrites an authority hostname to a resolved ipv4 address', async () => {
    const result = await rewriteDbConnectionStringForIpv4(
      'postgres://user:pass@db.example.com:5432/remit?sslmode=require',
      vi.fn().mockResolvedValue('10.0.0.12'),
    )

    expect(result).not.toBeNull()
    expect(result?.originalHost).toBe('db.example.com')
    expect(result?.resolvedHost).toBe('10.0.0.12')
    expect(result?.source).toBe('hostname')
    expect(result?.connectionString).toContain('@10.0.0.12:5432/remit')
  })

  it('rewrites query host and hostaddr fields when the authority host is omitted', async () => {
    const result = await rewriteDbConnectionStringForIpv4(
      'postgres://user:pass@/remit?host=db.example.com&hostaddr=2600%3A%3A1',
      vi.fn().mockResolvedValue('10.0.0.12'),
    )

    expect(result).not.toBeNull()
    const parsed = new URL(result!.connectionString)
    expect(parsed.hostname).toBe('10.0.0.12')
    expect(parsed.searchParams.get('host')).toBe('10.0.0.12')
    expect(parsed.searchParams.get('hostaddr')).toBe('10.0.0.12')
  })

  it('uses a query host fallback when the authority host is already an ipv6 literal', async () => {
    const result = await rewriteDbConnectionStringForIpv4(
      'postgres://user:pass@[2600:1f13:838:6e00::1]:5432/remit?host=db.example.com',
      vi.fn().mockResolvedValue('10.0.0.12'),
    )

    expect(result).not.toBeNull()
    const parsed = new URL(result!.connectionString)
    expect(parsed.hostname).toBe('10.0.0.12')
    expect(parsed.searchParams.get('host')).toBe('10.0.0.12')
    expect(result?.source).toBe('host')
  })

  it('leaves localhost urls untouched', async () => {
    const result = await rewriteDbConnectionStringForIpv4(
      'postgres://user:pass@localhost:5432/remit',
      vi.fn().mockResolvedValue('10.0.0.12'),
    )

    expect(result).toBeNull()
  })

  it('falls back to the Supabase session pooler when the direct host is ipv6-only', async () => {
    process.env.AWS_REGION = 'us-east-1'

    const result = await rewriteDbConnectionStringForIpv4(
      'postgres://postgres:pass@db.eztsaeuskuaqczgutdew.supabase.co:5432/postgres?sslmode=require',
      vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND db.eztsaeuskuaqczgutdew.supabase.co')),
    )

    expect(result).not.toBeNull()
    expect(result?.originalHost).toBe('db.eztsaeuskuaqczgutdew.supabase.co')
    expect(result?.resolvedHost).toBe('aws-0-us-east-1.pooler.supabase.com')
    expect(result?.connectionString).toContain('@aws-0-us-east-1.pooler.supabase.com:5432/postgres')
    expect(result?.connectionString).toContain('postgres.eztsaeuskuaqczgutdew')

    delete process.env.AWS_REGION
  })

  it('respects an explicit Supabase session pooler host override', async () => {
    process.env.SUPABASE_SESSION_POOLER_HOST = 'aws-0-us-west-2.pooler.supabase.com'

    const result = await rewriteDbConnectionStringForIpv4(
      'postgres://postgres:pass@db.eztsaeuskuaqczgutdew.supabase.co:5432/postgres',
      vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND db.eztsaeuskuaqczgutdew.supabase.co')),
    )

    expect(result?.resolvedHost).toBe('aws-0-us-west-2.pooler.supabase.com')
    expect(result?.connectionString).toContain('@aws-0-us-west-2.pooler.supabase.com:5432/postgres')

    delete process.env.SUPABASE_SESSION_POOLER_HOST
  })

  it('rewrites query-param usernames for Supabase session pooler connections', async () => {
    process.env.SUPABASE_SESSION_POOLER_HOST = 'aws-0-us-west-2.pooler.supabase.com'

    const result = await rewriteDbConnectionStringForIpv4(
      'postgres://:@db.eztsaeuskuaqczgutdew.supabase.co:5432/postgres?user=postgres&password=pass&sslmode=require',
      vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND db.eztsaeuskuaqczgutdew.supabase.co')),
    )

    expect(result).not.toBeNull()
    const parsed = new URL(result!.connectionString)
    expect(parsed.searchParams.get('user')).toBe('postgres.eztsaeuskuaqczgutdew')
    expect(parsed.hostname).toBe('aws-0-us-west-2.pooler.supabase.com')

    delete process.env.SUPABASE_SESSION_POOLER_HOST
  })
})
