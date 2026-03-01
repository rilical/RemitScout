import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const backendDir = path.resolve(__dirname, '..', '..')
const repoRoot = path.resolve(backendDir, '..')

const CODE_MAP_MARKER = 'LLM Code Map:'
const MAX_LINES_WITHOUT_MAP = 400
const HEADER_SCAN_LINES = 80

const fail = (message: string) => {
   
  console.error(`validate-code-maps failed: ${message}`)
  process.exitCode = 1
}

const git = (args: string[]): string => {
  const res = spawnSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
  if (res.status !== 0) return ''
  return String(res.stdout || '')
}

const gitLsFiles = (): string[] => {
  return git(['ls-files'])
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)
}

const resolveBaseRef = (): string | null => {
  const base = String(process.env.GITHUB_BASE_REF || '').trim()
  if (base) return `origin/${base}`
  return 'origin/main'
}

const gitChangedFiles = (): string[] => {
  const baseRef = resolveBaseRef()
  if (!baseRef) return []

  // Compute a merge-base so PRs and main builds behave similarly.
  const mergeBase = git(['merge-base', 'HEAD', baseRef]).trim()
  if (!mergeBase) return []

  return git(['diff', '--name-only', '--diff-filter=AM', `${mergeBase}..HEAD`])
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)
}

const parseArgs = () => {
  const args = new Set(process.argv.slice(2))
  const changedOnly = args.has('--changed-only')
  return { changedOnly }
}

const shouldCheck = (rel: string): boolean => {
  return rel.endsWith('.ts') || rel.endsWith('.tsx') || rel.endsWith('.vue')
}

const main = () => {
  const { changedOnly } = parseArgs()
  const files = changedOnly ? gitChangedFiles() : gitLsFiles()

  const candidates = files.filter(shouldCheck)
  for (const rel of candidates) {
    const abs = path.join(repoRoot, rel)
    if (!fs.existsSync(abs)) continue
    const text = fs.readFileSync(abs, 'utf8')
    const lines = text.split('\n')
    if (lines.length <= MAX_LINES_WITHOUT_MAP) continue

    const header = lines.slice(0, HEADER_SCAN_LINES).join('\n')
    if (!header.includes(CODE_MAP_MARKER)) {
      fail(`${rel} is ${lines.length} lines but is missing '${CODE_MAP_MARKER}' in first ${HEADER_SCAN_LINES} lines`)
    }
  }

  if (process.exitCode && process.exitCode !== 0) process.exit(process.exitCode)
   
  console.log(`validate-code-maps ok (changed_only=${changedOnly ? 'true' : 'false'} scanned=${candidates.length})`)
}

main()

