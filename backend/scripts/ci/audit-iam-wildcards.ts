import fs from 'node:fs'
import path from 'node:path'

type Finding = {
  file: string
  line: number
  text: string
}

const repoRoot = path.resolve(__dirname, '..', '..', '..')
const targets = [
  path.join(repoRoot, 'infrastructure', 'iam'),
  path.join(repoRoot, 'infrastructure', 'cdk', 'lib', 'iam.ts'),
]

const filePatterns = [
  /\.ya?ml$/i,
  /\.json$/i,
  /\.ts$/i,
]

const wildcardPatterns = [
  /\bAction\s*:\s*["']\*["']/i,
  /\bResource\s*:\s*["']\*["']/i,
  /\bactions\s*:\s*\[\s*['"]\*['"]\s*\]/i,
  /\bresources\s*:\s*\[\s*['"]\*['"]\s*\]/i,
]

const skipMarker = 'wildcard-ok'

const collectFiles = (targetPath: string): string[] => {
  if (!fs.existsSync(targetPath)) return []
  const stat = fs.statSync(targetPath)
  if (stat.isFile()) return [targetPath]
  if (!stat.isDirectory()) return []

  const output: string[] = []
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
        continue
      }
      if (filePatterns.some((pattern) => pattern.test(entry.name))) {
        output.push(full)
      }
    }
  }
  walk(targetPath)
  return output
}

const scanFile = (filePath: string): Finding[] => {
  const findings: Finding[] = []
  const lines = fs.readFileSync(filePath, 'utf8').split('\n')
  lines.forEach((line, idx) => {
    if (line.includes(skipMarker)) return
    if (wildcardPatterns.some((pattern) => pattern.test(line))) {
      findings.push({
        file: path.relative(repoRoot, filePath),
        line: idx + 1,
        text: line.trim(),
      })
    }
  })
  return findings
}

const writeReport = (findings: Finding[]) => {
  const reportPath = process.env.IAM_AUDIT_REPORT || 'artifacts/iam-wildcard-audit.json'
  const fullPath = path.resolve(repoRoot, reportPath)
  fs.mkdirSync(path.dirname(fullPath), { recursive: true })
  fs.writeFileSync(
    fullPath,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), findings }, null, 2)}\n`,
  )
  return fullPath
}

const run = () => {
  const files = targets.flatMap((target) => collectFiles(target))
  const findings = files.flatMap((file) => scanFile(file))
  const reportPath = writeReport(findings)

  if (findings.length > 0) {
    console.error('IAM wildcard findings detected:')
    for (const finding of findings) {
      console.error(`- ${finding.file}:${finding.line} ${finding.text}`)
    }
    console.error(`Report: ${reportPath}`)
    process.exit(1)
  }

  console.log(`IAM wildcard audit passed. Report: ${reportPath}`)
}

run()

