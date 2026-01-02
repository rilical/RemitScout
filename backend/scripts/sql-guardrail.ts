import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

type Match = {
  file: string
  line: number
  text: string
}

const argv = process.argv.slice(2)
const args = new Set(argv)
const mode = args.has('--inventory') ? 'inventory' : 'guardrail'

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

  const matches = await findMatches(files)

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
      : `Guardrail failed: SQL calls found outside repositories in ${scanLabel}:`
  console.log(header)

  for (const match of matches) {
    console.log(`${match.file}:${match.line} ${match.text}`)
  }

  if (mode === 'guardrail') {
    process.exit(1)
  }
}

run().catch(error => {
  console.error('SQL guardrail failed:', error)
  process.exit(1)
})
