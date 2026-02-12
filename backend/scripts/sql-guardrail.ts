import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { execSync } from 'node:child_process'

type Match = {
  file: string
  line: number
  text: string
}

const argv = process.argv.slice(2)
const args = new Set(argv)
const changedOnly = args.has('--changed-only')
const mode = args.has('--unsafe-interpolation')
  ? 'unsafe-interpolation'
  : args.has('--inventory')
    ? 'inventory'
    : 'guardrail'

const backendRoot = path.resolve(__dirname, '..')
let scanRoot = path.join(backendRoot, 'plane-b', 'src')

if (args.has('--plane-a')) {
  scanRoot = path.join(backendRoot, 'plane-a', 'src')
} else if (args.has('--plane-c')) {
  scanRoot = path.join(backendRoot, 'plane-c', 'src')
} else if (args.has('--root')) {
  const rootIndex = argv.indexOf('--root')
  const rootValue = rootIndex === -1 ? undefined : argv[rootIndex + 1]
  if (!rootValue) {
    throw new Error('Missing value for --root')
  }
  scanRoot = path.isAbsolute(rootValue)
    ? rootValue
    : path.join(backendRoot, rootValue)
}

const scanLabel = path.relative(backendRoot, scanRoot) || scanRoot

const ignoredDirs = new Set(['node_modules', 'dist'])
if (mode === 'guardrail') {
  ignoredDirs.add('repositories')
}

const queryPatterns = [
  /\bquery\s*\(/,
  /\bpool\.query\s*\(/,
  /\bdb\.query\s*\(/,
]

const allowlistedLinePatterns = [
  /db\.query\(\s*['"`]BEGIN['"`]\s*\)/i,
  /db\.query\(\s*['"`]COMMIT['"`]\s*\)/i,
  /db\.query\(\s*['"`]ROLLBACK['"`]\s*\)/i,
  /query\(\s*['"`]SELECT 1;?['"`]\s*\)/i,
  /sql-guardrail:\s*allow/i,
]

const shouldSkipDir = (dirName: string) => ignoredDirs.has(dirName)

const shouldAllowLine = (line: string) =>
  allowlistedLinePatterns.some(pattern => pattern.test(line))

const getChangedFiles = (): string[] => {
  const run = (command: string) =>
    execSync(command, { cwd: backendRoot, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString('utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

  const baseRef = process.env.GITHUB_BASE_REF?.trim()
  if (baseRef) {
    try {
      return run(`git diff --name-only --diff-filter=ACMRTUXB origin/${baseRef}...HEAD`)
    } catch (error) {
      console.warn('[sql-guardrail] failed to diff against base ref, falling back', {
        baseRef,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  try {
    return run('git diff --name-only --diff-filter=ACMRTUXB HEAD~1 HEAD')
  } catch (error) {
    console.warn('[sql-guardrail] failed to diff HEAD~1..HEAD, falling back', {
      error: error instanceof Error ? error.message : String(error),
    })
  }

  try {
    const statusLines = run('git status --porcelain')
    return statusLines
      .map((line) => line.slice(3).trim())
      .filter(Boolean)
  } catch (error) {
    console.warn('[sql-guardrail] failed to read git status', {
      error: error instanceof Error ? error.message : String(error),
    })
    return []
  }
}

const collectFiles = async (dir: string, results: string[]): Promise<void> => {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue
    }

    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (shouldSkipDir(entry.name)) {
        continue
      }
      await collectFiles(fullPath, results)
      continue
    }

    if (!entry.isFile()) {
      continue
    }

    if (!fullPath.endsWith('.ts') && !fullPath.endsWith('.tsx')) {
      continue
    }

    results.push(fullPath)
  }
}

const findMatches = async (files: string[]): Promise<Match[]> => {
  const matches: Match[] = []
  for (const file of files) {
    const contents = await readFile(file, 'utf8')
    const lines = contents.split(/\r?\n/)

    if (mode === 'unsafe-interpolation') {
      // Flag template-literal SQL with `${...}` interpolation inside query calls.
      // Use `// sql-guardrail: allow` on the same line as the query call to suppress.
      const interpolationRegex =
        /\b(?:query|pool\.query|db\.query)\s*(?:<[^>]*>)?\s*\(\s*`[\s\S]*?\$\{[\s\S]*?`/g
      for (const match of contents.matchAll(interpolationRegex)) {
        const index = match.index ?? 0
        const before = contents.slice(0, index)
        const line = before.split(/\r?\n/).length
        const lineText = lines[line - 1]?.trim() ?? ''
        if (shouldAllowLine(lineText)) {
          continue
        }
        matches.push({
          file: path.relative(backendRoot, file),
          line,
          text: 'Template literal SQL interpolation detected. Use parameter placeholders or add `sql-guardrail: allow` with justification.',
        })
      }
      continue
    }

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index]
      if (!queryPatterns.some(pattern => pattern.test(line))) {
        continue
      }

      if (mode === 'guardrail' && shouldAllowLine(line)) {
        continue
      }

      matches.push({
        file: path.relative(backendRoot, file),
        line: index + 1,
        text: line.trim(),
      })
    }
  }

  return matches
}

const run = async () => {
  const files: string[] = []
  await collectFiles(scanRoot, files)

  const targetFiles = changedOnly
    ? (() => {
      const changed = new Set(
        getChangedFiles()
          .filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'))
          .map((file) => path.resolve(backendRoot, file)),
      )
      return files.filter((file) => changed.has(file))
    })()
    : files

  if (changedOnly && targetFiles.length === 0) {
    console.log(`Guardrail ok: no changed TypeScript files in ${scanLabel}.`)
    return
  }

  const matches = await findMatches(targetFiles)

  if (matches.length === 0) {
    if (mode === 'inventory') {
      console.log(`No SQL query calls found in ${scanLabel}.`)
    } else {
      console.log(`Guardrail ok: no SQL calls outside repositories in ${scanLabel}.`)
    }
    return
  }

  const header =
    mode === 'inventory'
      ? `SQL query calls found in ${scanLabel}:`
      : mode === 'unsafe-interpolation'
        ? `Guardrail failed: unsafe SQL template interpolation found in ${scanLabel}:`
        : `Guardrail failed: SQL calls found outside repositories in ${scanLabel}:`
  console.log(header)

  for (const match of matches) {
    console.log(`${match.file}:${match.line} ${match.text}`)
  }

  if (mode === 'guardrail' || mode === 'unsafe-interpolation') {
    process.exit(1)
  }
}

run().catch(error => {
  console.error('SQL guardrail failed:', error)
  process.exit(1)
})
