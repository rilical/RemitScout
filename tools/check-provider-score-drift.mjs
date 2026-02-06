import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptDir, '..')

const FRONTEND_SCORES_PATH = resolve(repoRoot, 'frontend/lib/providerScores.ts')
const BACKEND_METADATA_PATH = resolve(repoRoot, 'backend/plane-a/src/services/provider-metadata.ts')

const readText = (path) => readFileSync(path, 'utf8')

const findObjectLiteral = (source, anchor) => {
  const anchorIdx = source.indexOf(anchor)
  if (anchorIdx === -1) {
    throw new Error(`Could not find anchor: ${anchor}`)
  }
  const startIdx = source.indexOf('{', anchorIdx)
  if (startIdx === -1) {
    throw new Error(`Could not find object literal start after anchor: ${anchor}`)
  }

  let depth = 0
  let inString = false
  let stringQuote = ''
  let escaped = false
  for (let i = startIdx; i < source.length; i++) {
    const ch = source[i]
    if (inString) {
      if (escaped) {
        escaped = false
        continue
      }
      if (ch === '\\\\') {
        escaped = true
        continue
      }
      if (ch === stringQuote) {
        inString = false
        stringQuote = ''
      }
      continue
    }

    if (ch === '"' || ch === '\'') {
      inString = true
      stringQuote = ch
      continue
    }

    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        return source.slice(startIdx, i + 1)
      }
    }
  }

  throw new Error(`Unterminated object literal after anchor: ${anchor}`)
}

const parseTopLevelEntries = (objectLiteral) => {
  const entries = []
  const body = objectLiteral.trim().replace(/^[{]|[}]$/g, '')
  let i = 0

  const skipWhitespaceAndCommas = () => {
    while (i < body.length) {
      const ch = body[i]
      if (ch === ',' || ch === '\n' || ch === '\r' || ch === '\t' || ch === ' ') {
        i++
        continue
      }
      break
    }
  }

  const parseKey = () => {
    const ch = body[i]
    if (ch === '"' || ch === '\'') {
      const quote = ch
      i++
      let key = ''
      let escaped = false
      while (i < body.length) {
        const c = body[i++]
        if (escaped) {
          key += c
          escaped = false
          continue
        }
        if (c === '\\\\') {
          escaped = true
          continue
        }
        if (c === quote) break
        key += c
      }
      return key
    }

    // Identifier-like key (until colon)
    let key = ''
    while (i < body.length) {
      const c = body[i]
      if (c === ':' || c === ' ' || c === '\n' || c === '\r' || c === '\t') break
      key += c
      i++
    }
    return key.trim()
  }

  const expectChar = (expected) => {
    skipWhitespaceAndCommas()
    if (body[i] !== expected) {
      throw new Error(`Expected '${expected}' at position ${i}, found '${body[i] || 'EOF'}'`)
    }
    i++
  }

  const parseObject = () => {
    skipWhitespaceAndCommas()
    if (body[i] !== '{') {
      throw new Error(`Expected '{' at position ${i}, found '${body[i] || 'EOF'}'`)
    }
    const startIdx = i

    let depth = 0
    let inString = false
    let stringQuote = ''
    let escaped = false
    for (; i < body.length; i++) {
      const ch = body[i]
      if (inString) {
        if (escaped) {
          escaped = false
          continue
        }
        if (ch === '\\\\') {
          escaped = true
          continue
        }
        if (ch === stringQuote) {
          inString = false
          stringQuote = ''
        }
        continue
      }

      if (ch === '"' || ch === '\'') {
        inString = true
        stringQuote = ch
        continue
      }

      if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) {
          i++
          return body.slice(startIdx, i)
        }
      }
    }

    throw new Error('Unterminated entry object literal')
  }

  while (i < body.length) {
    skipWhitespaceAndCommas()
    if (i >= body.length) break
    const key = parseKey()
    if (!key) break
    skipWhitespaceAndCommas()
    expectChar(':')
    skipWhitespaceAndCommas()

    // Support entries that are simple references, but we only care about object literals.
    if (body[i] !== '{') {
      // Skip until next comma at top-level.
      while (i < body.length && body[i] !== ',') i++
      continue
    }

    const valueObject = parseObject()
    entries.push({ key, valueObject })
  }

  return entries
}

const extractScoresBySlug = (source, anchor) => {
  const objectLiteral = findObjectLiteral(source, anchor)
  const entries = parseTopLevelEntries(objectLiteral)

  const bySlug = new Map()
  for (const entry of entries) {
    const slugMatch = entry.valueObject.match(/slug:\s*['"]([^'"]+)['"]/)
    const scoreMatch = entry.valueObject.match(/remitScore:\s*([0-9]+(?:\.[0-9]+)?)/)
    if (!slugMatch || !scoreMatch) continue
    const slug = slugMatch[1]
    const score = Number(scoreMatch[1])
    if (!Number.isFinite(score)) continue
    bySlug.set(slug, score)
  }
  return bySlug
}

const frontendSource = readText(FRONTEND_SCORES_PATH)
const backendSource = readText(BACKEND_METADATA_PATH)

const frontendScores = extractScoresBySlug(frontendSource, 'export const PROVIDER_SCORES')
const backendScores = extractScoresBySlug(backendSource, 'const PROVIDER_METADATA')

const sharedSlugs = [...frontendScores.keys()].filter(slug => backendScores.has(slug)).sort()
const mismatches = []

for (const slug of sharedSlugs) {
  const a = frontendScores.get(slug)
  const b = backendScores.get(slug)
  if (a !== b) {
    mismatches.push({ slug, frontend: a, backend: b })
  }
}

if (mismatches.length) {
  console.error('Provider Remit-Score drift detected (frontend vs backend):')
  for (const m of mismatches) {
    console.error(`- ${m.slug}: frontend=${m.frontend} backend=${m.backend}`)
  }
  process.exit(1)
}

console.log(`OK: provider remitScore values match for ${sharedSlugs.length} shared slugs.`)
