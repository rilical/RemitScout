import fs from 'node:fs'
import path from 'node:path'

import Ajv2020 from 'ajv/dist/2020'
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
  console.error(`issueops contract validation failed: ${message}`)
  process.exitCode = 1
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const extractSpecRefs = (value: unknown): string[] => {
  if (!isRecord(value)) return []
  const traceability = value.traceability
  if (!isRecord(traceability)) return []
  const specRefs = traceability.spec_refs
  if (!Array.isArray(specRefs)) return []
  return specRefs.filter((ref): ref is string => typeof ref === 'string')
}

const validateSpecRefs = (value: unknown, label: string) => {
  const specRefs = extractSpecRefs(value)
  for (const specRef of specRefs) {
    if (specRef.trim() !== specRef) {
      fail(`${label}: traceability.spec_refs entry has leading/trailing whitespace: '${specRef}'`)
      continue
    }

    const resolved = path.resolve(repoRoot, specRef)
    const rel = path.relative(repoRoot, resolved)
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      fail(`${label}: traceability.spec_refs entry escapes repo root: '${specRef}'`)
      continue
    }

    if (!fs.existsSync(resolved)) {
      fail(`${label}: traceability.spec_refs entry does not exist: '${specRef}'`)
    }
  }
}

const assertFileExists = (p: string) => {
  if (!fs.existsSync(p)) {
    fail(`missing file: ${p}`)
    return false
  }
  return true
}

const validateProviderCatalog = (): Set<string> => {
  const p = path.join(remitScoutDir, 'providers', 'catalog.json')
  if (!assertFileExists(p)) return new Set()

  let parsed: any
  try {
    parsed = readJson(p)
  } catch (_e) {
    fail(`invalid JSON: ${p}`)
    return new Set()
  }

  const version = Number(parsed?.version)
  if (!Number.isInteger(version) || version < 1) {
    fail(`providers/catalog.json missing/invalid version (expected int >= 1): ${p}`)
  }

  const providers = parsed?.providers
  if (!Array.isArray(providers) || providers.length === 0) {
    fail(`providers/catalog.json missing/empty providers[]: ${p}`)
    return new Set()
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

  return ids
}

const buildAjv = () => {
  return new Ajv2020({
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
  ajv: Ajv2020,
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

  const prdTemplate = readYaml(templatePath('prd.template.yaml'))
  const planTemplate = readYaml(templatePath('plan.template.yaml'))

  validateWithSchema(ajv, prdSchema, prdTemplate, 'templates/prd.template.yaml')
  validateWithSchema(ajv, planSchema, planTemplate, 'templates/plan.template.yaml')
  validateSpecRefs(prdTemplate, 'templates/prd.template.yaml')
  validateSpecRefs(planTemplate, 'templates/plan.template.yaml')
  validateWithSchema(ajv, runSchema, readJson(templatePath('run.template.json')), 'templates/run.template.json')
  validateWithSchema(ajv, evidenceSchema, readJson(templatePath('evidence.template.json')), 'templates/evidence.template.json')

  validateWithSchema(
    ajv,
    skillSchema,
    readYaml(path.join(remitScoutDir, 'skills', 'catalog.yaml')),
    'skills/catalog.yaml',
  )
}

const validateModuleCatalog = (providerIds: Set<string>) => {
  const ajv = buildAjv()
  const schema = readJson(schemaPath('module-catalog.schema.json'))
  const catalogPath = path.join(remitScoutDir, 'modules', 'catalog.json')
  if (!assertFileExists(catalogPath)) return

  let catalog: any
  try {
    catalog = readJson(catalogPath)
  } catch (_error) {
    fail(`invalid JSON: ${catalogPath}`)
    return
  }

  validateWithSchema(ajv, schema, catalog, 'modules/catalog.json')

  const modules = Array.isArray(catalog?.modules) ? catalog.modules : []
  const productionModules = modules.filter((module: any) => module?.status === 'production')
  const productionProviderIds = new Set<string>()
  for (const module of productionModules) {
    const providerId = String(module?.provider_id ?? '').trim()
    if (!providerId) {
      fail(`modules/catalog.json has production module missing provider_id: ${catalogPath}`)
      continue
    }
    if (!providerIds.has(providerId)) {
      fail(`modules/catalog.json has unknown production provider_id='${providerId}'`)
    }
    if (productionProviderIds.has(providerId)) {
      fail(`modules/catalog.json has duplicate production module for provider_id='${providerId}'`)
    }
    productionProviderIds.add(providerId)

    const volume = module?.volume
    if (!volume || typeof volume !== 'object') {
      fail(`modules/catalog.json production module '${module?.module_id}' missing volume`)
      continue
    }
    if (volume.strategy !== 'synthetic_seed') {
      fail(
        `modules/catalog.json production module '${module?.module_id}' must use strategy='synthetic_seed' for this release cut`,
      )
    }
    if (volume.model_version !== 'synthetic_seed_v1') {
      fail(
        `modules/catalog.json production module '${module?.module_id}' must use model_version='synthetic_seed_v1' for this release cut`,
      )
    }
    if (volume?.reported?.enabled !== false) {
      fail(
        `modules/catalog.json production module '${module?.module_id}' must keep reported.enabled=false for this release cut`,
      )
    }
    if (volume?.inferred_proxy?.enabled !== false) {
      fail(
        `modules/catalog.json production module '${module?.module_id}' must keep inferred_proxy.enabled=false for this release cut`,
      )
    }
    const seedWeight = Number(volume?.synthetic_seed?.default_weight)
    const seedConfidence = Number(volume?.synthetic_seed?.default_confidence)
    if (!Number.isFinite(seedWeight) || seedWeight < 0 || seedWeight > 1) {
      fail(
        `modules/catalog.json production module '${module?.module_id}' has invalid synthetic_seed.default_weight`,
      )
    }
    if (!Number.isFinite(seedConfidence) || seedConfidence < 0 || seedConfidence > 1) {
      fail(
        `modules/catalog.json production module '${module?.module_id}' has invalid synthetic_seed.default_confidence`,
      )
    }
  }

  if (providerIds.size > 0 && productionProviderIds.size !== providerIds.size) {
    fail(
      `modules/catalog.json production coverage mismatch: modules=${productionProviderIds.size} providers=${providerIds.size}`,
    )
  }
  for (const providerId of providerIds) {
    if (!productionProviderIds.has(providerId)) {
      fail(`modules/catalog.json missing production module for provider_id='${providerId}'`)
    }
  }
}

const validateEnvInvariants = (
  prd: unknown,
  plan: unknown,
  label: string,
) => {
  if (!isRecord(prd)) return
  const env = prd.env
  if (typeof env !== 'string') return

  const isProdLike = env === 'prod' || env === 'staging'

  if (isRecord(plan)) {
    const guardrails = plan.guardrails
    if (isRecord(guardrails)) {
      if (isProdLike && guardrails.prod_read_only !== true) {
        fail(`${label}: env='${env}' requires guardrails.prod_read_only=true`)
      }
      if (env === 'prod' && typeof guardrails.max_diff_lines === 'number' && guardrails.max_diff_lines > 0) {
        fail(`${label}: env='prod' with prod_read_only requires guardrails.max_diff_lines=0`)
      }
    }

    const constraints = plan.constraints
    if (Array.isArray(constraints) && isProdLike) {
      const hasProdReadOnly = constraints.some(
        (c: unknown) => typeof c === 'string' && c.includes('prod_read_only=true'),
      )
      if (!hasProdReadOnly) {
        fail(`${label}: env='${env}' plan constraints should include 'prod_read_only=true'`)
      }
    }
  }
}

const validateCases = () => {
  const ajv = buildAjv()
  const prdSchema = readJson(schemaPath('prd.schema.json'))
  const planSchema = readJson(schemaPath('plan.schema.json'))
  const runSchema = readJson(schemaPath('run.schema.json'))
  const caseIndexSchema = readJson(schemaPath('case-index.schema.json'))

  const casesDir = path.join(remitScoutDir, 'cases')
  if (!fs.existsSync(casesDir)) return

  const caseIndexFile = path.join(casesDir, 'index.json')
  const indexedCaseIds = new Set<string>()
  const indexedEnvs = new Map<string, string>()
  if (fs.existsSync(caseIndexFile)) {
    const caseIndex = readJson(caseIndexFile)
    validateWithSchema(ajv, caseIndexSchema, caseIndex, 'cases/index.json')
    const cases = Array.isArray((caseIndex as any)?.cases) ? (caseIndex as any).cases : []
    for (const entry of cases) {
      const caseId = String(entry?.case_id || '').trim()
      if (!caseId) continue
      if (indexedCaseIds.has(caseId)) {
        fail(`cases/index.json has duplicate case_id='${caseId}'`)
        continue
      }
      indexedCaseIds.add(caseId)
      if (typeof entry?.env === 'string') {
        indexedEnvs.set(caseId, entry.env)
      }
      const caseDir = path.join(casesDir, caseId)
      if (!fs.existsSync(caseDir) || !fs.statSync(caseDir).isDirectory()) {
        fail(`cases/index.json references missing case folder '${caseId}'`)
      }
    }
  }

  const entries = fs.readdirSync(casesDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const caseDir = path.join(casesDir, entry.name)
    const prdPath = path.join(caseDir, 'prd.yaml')
    const planPath = path.join(caseDir, 'plan.yaml')

    let prdData: unknown = undefined
    let planData: unknown = undefined

    if (assertFileExists(prdPath)) {
      prdData = readYaml(prdPath)
      validateWithSchema(ajv, prdSchema, prdData, `cases/${entry.name}/prd.yaml`)
      validateSpecRefs(prdData, `cases/${entry.name}/prd.yaml`)
      if (isRecord(prdData) && typeof prdData.case_id === 'string' && prdData.case_id !== entry.name) {
        fail(`cases/${entry.name}/prd.yaml: case_id '${prdData.case_id}' does not match directory name '${entry.name}'`)
      }
      if (isRecord(prdData) && typeof prdData.env === 'string') {
        const indexedEnv = indexedEnvs.get(entry.name)
        if (indexedEnv && indexedEnv !== prdData.env) {
          fail(`cases/${entry.name}: index env='${indexedEnv}' does not match prd env='${prdData.env}'`)
        }
      }
    }
    if (assertFileExists(planPath)) {
      planData = readYaml(planPath)
      validateWithSchema(ajv, planSchema, planData, `cases/${entry.name}/plan.yaml`)
      validateSpecRefs(planData, `cases/${entry.name}/plan.yaml`)
      if (isRecord(planData) && typeof planData.case_id === 'string' && planData.case_id !== entry.name) {
        fail(`cases/${entry.name}/plan.yaml: case_id '${planData.case_id}' does not match directory name '${entry.name}'`)
      }
    }

    if (prdData && planData) {
      validateEnvInvariants(prdData, planData, `cases/${entry.name}`)
    }

    const runsDir = path.join(caseDir, 'runs')
    if (!fs.existsSync(runsDir)) continue
    const runFiles = fs.readdirSync(runsDir).filter((f) => f.endsWith('.json'))
    for (const f of runFiles) {
      const p = path.join(runsDir, f)
      const run = readJson(p)
      validateWithSchema(ajv, runSchema, run, `cases/${entry.name}/runs/${f}`)
      if (isRecord(run) && typeof run.case_id === 'string' && run.case_id !== entry.name) {
        fail(`cases/${entry.name}/runs/${f}: case_id '${run.case_id}' does not match directory name '${entry.name}'`)
      }
    }

    if (fs.existsSync(caseIndexFile) && !indexedCaseIds.has(entry.name)) {
      fail(`cases/${entry.name} is missing from cases/index.json`)
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
  assertFileExists(schemaPath('module-catalog.schema.json'))

  assertFileExists(templatePath('prd.template.yaml'))
  assertFileExists(templatePath('plan.template.yaml'))
  assertFileExists(templatePath('run.template.json'))
  assertFileExists(templatePath('evidence.template.json'))

  assertFileExists(path.join(remitScoutDir, 'skills', 'catalog.yaml'))
  assertFileExists(path.join(remitScoutDir, 'modules', 'catalog.json'))

  const providerIds = validateProviderCatalog()
  validateModuleCatalog(providerIds)
  validateTemplatesAndRegistries()
  validateCases()

  if (process.exitCode && process.exitCode !== 0) {
    process.exit(process.exitCode)
  }

  console.log('✅ IssueOps contracts validated')
}

main()
