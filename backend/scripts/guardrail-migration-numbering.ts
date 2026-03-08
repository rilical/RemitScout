/**
 * guardrail-migration-numbering.ts
 *
 * Checks migration files in backend/db/migrations/ for:
 *   1. Duplicate sequence numbers (two files share the same NNN prefix)
 *   2. Gaps in sequence numbers (NNN jumps by more than 1)
 *   3. Files that do not match the NNN_*.sql naming convention
 *
 * Usage:
 *   tsx scripts/guardrail-migration-numbering.ts [--strict]
 *
 * Exit codes:
 *   0 — no violations (or only gaps/duplicates in the known-legacy allowlist
 *       when --strict is NOT passed)
 *   1 — new violations detected
 *
 * Known-legacy allowlist (pre-existing duplicates and gaps that cannot be
 * retroactively renumbered without breaking already-applied schema_migrations
 * rows):
 *
 *   Duplicates: 017, 027, 040, 060, 076, 083
 *   Gaps:       033, 048-051
 */

import { readdirSync } from 'fs'
import path from 'path'

const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'db', 'migrations')

// ── Legacy allowlists ─────────────────────────────────────────────────────────
// These were created before this guardrail existed. They cannot be renumbered
// because the filename IS the primary key stored in public.schema_migrations.
const LEGACY_DUPLICATE_NUMBERS = new Set([17, 27, 40, 60, 76, 83])

// Gap numbers that are intentionally absent (reserved, skipped, or deleted).
const LEGACY_GAP_NUMBERS = new Set([33, 48, 49, 50, 51])

const STRICT = process.argv.includes('--strict')

interface Violation {
  kind: 'duplicate' | 'gap' | 'bad_name'
  message: string
  legacy: boolean
}

function run(): void {
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql'))

  const violations: Violation[] = []

  // ── 1. Naming convention check ─────────────────────────────────────────────
  const SQL_NAME_RE = /^(\d{3})_.+\.sql$/
  const goodFiles: Array<{ num: number; file: string }> = []

  for (const file of files) {
    const m = SQL_NAME_RE.exec(file)
    if (!m) {
      violations.push({
        kind: 'bad_name',
        message: `File does not match NNN_*.sql convention: ${file}`,
        legacy: false,
      })
    } else {
      goodFiles.push({ num: parseInt(m[1], 10), file })
    }
  }

  // ── 2. Duplicate detection ─────────────────────────────────────────────────
  const byNum = new Map<number, string[]>()
  for (const { num, file } of goodFiles) {
    const existing = byNum.get(num) ?? []
    existing.push(file)
    byNum.set(num, existing)
  }

  for (const [num, dupeFiles] of byNum.entries()) {
    if (dupeFiles.length > 1) {
      const isLegacy = LEGACY_DUPLICATE_NUMBERS.has(num)
      violations.push({
        kind: 'duplicate',
        message:
          `Duplicate migration number ${String(num).padStart(3, '0')}: ` +
          dupeFiles.join(', ') +
          (isLegacy ? ' [LEGACY — do not add more]' : ' [NEW VIOLATION]'),
        legacy: isLegacy,
      })
    }
  }

  // ── 3. Gap detection ───────────────────────────────────────────────────────
  const sortedNums = [...byNum.keys()].sort((a, b) => a - b)
  for (let i = 1; i < sortedNums.length; i++) {
    const prev = sortedNums[i - 1]
    const curr = sortedNums[i]
    for (let missing = prev + 1; missing < curr; missing++) {
      const isLegacy = LEGACY_GAP_NUMBERS.has(missing)
      violations.push({
        kind: 'gap',
        message:
          `Gap in migration sequence: ${String(missing).padStart(3, '0')} is missing` +
          (isLegacy ? ' [LEGACY — expected]' : ' [NEW VIOLATION]'),
        legacy: isLegacy,
      })
    }
  }

  // ── Report ─────────────────────────────────────────────────────────────────
  const newViolations = violations.filter((v) => !v.legacy)
  const legacyViolations = violations.filter((v) => v.legacy)

  if (legacyViolations.length > 0 && !STRICT) {
    console.log(
      `\n[migration-numbering] ${legacyViolations.length} legacy violation(s) (allowlisted, skipped in non-strict mode):`,
    )
    for (const v of legacyViolations) {
      console.log(`  [${v.kind.toUpperCase()}] ${v.message}`)
    }
  }

  if (newViolations.length > 0) {
    console.error(
      `\n[migration-numbering] FAIL — ${newViolations.length} NEW violation(s) detected:`,
    )
    for (const v of newViolations) {
      console.error(`  [${v.kind.toUpperCase()}] ${v.message}`)
    }
    console.error(
      '\nFix: use the next available sequential number for new migrations.',
    )
    console.error(
      'Do NOT add new files to the legacy allowlist without a documented reason.\n',
    )
    process.exit(1)
  }

  if (STRICT && legacyViolations.length > 0) {
    console.error(
      `\n[migration-numbering] FAIL (--strict) — ${legacyViolations.length} legacy violation(s) require attention:`,
    )
    for (const v of legacyViolations) {
      console.error(`  [${v.kind.toUpperCase()}] ${v.message}`)
    }
    process.exit(1)
  }

  const nextNum = (sortedNums[sortedNums.length - 1] ?? 0) + 1
  console.log(
    `\n[migration-numbering] PASS — ${goodFiles.length} migration file(s) checked.` +
      ` Next available number: ${String(nextNum).padStart(3, '0')}`,
  )
}

run()
