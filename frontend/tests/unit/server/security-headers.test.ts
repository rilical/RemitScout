// @vitest-environment node
import { createServer } from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, eventHandler, toNodeListener } from 'h3'
import securityHeaders from '~/server/middleware/security-headers'

type TestServer = { server: ReturnType<typeof createServer>, baseUrl: string }

const startServer = async (): Promise<TestServer> => {
  const app = createApp()
  app.use(securityHeaders)
  app.use(eventHandler(() => ({ ok: true })))

  const server = createServer(toNodeListener(app))
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve())
  })

  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : 0
  return { server, baseUrl: `http://127.0.0.1:${port}` }
}

let active: TestServer | null = null
afterEach(() => {
  active?.server.close()
  active = null
})

describe('security-headers middleware', () => {
  it('sets X-Frame-Options: DENY for normal pages', async () => {
    active = await startServer()
    const res = await fetch(`${active.baseUrl}/`)
    expect(res.headers.get('x-frame-options')).toBe('DENY')
  })

  it('sets X-Frame-Options: SAMEORIGIN for /embed/*', async () => {
    active = await startServer()
    const res = await fetch(`${active.baseUrl}/embed/pulse/chart`)
    expect(res.headers.get('x-frame-options')).toBe('SAMEORIGIN')
  })

  it('sets HSTS with 1 year max-age', async () => {
    active = await startServer()
    const res = await fetch(`${active.baseUrl}/`)
    expect(res.headers.get('strict-transport-security')).toContain('max-age=31536000')
  })

  it('sets X-Content-Type-Options: nosniff', async () => {
    active = await startServer()
    const res = await fetch(`${active.baseUrl}/`)
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })

  it('sets Permissions-Policy', async () => {
    active = await startServer()
    const res = await fetch(`${active.baseUrl}/`)
    expect(res.headers.get('permissions-policy')).toBeTruthy()
  })

  it('sets CSP (Report-Only)', async () => {
    active = await startServer()
    const res = await fetch(`${active.baseUrl}/`)
    const csp = res.headers.get('content-security-policy-report-only')
    expect(csp).toBeTruthy()
    expect(csp).toContain('default-src \'self\'')
  })
})
