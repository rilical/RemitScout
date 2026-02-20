#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const parseArgs = () => {
  const args = process.argv.slice(2)
  const result = {
    input: '',
    baseline: '.security/nuclei-allowlist.json',
    out: '',
  }

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    const next = args[i + 1]
    if (arg === '--input' && next) {
      result.input = next
      i += 1
      continue
    }
    if (arg === '--baseline' && next) {
      result.baseline = next
      i += 1
      continue
    }
    if (arg === '--out' && next) {
      result.out = next
      i += 1
      continue
    }
  }

  if (!result.input) {
    throw new Error('Missing required --input <nuclei-json-or-jsonl-file>')
  }

  return result
}

const defaultBaseline = {
  maxCritical: 0,
  maxHigh: 0,
  maxMedium: 0,
  allowed: {
    critical: [],
    high: [],
    medium: [],
  },
}

const ensureDir = (filePath) => {
  if (!filePath) return
  const dir = path.dirname(filePath)
  fs.mkdirSync(dir, { recursive: true })
}

const normalizeString = (value) => String(value ?? '').trim()

const normalizeSeverity = (value) => {
  const severity = normalizeString(value).toLowerCase()
  if (severity === 'critical') return 'critical'
  if (severity === 'high') return 'high'
  if (severity === 'medium') return 'medium'
  if (severity === 'low') return 'low'
  if (severity === 'info') return 'info'
  if (severity === 'informational') return 'info'
  return 'unknown'
}

const toFinding = (raw) => {
  const templateId = normalizeString(raw?.['template-id'] || raw?.template_id || raw?.templateID)
  const matchedAt = normalizeString(
    raw?.['matched-at']
    || raw?.matched_at
    || raw?.host
    || raw?.url
    || raw?.ip,
  )
  const name = normalizeString(raw?.info?.name || raw?.name)
  const severity = normalizeSeverity(raw?.info?.severity || raw?.severity)
  const fingerprint = `${templateId || 'unknown-template'}|${severity}|${matchedAt || 'unknown-target'}`

  return {
    fingerprint,
    templateId,
    matchedAt,
    name,
    severity,
  }
}

const parseJsonOrJsonl = (content, inputPath) => {
  const trimmed = content.trim()
  if (!trimmed) return []

  try {
    const parsed = JSON.parse(trimmed)
    if (Array.isArray(parsed)) return parsed
    if (Array.isArray(parsed?.results)) return parsed.results
    if (parsed && typeof parsed === 'object') return [parsed]
  } catch {
    // fall through and parse JSONL
  }

  const lines = content.split(/\r?\n/)
  const findings = []
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]?.trim() || ''
    if (!line) continue
    try {
      findings.push(JSON.parse(line))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Invalid JSONL in ${inputPath} at line ${i + 1}: ${message}`)
    }
  }

  return findings
}

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'))

const main = () => {
  const args = parseArgs()
  const inputRaw = fs.readFileSync(args.input, 'utf8')
  const parsedFindings = parseJsonOrJsonl(inputRaw, args.input)
  const findings = parsedFindings.map(toFinding)

  const baseline = fs.existsSync(args.baseline)
    ? readJson(args.baseline)
    : defaultBaseline

  const criticalFindings = findings.filter((f) => f.severity === 'critical')
  const highFindings = findings.filter((f) => f.severity === 'high')
  const mediumFindings = findings.filter((f) => f.severity === 'medium')
  const lowFindings = findings.filter((f) => f.severity === 'low')
  const infoFindings = findings.filter((f) => f.severity === 'info')
  const unknownFindings = findings.filter((f) => f.severity === 'unknown')

  const allowedCritical = new Set(Array.isArray(baseline?.allowed?.critical) ? baseline.allowed.critical : [])
  const allowedHigh = new Set(Array.isArray(baseline?.allowed?.high) ? baseline.allowed.high : [])
  const allowedMedium = new Set(Array.isArray(baseline?.allowed?.medium) ? baseline.allowed.medium : [])

  const newCritical = criticalFindings.filter((f) => !allowedCritical.has(f.fingerprint))
  const newHigh = highFindings.filter((f) => !allowedHigh.has(f.fingerprint))
  const newMedium = mediumFindings.filter((f) => !allowedMedium.has(f.fingerprint))

  const maxCritical = Number.isFinite(Number(baseline?.maxCritical)) ? Number(baseline.maxCritical) : 0
  const maxHigh = Number.isFinite(Number(baseline?.maxHigh)) ? Number(baseline.maxHigh) : 0
  const maxMedium = Number.isFinite(Number(baseline?.maxMedium)) ? Number(baseline.maxMedium) : 0

  const violations = []

  if (newCritical.length > maxCritical) {
    violations.push(`Non-allowlisted critical findings (${newCritical.length}) exceed allowed max (${maxCritical})`)
  }
  if (newHigh.length > maxHigh) {
    violations.push(`Non-allowlisted high findings (${newHigh.length}) exceed allowed max (${maxHigh})`)
  }
  if (newMedium.length > maxMedium) {
    violations.push(`Non-allowlisted medium findings (${newMedium.length}) exceed allowed max (${maxMedium})`)
  }

  const summary = {
    input: args.input,
    baseline: args.baseline,
    totals: {
      findings: findings.length,
      critical: criticalFindings.length,
      high: highFindings.length,
      medium: mediumFindings.length,
      low: lowFindings.length,
      info: infoFindings.length,
      unknown: unknownFindings.length,
    },
    newFindings: {
      critical: newCritical.length,
      high: newHigh.length,
      medium: newMedium.length,
    },
    nonAllowlistedTotals: {
      critical: newCritical.length,
      high: newHigh.length,
      medium: newMedium.length,
    },
    violations,
    newCriticalFingerprints: newCritical.map((f) => f.fingerprint),
    newHighFingerprints: newHigh.map((f) => f.fingerprint),
    newMediumFingerprints: newMedium.map((f) => f.fingerprint),
  }

  if (args.out) {
    ensureDir(args.out)
    fs.writeFileSync(args.out, `${JSON.stringify(summary, null, 2)}\n`)
  }

  console.log(JSON.stringify(summary, null, 2))
  if (violations.length > 0) {
    process.exit(1)
  }
}

try {
  main()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Nuclei findings check failed: ${message}`)
  process.exit(1)
}
