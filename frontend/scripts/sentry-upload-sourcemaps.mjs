import { readdirSync, rmSync, existsSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const log = (...args) => console.log('[sentry:sourcemaps]', ...args)

const requiredEnv = ['SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT']
const missing = requiredEnv.filter((key) => !(process.env[key] && String(process.env[key]).trim()))
if (missing.length > 0) {
  log(`skipping (missing ${missing.join(', ')})`)
  process.exit(0)
}

const release
  = (process.env.SENTRY_RELEASE && process.env.SENTRY_RELEASE.trim())
    || (process.env.APP_VERSION && process.env.APP_VERSION.trim())
    || (process.env.GITHUB_SHA && process.env.GITHUB_SHA.trim())
    || (process.env.npm_package_version && process.env.npm_package_version.trim())
    || ''

if (!release) {
  log('skipping (missing release: set SENTRY_RELEASE or APP_VERSION)')
  process.exit(0)
}

const nuxtDir = path.join(process.cwd(), '.output', 'public', '_nuxt')
if (!existsSync(nuxtDir)) {
  log(`skipping (missing build output at ${nuxtDir})`)
  process.exit(0)
}

const pnpmBin = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const sentryCliArgsBase = ['exec', 'sentry-cli']
if (process.env.SENTRY_URL && process.env.SENTRY_URL.trim()) {
  sentryCliArgsBase.push('--url', process.env.SENTRY_URL.trim())
}

const run = (args, options = {}) => {
  const result = spawnSync(pnpmBin, [...sentryCliArgsBase, ...args], {
    stdio: 'inherit',
    env: process.env,
    ...options,
  })
  return result.status ?? 1
}

const runAllowFail = (args) => {
  const code = run(args)
  if (code !== 0) {
    log(`command failed (continuing): sentry-cli ${args.join(' ')}`)
  }
}

log(`uploading source maps for release=${release}`)

// Create the release if missing (ignore "already exists" failure).
runAllowFail(['releases', 'new', release])

const uploadCode = run([
  'releases',
  'files',
  release,
  'upload-sourcemaps',
  nuxtDir,
  '--url-prefix',
  '~/_nuxt',
  '--rewrite',
  '--validate',
])

if (uploadCode !== 0) {
  log('upload failed (non-fatal, continuing deploy)')
}

runAllowFail(['releases', 'finalize', release])

// Delete .map files so they aren't publicly served.
const walk = (dir) => {
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full)
      continue
    }
    if (entry.isFile() && entry.name.endsWith('.map')) {
      try {
        rmSync(full, { force: true })
      }
 catch {
        // ignore
      }
    }
  }
}

walk(nuxtDir)
log('done')
