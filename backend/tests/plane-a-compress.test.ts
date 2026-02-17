import { describe, it, expect } from 'vitest'
import { gunzipSync } from 'node:zlib'
import { buildApp } from '../plane-a/src/app'

describe('plane-a compression', () => {
  it('compresses JSON responses when the client accepts gzip', async () => {
    const app = await buildApp()
    app.get('/_test/compress', async () => ({ data: 'x'.repeat(5000) }))
    await app.ready()

    const res = await app.inject({
      method: 'GET',
      url: '/_test/compress',
      headers: {
        'accept-encoding': 'gzip',
      },
    })

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-encoding']).toBe('gzip')

    const raw = res.rawPayload
    const decoded = gunzipSync(raw).toString('utf8')
    expect(JSON.parse(decoded)).toMatchObject({ data: expect.any(String) })
    expect(JSON.parse(decoded).data.length).toBe(5000)

    await app.close()
  })
})

