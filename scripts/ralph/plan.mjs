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

function usage() {
  console.error('Usage:')
  console.error('  node scripts/ralph/plan.mjs sync')
  console.error('  node scripts/ralph/plan.mjs build')
  console.error('  node scripts/ralph/plan.mjs next')
  console.error('  node scripts/ralph/plan.mjs mark <taskId> <todo|in_progress|done|blocked> [note]')
  process.exit(1)
}

const statusPriority = {
  todo: 0,
  in_progress: 1,
  blocked: 2,
  done: 3,
}

const knownStatuses = new Set(Object.keys(statusPriority))

function normalizeRelative(filePath) {
  return path.relative(ROOT_DIR, filePath).replace(/\\/g, '/')
}

function toStatus(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/\s+/g, '_')
  return knownStatuses.has(normalized) ? normalized : 'todo'
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
    if (!id) {
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
  if (!fs.existsSync(PRD_PATH)) {
    return []
  }

  const raw = readText(PRD_PATH).trim()
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    const items = Array.isArray(parsed.items) ? parsed.items : []

    return items
      .map((entry, index) => {
        const id = String(entry.id || `TASK-${String(index + 1).padStart(3, '0')}`).trim()
        const specRefs = Array.isArray(entry.spec_refs)
          ? entry.spec_refs
          : Array.isArray(entry.specRefs)
            ? entry.specRefs
            : []

        return {
          id,
          title: String(entry.title || entry.name || `Task ${id}`),
          status: toStatus(entry.status || 'todo'),
          priority: Number.isFinite(Number(entry.priority)) ? Number(entry.priority) : 100,
          ownership_tag: String(entry.ownership_tag || entry.owner_tag || entry.ownerTag || DEFAULT_OWNERSHIP_TAG),
          traceability_tag: String(entry.traceability_tag || entry.trace_tag || entry.traceabilityTag || DEFAULT_TRACEABILITY_TAG),
          spec_refs: specRefs.length
            ? specRefs.join(', ')
            : String(entry.spec_refs || entry.specRefs || ''),
          notes: String(entry.notes || entry.description || entry.acceptance || ''),
        }
      })
      .filter((task) => task.title && task.id)
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
    priority: Number.isFinite(Number(task.priority)) ? Number(task.priority) : 100,
    ownership_tag: String(task.ownership_tag || task.owner_tag || task.ownerTag || DEFAULT_OWNERSHIP_TAG).trim(),
    traceability_tag: String(task.traceability_tag || task.trace_tag || task.traceabilityTag || DEFAULT_TRACEABILITY_TAG).trim(),
    spec_refs: String(task.spec_refs || '').trim(),
    notes: String(task.notes || '').trim(),
  }
}

function parsePlanRows(markdown) {
  const lines = markdown.split('\n')
  const rows = []

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

    if (segments.length !== 6 && segments.length !== 8) {
      continue
    }

    if (segments.length === 8) {
      const [id, title, status, priority, ownership_tag, traceability_tag, spec_refs, notes] = segments
      rows.push(normalizeTask({ id, title, status, priority, ownership_tag, traceability_tag, spec_refs, notes }))
      continue
    }

    const [id, title, status, priority, spec_refs, notes] = segments
    rows.push(normalizeTask({ id, title, status, priority, spec_refs, notes }))
  }

  return rows.filter((task) => task.id !== EMPTY_PLAN_ID)
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
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return Number(a.priority) - Number(b.priority)
      }
      return String(a.id).localeCompare(String(b.id))
    })

  const header = [
    '# IMPLEMENTATION_PLAN',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Source: ${sourceLabel}`,
    '',
    '| id | title | status | priority | ownership_tag | traceability_tag | spec_refs | notes |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ]

  const rowsText = normalized.map((task) => {
    const id = String(task.id)
    const title = String(task.title).replace(/\|/g, '\\|')
    const status = String(task.status)
    const priority = String(task.priority)
    const ownershipTag = String(task.ownership_tag || DEFAULT_OWNERSHIP_TAG).replace(/\|/g, '\\|')
    const traceabilityTag = String(task.traceability_tag || DEFAULT_TRACEABILITY_TAG).replace(/\|/g, '\\|')
    const specs = String(task.spec_refs || '').replace(/\|/g, '\\|')
    const notes = String(task.notes || '').replace(/\|/g, '\\|')
    return `| ${id} | ${title} | ${status} | ${priority} | ${ownershipTag} | ${traceabilityTag} | ${specs} | ${notes} |`
  })

  if (!rowsText.length) {
    rowsText.push(
      `| ${EMPTY_PLAN_ID} | No open tasks found. Add tasks to ${path.relative(ROOT_DIR, PRD_PATH)} or update progress.txt. | done | 0 | ${DEFAULT_OWNERSHIP_TAG} | ${DEFAULT_TRACEABILITY_TAG} | SPECS | Auto placeholder for empty plans. |`
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

function getAllSources() {
  const progress = parseProgress()
  const fromPrd = readPrdItems()

  if (fromPrd.length > 0) {
    return fromPrd.map((task) => ({
      ...task,
      status: progress.get(task.id)?.status || task.status,
      notes: task.notes || progress.get(task.id)?.note || '',
    }))
  }

  if (progress.size > 0) {
    return Array.from(progress.entries()).map(([id, value]) => ({
      id,
      title: `Task ${id}`,
      status: value.status,
      priority: 100,
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
  const todo = rows.filter((task) => task.id !== EMPTY_PLAN_ID && task.status === 'todo')

  if (todo.length === 0) {
    return null
  }

  todo.sort((a, b) => {
    if (a.priority !== b.priority) {
      return Number(a.priority) - Number(b.priority)
    }
    return String(a.id).localeCompare(String(b.id))
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

function mark() {
  const [idInput, statusInput, ...noteParts] = commandArgs
  const taskId = String(idInput || '').trim()
  const status = toStatus(statusInput)
  const note = noteParts.join(' ').trim()

  if (!taskId) {
    console.error('ERROR: mark requires a task id.')
    usage()
  }

  const rows = readPlanRows()
  if (!rows.length) {
    console.error('ERROR: No implementation plan to update.')
    process.exit(1)
  }

  let updated = false
  for (const row of rows) {
    if (row.id === taskId) {
      row.status = status
      if (note) {
        row.notes = `${row.notes ? `${row.notes}; ` : ''}${note}`.trim()
      }
      updated = true
    }
  }

  if (!updated) {
    console.error(`ERROR: Task ${taskId} not found in ${path.relative(ROOT_DIR, PLAN_PATH)}.`)
    process.exit(1)
  }

  writePlanRows(rows, 'manual status update')
  const progress = parseProgress()
  const next = new Map(progress)
  next.set(taskId, {
    status,
    note: note || (next.get(taskId)?.note || ''),
  })

  const progressRows = Array.from(next.entries()).map(([id, value]) => ({
    id,
    title: id,
    status: value.status,
    priority: 100,
    notes: value.note,
  }))
  writeProgress(progressRows)

  console.log(`Updated ${taskId} -> ${status}`)
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
  default:
    usage()
}
