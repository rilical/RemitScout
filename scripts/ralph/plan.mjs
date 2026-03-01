#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const ROOT_DIR = process.cwd()
const PLAN_PATH = process.env.RALPH_PLAN_FILE || process.env.PATH_PLAN_FILE || process.env.PLAN_FILE || path.join(ROOT_DIR, 'IMPLEMENTATION_PLAN.md')
const PROGRESS_PATH = process.env.RALPH_PROGRESS_FILE || path.join(ROOT_DIR, 'progress.txt')
const PRD_PATH = process.env.RALPH_PRD_FILE || path.join(ROOT_DIR, 'prd.json')
const SPECS_DIR = process.env.RALPH_SPECS_DIR || path.join(ROOT_DIR, 'SPECS')
const MAX_SYNC_BYTES = 1024 * 1024
const CODEX_SKILLS_DIR = process.env.RALPH_CODEX_SKILLS_DIR || process.env.CODEX_SKILLS_DIR || path.join(os.homedir(), '.codex', 'skills')
const SKILL_FILTER = new Set(
  (process.env.RALPH_SKILL_FILTER || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => value.toLowerCase())
)

const [,, command, ...commandArgs] = process.argv
const EMPTY_PLAN_ID = '__RALPH_NO_TASKS__'
const DEFAULT_OWNERSHIP_TAG = 'owner.unassigned@v1'
const DEFAULT_TRACEABILITY_TAG = 'trace.spec_refs+bounded_evidence+rollback_evidence@v1'
const DEFAULT_PARALLELIZABLE_TAG = 'parallel.serial_only@v1'
const DEFAULT_PRIORITY = 100
const DEFAULT_RUN_ORDER = Number.MAX_SAFE_INTEGER

/** Ralph Loop Protocol version -- pinned for backward-compat enforcement */
const RALPH_LOOP_PROTOCOL_VERSION = 'v2'
const RALPH_PLAN_SCHEMA_VERSION = 'v2'
const RALPH_PROGRESS_SCHEMA_VERSION = 'v1'
const MAX_PLACEHOLDER_DETAIL = 5
const MAX_POLICY_DETAIL = 5
const MAX_RECONCILE_DETAIL = 5
const MAX_RECONCILE_NOTE_LENGTH = 120
const PLACEHOLDER_ID_PATTERNS = [
  /^TASK-\d+$/i,
  /^(TODO|TBD|PLACEHOLDER)(?:[-_].*)?$/i,
]

function usage() {
  console.error('Usage:')
  console.error('  node scripts/ralph/plan.mjs sync')
  console.error('  node scripts/ralph/plan.mjs build')
  console.error('  node scripts/ralph/plan.mjs reconcile-progress [lifecycle stage]')
  console.error('  node scripts/ralph/plan.mjs next')
  console.error('  node scripts/ralph/plan.mjs mark <taskId> <todo|in_progress|done|blocked> [note]')
  console.error('  node scripts/ralph/plan.mjs version')
  process.exit(1)
}

const statusPriority = {
  todo: 0,
  in_progress: 1,
  blocked: 2,
  done: 3,
}

const TASK_LIFECYCLE_VERSION = 'v1'
const taskLifecycleTransitions = {
  v1: {
    todo: new Set(['in_progress', 'blocked']),
    in_progress: new Set(['done', 'blocked', 'todo']),
    blocked: new Set(['todo', 'in_progress']),
    done: new Set(),
  },
}

const knownStatuses = new Set(Object.keys(statusPriority))

function normalizeNumeric(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeRunOrder(value, fallback) {
  const parsed = normalizeNumeric(value, fallback)
  return parsed >= 0 ? parsed : fallback
}

/**
 * Compute topological depth for each task based on depends_on edges.
 * Tasks with unmet dependencies receive a higher depth, pushing them later.
 * Returns a Map<string, number> of task id -> topological depth.
 */
function computeDependencyDepth(tasks) {
  const idSet = new Set(tasks.map((t) => t.id))
  const depsMap = new Map()
  for (const task of tasks) {
    const deps = (task.depends_on || []).filter((dep) => idSet.has(dep))
    depsMap.set(task.id, deps)
  }

  const depths = new Map()
  const visiting = new Set()

  function resolve(id) {
    if (depths.has(id)) return depths.get(id)
    if (visiting.has(id)) {
      // Cycle detected -- break by assigning depth 0
      return 0
    }
    visiting.add(id)
    const deps = depsMap.get(id) || []
    let maxDepth = 0
    for (const dep of deps) {
      maxDepth = Math.max(maxDepth, resolve(dep) + 1)
    }
    visiting.delete(id)
    depths.set(id, maxDepth)
    return maxDepth
  }

  for (const task of tasks) {
    resolve(task.id)
  }

  return depths
}

/**
 * Check if a task's dependencies are all satisfied (done status).
 */
function areDependenciesSatisfied(task, statusMap) {
  const deps = task.depends_on || []
  for (const dep of deps) {
    const depStatus = statusMap.get(dep)
    if (depStatus !== 'done') {
      return false
    }
  }
  return true
}

function compareTaskOrder(a, b) {
  // First sort by dependency depth (tasks with no deps come first)
  const aDepth = a._dependency_depth ?? 0
  const bDepth = b._dependency_depth ?? 0
  if (aDepth !== bDepth) {
    return aDepth - bDepth
  }

  const aPriority = normalizeNumeric(a.priority, DEFAULT_PRIORITY)
  const bPriority = normalizeNumeric(b.priority, DEFAULT_PRIORITY)
  if (aPriority !== bPriority) {
    return aPriority - bPriority
  }

  const aRunOrder = normalizeRunOrder(a.run_order, DEFAULT_RUN_ORDER)
  const bRunOrder = normalizeRunOrder(b.run_order, DEFAULT_RUN_ORDER)
  if (aRunOrder !== bRunOrder) {
    return aRunOrder - bRunOrder
  }

  return String(a.id).localeCompare(String(b.id))
}

function isPlaceholderTaskId(value) {
  const id = String(value || '').trim()
  if (!id || id === EMPTY_PLAN_ID) {
    return true
  }
  return PLACEHOLDER_ID_PATTERNS.some((pattern) => pattern.test(id))
}

function isPlaceholderTaskTitle(value, id = '') {
  const title = String(value || '').trim()
  if (!title) {
    return true
  }
  if (/^(TODO|TBD|PLACEHOLDER)$/i.test(title)) {
    return true
  }
  const normalizedId = String(id || '').trim()
  if (normalizedId && title.toLowerCase() === `task ${normalizedId}`.toLowerCase() && isPlaceholderTaskId(normalizedId)) {
    return true
  }
  return false
}

function formatBoundedPlaceholderSummary(entries) {
  const bounded = entries.slice(0, MAX_PLACEHOLDER_DETAIL)
  const detail = bounded.map((entry) => `${entry.id || `item#${entry.index}`}: ${entry.reasons.join(', ')}`).join(' | ')
  const suffix = entries.length > bounded.length ? ` | +${entries.length - bounded.length} more` : ''
  return `${detail}${suffix}`
}

function formatBoundedTaskList(tasks) {
  const bounded = tasks.slice(0, MAX_POLICY_DETAIL)
  const detail = bounded.map((task) => task.id).join(', ')
  const suffix = tasks.length > bounded.length ? `, +${tasks.length - bounded.length} more` : ''
  return `${detail}${suffix}`
}

function collectInProgressTasks(rows) {
  return rows.filter((task) => task.id !== EMPTY_PLAN_ID && task.status === 'in_progress')
}

function normalizeRelative(filePath) {
  return path.relative(ROOT_DIR, filePath).replace(/\\/g, '/')
}

function toStatus(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/\s+/g, '_')
  return knownStatuses.has(normalized) ? normalized : 'todo'
}

function normalizeStatusInput(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '_')
}

function isAllowedLifecycleTransition(version, fromStatus, toStatusValue) {
  if (fromStatus === toStatusValue) {
    return true
  }

  const versionTransitions = taskLifecycleTransitions[version]
  if (!versionTransitions) {
    return false
  }

  const allowedTargets = versionTransitions[fromStatus]
  if (!allowedTargets) {
    return false
  }

  return allowedTargets.has(toStatusValue)
}

function allowedTransitionsSummary(version, status) {
  const versionTransitions = taskLifecycleTransitions[version]
  if (!versionTransitions || !versionTransitions[status]) {
    return '(unknown)'
  }
  const allowedTargets = Array.from(versionTransitions[status].values())
  return allowedTargets.length > 0 ? allowedTargets.join('|') : '(terminal)'
}

function splitNoteSegments(value) {
  return String(value || '')
    .split(';')
    .map((segment) => segment.trim())
    .filter(Boolean)
}

function mergeNotesIdempotent(existingNote, incomingNote) {
  const existingSegments = splitNoteSegments(existingNote)
  const incomingSegments = splitNoteSegments(incomingNote)

  if (incomingSegments.length === 0) {
    return existingSegments.join('; ')
  }

  const seen = new Set()
  const merged = []
  for (const segment of [...existingSegments, ...incomingSegments]) {
    const fingerprint = segment.toLowerCase()
    if (seen.has(fingerprint)) {
      continue
    }
    seen.add(fingerprint)
    merged.push(segment)
  }

  return merged.join('; ')
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function readText(filePath, fallback = '') {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : fallback
}

function shouldSkipDir(relativeDir, allowDotDirs = false) {
  const normalized = normalizeRelative(path.join(ROOT_DIR, relativeDir)).split(path.sep).join('/')
  const parts = normalized.split('/').filter(Boolean)

  return parts.some((part) => {
    if (part.startsWith('.') && !allowDotDirs && part !== '.remit-scout') {
      return true
    }

    if (!part || part === 'node_modules' || part === '.git' || part === '.ralph' || part === 'SPECS' || part === '.next' || part === '.turbo' || part === '.cache' || part === 'dist' || part === 'build') {
      return true
    }
    return part === 'cdk.out' || part.startsWith('cdk.out.')
  })
}

function copyFileAndTrack(state, sourcePath, targetPath, sourceLabel, note) {
  if (!fs.existsSync(sourcePath)) {
    return
  }

  const sourceSize = fs.statSync(sourcePath).size
  if (sourceSize > MAX_SYNC_BYTES) {
    state.skipped.push({
      source: sourceLabel,
      reason: `file > ${MAX_SYNC_BYTES} bytes`,
    })
    return
  }

  ensureDir(targetPath)
  fs.copyFileSync(sourcePath, targetPath)

  const targetRel = normalizeRelative(targetPath)
  const targetDisplay = targetRel.replace(/^SPECS\//, '')
  state.copied.add(targetRel)
  state.catalog.push({
    source: sourceLabel,
    target: targetDisplay,
    note,
  })
}

function collectFiles(baseDir, predicate, options = {}) {
  const allowDotDirs = options.allowDotDirs || false
  const anchorDir = options.anchorDir || baseDir
  const found = []
  const walk = (currentDir) => {
    const rel = path.relative(anchorDir, currentDir)
    if (rel && shouldSkipDir(rel, allowDotDirs)) {
      return
    }

    let entries = []
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      const childPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        walk(childPath)
        continue
      }

      if (!entry.isFile()) {
        continue
      }

      if (predicate(childPath)) {
        found.push(childPath)
      }
    }
  }

  walk(baseDir)
  return found.sort((a, b) => normalizeRelative(a).localeCompare(normalizeRelative(b)))
}

function parseProgress() {
  const raw = readText(PROGRESS_PATH).split('\n')
  const map = new Map()

  for (const line of raw) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const [id, status, ...noteParts] = trimmed.split('|').map((value) => value.trim())
    if (!id || isPlaceholderTaskId(id)) {
      continue
    }

    map.set(id, {
      status: toStatus(status || 'todo'),
      note: noteParts.join('|').trim(),
    })
  }

  return map
}

function readPrdItems() {
  const emptyResult = {
    prdExists: false,
    hasItemsArray: false,
    itemCount: 0,
    placeholderCount: 0,
    tasks: [],
  }

  if (!fs.existsSync(PRD_PATH)) {
    return emptyResult
  }

  emptyResult.prdExists = true

  const raw = readText(PRD_PATH).trim()
  if (!raw) {
    return emptyResult
  }

  try {
    const parsed = JSON.parse(raw)
    const hasItemsArray = Array.isArray(parsed.items)
    const items = hasItemsArray ? parsed.items : []
    const placeholderEntries = []

    const tasks = items
      .map((entry, index) => {
        const record = entry && typeof entry === 'object' ? entry : {}
        const explicitId = String(record.id || '').trim()
        const explicitTitle = String(record.title || record.name || '').trim()
        const id = explicitId || `TASK-${String(index + 1).padStart(3, '0')}`
        const title = explicitTitle || `Task ${id}`
        const specRefs = Array.isArray(record.spec_refs)
          ? record.spec_refs
          : Array.isArray(record.specRefs)
            ? record.specRefs
            : []
        const runOrderValue = record.run_order ?? record.runOrder ?? record.run_order_index ?? record.runOrderIndex ?? record.order_index

        const reasons = []
        if (!explicitId) {
          reasons.push('missing id')
        }
        if (!explicitTitle) {
          reasons.push('missing title')
        }
        if (isPlaceholderTaskId(id)) {
          reasons.push('placeholder id')
        }
        if (isPlaceholderTaskTitle(title, id)) {
          reasons.push('placeholder title')
        }

        if (reasons.length > 0) {
          placeholderEntries.push({
            index: index + 1,
            id,
            reasons,
          })
          return null
        }

        const dependsOn = Array.isArray(record.depends_on)
          ? record.depends_on.map((d) => String(d).trim()).filter(Boolean)
          : Array.isArray(record.dependsOn)
            ? record.dependsOn.map((d) => String(d).trim()).filter(Boolean)
            : []

        return {
          id,
          title,
          status: toStatus(record.status || 'todo'),
          priority: normalizeNumeric(record.priority, DEFAULT_PRIORITY),
          run_order: normalizeRunOrder(runOrderValue, index + 1),
          parallelizable_tag: String(
            record.parallelizable_tag
            || record.parallelization_tag
            || record.parallel_tag
            || record.parallelizableTag
            || record.parallelizationTag
            || record.parallelTag
            || DEFAULT_PARALLELIZABLE_TAG
          ),
          ownership_tag: String(record.ownership_tag || record.owner_tag || record.ownerTag || DEFAULT_OWNERSHIP_TAG),
          traceability_tag: String(record.traceability_tag || record.trace_tag || record.traceabilityTag || DEFAULT_TRACEABILITY_TAG),
          spec_refs: specRefs.length
            ? specRefs.join(', ')
            : String(record.spec_refs || record.specRefs || ''),
          notes: String(record.notes || record.description || record.acceptance || ''),
          depends_on: dependsOn,
        }
      })
      .filter(Boolean)
      .filter((task) => task.title && task.id)

    if (placeholderEntries.length > 0) {
      console.warn(
        `WARN: Ignored ${placeholderEntries.length} placeholder PRD item(s) while building ${path.relative(ROOT_DIR, PLAN_PATH)}: ${formatBoundedPlaceholderSummary(placeholderEntries)}`
      )
    }

    return {
      prdExists: true,
      hasItemsArray,
      itemCount: items.length,
      placeholderCount: placeholderEntries.length,
      tasks,
    }
  } catch (error) {
    console.error(`ERROR: Failed to parse ${path.relative(ROOT_DIR, PRD_PATH)} as JSON: ${error.message}`)
    process.exit(1)
  }
}

function normalizeTask(task) {
  return {
    id: String(task.id).trim(),
    title: String(task.title || '').trim(),
    status: toStatus(task.status),
    priority: normalizeNumeric(task.priority, DEFAULT_PRIORITY),
    run_order: normalizeRunOrder(task.run_order ?? task.runOrder, DEFAULT_RUN_ORDER),
    parallelizable_tag: String(
      task.parallelizable_tag
      || task.parallelization_tag
      || task.parallel_tag
      || task.parallelizableTag
      || task.parallelizationTag
      || task.parallelTag
      || DEFAULT_PARALLELIZABLE_TAG
    ).trim(),
    ownership_tag: String(task.ownership_tag || task.owner_tag || task.ownerTag || DEFAULT_OWNERSHIP_TAG).trim(),
    traceability_tag: String(task.traceability_tag || task.trace_tag || task.traceabilityTag || DEFAULT_TRACEABILITY_TAG).trim(),
    spec_refs: String(task.spec_refs || '').trim(),
    notes: String(task.notes || '').trim(),
  }
}

function parsePlanRows(markdown) {
  const lines = markdown.split('\n')
  const rows = []
  let parsedRows = 0

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('|')) {
      continue
    }
    if (trimmed.includes('---') || trimmed.toLowerCase().includes('id | title')) {
      continue
    }

    const segments = trimmed
      .slice(1, -1)
      .split('|')
      .map((value) => value.trim())

    if (segments.length !== 6 && segments.length !== 8 && segments.length !== 9 && segments.length !== 10) {
      continue
    }

    const fallbackRunOrder = parsedRows + 1

    if (segments.length === 10) {
      const [id, title, status, priority, run_order, parallelizable_tag, ownership_tag, traceability_tag, spec_refs, notes] = segments
      rows.push(normalizeTask({ id, title, status, priority, run_order, parallelizable_tag, ownership_tag, traceability_tag, spec_refs, notes }))
      parsedRows += 1
      continue
    }

    if (segments.length === 9) {
      const [id, title, status, priority, run_order, ownership_tag, traceability_tag, spec_refs, notes] = segments
      rows.push(normalizeTask({ id, title, status, priority, run_order, ownership_tag, traceability_tag, spec_refs, notes }))
      parsedRows += 1
      continue
    }

    if (segments.length === 8) {
      const [id, title, status, priority, ownership_tag, traceability_tag, spec_refs, notes] = segments
      rows.push(normalizeTask({ id, title, status, priority, run_order: fallbackRunOrder, ownership_tag, traceability_tag, spec_refs, notes }))
      parsedRows += 1
      continue
    }

    const [id, title, status, priority, spec_refs, notes] = segments
    rows.push(normalizeTask({ id, title, status, priority, run_order: fallbackRunOrder, spec_refs, notes }))
    parsedRows += 1
  }

  return rows.filter((task) => !isPlaceholderTaskId(task.id))
}

function readPlanRows() {
  if (!fs.existsSync(PLAN_PATH)) {
    return []
  }
  return parsePlanRows(readText(PLAN_PATH))
}

function writePlanRows(rows, sourceLabel) {
  const normalized = rows
    .map(normalizeTask)
    .slice()
    .sort(compareTaskOrder)

  const header = [
    '# IMPLEMENTATION_PLAN',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Source: ${sourceLabel}`,
    `Protocol: ${RALPH_LOOP_PROTOCOL_VERSION}`,
    `Plan-Schema: ${RALPH_PLAN_SCHEMA_VERSION}`,
    `Progress-Schema: ${RALPH_PROGRESS_SCHEMA_VERSION}`,
    '',
    '| id | title | status | priority | run_order | parallelizable_tag | ownership_tag | traceability_tag | spec_refs | notes |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ]

  const rowsText = normalized.map((task) => {
    const id = String(task.id)
    const title = String(task.title).replace(/\|/g, '\\|')
    const status = String(task.status)
    const priority = String(task.priority)
    const runOrder = String(task.run_order)
    const parallelizableTag = String(task.parallelizable_tag || DEFAULT_PARALLELIZABLE_TAG).replace(/\|/g, '\\|')
    const ownershipTag = String(task.ownership_tag || DEFAULT_OWNERSHIP_TAG).replace(/\|/g, '\\|')
    const traceabilityTag = String(task.traceability_tag || DEFAULT_TRACEABILITY_TAG).replace(/\|/g, '\\|')
    const specs = String(task.spec_refs || '').replace(/\|/g, '\\|')
    const notes = String(task.notes || '').replace(/\|/g, '\\|')
    return `| ${id} | ${title} | ${status} | ${priority} | ${runOrder} | ${parallelizableTag} | ${ownershipTag} | ${traceabilityTag} | ${specs} | ${notes} |`
  })

  if (!rowsText.length) {
    rowsText.push(
      `| ${EMPTY_PLAN_ID} | No open tasks found. Add tasks to ${path.relative(ROOT_DIR, PRD_PATH)} or update progress.txt. | done | 0 | 0 | ${DEFAULT_PARALLELIZABLE_TAG} | ${DEFAULT_OWNERSHIP_TAG} | ${DEFAULT_TRACEABILITY_TAG} | SPECS | Auto placeholder for empty plans; bounded evidence: no actionable tasks discovered; rollback evidence: update PRD/progress then rebuild. |`
    )
  }

  ensureDir(PLAN_PATH)
  fs.writeFileSync(PLAN_PATH, `${header.join('\n')}\n${rowsText.join('\n')}\n`, 'utf8')
}

function writeProgress(rows) {
  const normalized = rows.map(normalizeTask)
  const entries = normalized.map((row) => `${row.id}|${row.status}|${String(row.notes || '').replace(/\n/g, ' ')}`)
  const out = ['# progress.txt', '# id|status|note', ...entries, ''].join('\n')

  ensureDir(PROGRESS_PATH)
  fs.writeFileSync(PROGRESS_PATH, out, 'utf8')
}

function progressMapToRows(progressMap) {
  return Array.from(progressMap.entries()).map(([id, value]) => ({
    id,
    title: id,
    status: value.status,
    priority: DEFAULT_PRIORITY,
    run_order: 0,
    notes: value.note,
  }))
}

function appendRollbackEvidence(note, lifecycleStage) {
  const rollbackNote = progressReconcileRollbackNote(lifecycleStage)
  const trimmed = String(note || '').trim()
  return trimmed ? `${trimmed}; ${rollbackNote}` : rollbackNote
}

function progressReconcileRollbackNote(lifecycleStage) {
  return `rollback evidence: recovered stale in_progress during ${lifecycleStage} (progress.txt reconciliation)`
}

function toBoundedSingleLine(value, maxLength = MAX_RECONCILE_NOTE_LENGTH) {
  const normalized = String(value || '')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) {
    return ''
  }

  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`
}

function formatBoundedReconcileEvidence(entries) {
  if (!entries.length) {
    return 'none'
  }

  const bounded = entries.slice(0, MAX_RECONCILE_DETAIL)
  const detail = bounded
    .map((entry) => {
      const note = toBoundedSingleLine(entry.previousNote)
      return note ? `${entry.id} (${note})` : entry.id
    })
    .join(' | ')
  const suffix = entries.length > bounded.length ? ` | +${entries.length - bounded.length} more` : ''
  return `${detail}${suffix}`
}

function getAllSources() {
  const progress = parseProgress()
  const prdSource = readPrdItems()
  const fromPrd = prdSource.tasks

  if (fromPrd.length > 0) {
    const merged = fromPrd.map((task) => ({
      ...task,
      status: progress.get(task.id)?.status || task.status,
      notes: task.notes || progress.get(task.id)?.note || '',
    }))
    // Annotate tasks with dependency depth for ordering
    const depths = computeDependencyDepth(merged)
    for (const task of merged) {
      task._dependency_depth = depths.get(task.id) || 0
    }
    return merged
  }

  if (prdSource.prdExists) {
    if (!prdSource.hasItemsArray) {
      console.error(`ERROR: ${path.relative(ROOT_DIR, PRD_PATH)} must define an items[] array for plan generation.`)
      process.exit(1)
    }

    if (prdSource.itemCount === 0) {
      console.error(`ERROR: ${path.relative(ROOT_DIR, PRD_PATH)} has an empty items[] array (empty-plan failure mode). Add at least one non-placeholder task.`)
      process.exit(1)
    }

    if (prdSource.placeholderCount >= prdSource.itemCount) {
      console.error(`ERROR: ${path.relative(ROOT_DIR, PRD_PATH)} only produced placeholder tasks (empty-plan failure mode). Add explicit id/title fields before rerunning.`)
      process.exit(1)
    }

    return []
  }

  if (progress.size > 0) {
    return Array.from(progress.entries()).map(([id, value]) => ({
      id,
      title: `Task ${id}`,
      status: value.status,
      priority: DEFAULT_PRIORITY,
      run_order: 0,
      parallelizable_tag: DEFAULT_PARALLELIZABLE_TAG,
      ownership_tag: DEFAULT_OWNERSHIP_TAG,
      traceability_tag: DEFAULT_TRACEABILITY_TAG,
      spec_refs: 'SPECS',
      notes: value.note || 'Derived from progress.txt',
    }))
  }

  return []
}

function nextTodoTask() {
  const rows = readPlanRows()
  const inProgress = collectInProgressTasks(rows)

  if (inProgress.length > 1) {
    console.error(
      `ERROR: One-task-per-iteration policy violation in ${path.relative(ROOT_DIR, PLAN_PATH)}: found ${inProgress.length} in_progress tasks (${formatBoundedTaskList(inProgress)}). Reconcile stale work before selecting the next task.`
    )
    process.exit(1)
  }

  if (inProgress.length === 1) {
    return inProgress[0]
  }

  // Build a status map for dependency satisfaction checks
  const statusMap = new Map()
  for (const row of rows) {
    statusMap.set(row.id, row.status)
  }

  // Also merge in progress.txt for more accurate status picture
  const progress = parseProgress()
  for (const [id, value] of progress.entries()) {
    statusMap.set(id, value.status)
  }

  const todo = rows.filter((task) => {
    if (task.id === EMPTY_PLAN_ID || task.status !== 'todo') {
      return false
    }
    // Skip tasks whose dependencies are not yet satisfied
    if (!areDependenciesSatisfied(task, statusMap)) {
      return false
    }
    return true
  })

  if (todo.length === 0) {
    return null
  }

  todo.sort((a, b) => {
    return compareTaskOrder(a, b)
  })

  return todo[0]
}

function buildSpecCatalog() {
  const state = {
    catalog: [],
    copied: new Set(),
    skipped: [],
  }

  const agentsBundleDir = path.join(SPECS_DIR, 'agents-bundle')
  const skillsBundleDir = path.join(SPECS_DIR, 'skills-bundle')
  try {
    fs.rmSync(agentsBundleDir, { recursive: true, force: true })
    fs.rmSync(skillsBundleDir, { recursive: true, force: true })
  } catch {
    // ignore pre-existing folder cleanup errors; script should continue with empty bundle.
  }

  const addStaticCopy = (sourceRel, targetRel, note) => {
    const sourcePath = path.join(ROOT_DIR, sourceRel)
    const targetPath = path.join(SPECS_DIR, targetRel)
    copyFileAndTrack(state, sourcePath, targetPath, sourceRel, note)
  }

  const allAgents = collectFiles(ROOT_DIR, (candidate) => {
    const rel = normalizeRelative(candidate)
    return path.basename(candidate) === 'AGENTS.md' && !rel.startsWith('.remit-scout/')
  })
  const ragDir = path.join(ROOT_DIR, 'agents', 'rag')

  const shouldIncludeSkill = (skillPath) => {
    if (!SKILL_FILTER.size) {
      return true
    }

    const rel = path.relative(CODEX_SKILLS_DIR, skillPath)
    const relNorm = normalizeRelative(rel)
    const parts = relNorm.split('/').filter(Boolean)
    if (!parts.length) {
      return false
    }

    const topLevel = parts[0].toLowerCase()
    const leaf = path.basename(relNorm).replace(/\.md$/i, '').toLowerCase()
    const relWithoutExt = relNorm.replace(/\.md$/i, '').toLowerCase()

    return (
      SKILL_FILTER.has(topLevel)
      || SKILL_FILTER.has(leaf)
      || SKILL_FILTER.has(relWithoutExt)
    )
  }

  const copyCodexSkills = () => {
    if (!fs.existsSync(CODEX_SKILLS_DIR)) {
      return
    }

    const skillFiles = collectFiles(CODEX_SKILLS_DIR, (candidate) => path.basename(candidate) === 'SKILL.md', {
      allowDotDirs: true,
      anchorDir: CODEX_SKILLS_DIR,
    })

    for (const skillPath of skillFiles) {
      if (!shouldIncludeSkill(skillPath)) {
        continue
      }
      const rel = path.relative(CODEX_SKILLS_DIR, skillPath)
      const targetRel = path.join('skills-bundle', rel)
      copyFileAndTrack(
        state,
        skillPath,
        path.join(SPECS_DIR, targetRel),
        path.posix.join('.codex/skills', normalizeRelative(rel)),
        'Codex skill instruction'
      )
    }
  }

  // fixed governance + schemas + reason-code catalogs used by the runbook loop
  addStaticCopy('AGENTS.md', 'agents.md', 'Primary project contract')
  addStaticCopy('.remit-scout/AGENTS.md', 'remit-scout.agents.md', 'IssueOps contract')
  addStaticCopy('agents/AGENT-MATCH.md', 'agent-match.md', 'Agent routing contract')
  addStaticCopy('ARCHITECTURE.md', 'architecture.md', 'System architecture')
  addStaticCopy('.remit-scout/skills/catalog.yaml', 'skills.catalog.yaml', 'Skill catalog')
  addStaticCopy('.remit-scout/reason-codes/catalog.yaml', 'reason-codes.catalog.yaml', 'Evidence reason codes catalog')
  addStaticCopy('.remit-scout/providers/catalog.json', 'providers.catalog.json', 'Provider catalog')
  addStaticCopy('.remit-scout/schema/prd.schema.json', 'schema.prd.json', 'PRD schema')
  addStaticCopy('.remit-scout/schema/run.schema.json', 'schema.run.json', 'Run schema')
  addStaticCopy('.remit-scout/schema/plan.schema.json', 'schema.plan.json', 'Plan schema')
  addStaticCopy('docs/runbooks/agent-deploy-promotion-checklist.md', 'agent-deploy-promotion-checklist.md', 'Promotion checklist')
  addStaticCopy('docs/runbooks/ralph-verifier.md', 'ralph-verifier.md', 'Ralph verifier contract')
  addStaticCopy('docs/runbooks/ralph-codex-loop.md', 'ralph-codex-loop.md', 'Loop runbook')
  addStaticCopy('frontend/ralph.yml', 'frontend-ralph.yml', 'Frontend Ralph config')

  for (const agentPath of allAgents) {
    const targetRel = path.join('agents-bundle', normalizeRelative(agentPath))
    copyFileAndTrack(state, agentPath, path.join(SPECS_DIR, targetRel), normalizeRelative(agentPath), 'AGENTS contract')
  }

  if (fs.existsSync(ragDir)) {
    const ragFiles = collectFiles(ragDir, (candidate) => candidate.endsWith('.md') && path.basename(candidate) !== 'AGENT-MATCH.md')
    for (const ragPath of ragFiles) {
      const targetRel = path.join('agents-bundle', normalizeRelative(ragPath))
      copyFileAndTrack(state, ragPath, path.join(SPECS_DIR, targetRel), normalizeRelative(ragPath), 'RAG guidance')
    }
  }

  copyCodexSkills()

  const grouped = new Map()
  for (const entry of state.catalog) {
    const sourceGroupRaw = path.posix.dirname(entry.source)
    const sourceGroup = sourceGroupRaw === '.' ? 'root' : sourceGroupRaw
    const lines = grouped.get(sourceGroup) || []
    const targetRel = path.posix.join('SPECS', entry.target)
    lines.push(`- ${entry.source} -> ${targetRel} (${entry.note})`)
    grouped.set(sourceGroup, lines)
  }

  const readmeLines = [
    '# Ralph Loop Specs Bundle',
    '',
    'This directory is the loop-facing copy of governance, skill catalogs, and AGENTS/RAG instruction files.',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Total synced: ${state.copied.size} files (${state.skipped.length} skipped)`,
    '',
    'Governance: sync contract documented in `.remit-scout/AGENTS.md` (Documentation-to-SPECS sync contract).',
    'Source-of-truth matrix: `SPECS/source-of-truth-matrix.json` (canonical ownership, CI validators, sync policies).',
    'Non-manifest files in SPECS: `README.md` (this file, auto-generated), `source-of-truth-matrix.json`, `contract-onboarding.md`.',
    '',
    'Copied artifact manifest:',
    '',
  ]

  for (const sourceGroup of Array.from(grouped.keys()).sort((a, b) => a.localeCompare(b))) {
    readmeLines.push(`## ${sourceGroup}`)
    for (const line of grouped.get(sourceGroup).sort()) {
      readmeLines.push(line)
    }
    readmeLines.push('')
  }

  if (state.skipped.length) {
    readmeLines.push('### Skipped due to file-size limit')
    for (const item of state.skipped) {
      readmeLines.push(`- ${item.source} (${item.reason})`)
    }
    readmeLines.push('')
  }

  const readmePath = path.join(SPECS_DIR, 'README.md')
  ensureDir(readmePath)
  fs.writeFileSync(readmePath, readmeLines.join('\n'), 'utf8')

  const copiedCount = state.copied.size
  const skippedCount = state.skipped.length
  console.log(`Synced ${copiedCount} files into ${path.relative(ROOT_DIR, SPECS_DIR)} (skipped ${skippedCount})`)
}

function build() {
  const tasks = getAllSources()
  const sourceLabel = fs.existsSync(PRD_PATH) ? 'prd.json' : 'progress.txt'
  const normalized = tasks.map(normalizeTask)
  writePlanRows(normalized, sourceLabel)
  console.log(`Wrote ${path.relative(ROOT_DIR, PLAN_PATH)}`)
}

function reconcileProgress() {
  const lifecycleStage = String(commandArgs.join(' ') || 'plan refresh').trim()
  const rollbackEvidenceNote = progressReconcileRollbackNote(lifecycleStage)
  const progress = parseProgress()
  const recovered = []

  for (const [id, value] of progress.entries()) {
    if (value.status !== 'in_progress') {
      continue
    }

    progress.set(id, {
      status: 'todo',
      note: appendRollbackEvidence(value.note, lifecycleStage),
    })
    recovered.push({
      id,
      previousNote: value.note,
    })
  }

  if (recovered.length > 0) {
    writeProgress(progressMapToRows(progress))
  }

  const boundedEvidence = formatBoundedReconcileEvidence(recovered)
  console.log(
    `Reconciled progress.txt stale in_progress tasks during ${lifecycleStage}: ${recovered.length}; bounded evidence: ${boundedEvidence}; rollback evidence: ${rollbackEvidenceNote}`
  )
}

function mark() {
  const [idInput, statusInput, ...noteParts] = commandArgs
  const taskId = String(idInput || '').trim()
  const normalizedStatusInput = normalizeStatusInput(statusInput)
  const status = toStatus(normalizedStatusInput)
  const note = noteParts.join(' ').trim()

  if (!taskId) {
    console.error('ERROR: mark requires a task id.')
    usage()
  }

  if (!normalizedStatusInput || !knownStatuses.has(normalizedStatusInput)) {
    console.error(
      `ERROR: mark requires a valid status (${Array.from(knownStatuses).join('|')}). Received: '${statusInput ?? ''}'.`
    )
    usage()
  }

  const rows = readPlanRows()
  if (!rows.length) {
    console.error('ERROR: No implementation plan to update.')
    process.exit(1)
  }

  if (status === 'in_progress') {
    const conflicting = collectInProgressTasks(rows).filter((task) => task.id !== taskId)
    if (conflicting.length > 0) {
      console.error(
        `ERROR: One-task-per-iteration policy violation in ${path.relative(ROOT_DIR, PLAN_PATH)}: cannot mark ${taskId} as in_progress while ${conflicting.length} other task(s) are already in_progress (${formatBoundedTaskList(conflicting)}).`
      )
      process.exit(1)
    }
  }

  let updated = false
  let planChanged = false
  for (const row of rows) {
    if (row.id === taskId) {
      const currentStatus = row.status
      if (!isAllowedLifecycleTransition(TASK_LIFECYCLE_VERSION, currentStatus, status)) {
        console.error(
          `ERROR: Invalid ${TASK_LIFECYCLE_VERSION} lifecycle transition for ${taskId}: ${currentStatus} -> ${status}. Allowed from ${currentStatus}: ${allowedTransitionsSummary(TASK_LIFECYCLE_VERSION, currentStatus)}. Idempotent same-state writes are allowed.`
        )
        process.exit(1)
      }

      const mergedNotes = mergeNotesIdempotent(row.notes, note)
      const statusChanged = currentStatus !== status
      const notesChanged = mergedNotes !== row.notes

      row.status = status
      row.notes = mergedNotes

      if (statusChanged || notesChanged) {
        planChanged = true
      }

      updated = true
    }
  }

  if (!updated) {
    console.error(`ERROR: Task ${taskId} not found in ${path.relative(ROOT_DIR, PLAN_PATH)}.`)
    process.exit(1)
  }

  if (planChanged) {
    writePlanRows(rows, 'manual status update')
  }

  const progress = parseProgress()
  const next = new Map(progress)
  const existingProgress = next.get(taskId)
  const mergedProgressNote = mergeNotesIdempotent(existingProgress?.note || '', note)
  const progressStatusChanged = !existingProgress || existingProgress.status !== status
  const progressNoteChanged = !existingProgress || mergedProgressNote !== (existingProgress.note || '')

  if (progressStatusChanged || progressNoteChanged) {
    next.set(taskId, {
      status,
      note: mergedProgressNote,
    })

    writeProgress(progressMapToRows(next))
  }

  if (planChanged || progressStatusChanged || progressNoteChanged) {
    console.log(`Updated ${taskId} -> ${status}`)
    return
  }

  console.log(`No-op ${taskId} -> ${status} (idempotent)`)
}

switch (command) {
  case 'sync-specs':
  case 'sync':
    buildSpecCatalog()
    break
  case 'build':
    buildSpecCatalog()
    build()
    break
  case 'reconcile-progress':
    reconcileProgress()
    break
  case 'next':
    {
      const task = nextTodoTask()
      if (!task) {
        process.exit(1)
      }
      process.stdout.write(JSON.stringify(task))
    }
    break
  case 'mark':
    mark()
    break
  case 'version':
    process.stdout.write(JSON.stringify({
      protocol: RALPH_LOOP_PROTOCOL_VERSION,
      plan_schema: RALPH_PLAN_SCHEMA_VERSION,
      progress_schema: RALPH_PROGRESS_SCHEMA_VERSION,
      lifecycle: TASK_LIFECYCLE_VERSION,
    }))
    break
  default:
    usage()
}
