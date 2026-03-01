import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

type RouteAuditRow = {
  file: string
  usesZod: boolean
  usesBody: boolean
  usesQuery: boolean
  usesParams: boolean
  likelyMissingSchema: boolean
}

const backendRoot = path.resolve(__dirname, '..', '..')
const routesRoot = path.join(backendRoot, 'plane-a', 'src', 'routes')
const outPath = path.join(backendRoot, '..', 'docs', 'security', 'route-validation-audit.md')

const shouldSkip = (filePath: string) =>
  filePath.endsWith(path.join('routes', 'index.ts')) ||
  filePath.endsWith(path.join('routes', 'billing', 'index.ts')) ||
  filePath.endsWith(path.join('routes', 'ops', 'index.ts'))

const collectFiles = async (dir: string, results: string[]): Promise<void> => {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await collectFiles(fullPath, results)
      continue
    }
    if (!entry.isFile()) continue
    if (!fullPath.endsWith('.ts') && !fullPath.endsWith('.tsx')) continue
    if (shouldSkip(fullPath)) continue
    results.push(fullPath)
  }
}

const scanFile = async (filePath: string): Promise<RouteAuditRow> => {
  const content = await readFile(filePath, 'utf8')
  const usesZod =
    content.includes("from 'zod'") ||
    content.includes('from "zod"') ||
    /\bz\.(object|string|number|enum|array|union|discriminatedUnion)\b/.test(content)
  const usesBody = /\brequest\.body\b/.test(content)
  const usesQuery = /\brequest\.query\b/.test(content)
  const usesParams = /\brequest\.params\b/.test(content)
  const likelyMissingSchema = (usesBody || usesQuery || usesParams) && !usesZod
  return {
    file: path.relative(path.join(backendRoot, 'plane-a', 'src'), filePath),
    usesZod,
    usesBody,
    usesQuery,
    usesParams,
    likelyMissingSchema,
  }
}

const toCheck = (value: boolean) => (value ? '✅' : '—')

const renderMarkdown = (rows: RouteAuditRow[]): string => {
  const missing = rows.filter((row) => row.likelyMissingSchema)
  const lines: string[] = []
  lines.push('# Plane A Route Validation Audit')
  lines.push('')
  lines.push('This file is generated.')
  lines.push('Regenerate with:')
  lines.push('')
  lines.push('```bash')
  lines.push('pnpm -C backend tsx scripts/ci/generate-route-validation-audit.ts')
  lines.push('```')
  lines.push('')
  lines.push(`Last generated: ${new Date().toISOString()}`)
  lines.push('')
  lines.push('## Summary')
  lines.push(`- Total route files scanned: ${rows.length}`)
  lines.push(`- Likely missing schema (uses request.* but no Zod detected): ${missing.length}`)
  lines.push('')
  if (missing.length > 0) {
    lines.push('## Likely Missing Schemas (Review P0)')
    for (const row of missing) {
      lines.push(`- [ ] \`${row.file}\``)
    }
    lines.push('')
  }
  lines.push('## Inventory')
  lines.push('| Route File | Zod | body | query | params | Likely Missing |')
  lines.push('|---|---:|---:|---:|---:|---:|')
  for (const row of rows) {
    lines.push(
      `| \`${row.file}\` | ${toCheck(row.usesZod)} | ${toCheck(row.usesBody)} | ${toCheck(row.usesQuery)} | ${toCheck(row.usesParams)} | ${row.likelyMissingSchema ? '⚠️' : '—'} |`,
    )
  }
  lines.push('')
  return `${lines.join('\n')}\n`
}

const main = async () => {
  const files: string[] = []
  await collectFiles(routesRoot, files)
  files.sort()

  const rows = await Promise.all(files.map(scanFile))
  rows.sort((a, b) => a.file.localeCompare(b.file))

  const markdown = renderMarkdown(rows)
  await writeFile(outPath, markdown, 'utf8')
   
  console.log(`Wrote ${path.relative(backendRoot, outPath)}`)
}

main().catch((error) => {
   
  console.error(error)
  process.exit(1)
})

