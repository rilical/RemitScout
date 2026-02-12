import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'

const readStdin = async () => {
  if (process.stdin.isTTY) return null
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  const text = Buffer.concat(chunks).toString('utf8').trim()
  return text.length ? text : null
}

const toKey = (name, version) => `${name}@${version}`

const main = async () => {
  const policyPath = resolve(process.cwd(), 'scripts', 'ci', 'license-policy.json')
  const policy = JSON.parse(await readFile(policyPath, 'utf8'))

  const allowed = new Set(policy.allowedLicenses || [])
  const exceptions = new Map()
  for (const ex of policy.exceptions || []) {
    if (!ex?.name || !ex?.version) continue
    exceptions.set(toKey(ex.name, ex.version), ex)
  }

  const stdin = await readStdin()
  const raw =
    stdin ??
    execSync('pnpm licenses list --prod --json', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 1024 * 1024 * 100,
    })

  const data = JSON.parse(raw)
  const violations = []

  for (const [license, pkgs] of Object.entries(data)) {
    // pnpm returns { "<license>": [{ name, versions: [], ... }] }
    if (allowed.has(license)) continue
    for (const pkg of pkgs) {
      const name = pkg?.name
      const versions = Array.isArray(pkg?.versions) ? pkg.versions : []
      for (const version of versions) {
        const key = toKey(name, version)
        if (exceptions.has(key)) continue
        violations.push({ name, version, license })
      }
    }
  }

  if (violations.length) {
    console.error('License policy violation(s) detected in production dependencies:')
    for (const v of violations) {
      console.error(`- ${v.name}@${v.version}: ${v.license}`)
    }
    console.error('')
    console.error('If this is intentional, add an explicit exception to scripts/ci/license-policy.json with a reason.')
    process.exit(1)
  }

  console.log('License policy OK')
}

await main()

