import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

import { parse as parseYaml } from 'yaml'

type Severity = 'sev0' | 'sev1' | 'sev2' | 'sev3'
type Domain =
  | 'provider_health'
  | 'queue'
  | 'api_latency'
  | 'freshness'
  | 'indices'
  | 'exports'
  | 'infra_drift'
  | 'security'
  | 'other'
  | 'pulse'

type ReasonCodeDef = {
  code: string
  default_severity: Severity
  description: string
  suggested_next_skill_ids?: string[]
  domain: Domain
}

type ReasonCodeCatalog = {
  version: number
  reason_codes: ReasonCodeDef[]
}

const backendDir = path.resolve(__dirname, '..', '..')
const repoRoot = path.resolve(backendDir, '..')

const catalogPath = path.join(repoRoot, '.remit-scout', 'reason-codes', 'catalog.yaml')
const reasonCodeRegex = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/
const severityRank: Record<Severity, number> = { sev0: 0, sev1: 1, sev2: 2, sev3: 3 }
const triageSeverityFloorBySkill: Partial<Record<string, Severity>> = {
  'manual.human_triage': 'sev2',
}

const meetsSeverityFloor = (severity: Severity, floor: Severity): boolean => {
  return severityRank[severity] >= severityRank[floor]
}

const gitLsFiles = (pattern: string): string[] => {
  const res = spawnSync('git', ['ls-files', pattern], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
  if (res.status !== 0) return []
  return String(res.stdout || '')
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => path.join(repoRoot, x))
}

const readJsonFile = (filePath: string): any => {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

const loadCatalog = (): ReasonCodeCatalog => {
  if (!fs.existsSync(catalogPath)) {
    throw new Error(`Missing reason code catalog: ${catalogPath}`)
  }
  const raw = parseYaml(fs.readFileSync(catalogPath, 'utf8')) as any
  const version = Number(raw?.version)
  const reasonCodes = Array.isArray(raw?.reason_codes) ? raw.reason_codes : []
  if (!Number.isInteger(version) || version < 1) {
    throw new Error(`Invalid reason code catalog version in ${catalogPath}`)
  }
  return { version, reason_codes: reasonCodes }
}

const scanReasonCodes = (files: string[]): Set<string> => {
  const used = new Set<string>()
  const re = /reason_code\s*:\s*['"`]([^'"`]+)['"`]/g

  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8')
    for (;;) {
      const m = re.exec(text)
      if (!m) break
      const code = String(m[1] || '').trim()
      if (code) used.add(code)
    }
  }

  return used
}

const collectReasonCodesFromRunRecord = (record: any, label: string, errors: string[]): string[] => {
  const collected: string[] = []

  const pushCode = (value: unknown, scope: string) => {
    const code = String(value || '').trim()
    if (!code) return
    collected.push(code)
    if (!reasonCodeRegex.test(code)) {
      errors.push(`${label}: invalid reason code format in ${scope}: ${code}`)
    }
  }

  const findings = Array.isArray(record?.results?.findings) ? record.results.findings : []
  for (const finding of findings) {
    pushCode(finding?.reason_code, 'results.findings[].reason_code')
  }

  const decisionReasonCodes = Array.isArray(record?.decision_record?.reason_codes)
    ? record.decision_record.reason_codes
    : []
  for (const code of decisionReasonCodes) {
    pushCode(code, 'decision_record.reason_codes[]')
  }

  const humanInLoopReasonCodes = Array.isArray(record?.decision_record?.human_in_loop?.reason_codes)
    ? record.decision_record.human_in_loop.reason_codes
    : []
  for (const code of humanInLoopReasonCodes) {
    pushCode(code, 'decision_record.human_in_loop.reason_codes[]')
  }

  return collected
}

const scanRunArtifactReasonCodes = (files: string[], errors: string[]): Set<string> => {
  const used = new Set<string>()

  for (const filePath of files) {
    let record: any
    try {
      record = readJsonFile(filePath)
    } catch (error: any) {
      errors.push(`Failed to parse JSON in ${path.relative(repoRoot, filePath)}: ${error?.message || 'parse error'}`)
      continue
    }

    const codes = collectReasonCodesFromRunRecord(record, path.relative(repoRoot, filePath), errors)
    for (const code of codes) {
      used.add(code)
    }
  }

  return used
}

const main = () => {
  const catalog = loadCatalog()
  const defs = catalog.reason_codes
  const known = new Set(defs.map((d) => String(d?.code || '').trim()).filter(Boolean))

  const errors: string[] = []

  for (const d of defs) {
    const code = String(d?.code || '').trim()
    const desc = String(d?.description || '').trim()
    const sev = String(d?.default_severity || '').trim()
    const domain = String(d?.domain || '').trim()
    const suggested = Array.isArray(d?.suggested_next_skill_ids)
      ? d.suggested_next_skill_ids.map((skillId) => String(skillId || '').trim()).filter(Boolean)
      : []

    if (!code) errors.push(`Catalog entry missing code: ${JSON.stringify(d)}`)
    if (code && !reasonCodeRegex.test(code)) errors.push(`Invalid code format: ${code}`)
    if (code && code.length > 120) errors.push(`Code too long (>120): ${code}`)
    if (!desc) errors.push(`Catalog entry missing description: ${code}`)
    if (desc.length > 200) errors.push(`Description too long (>200): ${code}`)
    if (!['sev0', 'sev1', 'sev2', 'sev3'].includes(sev)) errors.push(`Invalid default_severity for ${code}: ${sev}`)
    if (![
      'provider_health',
      'queue',
      'api_latency',
      'freshness',
      'indices',
      'exports',
      'infra_drift',
      'security',
      'other',
      'pulse',
    ].includes(domain)) errors.push(`Invalid domain for ${code}: ${domain}`)

    if (sev === 'sev0' || sev === 'sev1' || sev === 'sev2' || sev === 'sev3') {
      for (const skillId of suggested) {
        const floor = triageSeverityFloorBySkill[skillId]
        if (!floor) continue
        if (!meetsSeverityFloor(sev, floor)) {
          errors.push(`Invalid incident severity mapping for triage task ${skillId} on ${code}: default_severity=${sev} requires >=${floor}`)
        }
      }
    }
  }

  const evidenceFiles = gitLsFiles('backend/scripts/evidence/*.ts')
  const usedInEvidenceScripts = scanReasonCodes(evidenceFiles)
  const runArtifactFiles = [
    ...gitLsFiles('.remit-scout/templates/run.template.json'),
    ...gitLsFiles('.remit-scout/cases/*/runs/*.json'),
  ]
  const usedInRunArtifacts = scanRunArtifactReasonCodes(runArtifactFiles, errors)
  const used = new Set<string>([...usedInEvidenceScripts, ...usedInRunArtifacts])

  for (const code of used) {
    if (!reasonCodeRegex.test(code)) errors.push(`Invalid reason_code format: ${code}`)
    if (!known.has(code)) errors.push(`Unknown reason_code (not in catalog): ${code}`)
  }

  if (errors.length) {
     
    console.error('validate-reason-codes failed:\n' + errors.map((e) => `- ${e}`).join('\n'))
    process.exit(1)
  }

   
  console.log(
    `validate-reason-codes ok (catalog=${known.size} used_total=${used.size} `
    + `used_in_evidence=${usedInEvidenceScripts.size} used_in_run_artifacts=${usedInRunArtifacts.size})`,
  )
}

main()
