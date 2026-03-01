import fs from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(__dirname, '..', '..', '..')
const ABS_PREFIX = '/Users/omarghabyen/Desktop/Remit-Scout Production V2/'
const MAX_AGENTS_LINES = 180
const MAX_ENTRYPOINTS = 12
const ROOT_AGENTS_PATH = 'AGENTS.md'
const REMIT_SCOUT_AGENTS_PATH = '.remit-scout/AGENTS.md'

const ROOT_LOAD_ORDER_PREFIX = [
  'ARCHITECTURE.md',
  'agents/AGENT-MATCH.md',
  'docs/runbooks/agent-deploy-promotion-checklist.md',
  '.remit-scout/AGENTS.md',
]

const ROOT_REQUIRED_LOAD_ORDER = [
  'ARCHITECTURE.md',
  'agents/AGENT-MATCH.md',
  'docs/runbooks/agent-deploy-promotion-checklist.md',
  'agents/rag/<agent>.md',
]

const REMIT_SCOUT_LOAD_ORDER = [
  '.remit-scout/README.md',
  '.remit-scout/skills/catalog.yaml',
  '.remit-scout/reason-codes/catalog.yaml',
  '.remit-scout/providers/catalog.json',
  '.remit-scout/schema/prd.schema.json',
  '.remit-scout/schema/plan.schema.json',
  '.remit-scout/schema/run.schema.json',
]

const fail = (message: string) => {
  // eslint-disable-next-line no-console
  console.error(`agent surface validation failed: ${message}`)
  process.exitCode = 1
}

const readUtf8 = (p: string) => fs.readFileSync(p, 'utf8')

const formatList = (items: string[]) => `[${items.map((item) => `'${item}'`).join(', ')}]`

const arraysEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false
  return a.every((value, index) => value === b[index])
}

const hasPrefix = (items: string[], prefix: string[]) => {
  if (items.length < prefix.length) return false
  return prefix.every((value, index) => items[index] === value)
}

const extractRequiredLoadOrder = (content: string, rel: string) => {
  const lines = content.split('\n')
  const startIndex = lines.findIndex((line) => line.trim() === 'Required load order (before touching code):')
  if (startIndex < 0) {
    fail(`missing 'Required load order (before touching code):' section in ${rel}`)
    return []
  }

  const entries: string[] = []
  for (const line of lines.slice(startIndex + 1)) {
    const trimmed = line.trim()
    if (!trimmed) {
      if (entries.length > 0) break
      continue
    }

    const match = trimmed.match(/^\d+\.\s+`([^`]+)`/)
    if (!match) {
      if (entries.length > 0) break
      continue
    }

    entries.push(match[1].trim())
  }

  if (entries.length === 0) {
    fail(`'Required load order (before touching code):' section has no ordered entries in ${rel}`)
  }

  return entries
}

const resolvePathRef = (ref: string, fromFile: string): string | null => {
  const raw = String(ref || '').trim()
  if (!raw) return null
  if (raw.includes('<') || raw.includes('>')) return null
  if (raw.includes('://')) return null
  if (raw.startsWith('pnpm ') || raw.startsWith('bash ') || raw.startsWith('node ')) return null

  const stripAnchor = raw.split('#')[0].split(':')[0]
  if (!stripAnchor) return null

  if (stripAnchor.startsWith(ABS_PREFIX)) {
    return path.join(repoRoot, stripAnchor.slice(ABS_PREFIX.length))
  }

  // Ignore other absolute paths (not portable to CI).
  if (stripAnchor.startsWith('/')) return null

  const looksLikePath =
    stripAnchor.includes('/')
    || stripAnchor.endsWith('.md')
    || stripAnchor.endsWith('.ts')
    || stripAnchor.endsWith('.yml')
    || stripAnchor.endsWith('.yaml')
    || stripAnchor.endsWith('.json')

  if (!looksLikePath) return null

  if (stripAnchor.startsWith('./') || stripAnchor.startsWith('../')) {
    return path.resolve(path.dirname(fromFile), stripAnchor)
  }

  return path.join(repoRoot, stripAnchor)
}

type Frontmatter = {
  entrypoints: string[]
  evidence_skills: string[]
  common_reason_codes: string[]
}

const parseFrontmatter = (content: string, rel: string): Frontmatter | null => {
  const lines = content.split('\n')
  if (lines.length > MAX_AGENTS_LINES) {
    fail(`AGENTS.md exceeds budget (${lines.length} lines > ${MAX_AGENTS_LINES}): ${rel}`)
  }

  if ((lines[0] || '').trim() !== '---') {
    fail(`Missing YAML frontmatter (expected first line '---'): ${rel}`)
    return null
  }

  const endIndex = lines.slice(1).findIndex((l) => l.trim() === '---')
  if (endIndex < 0) {
    fail(`Unterminated YAML frontmatter (missing closing '---'): ${rel}`)
    return null
  }

  const fmLines = lines.slice(1, 1 + endIndex)
  const out: Frontmatter = { entrypoints: [], evidence_skills: [], common_reason_codes: [] }

  let current: keyof Frontmatter | null = null
  for (const raw of fmLines) {
    const line = raw.replace(/\t/g, '  ')
    const keyMatch = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/)
    if (keyMatch) {
      const key = keyMatch[1] as keyof Frontmatter
      const rest = (keyMatch[2] || '').trim()
      if (key === 'entrypoints' || key === 'evidence_skills' || key === 'common_reason_codes') {
        current = key
        if (rest && rest !== '[]') {
          // Support: key: ["a", "b"] (JSON array)
          if (rest.startsWith('[')) {
            try {
              const arr = JSON.parse(rest) as unknown
              if (Array.isArray(arr)) out[current] = arr.map((x) => String(x)).filter(Boolean)
            } catch {
              fail(`Invalid frontmatter array for ${key} in ${rel}: ${rest}`)
            }
          }
        }
        continue
      }
      current = null
      continue
    }

    const itemMatch = line.match(/^\s*-\s*(.+)\s*$/)
    if (itemMatch && current) {
      const itemRaw = itemMatch[1].trim()
      const item = itemRaw.replace(/^['"]|['"]$/g, '').trim()
      if (item) out[current].push(item)
    }
  }

  if (!('entrypoints' in out)) fail(`Frontmatter missing 'entrypoints' in ${rel}`)
  if (!('evidence_skills' in out)) fail(`Frontmatter missing 'evidence_skills' in ${rel}`)
  if (!('common_reason_codes' in out)) fail(`Frontmatter missing 'common_reason_codes' in ${rel}`)

  if (out.entrypoints.length > MAX_ENTRYPOINTS) {
    fail(`Too many entrypoints in ${rel}: ${out.entrypoints.length} > ${MAX_ENTRYPOINTS}`)
  }

  return out
}

const validateRequiredLoadOrderContracts = () => {
  const rootAgentsAbs = path.join(repoRoot, ROOT_AGENTS_PATH)
  if (!fs.existsSync(rootAgentsAbs)) {
    fail(`missing root AGENTS contract: ${ROOT_AGENTS_PATH}`)
    return
  }

  const rootAgentsContent = readUtf8(rootAgentsAbs)
  const rootAgentsFrontmatter = parseFrontmatter(rootAgentsContent, ROOT_AGENTS_PATH)
  if (rootAgentsFrontmatter && !hasPrefix(rootAgentsFrontmatter.entrypoints, ROOT_LOAD_ORDER_PREFIX)) {
    fail(
      `${ROOT_AGENTS_PATH} frontmatter entrypoints load-order prefix mismatch: expected=${formatList(ROOT_LOAD_ORDER_PREFIX)} actual=${formatList(rootAgentsFrontmatter.entrypoints)}`,
    )
  }

  const rootRequiredLoadOrder = extractRequiredLoadOrder(rootAgentsContent, ROOT_AGENTS_PATH)
  if (rootRequiredLoadOrder.length > 0 && !arraysEqual(rootRequiredLoadOrder, ROOT_REQUIRED_LOAD_ORDER)) {
    fail(
      `${ROOT_AGENTS_PATH} required load order mismatch: expected=${formatList(ROOT_REQUIRED_LOAD_ORDER)} actual=${formatList(rootRequiredLoadOrder)}`,
    )
  }

  const remitScoutAgentsAbs = path.join(repoRoot, REMIT_SCOUT_AGENTS_PATH)
  if (!fs.existsSync(remitScoutAgentsAbs)) {
    fail(`missing IssueOps AGENTS contract: ${REMIT_SCOUT_AGENTS_PATH}`)
    return
  }

  const remitScoutContent = readUtf8(remitScoutAgentsAbs)
  const remitScoutFrontmatter = parseFrontmatter(remitScoutContent, REMIT_SCOUT_AGENTS_PATH)
  if (remitScoutFrontmatter && !arraysEqual(remitScoutFrontmatter.entrypoints, REMIT_SCOUT_LOAD_ORDER)) {
    fail(
      `${REMIT_SCOUT_AGENTS_PATH} frontmatter entrypoints load order mismatch: expected=${formatList(REMIT_SCOUT_LOAD_ORDER)} actual=${formatList(remitScoutFrontmatter.entrypoints)}`,
    )
  }
}

const validateAgentsMdLinks = () => {
  const shouldSkipDirectory = (name: string): boolean => {
    if (name === '.git' || name === 'node_modules' || name === 'dist' || name === 'cdk.out') {
      return true
    }
    // Governance scope only: ignore local/editor metadata trees.
    if (name.startsWith('.') && name !== '.remit-scout') {
      return true
    }
    return false
  }

  const walk = (dir: string): string[] => {
    const out: string[] = []
    const entries = fs.readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))
    for (const entry of entries) {
      if (entry.isDirectory() && shouldSkipDirectory(entry.name)) continue
      const abs = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        out.push(...walk(abs))
      } else if (entry.isFile()) {
        out.push(abs)
      }
    }
    return out
  }

  const agentDocs = walk(repoRoot)
    .map((abs) => path.relative(repoRoot, abs))
    .filter((rel) => rel.endsWith('AGENTS.md'))
    .sort((a, b) => a.localeCompare(b))

  for (const rel of agentDocs) {
    const abs = path.join(repoRoot, rel)
    const content = readUtf8(abs)

    const fm = parseFrontmatter(content, rel)
    if (fm) {
      for (const ep of fm.entrypoints) {
        const resolved = resolvePathRef(ep, abs)
        if (!resolved) continue
        if (!fs.existsSync(resolved)) {
          fail(`missing entrypoint in ${rel}: ${ep} -> ${path.relative(repoRoot, resolved)}`)
        }
      }
    }

    const spans = Array.from(content.matchAll(/`([^`]+)`/g)).map((m) => m[1])

    for (const span of spans) {
      const resolved = resolvePathRef(span, abs)
      if (!resolved) continue
      if (!fs.existsSync(resolved)) {
        fail(`missing ref in ${rel}: \`${span}\` -> ${path.relative(repoRoot, resolved)}`)
      }
    }
  }
}

const main = () => {
  validateRequiredLoadOrderContracts()
  validateAgentsMdLinks()

  if (process.exitCode && process.exitCode !== 0) process.exit(process.exitCode)
  // eslint-disable-next-line no-console
  console.log('Agent surfaces validated')
}

main()
