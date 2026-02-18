import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const repoRoot = path.resolve(__dirname, '..', '..', '..')
const ABS_PREFIX = '/Users/omarghabyen/Desktop/Remit-Scout Production V2/'
const MAX_AGENTS_LINES = 160
const MAX_ENTRYPOINTS = 12

const fail = (message: string) => {
  // eslint-disable-next-line no-console
  console.error(`agent surface validation failed: ${message}`)
  process.exitCode = 1
}

const readUtf8 = (p: string) => fs.readFileSync(p, 'utf8')

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

const validateAgentsMdLinks = () => {
  const files = execSync('git ls-files', { cwd: repoRoot, stdio: ['ignore', 'pipe', 'ignore'] })
    .toString('utf8')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  const agentDocs = files.filter((f) => f.endsWith('AGENTS.md'))
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

const validateProviderCatalogMatchesDirs = () => {
  const catalogPath = path.join(repoRoot, '.remit-scout', 'providers', 'catalog.json')
  if (!fs.existsSync(catalogPath)) {
    fail(`missing provider catalog: ${path.relative(repoRoot, catalogPath)}`)
    return
  }

  const raw = JSON.parse(readUtf8(catalogPath)) as any
  const ids = new Set<string>(
    (raw?.providers || [])
      .map((p: any) => String(p?.provider_id || '').trim())
      .filter(Boolean),
  )

  if (ids.size === 0) {
    fail(`provider catalog has no providers: ${path.relative(repoRoot, catalogPath)}`)
    return
  }

  const providersDir = path.join(repoRoot, 'backend', 'plane-b', 'src', 'providers')
  if (!fs.existsSync(providersDir)) {
    fail(`missing providers dir: ${path.relative(repoRoot, providersDir)}`)
    return
  }

  const dirProviders = fs.readdirSync(providersDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => name !== 'node_modules' && name !== 'dist')

  const dirSet = new Set<string>(dirProviders)

  for (const id of ids) {
    if (!dirSet.has(id)) fail(`provider in catalog missing provider directory: provider_id='${id}'`)
  }

  for (const name of dirProviders) {
    if (!ids.has(name)) fail(`provider directory missing from catalog: provider_id='${name}'`)
  }
}

const validateProviderOnboardingDoc = () => {
  const onboardingPath = path.join(repoRoot, 'agents', 'rag', 'provider-onboarding.md')
  if (!fs.existsSync(onboardingPath)) return
  const content = readUtf8(onboardingPath)

  const catalogPath = path.join(repoRoot, '.remit-scout', 'providers', 'catalog.json')
  const raw = JSON.parse(readUtf8(catalogPath)) as any
  const catalogIds = (raw?.providers || [])
    .map((p: any) => String(p?.provider_id || '').trim())
    .filter(Boolean)
    .sort()

  const lines = content.split('\n')
  const headerIndex = lines.findIndex((l) => l.trim().startsWith('## Current provider registry'))
  if (headerIndex < 0) return

  const headerLine = lines[headerIndex] || ''
  const m = headerLine.match(/\((\d+)\)/)
  if (m) {
    const declared = Number(m[1])
    if (Number.isFinite(declared) && declared !== catalogIds.length) {
      fail(`provider-onboarding registry count mismatch: declared=${declared} catalog=${catalogIds.length}`)
    }
  }

  const listLine = lines.slice(headerIndex + 1).find((l) => l.trim().length > 0 && !l.trim().startsWith('Canonical inventory'))
  if (!listLine) {
    fail('provider-onboarding registry list missing')
    return
  }

  const docIds = listLine
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .sort()

  const doc = docIds.join(',')
  const cat = catalogIds.join(',')
  if (doc !== cat) {
    fail(`provider-onboarding registry list mismatch: doc=[${doc}] catalog=[${cat}]`)
  }
}

const main = () => {
  validateAgentsMdLinks()
  validateProviderCatalogMatchesDirs()
  validateProviderOnboardingDoc()

  if (process.exitCode && process.exitCode !== 0) process.exit(process.exitCode)
  // eslint-disable-next-line no-console
  console.log('Agent surfaces validated')
}

main()
