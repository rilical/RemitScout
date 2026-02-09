import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

// Run via: pnpm -C frontend api:types:generate
const FRONTEND_ROOT = process.cwd()
const REPO_ROOT = path.resolve(FRONTEND_ROOT, '..')

const run = cmd => {
  execSync(cmd, { cwd: REPO_ROOT, stdio: 'inherit' })
}

const ensureDir = p => fs.mkdirSync(p, { recursive: true })

const main = () => {
  const tmpDir = path.join(FRONTEND_ROOT, 'tmp')
  ensureDir(tmpDir)

  const openapiPath = path.join(tmpDir, 'openapi.json')
  const outPath = path.join(FRONTEND_ROOT, 'shared', 'lib', 'api', 'types.ts')
  ensureDir(path.dirname(outPath))

  // Export OpenAPI from backend and strip /api/v1 prefix so frontend uses apiBase + relative paths.
  run(`pnpm --config.engine-strict=false -C backend -s exec tsx scripts/ci/export-openapi.ts --out ${JSON.stringify(openapiPath)} --pretty`)

  // Generate TS types.
  run(`pnpm --config.engine-strict=false -C frontend -s exec openapi-typescript ${JSON.stringify(openapiPath)} --output ${JSON.stringify(outPath)}`)

  const bytes = fs.statSync(outPath).size
  if (bytes < 1000) {
    throw new Error(`Generated types file looks too small (${bytes} bytes): ${outPath}`)
  }

  console.log(`Generated ${outPath} (${bytes} bytes) from ${openapiPath}`)
}

main()
