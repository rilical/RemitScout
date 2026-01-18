#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const ragDir = path.join(root, 'agents', 'rag')

const requiredHeadings = [
  /^## Personality/m,
  /^## Purpose/m,
  /^## Primary RAG/m,
  /^## Scope/m,
  /^## Responsibilities/m,
  /^## Non-negotiable invariants/m,
  /^## File map/m,
  /^## Hands-on checks/m,
  /^## Evidence capture template/m,
  /^## Output expectations/m,
  /^## Self-healing loop/m,
]

let failed = false
const files = fs.readdirSync(ragDir).filter(f => f.endsWith('.md'))
for (const file of files) {
  const full = path.join(ragDir, file)
  const content = fs.readFileSync(full, 'utf8')
  const missing = []
  for (const re of requiredHeadings) {
    if (!re.test(content)) {
      missing.push(re.toString())
    }
  }
  const lineCount = content.split('\n').length
  if (lineCount < 200) {
    missing.push(`line_count<200 (${lineCount})`)
  }
  if (missing.length) {
    failed = true
    console.log(`FAIL ${file}`)
    for (const item of missing) console.log(`  missing: ${item}`)
  } else {
    console.log(`OK   ${file} (${lineCount} lines)`) 
  }
}

process.exit(failed ? 1 : 0)
