import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

// Run via: pnpm -C frontend lint:debt
const FRONTEND_ROOT = process.cwd()
const REPO_ROOT = path.resolve(FRONTEND_ROOT, '..')

const ALLOWED_EMAILS = new Set([
  'support@remit-scout.com',
  'partnership@remit-scout.com',
])

const DISALLOWED_PREFIXES = ['press@', 'compliance@', 'transparency@', 'alerts@']

const gitFiles = () => {
  const out = execSync('git ls-files', { cwd: REPO_ROOT, encoding: 'utf8' })
  return out
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
    .map(rel => path.join(REPO_ROOT, rel))
    .filter(abs => abs.includes(`${path.sep}frontend${path.sep}`))
}

const readText = filePath => fs.readFileSync(filePath, 'utf8')
const splitLines = text => text.split(/\r?\n/)
const rel = filePath => path.relative(REPO_ROOT, filePath)

const findLineMatches = (filePath, re) => {
  const ls = splitLines(readText(filePath))
  const out = []
  for (let i = 0; i < ls.length; i += 1) {
    if (re.test(ls[i])) {
      out.push({ filePath, line: i + 1, text: ls[i].trim() })
    }
  }
  return out
}

const violations = []
const files = gitFiles()

// Disallowed email prefixes anywhere.
for (const prefix of DISALLOWED_PREFIXES) {
  const re = new RegExp(prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  for (const f of files) {
    if (!/\.(vue|ts|js|mjs|md)$/.test(f)) continue
    for (const m of findLineMatches(f, re)) {
      violations.push({ rule: `disallowed_email_prefix:${prefix}`, ...m })
    }
  }
}

// Email allowlist for remit-scout domains.
{
  const re = /\b([A-Z0-9._%+-]+)@(remit-scout\.com|remitscout\.com)\b/ig
  for (const f of files) {
    if (!/\.(vue|ts|js|mjs|md)$/.test(f)) continue
    const ls = splitLines(readText(f))
    for (let i = 0; i < ls.length; i += 1) {
      const line = ls[i]
      re.lastIndex = 0
      let m
      while ((m = re.exec(line)) !== null) {
        const email = `${m[1]}@${m[2]}`.toLowerCase()
        if (!ALLOWED_EMAILS.has(email)) {
          violations.push({ rule: 'email_policy', filePath: f, line: i + 1, text: line.trim() })
        }
      }
    }
  }
}

// Ban dynamic email construction (we only allow the two canonical emails).
{
  const re = /\$\{\s*hostname\s*\}/
  for (const f of files) {
    if (!/\.(vue|ts|js|mjs)$/.test(f)) continue
    for (const m of findLineMatches(f, re)) {
      violations.push({ rule: 'dynamic_email_construction', ...m })
    }
  }
}

// Dead links.
{
  const re = /href\s*=\s*['"]#['"]/i
  for (const f of files) {
    if (!/\.vue$/.test(f)) continue
    for (const m of findLineMatches(f, re)) {
      violations.push({ rule: 'dead_link_href_hash', ...m })
    }
  }
}

// Placeholder tokens in pages (most SEO-visible surface area).
{
  const re = /\bYOUR_[A-Z0-9_]+\b/
  for (const f of files) {
    if (!f.includes(`${path.sep}frontend${path.sep}pages${path.sep}`)) continue
    if (!/\.(vue|ts)$/.test(f)) continue
    for (const m of findLineMatches(f, re)) {
      violations.push({ rule: 'placeholder_token', ...m })
    }
  }
}

// Synthetic trust signals.
{
  const re = /Math\.random\(/
  for (const f of files) {
    const isStructured = f.endsWith(`${path.sep}frontend${path.sep}composables${path.sep}useStructuredData.ts`)
    const isHome = f.includes(`${path.sep}frontend${path.sep}components${path.sep}home${path.sep}`)
    if (!(isStructured || isHome)) continue
    if (!/\.(vue|ts)$/.test(f)) continue
    for (const m of findLineMatches(f, re)) {
      violations.push({ rule: 'synthetic_random_in_product_ui', ...m })
    }
  }
}

if (violations.length) {
  const counts = new Map()
  for (const v of violations) counts.set(v.rule, (counts.get(v.rule) ?? 0) + 1)

  console.error('lint:debt failed. Violations:')
  for (const [rule, count] of [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.error(`- ${rule}: ${count}`)
  }

  console.error('\nDetails:')
  for (const v of violations) {
    console.error(`${v.rule}: ${rel(v.filePath)}:${v.line}: ${v.text}`)
  }

  process.exit(1)
}

console.log('lint:debt passed')
