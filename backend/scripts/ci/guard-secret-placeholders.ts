import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const SECRET_KEYS = new Set([
  'PLANE_A_API_KEYS',
  'PLANE_A_JWT_SECRET',
  'PRIVACY_HASH_SALT',
  'PRIVACY_SESSION_SALT',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'ALERT_UNSUBSCRIBE_SECRET',
  'FIREBASE_SERVER_KEY',
  'PUSH_WEB_VAPID_PRIVATE_KEY',
  'PUSH_VAPID_PRIVATE_KEY',
])

const PLACEHOLDER_PATTERNS = [
  /^change[-_]?me$/i,
  /^placeholder$/i,
  /^example(?:[-_].*)?$/i,
  /^staging[-_]?key$/i,
  /^test[-_]?key$/i,
  /^your[-_].*/i,
  /^<[^>]+>$/,
]

const isRuntimeEnvFile = (filePath: string): boolean => {
  const base = path.basename(filePath)
  if (!base.startsWith('.env')) return false
  if (base.includes('.example')) return false
  return true
}

const parseAssignment = (line: string): { key: string; value: string } | null => {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return null
  const normalized = trimmed.startsWith('export ') ? trimmed.slice('export '.length) : trimmed
  const separatorIndex = normalized.indexOf('=')
  if (separatorIndex <= 0) return null

  const key = normalized.slice(0, separatorIndex).trim()
  if (!key) return null

  let value = normalized.slice(separatorIndex + 1).trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }

  return { key, value }
}

const looksLikePlaceholder = (value: string): boolean => {
  const trimmed = value.trim()
  if (!trimmed) return false
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed))
}

const getTrackedFiles = (): string[] => {
  const raw = execSync('git ls-files -z', { encoding: 'utf8' })
  return raw
    .split('\0')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

const run = () => {
  const runtimeEnvFiles = getTrackedFiles().filter(isRuntimeEnvFile)
  if (runtimeEnvFiles.length === 0) {
    console.log('No committed runtime .env files found; placeholder guard passed.')
    return
  }

  const violations: string[] = []

  for (const filePath of runtimeEnvFiles) {
    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split(/\r?\n/)

    for (let index = 0; index < lines.length; index += 1) {
      const assignment = parseAssignment(lines[index] ?? '')
      if (!assignment) continue
      if (!SECRET_KEYS.has(assignment.key)) continue
      if (!looksLikePlaceholder(assignment.value)) continue

      violations.push(`${filePath}:${index + 1} ${assignment.key} uses placeholder-like value`)
    }
  }

  if (violations.length > 0) {
    console.error('Forbidden placeholder secret values detected in committed runtime env files:')
    for (const violation of violations) {
      console.error(`- ${violation}`)
    }
    process.exit(1)
  }

  console.log('Runtime env placeholder guard passed.')
}

run()
