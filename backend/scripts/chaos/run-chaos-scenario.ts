import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

type Scenario = 'redis_unavailable' | 'sqs_failure' | 'provider_timeout'

type ChaosSummary = {
  scenario: Scenario
  environment: string
  templateId: string
  dryRun: boolean
  startedAt: string
  endedAt: string
  experimentId?: string
  status: string
  statusReason?: string
}

const parseScenario = (): Scenario => {
  const idx = process.argv.findIndex((arg) => arg === '--scenario')
  const value = idx >= 0 ? process.argv[idx + 1] : process.env.CHAOS_SCENARIO
  if (value === 'redis_unavailable' || value === 'sqs_failure' || value === 'provider_timeout') {
    return value
  }
  throw new Error(
    'Missing or invalid scenario. Use --scenario redis_unavailable|sqs_failure|provider_timeout',
  )
}

const parseEnvName = (): string => {
  const idx = process.argv.findIndex((arg) => arg === '--env')
  const value = (idx >= 0 ? process.argv[idx + 1] : process.env.ENVIRONMENT || process.env.NODE_ENV || '')
    .trim()
    .toLowerCase()
  if (!value) throw new Error('Missing environment name (--env or ENVIRONMENT)')
  return value
}

const templateEnvMap: Record<Scenario, string> = {
  redis_unavailable: 'CHAOS_TEMPLATE_REDIS_UNAVAILABLE',
  sqs_failure: 'CHAOS_TEMPLATE_SQS_FAILURE',
  provider_timeout: 'CHAOS_TEMPLATE_PROVIDER_TIMEOUT',
}

const getTemplateId = (scenario: Scenario): string => {
  const key = templateEnvMap[scenario]
  const templateId = (process.env[key] || '').trim()
  if (!templateId) {
    throw new Error(`Missing FIS template id env: ${key}`)
  }
  return templateId
}

const mustAllowChaos = (environment: string) => {
  if (process.env.CHAOS_ALLOW !== '1') {
    throw new Error('CHAOS_ALLOW must be set to 1 to run chaos scenarios')
  }
  if (environment === 'prod' || environment === 'production') {
    throw new Error('Chaos scenarios are blocked in production')
  }
}

const runAwsJson = (args: string[]): any => {
  const stdout = execFileSync('aws', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  return JSON.parse(stdout)
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const startFisExperiment = (templateId: string) => {
  return runAwsJson([
    'fis',
    'start-experiment',
    '--experiment-template-id',
    templateId,
    '--output',
    'json',
  ])
}

const getFisExperiment = (experimentId: string) => {
  return runAwsJson([
    'fis',
    'get-experiment',
    '--id',
    experimentId,
    '--output',
    'json',
  ])
}

const writeSummary = (summary: ChaosSummary) => {
  const summaryPath = process.env.CHAOS_SUMMARY_PATH || 'artifacts/chaos/chaos-summary.json'
  const fullPath = path.resolve(process.cwd(), summaryPath)
  fs.mkdirSync(path.dirname(fullPath), { recursive: true })
  fs.writeFileSync(fullPath, `${JSON.stringify(summary, null, 2)}\n`)
  console.log(`Chaos summary written: ${fullPath}`)
}

const run = async () => {
  const scenario = parseScenario()
  const environment = parseEnvName()
  mustAllowChaos(environment)
  const templateId = getTemplateId(scenario)
  const dryRun = process.env.CHAOS_DRY_RUN === '1'
  const startedAt = new Date().toISOString()

  if (dryRun) {
    const summary: ChaosSummary = {
      scenario,
      environment,
      templateId,
      dryRun,
      startedAt,
      endedAt: new Date().toISOString(),
      status: 'dry_run',
    }
    writeSummary(summary)
    return
  }

  const start = startFisExperiment(templateId)
  const experimentId = start?.experiment?.id as string | undefined
  if (!experimentId) {
    throw new Error('FIS did not return experiment id')
  }

  const timeoutMinutes = Number.parseInt(process.env.CHAOS_TIMEOUT_MINUTES || '30', 10)
  const timeoutMs = Number.isFinite(timeoutMinutes) ? timeoutMinutes * 60_000 : 1_800_000
  const startedMs = Date.now()
  let latestStatus = 'unknown'
  let latestReason: string | undefined

  while (Date.now() - startedMs < timeoutMs) {
    const current = getFisExperiment(experimentId)
    const state = current?.experiment?.state ?? {}
    latestStatus = String(state.status || 'unknown')
    latestReason = state.reason ? String(state.reason) : undefined
    if (latestStatus === 'completed' || latestStatus === 'failed' || latestStatus === 'stopped') {
      break
    }
    await sleep(10_000)
  }

  const summary: ChaosSummary = {
    scenario,
    environment,
    templateId,
    dryRun,
    startedAt,
    endedAt: new Date().toISOString(),
    experimentId,
    status: latestStatus,
    statusReason: latestReason,
  }
  writeSummary(summary)

  if (latestStatus !== 'completed') {
    throw new Error(`Chaos scenario did not complete successfully (status=${latestStatus})`)
  }
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Chaos run failed: ${message}`)
  process.exit(1)
})

