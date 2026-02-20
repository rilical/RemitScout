#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const parseArgs = () => {
  const args = process.argv.slice(2)
  const result = {
    input: '',
    baseline: '.security/zap-allowlist.json',
    profile: 'baseline',
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
    if (arg === '--profile' && next) {
      result.profile = next
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
    throw new Error('Missing required --input <zap-json-file>')
  }
  return result
}

const readJson = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(content)
}

const defaultBaseline = {
  maxHigh: 0,
  maxMedium: 0,
  allowed: {
    high: [],
    medium: [],
  },
}

const normalizeString = (value) => String(value ?? '').trim()

const toFinding = (siteName, alert, instance) => {
  const alertName = normalizeString(alert.alert)
  const pluginId = normalizeString(alert.pluginid)
  const uri = normalizeString(instance?.uri || instance?.url || siteName)
  const riskCode = Number(alert.riskcode ?? alert.risk ?? 0)
  const fingerprint = `${pluginId}|${alertName}|${uri}`
  return {
    riskCode,
    fingerprint,
    pluginId,
    alertName,
    uri,
    confidence: normalizeString(alert.confidence),
  }
}

const collectFindings = (report) => {
  const findings = []
  const sites = Array.isArray(report.site) ? report.site : []
  for (const site of sites) {
    const siteName = normalizeString(site['@name'])
    const alerts = Array.isArray(site.alerts) ? site.alerts : []
    for (const alert of alerts) {
      const instances = Array.isArray(alert.instances) && alert.instances.length > 0
        ? alert.instances
        : [{}]
      for (const instance of instances) {
        findings.push(toFinding(siteName, alert, instance))
      }
    }
  }
  return findings
}

const classify = (finding) => {
  if (finding.riskCode >= 3) return 'high'
  if (finding.riskCode === 2) return 'medium'
  return 'low'
}

const ensureDir = (filePath) => {
  if (!filePath) return
  const dir = path.dirname(filePath)
  fs.mkdirSync(dir, { recursive: true })
}

const main = () => {
  const args = parseArgs()
  const report = readJson(args.input)
  const baseline = fs.existsSync(args.baseline)
    ? readJson(args.baseline)
    : defaultBaseline

  const findings = collectFindings(report)
  const highFindings = findings.filter((f) => classify(f) === 'high')
  const mediumFindings = findings.filter((f) => classify(f) === 'medium')

  const allowedHigh = new Set(
    Array.isArray(baseline?.allowed?.high) ? baseline.allowed.high : [],
  )
  const allowedMedium = new Set(
    Array.isArray(baseline?.allowed?.medium) ? baseline.allowed.medium : [],
  )

  const newHigh = highFindings.filter((f) => !allowedHigh.has(f.fingerprint))
  const newMedium = mediumFindings.filter((f) => !allowedMedium.has(f.fingerprint))

  const maxHigh = Number.isFinite(Number(baseline?.maxHigh)) ? Number(baseline.maxHigh) : 0
  const maxMedium = Number.isFinite(Number(baseline?.maxMedium)) ? Number(baseline.maxMedium) : 0

  const violations = []
  if (newHigh.length > maxHigh) {
    violations.push(
      `Non-allowlisted high-risk findings (${newHigh.length}) exceed allowed max (${maxHigh})`,
    )
  }
  if (newMedium.length > maxMedium) {
    violations.push(
      `Non-allowlisted medium-risk findings (${newMedium.length}) exceed allowed max (${maxMedium})`,
    )
  }

  const summary = {
    profile: args.profile,
    input: args.input,
    baseline: args.baseline,
    totals: {
      findings: findings.length,
      high: highFindings.length,
      medium: mediumFindings.length,
      low: findings.length - highFindings.length - mediumFindings.length,
    },
    newFindings: {
      high: newHigh.length,
      medium: newMedium.length,
    },
    nonAllowlistedTotals: {
      high: newHigh.length,
      medium: newMedium.length,
    },
    violations,
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
  console.error(`ZAP findings check failed: ${message}`)
  process.exit(1)
}
