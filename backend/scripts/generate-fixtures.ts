import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const DEFAULT_SOURCE_DIR = path.resolve(process.cwd(), 'plane-b', 'fixtures-raw')
const DEST_ROOT = path.resolve(process.cwd(), 'plane-b', 'src', 'providers')

const REDACTED = '[REDACTED]'
const SENSITIVE_KEY = /(api[-_]?key|token|secret|authorization|cookie|set-cookie|password|bearer)/i
const SENSITIVE_VALUE = /(bearer\s+[a-z0-9._-]+|[a-z0-9_-]{24,}\.[a-z0-9._-]{24,}|x-api-key|authorization:)/i

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

const parseArgs = () => {
  const args = process.argv.slice(2)
  const sourceIndex = args.findIndex((arg) => arg === '--source')
  if (sourceIndex >= 0 && args[sourceIndex + 1]) {
    return { sourceDir: path.resolve(process.cwd(), args[sourceIndex + 1]) }
  }
  return { sourceDir: DEFAULT_SOURCE_DIR }
}

const listFiles = (dir: string): string[] => {
  const entries = readdirSync(dir)
  const files: string[] = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry)
    const stats = statSync(fullPath)
    if (stats.isDirectory()) {
      files.push(...listFiles(fullPath))
      continue
    }
    if (entry.endsWith('.json')) {
      files.push(fullPath)
    }
  }
  return files
}

const sanitizeString = (value: string): string => {
  if (SENSITIVE_VALUE.test(value)) {
    return REDACTED
  }
  return value
}

const sanitizeJson = (value: JsonValue, keyHint?: string): JsonValue => {
  if (typeof value === 'string') {
    if (keyHint && SENSITIVE_KEY.test(keyHint)) {
      return REDACTED
    }
    return sanitizeString(value)
  }
  if (value === null || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJson(item))
  }

  const result: { [key: string]: JsonValue } = {}
  for (const [key, nestedValue] of Object.entries(value)) {
    if (SENSITIVE_KEY.test(key)) {
      result[key] = REDACTED
      continue
    }
    result[key] = sanitizeJson(nestedValue as JsonValue, key)
  }
  return result
}

const resolveDestPath = (sourcePath: string, sourceDir: string): string | null => {
  const relative = path.relative(sourceDir, sourcePath)
  const segments = relative.split(path.sep)
  if (segments.length < 2) {
    return null
  }

  // Expected source layout: <source>/<provider>/.../*.json
  const provider = segments[0]
  const remaining = segments.slice(1)
  return path.join(DEST_ROOT, provider, 'fixtures', ...remaining)
}

const main = () => {
  const { sourceDir } = parseArgs()

  let files: string[] = []
  try {
    files = listFiles(sourceDir)
  } catch (error) {
    console.warn('[fixtures] source scan failed', {
      sourceDir,
      error: error instanceof Error ? error.message : String(error),
    })
    console.log(`[fixtures] source directory not found, skipping: ${sourceDir}`)
    return
  }

  if (files.length === 0) {
    console.log(`[fixtures] no JSON files found in ${sourceDir}, skipping`)
    return
  }

  let written = 0
  for (const file of files) {
    const destPath = resolveDestPath(file, sourceDir)
    if (!destPath) {
      continue
    }

    let parsed: JsonValue
    try {
      parsed = JSON.parse(readFileSync(file, 'utf8')) as JsonValue
    } catch (error) {
      console.warn('[fixtures] failed to parse json fixture, skipping', {
        file,
        error: error instanceof Error ? error.message : String(error),
      })
      continue
    }

    const sanitized = sanitizeJson(parsed)
    mkdirSync(path.dirname(destPath), { recursive: true })
    writeFileSync(destPath, `${JSON.stringify(sanitized, null, 2)}\n`, 'utf8')
    written += 1
  }

  console.log(`[fixtures] wrote ${written} sanitized fixture file(s) to provider fixtures`)
}

main()
