import '../../shared/load-env'
import { spawn } from 'node:child_process'
import path from 'node:path'
import {
  CloudWatchClient,
  GetMetricDataCommand,
  ListMetricsCommand,
  type Dimension,
  type Metric,
} from '@aws-sdk/client-cloudwatch'

type Check = {
  name: string
  ok: boolean
  note?: string
}

type CloudWatchMetricSpec = {
  name: string
  namespace: string
  required: boolean
  dimensions: Dimension[]
}

type NrqlRow = Record<string, unknown>

const cloudWatch = new CloudWatchClient({})
const backendRoot = path.resolve(__dirname, '../..')
const repoRoot = path.resolve(backendRoot, '..')

const mustEnv = (key: string): string => {
  const value = process.env[key]
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${key}`)
  }
  return value.trim()
}

const normalizeEnvName = (value: string): string => {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return 'staging'
  if (normalized === 'production') return 'prod'
  if (normalized === 'development') return 'dev'
  return normalized
}

const escapeNrqlValue = (value: string) => value.replace(/'/g, "\\'")

const readBooleanEnv = (key: string, fallback = false): boolean => {
  const value = process.env[key]
  if (!value || !value.trim()) return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

const getAwsAccountIdForEnv = (envName: string): string =>
  (envName === 'prod'
    ? process.env.NEW_RELIC_PROD_AWS_ACCOUNT_ID
    : process.env.NEW_RELIC_STAGING_AWS_ACCOUNT_ID)?.trim()
    || ''

const getEnvTokens = (envName: string): string[] => {
  const base = `remit-scout-${envName}`
  const compact = base.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  return Array.from(new Set([base, compact])).filter(Boolean)
}

const buildEnvironmentFilter = (envName: string): string => {
  if (envName === 'prod') {
    return `(environment = 'prod' OR environment = 'production')`
  }
  return `environment = '${escapeNrqlValue(envName)}'`
}

const buildScopeClause = (envName: string, awsAccountId: string): string => {
  const envFilter = buildEnvironmentFilter(envName)
  const tokenPredicates = getEnvTokens(envName).flatMap((token) => {
    const escaped = escapeNrqlValue(token)
    return [
      `entity.name LIKE '%${escaped}%'`,
      `aws.lambda.FunctionName LIKE '%${escaped}%'`,
      `aws.sqs.QueueName LIKE '%${escaped}%'`,
      `aws.logs.Resource LIKE '%${escaped}%'`,
      `aws.arn LIKE '%${escaped}%'`,
      `aws.Arn LIKE '%${escaped}%'`,
      `appName LIKE '%${escaped}%'`,
      `providerAccountName LIKE '%${escaped}%'`,
    ]
  })

  const scoped = `(${[envFilter, ...tokenPredicates].join(' OR ')})`
  if (!awsAccountId) return scoped

  const escapedAccountId = escapeNrqlValue(awsAccountId)
  return `${scoped} AND (aws.accountId = '${escapedAccountId}' OR aws.accountId IS NULL OR aws.accountId = '')`
}

const buildMetricNameFilter = (name: string): string => {
  const escaped = escapeNrqlValue(name)
  return `(
    metricName = '${escaped}'
    OR metricName = 'aws.remitscout.${escaped}'
    OR metricName LIKE '%.${escaped}'
    OR metricName LIKE '%/${escaped}'
    OR metricName LIKE '%${escaped}%'
  )`
}

const buildMetricNamesFilter = (names: string[]): string =>
  `(${names.map((name) => buildMetricNameFilter(name)).join(' OR ')})`

const shouldRetryHttpStatus = (status: number) => status === 429 || status >= 500

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const gql = async <T = unknown>(query: string, variables: Record<string, unknown>): Promise<T> => {
  const apiKey = mustEnv('NEW_RELIC_USER_API_KEY')
  const region = (process.env.NEW_RELIC_REGION || 'US').trim().toUpperCase()
  const endpoint = region === 'EU'
    ? 'https://api.eu.newrelic.com/graphql'
    : 'https://api.newrelic.com/graphql'

  const maxAttempts = 4
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'API-Key': apiKey,
        },
        body: JSON.stringify({ query, variables }),
      })

      if (!response.ok) {
        const error = new Error(`NerdGraph request failed: HTTP ${response.status}`)
        if (attempt < maxAttempts && shouldRetryHttpStatus(response.status)) {
          await sleep(250 * 2 ** (attempt - 1) + Math.floor(Math.random() * 150))
          lastError = error
          continue
        }
        throw error
      }

      const payload = await response.json() as {
        data?: T
        errors?: Array<{ message?: string }>
      }

      if (payload.errors?.length) {
        throw new Error(payload.errors.map((error) => error.message || 'unknown NerdGraph error').join(' | '))
      }

      if (!payload.data) {
        throw new Error('NerdGraph response missing data')
      }

      return payload.data
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (attempt >= maxAttempts) break
      await sleep(250 * 2 ** (attempt - 1) + Math.floor(Math.random() * 150))
    }
  }

  throw lastError || new Error('NerdGraph request failed')
}

const nrqlValue = async (nrql: string, key = 'value'): Promise<number> => {
  const accountId = Number.parseInt(mustEnv('NEW_RELIC_ACCOUNT_ID'), 10)
  if (!Number.isFinite(accountId)) {
    throw new Error('Missing/invalid NEW_RELIC_ACCOUNT_ID')
  }

  const query = `
    query ReadNrql($accountId: Int!, $nrql: Nrql!) {
      actor {
        account(id: $accountId) {
          nrql(query: $nrql) {
            results
          }
        }
      }
    }
  `

  const data = await gql<{
    actor?: {
      account?: {
        nrql?: {
          results?: NrqlRow[]
        }
      }
    }
  }>(query, {
    accountId,
    nrql,
  })

  const rows = data.actor?.account?.nrql?.results || []
  if (rows.length === 0) return 0
  const value = Number(rows[0]?.[key] ?? 0)
  return Number.isFinite(value) ? value : 0
}

const runVerifySignals = async (envName: string, windowMinutes: number): Promise<void> =>
  await new Promise((resolve, reject) => {
    const scriptPath = path.join(repoRoot, 'ops', 'newrelic', 'verify-signals.mjs')
    const child = spawn(process.execPath, [scriptPath], {
      cwd: backendRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        NEW_RELIC_TARGET_ENV: process.env.NEW_RELIC_TARGET_ENV || envName,
        NEW_RELIC_WINDOW_MINUTES: process.env.NEW_RELIC_WINDOW_MINUTES || String(windowMinutes),
        REQUIRE_ACCOUNT_PINNING: process.env.REQUIRE_ACCOUNT_PINNING || '1',
        REQUIRE_LOGS: process.env.REQUIRE_LOGS || '1',
        REQUIRE_SPANS: process.env.REQUIRE_SPANS || '1',
        REQUIRE_API_GW_METRICS: process.env.REQUIRE_API_GW_METRICS || '1',
        REQUIRE_SQS_METRICS: process.env.REQUIRE_SQS_METRICS || '1',
        REQUIRE_CUSTOM_METRICS: process.env.REQUIRE_CUSTOM_METRICS || '1',
      },
    })

    child.on('error', reject)
    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`verify-signals terminated by ${signal}`))
        return
      }
      if (code !== 0) {
        reject(new Error(`verify-signals exited with ${String(code ?? 'unknown')}`))
        return
      }
      resolve(undefined)
    })
  })

const listMetricVariants = async (spec: CloudWatchMetricSpec): Promise<Metric[]> => {
  const response = await cloudWatch.send(new ListMetricsCommand({
    Namespace: spec.namespace,
    MetricName: spec.name,
    Dimensions: spec.dimensions,
  }))
  return (response.Metrics || []).slice(0, 100)
}

const loadCloudWatchDatapointCount = async (spec: CloudWatchMetricSpec, lookbackMinutes: number): Promise<number> => {
  const metrics = await listMetricVariants(spec)
  if (metrics.length === 0) return 0

  const endTime = new Date()
  const startTime = new Date(endTime.getTime() - lookbackMinutes * 60 * 1000)
  const queryWindowSeconds = Math.max(300, Math.min(3600, Math.floor((lookbackMinutes * 60) / 24)))

  const metricData = await cloudWatch.send(new GetMetricDataCommand({
    StartTime: startTime,
    EndTime: endTime,
    MetricDataQueries: metrics.map((metric, index) => ({
      Id: `m${index}`,
      MetricStat: {
        Metric: {
          Namespace: spec.namespace,
          MetricName: spec.name,
          Dimensions: metric.Dimensions,
        },
        Period: queryWindowSeconds,
        Stat: 'SampleCount',
      },
      ReturnData: true,
    })),
  }))

  return (metricData.MetricDataResults || []).reduce((total, result) => {
    const sampleCount = (result.Values || []).reduce((sum, value) => sum + Number(value || 0), 0)
    return total + sampleCount
  }, 0)
}

const main = async () => {
  mustEnv('NEW_RELIC_USER_API_KEY')
  mustEnv('NEW_RELIC_ACCOUNT_ID')
  mustEnv('NEW_RELIC_REGION')
  mustEnv('AWS_REGION')

  const envName = normalizeEnvName(
    process.env.SMOKE_ENV_NAME
      || process.env.ENVIRONMENT
      || process.env.NODE_ENV
      || 'staging',
  )
  const awsAccountId = getAwsAccountIdForEnv(envName)
  const windowMinutes = Number.parseInt(
    process.env.OBS_GATE_WINDOW_MINUTES || process.env.NEW_RELIC_WINDOW_MINUTES || '1440',
    10,
  )
  if (!Number.isFinite(windowMinutes) || windowMinutes <= 0) {
    throw new Error(`Invalid OBS_GATE_WINDOW_MINUTES: ${process.env.OBS_GATE_WINDOW_MINUTES || ''}`)
  }

  const since = `${windowMinutes} minutes ago`
  const scope = buildScopeClause(envName, awsAccountId)
  const checks: Check[] = []
  const record = (check: Check) => checks.push(check)
  const shouldRequireSignupMetric = readBooleanEnv('OBS_GATE_REQUIRE_SIGNUP_METRIC', false)
  const shouldRequireExportWorkerMetric =
    readBooleanEnv('OBS_GATE_REQUIRE_EXPORT_WORKER_METRIC', !readBooleanEnv('SMOKE_ALLOW_EXPORT_PIPELINE_DEGRADED', false))
  const shouldRequireAlertWorkerMetric = readBooleanEnv('OBS_GATE_REQUIRE_ALERT_WORKER_METRIC', false)
  const shouldRequireAgentMetric = readBooleanEnv('OBS_GATE_REQUIRE_AGENT_METRIC', false)

  if (!readBooleanEnv('OBS_GATE_SKIP_VERIFY_SIGNALS', false)) {
    await runVerifySignals(envName, windowMinutes)
    record({
      name: 'New Relic core verify-signals gate',
      ok: true,
      note: `env=${envName} window_minutes=${windowMinutes}`,
    })
  }

  const queryMetricPresence = async (
    name: string,
    metricNames: string[],
    options?: {
      namespaces?: string[]
      extraWhere?: string
      required?: boolean
    },
  ) => {
    const namespaceClause = options?.namespaces?.length
      ? ` AND (${options.namespaces.map((namespace) => {
          const escaped = escapeNrqlValue(namespace)
          return `namespace = '${escaped}' OR aws.Namespace = '${escaped}' OR aws.namespace = '${escaped}'`
        }).join(' OR ')})`
      : ''
    const extraWhere = options?.extraWhere ? ` AND (${options.extraWhere})` : ''
    const value = await nrqlValue(
      `FROM Metric SELECT count(*) AS value WHERE ${buildMetricNamesFilter(metricNames)} AND ${scope}${namespaceClause}${extraWhere} SINCE ${since}`,
    )
    record({
      name,
      ok: options?.required === false ? true : value > 0,
      note: `count=${value}`,
    })
  }

  await queryMetricPresence(
    'New Relic request metrics present',
    ['http_requests_total', 'api_requests_total'],
    { required: true },
  )

  await queryMetricPresence(
    'New Relic auth endpoint metrics present',
    ['api_requests_total'],
    {
      extraWhere: `endpoint LIKE '%/auth/%' OR endpoint LIKE '%/me' OR endpoint LIKE '%/sessions/%'`,
      required: true,
    },
  )

  await queryMetricPresence(
    'New Relic export endpoint metrics present',
    ['api_requests_total'],
    {
      extraWhere: `endpoint LIKE '%/exports%'`,
      required: true,
    },
  )

  await queryMetricPresence(
    'New Relic alerts/watchlist endpoint metrics present',
    ['api_requests_total'],
    {
      extraWhere: `endpoint LIKE '%/alerts%' OR endpoint LIKE '%/watchlist%'`,
      required: true,
    },
  )

  await queryMetricPresence(
    'New Relic triangulation endpoint metrics present',
    ['api_requests_total'],
    {
      extraWhere: `endpoint LIKE '%/indices/triangulated%'`,
      required: true,
    },
  )

  await queryMetricPresence(
    'New Relic queue visibility metrics present',
    ['queue_depth'],
    {
      namespaces: ['RemitScout/Queues'],
      required: true,
    },
  )

  await queryMetricPresence(
    'New Relic TEER/RCI/RVI metrics present',
    ['indices_teer_rate', 'indices_rci_ratio', 'indices_rvi_bps'],
    {
      namespaces: ['RemitScout'],
      required: true,
    },
  )

  await queryMetricPresence(
    'New Relic export worker metrics present',
    ['export_jobs_completed', 'export_jobs_failed'],
    {
      namespaces: ['RemitScout/Business'],
      required: shouldRequireExportWorkerMetric,
    },
  )

  await queryMetricPresence(
    'New Relic alert worker metrics present',
    ['alerts_evaluated_total', 'alerts_triggered_total'],
    {
      namespaces: ['RemitScout/Business'],
      required: shouldRequireAlertWorkerMetric,
    },
  )

  await queryMetricPresence(
    'New Relic signup metric present',
    ['user_signups_total'],
    {
      namespaces: ['RemitScout/Business'],
      required: shouldRequireSignupMetric,
    },
  )

  await queryMetricPresence(
    'New Relic worker failure metrics visible',
    ['message_failed', 'dlq_sent', 'lock_failed', 'stale_dropped', 'envelope_parse_error'],
    {
      namespaces: ['RemitScout/Workers'],
      required: false,
    },
  )

  await queryMetricPresence(
    'New Relic agent/self-healing metrics visible',
    ['detection_cycle_count', 'failure_bundle_created', 'stress_escalation_incident'],
    {
      namespaces: ['RemitScout/Agents'],
      required: shouldRequireAgentMetric,
    },
  )

  const cloudWatchSpecs: CloudWatchMetricSpec[] = [
    {
      name: 'http_requests_total',
      namespace: 'RemitScout',
      required: true,
      dimensions: [{ Name: 'environment', Value: envName }],
    },
    {
      name: 'indices_teer_rate',
      namespace: 'RemitScout',
      required: true,
      dimensions: [{ Name: 'environment', Value: envName }],
    },
    {
      name: 'indices_rci_ratio',
      namespace: 'RemitScout',
      required: true,
      dimensions: [{ Name: 'environment', Value: envName }],
    },
    {
      name: 'indices_rvi_bps',
      namespace: 'RemitScout',
      required: true,
      dimensions: [{ Name: 'environment', Value: envName }],
    },
    {
      name: 'detection_cycle_count',
      namespace: 'RemitScout/Agents',
      required: shouldRequireAgentMetric,
      dimensions: [{ Name: 'environment', Value: envName }],
    },
    {
      name: 'message_failed',
      namespace: 'RemitScout/Workers',
      required: false,
      dimensions: [{ Name: 'environment', Value: envName }],
    },
  ]

  for (const spec of cloudWatchSpecs) {
    const datapoints = await loadCloudWatchDatapointCount(spec, windowMinutes)
    record({
      name: `CloudWatch ${spec.namespace}/${spec.name}`,
      ok: spec.required ? datapoints > 0 : true,
      note: `datapoints=${datapoints}`,
    })
  }

  const failures = checks.filter((check) => !check.ok)
  for (const check of checks) {
    console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.name}${check.note ? ` | ${check.note}` : ''}`)
  }

  if (failures.length > 0) {
    console.error(`\nObservability business gate failed: ${failures.length} checks failed`)
    process.exit(1)
  }

  console.log('\nObservability business gate passed.')
}

if (require.main === module) {
  main().catch((error) => {
    console.error(
      'Observability business gate crashed:',
      error instanceof Error ? error.message : String(error),
    )
    process.exit(1)
  })
}
