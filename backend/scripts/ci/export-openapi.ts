import fs from 'node:fs'
import path from 'node:path'
import { buildApp } from '../../plane-a/src/app'

type Args = {
  out: string
  pretty: boolean
  stripPrefix: string | null
}

const parseArgs = (): Args => {
  const args = process.argv.slice(2)
  const outIdx = args.indexOf('--out')
  const out = outIdx >= 0 ? args[outIdx + 1] : ''
  const pretty = args.includes('--pretty')

  const stripIdx = args.indexOf('--strip-prefix')
  const stripPrefix = stripIdx >= 0 ? (args[stripIdx + 1] || '') : 'none'

  if (!out) {
    throw new Error('Missing required --out <path>')
  }

  if (stripIdx >= 0 && !stripPrefix) {
    throw new Error('Invalid --strip-prefix value')
  }

  return {
    out,
    pretty,
    stripPrefix: stripPrefix === 'none' ? null : stripPrefix,
  }
}

const main = async () => {
  const { out, pretty, stripPrefix } = parseArgs()

  // Ensure swagger generation is enabled even if AWS_* env vars are present.
  process.env.SWAGGER_ENABLED = '1'

  const app = await buildApp()
  await app.ready()

  // Export the JSON spec via swagger-ui's json endpoint.
  // NOTE: Fastify plugin encapsulation means app.swagger() may not exist on the root instance.
  const res = await app.inject({ method: 'GET', url: '/api-docs/json' })
  if (res.statusCode !== 200) {
    await app.close()
    const body = typeof res.body === 'string' ? res.body.slice(0, 500) : String(res.body)
    throw new Error(`OpenAPI export failed: GET /api-docs/json -> ${res.statusCode}. Body: ${body}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const spec = JSON.parse(res.body) as any
  if (!spec || typeof spec !== 'object') {
    await app.close()
    throw new Error('OpenAPI export failed: invalid JSON payload from /api-docs/json')
  }

  const next = { ...spec }

  if (stripPrefix) {
    const prefix = stripPrefix.endsWith('/') ? stripPrefix.slice(0, -1) : stripPrefix
    const nextPaths: Record<string, unknown> = {}

    for (const [p, v] of Object.entries(spec.paths || {})) {
      if (typeof p !== 'string') continue
      if (!p.startsWith(prefix + '/')) continue
      const stripped = p.slice(prefix.length) || '/'
      nextPaths[stripped] = v
    }

    next.paths = nextPaths
  }

  const absOut = path.isAbsolute(out) ? out : path.resolve(process.cwd(), out)
  fs.mkdirSync(path.dirname(absOut), { recursive: true })
  fs.writeFileSync(absOut, JSON.stringify(next, null, pretty ? 2 : 0) + '\n', 'utf8')

  await app.close()

  // eslint-disable-next-line no-console
  console.log(`Wrote OpenAPI spec to ${absOut}`)
  // eslint-disable-next-line no-console
  console.log(`Paths: ${Object.keys(next.paths || {}).length}`)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
