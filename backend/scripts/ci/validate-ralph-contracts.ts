import fs from 'node:fs'
import path from 'node:path'

const backendDir = path.resolve(__dirname, '..', '..')
const repoRoot = path.resolve(backendDir, '..')

const prdPath = path.join(repoRoot, 'prd.json')
const implementationPlanPath = path.join(repoRoot, 'IMPLEMENTATION_PLAN.md')
const progressPath = path.join(repoRoot, 'progress.txt')

const allowedStatuses = new Set(['todo', 'in_progress', 'blocked', 'done'])
const tagRegex = /^[a-z0-9._:+-]+@v[0-9]+$/
const specRefRegex = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))(?:[A-Za-z0-9._*?\-[\]]+\/)*[A-Za-z0-9._*?\-[\]]+\/?$/
const defaultTraceabilityTag = 'trace.spec_refs+bounded_evidence+rollback_evidence@v1'

const knownOwnershipPrefixes = [
  'owner.',
  'ops.',
]

const knownTraceabilityPrefixes = [
  'trace.',
]

const knownParallelizablePrefixes = [
  'parallel.',
]

const errors: string[] = []

const fail = (message: string) => {
  errors.push(message)
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const normalizeStatus = (value: unknown): string => {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '_')
}

const parseNumeric = (value: unknown, fallback: number): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const splitSpecRefs = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry || '').trim())
      .filter(Boolean)
  }

  return String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

const staticGlobPrefix = (value: string): string => {
  const firstGlobIndex = value.search(/[*?[\]]/)
  if (firstGlobIndex < 0) return value
  const prefix = value.slice(0, firstGlobIndex)
  const slashIndex = prefix.lastIndexOf('/')
  if (slashIndex < 0) return '.'
  return prefix.slice(0, slashIndex + 1) || '.'
}

const validateSpecRef = (specRef: string, label: string) => {
  if (!specRefRegex.test(specRef)) {
    fail(`${label}: invalid spec_ref format '${specRef}'`)
    return
  }

  const lookupRef = /[*?[\]]/.test(specRef)
    ? staticGlobPrefix(specRef)
    : specRef
  const resolved = path.resolve(repoRoot, lookupRef)
  const rel = path.relative(repoRoot, resolved)
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    fail(`${label}: spec_ref escapes repo root '${specRef}'`)
    return
  }

  if (!fs.existsSync(resolved)) {
    fail(`${label}: spec_ref does not exist '${specRef}'`)
  }
}

const validateTraceabilityTag = (tag: unknown, label: string) => {
  const normalized = String(tag || '').trim() || defaultTraceabilityTag
  if (!tagRegex.test(normalized)) {
    fail(`${label}: invalid traceability_tag '${normalized}'`)
    return
  }

  if (!knownTraceabilityPrefixes.some((p) => normalized.startsWith(p))) {
    fail(`${label}: traceability_tag '${normalized}' uses unknown namespace (expected: ${knownTraceabilityPrefixes.join(', ')})`)
  }

  const lowered = normalized.toLowerCase()
  if (!lowered.includes('bounded_evidence')) {
    fail(`${label}: traceability_tag missing bounded_evidence marker '${normalized}'`)
  }
  if (!lowered.includes('rollback_evidence')) {
    fail(`${label}: traceability_tag missing rollback_evidence marker '${normalized}'`)
  }
}

const validateNotesEvidence = (noteValue: unknown, label: string) => {
  const notes = String(noteValue || '').trim()
  if (!notes) {
    fail(`${label}: notes must be non-empty and include bounded/rollback evidence guidance`)
    return
  }
  const lowered = notes.toLowerCase()
  if (!lowered.includes('bounded evidence')) {
    fail(`${label}: notes missing 'bounded evidence' guidance`)
  }
  if (!lowered.includes('rollback evidence')) {
    fail(`${label}: notes missing 'rollback evidence' guidance`)
  }
}

const validatePrd = () => {
  if (!fs.existsSync(prdPath)) {
    fail(`missing file: ${path.relative(repoRoot, prdPath)}`)
    return
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(fs.readFileSync(prdPath, 'utf8'))
  } catch (error: any) {
    fail(`invalid JSON in ${path.relative(repoRoot, prdPath)}: ${error?.message || 'parse error'}`)
    return
  }

  if (!isRecord(parsed)) {
    fail(`${path.relative(repoRoot, prdPath)}: expected object`)
    return
  }

  const items = Array.isArray(parsed.items) ? parsed.items : []
  if (items.length === 0) {
    fail(`${path.relative(repoRoot, prdPath)}: items[] must contain at least one task`)
    return
  }

  const declaredTotalItems = Number(parsed.total_items)
  if (Number.isFinite(declaredTotalItems) && declaredTotalItems !== items.length) {
    fail(`${path.relative(repoRoot, prdPath)}: total_items=${declaredTotalItems} but items.length=${items.length}`)
  }

  const seenIds = new Set<string>()
  const seenPriorities = new Map<number, string>()
  let inProgressCount = 0

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index]
    const label = `prd.items[${index + 1}]`
    if (!isRecord(item)) {
      fail(`${label}: must be an object`)
      continue
    }

    const id = String(item.id || '').trim()
    if (!id) {
      fail(`${label}: missing id`)
      continue
    }
    if (seenIds.has(id)) {
      fail(`${label}: duplicate id '${id}'`)
    }
    seenIds.add(id)

    const title = String(item.title || '').trim()
    if (!title) {
      fail(`${label}/${id}: missing title`)
    }

    const status = normalizeStatus(item.status)
    if (!allowedStatuses.has(status)) {
      fail(`${label}/${id}: invalid status '${String(item.status || '')}'`)
    }
    if (status === 'in_progress') inProgressCount += 1

    const priority = parseNumeric(item.priority, Number.NaN)
    if (!Number.isFinite(priority) || priority < 0) {
      fail(`${label}/${id}: invalid priority '${String(item.priority || '')}'`)
    }
    if (Number.isFinite(priority) && Number.isInteger(priority)) {
      seenPriorities.set(priority, (seenPriorities.get(priority) || '') + (seenPriorities.has(priority) ? `, ${id}` : id))
    }

    const runOrder = item.run_order ?? item.runOrder
    if (runOrder !== undefined) {
      const parsedRunOrder = parseNumeric(runOrder, Number.NaN)
      if (!Number.isFinite(parsedRunOrder) || parsedRunOrder < 0) {
        fail(`${label}/${id}: invalid run_order '${String(runOrder)}'`)
      }
    }

    const specRefs = splitSpecRefs(item.spec_refs ?? item.specRefs)
    if (specRefs.length === 0) {
      fail(`${label}/${id}: missing spec_refs`)
    }
    for (const specRef of specRefs) {
      validateSpecRef(specRef, `${label}/${id}`)
    }

    validateNotesEvidence(item.notes, `${label}/${id}`)

    const parallelizableTag = String(item.parallelizable_tag || '').trim()
    if (parallelizableTag && !tagRegex.test(parallelizableTag)) {
      fail(`${label}/${id}: invalid parallelizable_tag '${parallelizableTag}'`)
    }
    if (parallelizableTag && !knownParallelizablePrefixes.some((p) => parallelizableTag.startsWith(p))) {
      fail(`${label}/${id}: parallelizable_tag '${parallelizableTag}' uses unknown namespace (expected: ${knownParallelizablePrefixes.join(', ')})`)
    }

    const ownershipTag = String(item.ownership_tag || item.owner_tag || '').trim()
    if (ownershipTag && !tagRegex.test(ownershipTag)) {
      fail(`${label}/${id}: invalid ownership_tag '${ownershipTag}'`)
    }
    if (ownershipTag && !knownOwnershipPrefixes.some((p) => ownershipTag.startsWith(p))) {
      fail(`${label}/${id}: ownership_tag '${ownershipTag}' uses unknown namespace (expected: ${knownOwnershipPrefixes.join(', ')})`)
    }

    validateTraceabilityTag(item.traceability_tag, `${label}/${id}`)
  }

  if (inProgressCount > 1) {
    fail(`${path.relative(repoRoot, prdPath)}: expected at most one in_progress item, found ${inProgressCount}`)
  }
}

type PlanRow = {
  id: string
  status: string
  priority: number
  runOrder: number
  parallelizableTag: string
  ownershipTag: string
  traceabilityTag: string
  specRefs: string
  notes: string
}

const parsePlanRows = (markdown: string): PlanRow[] => {
  const lines = markdown.split(/\r?\n/)
  const rows: PlanRow[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('|')) continue
    if (trimmed.includes('---') || trimmed.toLowerCase().includes('id | title')) continue

    const segments = trimmed
      .slice(1, -1)
      .split('|')
      .map((entry) => entry.trim())

    if (segments.length !== 10) continue

    rows.push({
      id: segments[0],
      status: normalizeStatus(segments[2]),
      priority: parseNumeric(segments[3], Number.NaN),
      runOrder: parseNumeric(segments[4], Number.NaN),
      parallelizableTag: segments[5],
      ownershipTag: segments[6],
      traceabilityTag: segments[7],
      specRefs: segments[8],
      notes: segments[9],
    })
  }

  return rows
}

const validateImplementationPlan = () => {
  if (!fs.existsSync(implementationPlanPath)) {
    fail(`missing file: ${path.relative(repoRoot, implementationPlanPath)}`)
    return
  }

  const content = fs.readFileSync(implementationPlanPath, 'utf8')
  const rows = parsePlanRows(content).filter((row) => row.id !== '__RALPH_NO_TASKS__')
  if (rows.length === 0) {
    fail(`${path.relative(repoRoot, implementationPlanPath)}: no task rows found`)
    return
  }

  const seenIds = new Set<string>()
  let inProgressCount = 0
  for (const row of rows) {
    const label = `plan.row/${row.id || '(missing-id)'}`
    if (!row.id) {
      fail(`${label}: missing id`)
      continue
    }
    if (seenIds.has(row.id)) {
      fail(`${label}: duplicate id`)
    }
    seenIds.add(row.id)

    if (!allowedStatuses.has(row.status)) {
      fail(`${label}: invalid status '${row.status}'`)
    }
    if (row.status === 'in_progress') inProgressCount += 1

    if (!Number.isFinite(row.priority) || row.priority < 0) {
      fail(`${label}: invalid priority '${String(row.priority)}'`)
    }
    if (!Number.isFinite(row.runOrder) || row.runOrder < 0) {
      fail(`${label}: invalid run_order '${String(row.runOrder)}'`)
    }

    if (!tagRegex.test(String(row.parallelizableTag || '').trim())) {
      fail(`${label}: invalid parallelizable_tag '${row.parallelizableTag}'`)
    }
    if (!tagRegex.test(String(row.ownershipTag || '').trim())) {
      fail(`${label}: invalid ownership_tag '${row.ownershipTag}'`)
    }

    validateTraceabilityTag(row.traceabilityTag, label)

    const specRefs = splitSpecRefs(row.specRefs)
    if (specRefs.length === 0) {
      fail(`${label}: missing spec_refs`)
    }
    for (const specRef of specRefs) {
      validateSpecRef(specRef, label)
    }

    validateNotesEvidence(row.notes, label)
  }

  if (inProgressCount > 1) {
    fail(`${path.relative(repoRoot, implementationPlanPath)}: expected at most one in_progress row, found ${inProgressCount}`)
  }
}

const validateProgress = () => {
  if (!fs.existsSync(progressPath)) {
    fail(`missing file: ${path.relative(repoRoot, progressPath)}`)
    return
  }

  const lines = fs.readFileSync(progressPath, 'utf8').split(/\r?\n/)
  const seenIds = new Set<string>()
  let inProgressCount = 0

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const [id, statusRaw] = line.split('|')
    const taskId = String(id || '').trim()
    const status = normalizeStatus(statusRaw)

    if (!taskId) {
      fail(`${path.relative(repoRoot, progressPath)}: progress row missing task id`)
      continue
    }
    if (seenIds.has(taskId)) {
      fail(`${path.relative(repoRoot, progressPath)}: duplicate id '${taskId}'`)
    }
    seenIds.add(taskId)

    if (!allowedStatuses.has(status)) {
      fail(`${path.relative(repoRoot, progressPath)}: invalid status '${String(statusRaw || '').trim()}' for '${taskId}'`)
      continue
    }
    if (status === 'in_progress') inProgressCount += 1
  }

  if (inProgressCount > 1) {
    fail(`${path.relative(repoRoot, progressPath)}: expected at most one in_progress row, found ${inProgressCount}`)
  }
}

const validateCrossConsistency = () => {
  // Collect PRD IDs
  const prdIds = new Set<string>()
  if (fs.existsSync(prdPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(prdPath, 'utf8'))
      if (isRecord(parsed) && Array.isArray(parsed.items)) {
        for (const item of parsed.items) {
          if (isRecord(item)) {
            const id = String(item.id || '').trim()
            if (id) prdIds.add(id)
          }
        }
      }
    } catch {
      // already validated in validatePrd
    }
  }

  // Collect Plan IDs
  const planIds = new Set<string>()
  const planStatusMap = new Map<string, string>()
  if (fs.existsSync(implementationPlanPath)) {
    const content = fs.readFileSync(implementationPlanPath, 'utf8')
    const rows = parsePlanRows(content).filter((row) => row.id !== '__RALPH_NO_TASKS__')
    for (const row of rows) {
      planIds.add(row.id)
      planStatusMap.set(row.id, row.status)
    }
  }

  // Collect Progress IDs and statuses
  const progressIds = new Set<string>()
  const progressStatusMap = new Map<string, string>()
  if (fs.existsSync(progressPath)) {
    const lines = fs.readFileSync(progressPath, 'utf8').split(/\r?\n/)
    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      const [id, statusRaw] = line.split('|')
      const taskId = String(id || '').trim()
      const status = normalizeStatus(statusRaw)
      if (taskId) {
        progressIds.add(taskId)
        progressStatusMap.set(taskId, status)
      }
    }
  }

  // Cross-reference: progress IDs should exist in PRD
  if (prdIds.size > 0) {
    for (const progressId of progressIds) {
      if (!prdIds.has(progressId)) {
        fail(`cross-consistency: progress.txt references task '${progressId}' which does not exist in prd.json`)
      }
    }
  }

  // Cross-reference: plan IDs should exist in PRD
  if (prdIds.size > 0) {
    for (const planId of planIds) {
      if (!prdIds.has(planId)) {
        fail(`cross-consistency: IMPLEMENTATION_PLAN.md references task '${planId}' which does not exist in prd.json`)
      }
    }
  }

  // Status consistency: if both plan and progress have a task, statuses should agree
  for (const [taskId, progressStatus] of progressStatusMap) {
    const planStatus = planStatusMap.get(taskId)
    if (planStatus && planStatus !== progressStatus) {
      // Only warn for significant mismatches (done vs not-done)
      if (
        (progressStatus === 'done' && planStatus !== 'done') ||
        (planStatus === 'done' && progressStatus !== 'done')
      ) {
        fail(`cross-consistency: status mismatch for '${taskId}': progress.txt='${progressStatus}' vs IMPLEMENTATION_PLAN.md='${planStatus}'`)
      }
    }
  }

  // PRD total_items consistency
  if (fs.existsSync(prdPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(prdPath, 'utf8'))
      if (isRecord(parsed) && Array.isArray(parsed.items)) {
        const declaredTotal = Number(parsed.total_items)
        if (Number.isFinite(declaredTotal) && declaredTotal !== parsed.items.length) {
          // already checked in validatePrd, but double-check here for cross-consistency
        }
      }
    } catch {
      // already validated
    }
  }
}

const validateSchemaCompliance = () => {
  // Validate PRD schema file exists and is valid JSON
  const prdSchemaPath = path.join(repoRoot, 'SPECS', 'schema.prd.json')
  if (fs.existsSync(prdSchemaPath)) {
    try {
      JSON.parse(fs.readFileSync(prdSchemaPath, 'utf8'))
    } catch (error: any) {
      fail(`schema compliance: SPECS/schema.prd.json is not valid JSON: ${error?.message || 'parse error'}`)
    }
  }

  // Validate Plan schema file exists and is valid JSON
  const planSchemaPath = path.join(repoRoot, 'SPECS', 'schema.plan.json')
  if (fs.existsSync(planSchemaPath)) {
    try {
      JSON.parse(fs.readFileSync(planSchemaPath, 'utf8'))
    } catch (error: any) {
      fail(`schema compliance: SPECS/schema.plan.json is not valid JSON: ${error?.message || 'parse error'}`)
    }
  }

  // Validate Run schema file exists and is valid JSON
  const runSchemaPath = path.join(repoRoot, 'SPECS', 'schema.run.json')
  if (fs.existsSync(runSchemaPath)) {
    try {
      JSON.parse(fs.readFileSync(runSchemaPath, 'utf8'))
    } catch (error: any) {
      fail(`schema compliance: SPECS/schema.run.json is not valid JSON: ${error?.message || 'parse error'}`)
    }
  }

  // Validate progress.txt format (every non-comment line must have pipe-delimited id|status)
  if (fs.existsSync(progressPath)) {
    const lines = fs.readFileSync(progressPath, 'utf8').split(/\r?\n/)
    let lineNum = 0
    for (const rawLine of lines) {
      lineNum += 1
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      const parts = line.split('|')
      if (parts.length < 2) {
        fail(`schema compliance: progress.txt line ${lineNum} does not match id|status|note format`)
      }
    }
  }
}

const validateVersionPins = () => {
  const planMjsPath = path.join(repoRoot, 'scripts', 'ralph', 'plan.mjs')
  if (!fs.existsSync(planMjsPath)) {
    fail(`version-pins: missing scripts/ralph/plan.mjs`)
    return
  }

  const content = fs.readFileSync(planMjsPath, 'utf8')
  const versionPattern = /^const\s+(RALPH_LOOP_PROTOCOL_VERSION|RALPH_PLAN_SCHEMA_VERSION|RALPH_PROGRESS_SCHEMA_VERSION|TASK_LIFECYCLE_VERSION)\s*=\s*'(v\d+)'/gm

  const expectedPins = new Set([
    'RALPH_LOOP_PROTOCOL_VERSION',
    'RALPH_PLAN_SCHEMA_VERSION',
    'RALPH_PROGRESS_SCHEMA_VERSION',
    'TASK_LIFECYCLE_VERSION',
  ])
  const foundPins = new Map<string, string>()

  let match: RegExpExecArray | null
  while ((match = versionPattern.exec(content)) !== null) {
    foundPins.set(match[1], match[2])
  }

  for (const pin of expectedPins) {
    if (!foundPins.has(pin)) {
      fail(`version-pins: missing required version constant '${pin}' in scripts/ralph/plan.mjs`)
    }
  }

  // Validate IMPLEMENTATION_PLAN.md references version pins
  if (fs.existsSync(implementationPlanPath)) {
    const planContent = fs.readFileSync(implementationPlanPath, 'utf8')
    const headerSection = planContent.slice(0, 500)

    for (const [pinName, pinValue] of foundPins) {
      if (pinName === 'TASK_LIFECYCLE_VERSION') continue
      if (!headerSection.includes(pinValue)) {
        fail(`version-pins: IMPLEMENTATION_PLAN.md header does not reference ${pinName}=${pinValue}`)
      }
    }
  }
}

const main = () => {
  validatePrd()
  validateImplementationPlan()
  validateProgress()
  validateCrossConsistency()
  validateSchemaCompliance()
  validateVersionPins()

  if (errors.length > 0) {
    console.error('validate-ralph-contracts failed:\n' + errors.map((entry) => `- ${entry}`).join('\n'))
    process.exit(1)
  }

  console.log('validate-ralph-contracts ok')
}

main()
