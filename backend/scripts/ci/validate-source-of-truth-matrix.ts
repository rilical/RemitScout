import fs from 'node:fs'
import path from 'node:path'

import Ajv2020 from 'ajv/dist/2020'

const repoRoot = path.resolve(__dirname, '..', '..', '..')

const matrixPath = path.join(repoRoot, 'SPECS', 'source-of-truth-matrix.json')
const schemaPath = path.join(repoRoot, '.remit-scout', 'schema', 'source-of-truth-matrix.schema.json')

const ownerTagPattern = /^[a-z0-9._:+-]+@v[0-9]+$/

const readJson = (p: string): unknown => JSON.parse(fs.readFileSync(p, 'utf8'))

const main = () => {
  const errors: string[] = []

  if (!fs.existsSync(matrixPath)) {
    console.error(`validate-source-of-truth-matrix failed: missing matrix file: ${matrixPath}`)
    process.exit(1)
  }

  if (!fs.existsSync(schemaPath)) {
    console.error(`validate-source-of-truth-matrix failed: missing schema file: ${schemaPath}`)
    process.exit(1)
  }

  const matrix = readJson(matrixPath) as any
  const schema = readJson(schemaPath) as any

  // 1. Validate against JSON Schema
  const ajv = new Ajv2020({ allErrors: true })
  const validate = ajv.compile(schema)
  if (!validate(matrix)) {
    for (const err of validate.errors || []) {
      errors.push(`schema: ${err.instancePath || '/'} ${err.message}`)
    }
  }

  const concerns: any[] = Array.isArray(matrix?.concerns) ? matrix.concerns : []

  // 2. Assert concern_id uniqueness
  const seenIds = new Set<string>()
  for (const c of concerns) {
    const id = String(c?.concern_id || '')
    if (!id) continue
    if (seenIds.has(id)) {
      errors.push(`duplicate concern_id: ${id}`)
    }
    seenIds.add(id)
  }

  for (const c of concerns) {
    const id = String(c?.concern_id || '<unknown>')

    // 3. Assert owner_tag matches pattern
    const tag = String(c?.owner_tag || '')
    if (tag && !ownerTagPattern.test(tag)) {
      errors.push(`${id}: owner_tag does not match pattern: ${tag}`)
    }

    // 4. Assert canonical_path resolves to an existing file or directory
    const canonical = String(c?.canonical_path || '')
    if (canonical) {
      const resolved = path.join(repoRoot, canonical)
      if (!fs.existsSync(resolved)) {
        errors.push(`${id}: canonical_path does not exist: ${canonical}`)
      }
    }

    // 5. Assert ci_validator path exists (when non-null)
    const validator = c?.ci_validator
    if (validator !== null && validator !== undefined) {
      const validatorStr = String(validator)
      if (validatorStr) {
        const resolved = path.join(repoRoot, validatorStr)
        if (!fs.existsSync(resolved)) {
          errors.push(`${id}: ci_validator does not exist: ${validatorStr}`)
        }
      }
    }

    // 6. Assert sync_policy.derived_copies[].path exists and content matches canonical
    const strategy = String(c?.sync_policy?.strategy || '')
    const copies = Array.isArray(c?.sync_policy?.derived_copies) ? c.sync_policy.derived_copies : []
    for (const copy of copies) {
      const copyPath = String(copy?.path || '')
      if (!copyPath) continue
      const resolvedCopy = path.join(repoRoot, copyPath)
      if (!fs.existsSync(resolvedCopy)) {
        errors.push(`${id}: sync_policy derived_copy does not exist: ${copyPath}`)
        continue
      }

      // For derived-copy strategy, verify content matches canonical source
      if (strategy === 'derived-copy' && canonical) {
        const resolvedCanonical = path.join(repoRoot, canonical)
        let canonicalFilePath: string | null = null

        if (fs.existsSync(resolvedCanonical) && fs.statSync(resolvedCanonical).isFile()) {
          // Canonical is a file — derived copy should match exactly
          canonicalFilePath = resolvedCanonical
        } else if (fs.existsSync(resolvedCanonical) && fs.statSync(resolvedCanonical).isDirectory()) {
          // Canonical is a directory — infer the source file from the copy filename
          // e.g. SPECS/schema.prd.json -> .remit-scout/schema/prd.schema.json
          const copyBasename = path.basename(copyPath)
          // Try exact match first, then common SPECS naming conventions
          const candidates = [
            path.join(resolvedCanonical, copyBasename),
            // SPECS renames: schema.prd.json -> prd.schema.json
            path.join(resolvedCanonical, copyBasename.replace(/^schema\./, '').replace(/\.json$/, '.schema.json')),
          ]
          for (const candidate of candidates) {
            if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
              canonicalFilePath = candidate
              break
            }
          }
        }

        if (canonicalFilePath) {
          const canonicalContent = fs.readFileSync(canonicalFilePath, 'utf8')
          const copyContent = fs.readFileSync(resolvedCopy, 'utf8')
          if (canonicalContent !== copyContent) {
            const canonicalRel = path.relative(repoRoot, canonicalFilePath)
            errors.push(
              `${id}: derived_copy '${copyPath}' content does not match canonical '${canonicalRel}'. Run 'node scripts/ralph/plan.mjs build' to sync.`,
            )
          }
        }
      }
    }

    // 7. Assert bounded_evidence_note and rollback_evidence_note are non-empty
    const bounded = String(c?.bounded_evidence_note || '').trim()
    if (!bounded) {
      errors.push(`${id}: bounded_evidence_note is empty`)
    }

    const rollback = String(c?.rollback_evidence_note || '').trim()
    if (!rollback) {
      errors.push(`${id}: rollback_evidence_note is empty`)
    }
  }

  // 8. Assert SPECS/README.md manifest exists and count is plausible
  const specsReadme = path.join(repoRoot, 'SPECS', 'README.md')
  if (fs.existsSync(specsReadme)) {
    const readmeContent = fs.readFileSync(specsReadme, 'utf8')
    const totalSyncedMatch = readmeContent.match(/^Total synced: (\d+) files/m)
    if (totalSyncedMatch) {
      const manifestCount = Number(totalSyncedMatch[1])
      const manifestEntries = readmeContent.split('\n').filter((l) => l.startsWith('- ') && l.includes(' -> SPECS/')).length
      if (manifestEntries !== manifestCount) {
        errors.push(
          `SPECS/README.md: Total synced header (${manifestCount}) does not match manifest entry count (${manifestEntries}). Run 'node scripts/ralph/plan.mjs build' to regenerate.`,
        )
      }
    }
  }

  if (errors.length) {
    console.error('validate-source-of-truth-matrix failed:\n' + errors.map((e) => `- ${e}`).join('\n'))
    process.exit(1)
  }

  console.log(
    `validate-source-of-truth-matrix ok (concerns=${concerns.length} unique_ids=${seenIds.size})`,
  )
}

main()
