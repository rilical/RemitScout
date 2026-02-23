import fs from 'node:fs'
import path from 'node:path'

import Ajv from 'ajv'
import { parse as parseYaml } from 'yaml'

const repoRoot = path.resolve(__dirname, '..', '..', '..')
const remitScoutDir = path.join(repoRoot, '.remit-scout')

const schemaPath = (name: string) => path.join(remitScoutDir, 'schema', name)
const templatePath = (name: string) => path.join(remitScoutDir, 'templates', name)

const readUtf8 = (p: string) => fs.readFileSync(p, 'utf8')

const readJson = (p: string) => JSON.parse(readUtf8(p)) as unknown

const readYaml = (p: string) => {
  const value = parseYaml(readUtf8(p))
  return value as unknown
}

const fail = (message: string) => {
  // eslint-disable-next-line no-console
  console.error(`issueops contract validation failed: ${message}`)
  process.exitCode = 1
}

const assertFileExists = (p: string) => {
  if (!fs.existsSync(p)) {
    fail(`missing file: ${p}`)
    return false
  }
  return true
}

const validateProviderCatalog = () => {
  const p = path.join(remitScoutDir, 'providers', 'catalog.json')
  if (!assertFileExists(p)) return

  let parsed: any
  try {
    parsed = readJson(p)
  } catch (_e) {
    fail(`invalid JSON: ${p}`)
    return
  }

  const version = Number(parsed?.version)
  if (!Number.isInteger(version) || version < 1) {
    fail(`providers/catalog.json missing/invalid version (expected int >= 1): ${p}`)
  }

  const providers = parsed?.providers
  if (!Array.isArray(providers) || providers.length === 0) {
    fail(`providers/catalog.json missing/empty providers[]: ${p}`)
    return
  }

  const ids = new Set<string>()
  for (const entry of providers) {
    const id = String(entry?.provider_id ?? '').trim()
    if (!id) {
      fail(`providers/catalog.json has provider with missing provider_id: ${p}`)
      continue
    }
    if (ids.has(id)) {
      fail(`providers/catalog.json has duplicate provider_id='${id}': ${p}`)
      continue
    }
    ids.add(id)
    if (!Array.isArray(entry?.health_corridors)) {
      fail(`providers/catalog.json provider_id='${id}' missing health_corridors[]: ${p}`)
    }
  }
}

const buildAjv = () => {
  return new Ajv({
    allErrors: true,
    strict: false,
    allowUnionTypes: true,
  })
}

const formatAjvErrors = (errors: any[] | null | undefined) => {
  if (!errors || errors.length === 0) return '(no details)'
  return errors
    .map((e) => {
      const instance = e.instancePath || '(root)'
      const msg = e.message || 'invalid'
      return `${instance}: ${msg}`
    })
    .join('; ')
}

const validateWithSchema = (
  ajv: Ajv,
  schema: unknown,
  value: unknown,
  label: string,
) => {
  const validate = ajv.compile(schema as any)
  const ok = validate(value)
  if (!ok) {
    fail(`${label}: ${formatAjvErrors(validate.errors as any)}`)
  }
}

const validateTemplatesAndRegistries = () => {
  const ajv = buildAjv()

  const prdSchema = readJson(schemaPath('prd.schema.json'))
  const planSchema = readJson(schemaPath('plan.schema.json'))
  const runSchema = readJson(schemaPath('run.schema.json'))
  const skillSchema = readJson(schemaPath('skill.schema.json'))
  const evidenceSchema = readJson(schemaPath('evidence.schema.json'))

  validateWithSchema(ajv, prdSchema, readYaml(templatePath('prd.template.yaml')), 'templates/prd.template.yaml')
  validateWithSchema(ajv, planSchema, readYaml(templatePath('plan.template.yaml')), 'templates/plan.template.yaml')
  validateWithSchema(ajv, runSchema, readJson(templatePath('run.template.json')), 'templates/run.template.json')
  validateWithSchema(ajv, evidenceSchema, readJson(templatePath('evidence.template.json')), 'templates/evidence.template.json')

  validateWithSchema(
    ajv,
    skillSchema,
    readYaml(path.join(remitScoutDir, 'skills', 'catalog.yaml')),
    'skills/catalog.yaml',
  )
}

const validateCases = () => {
  const ajv = buildAjv()
  const prdSchema = readJson(schemaPath('prd.schema.json'))
  const planSchema = readJson(schemaPath('plan.schema.json'))
  const runSchema = readJson(schemaPath('run.schema.json'))

  const casesDir = path.join(remitScoutDir, 'cases')
  if (!fs.existsSync(casesDir)) return

  const entries = fs.readdirSync(casesDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const caseDir = path.join(casesDir, entry.name)
    const prdPath = path.join(caseDir, 'prd.yaml')
    const planPath = path.join(caseDir, 'plan.yaml')

    if (assertFileExists(prdPath)) {
      validateWithSchema(ajv, prdSchema, readYaml(prdPath), `cases/${entry.name}/prd.yaml`)
    }
    if (assertFileExists(planPath)) {
      validateWithSchema(ajv, planSchema, readYaml(planPath), `cases/${entry.name}/plan.yaml`)
    }

    const runsDir = path.join(caseDir, 'runs')
    if (!fs.existsSync(runsDir)) continue
    const runFiles = fs.readdirSync(runsDir).filter((f) => f.endsWith('.json'))
    for (const f of runFiles) {
      const p = path.join(runsDir, f)
      validateWithSchema(ajv, runSchema, readJson(p), `cases/${entry.name}/runs/${f}`)
    }
  }
}

const main = () => {
  // Basic existence checks
  assertFileExists(schemaPath('prd.schema.json'))
  assertFileExists(schemaPath('plan.schema.json'))
  assertFileExists(schemaPath('run.schema.json'))
  assertFileExists(schemaPath('skill.schema.json'))
  assertFileExists(schemaPath('case-index.schema.json'))
  assertFileExists(schemaPath('evidence.schema.json'))

  assertFileExists(templatePath('prd.template.yaml'))
  assertFileExists(templatePath('plan.template.yaml'))
  assertFileExists(templatePath('run.template.json'))
  assertFileExists(templatePath('evidence.template.json'))

  assertFileExists(path.join(remitScoutDir, 'skills', 'catalog.yaml'))

  validateProviderCatalog()
  validateTemplatesAndRegistries()
  validateCases()

  if (process.exitCode && process.exitCode !== 0) {
    process.exit(process.exitCode)
  }

  // eslint-disable-next-line no-console
  console.log('✅ IssueOps contracts validated')
}

main()
