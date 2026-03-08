import {
  DescribeServicesCommand,
  ECSClient,
  ListServicesCommand,
} from '@aws-sdk/client-ecs'
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm'

import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'

export type OpsServiceHealthEntry = {
  service_id: string
  display_name: string
  status: 'healthy' | 'degraded' | 'offline' | 'unknown'
  last_active_at: string | null
  message: string | null
}

export type OpsServiceHealthResponse = {
  services: OpsServiceHealthEntry[]
  updatedAt: string
  unavailable?: boolean
  source: 'aws' | 'legacy' | 'none'
  message?: string | null
}

type PauseState = {
  paused: boolean
  lastModifiedAt: string | null
}

type EcsServiceRecord = {
  serviceName?: string
  status?: string
  desiredCount?: number
  runningCount?: number
  pendingCount?: number
  events?: Array<{
    createdAt?: Date
    message?: string
  }>
}

const logger = createLogger('plane-a.aws-ops-health')
const ecs = new ECSClient({})
const ssm = new SSMClient({})

const normalizeEnvironmentName = (value?: string): string => {
  const normalized = (value || '').trim().toLowerCase()
  if (!normalized) return 'dev'
  if (normalized === 'production') return 'prod'
  if (normalized === 'development') return 'dev'
  return normalized
}

const opsEnvironment = normalizeEnvironmentName(config.envName || config.env)
const clusterName = `remit-scout-${opsEnvironment}`
const pauseParamName = `/remit-scout/${opsEnvironment}/ops/paused`
const baselineParamName = `/remit-scout/${opsEnvironment}/ops/pause/ecs-baseline`

const trackedServices = [
  { matchKey: 'planebingestservice', serviceId: 'plane-b-ingest', displayName: 'Plane B Ingest' },
  { matchKey: 'b2crefreshworkerservice', serviceId: 'b2c-refresh', displayName: 'B2C Refresh Worker' },
  { matchKey: 'fxraterefreshworkerservice', serviceId: 'fx-rate-refresh', displayName: 'FX Refresh Worker' },
  { matchKey: 'ingestfanouttier1workerservice', serviceId: 'ingest-fanout-tier-1', displayName: 'Ingest Fanout Tier 1' },
  { matchKey: 'ingestfanouttier2workerservice', serviceId: 'ingest-fanout-tier-2', displayName: 'Ingest Fanout Tier 2' },
  { matchKey: 'goldliveworkerservice', serviceId: 'gold-live', displayName: 'Gold Live Worker' },
  { matchKey: 'notificationsqueueworkerservice', serviceId: 'notifications', displayName: 'Notifications Worker' },
  { matchKey: 'opsalertsqueueworkerservice', serviceId: 'ops-alerts', displayName: 'Ops Alerts Worker' },
  { matchKey: 'alertevaluationworkerservice', serviceId: 'alert-evaluation', displayName: 'Alert Evaluation Worker' },
  { matchKey: 'exportworkerservice', serviceId: 'export-worker', displayName: 'Export Worker' },
  { matchKey: 'agentorchestratorservice', serviceId: 'agent-orchestrator', displayName: 'Agent Orchestrator' },
  { matchKey: 'stressresponderservice', serviceId: 'stress-responder', displayName: 'Stress Responder' },
  { matchKey: 'normalizationworkerservice', serviceId: 'normalization', displayName: 'Normalization Worker' },
]

const serviceOrder = new Map(trackedServices.map((service, index) => [service.serviceId, index]))

const chunk = <T>(items: T[], size: number): T[][] => {
  if (items.length === 0) return []
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

const normalizeToken = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, '')

const resolveTrackedService = (serviceName: string) => {
  const normalized = normalizeToken(serviceName)
  return trackedServices.find((service) => normalized.includes(service.matchKey))
}

const toIso = (value: Date | string | undefined | null): string | null => {
  if (!value) return null
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.toISOString() : null
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null
}

const parseBaselineMap = (value: string | undefined): Record<string, number> => {
  if (!value) return {}
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>
    return Object.fromEntries(
      Object.entries(parsed).map(([serviceName, desired]) => {
        const numeric = Number(desired)
        return [serviceName, Number.isFinite(numeric) ? Math.max(0, Math.trunc(numeric)) : 0]
      }),
    )
  } catch (error) {
    logger.warn('ops_health_baseline_parse_failed', { error: String(error) })
    return {}
  }
}

const isParameterNotFound = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false
  const name = 'name' in error ? String(error.name) : ''
  return name === 'ParameterNotFound'
}

const loadPauseState = async (): Promise<PauseState> => {
  try {
    const response = await ssm.send(new GetParameterCommand({ Name: pauseParamName }))
    return {
      paused: response.Parameter?.Value === 'true',
      lastModifiedAt: toIso(response.Parameter?.LastModifiedDate ?? null),
    }
  } catch (error) {
    if (!isParameterNotFound(error)) throw error
    logger.warn('ops_health_pause_param_missing', { parameter: pauseParamName })
    return {
      paused: false,
      lastModifiedAt: null,
    }
  }
}

const loadBaselineMap = async (): Promise<Record<string, number>> => {
  try {
    const response = await ssm.send(new GetParameterCommand({ Name: baselineParamName }))
    return parseBaselineMap(response.Parameter?.Value)
  } catch (error) {
    if (!isParameterNotFound(error)) throw error
    logger.warn('ops_health_baseline_param_missing', { parameter: baselineParamName })
    return {}
  }
}

const listServiceNames = async (): Promise<string[]> => {
  const serviceNames = new Set<string>()
  let nextToken: string | undefined
  do {
    const response = await ecs.send(new ListServicesCommand({
      cluster: clusterName,
      nextToken,
    }))
    for (const serviceArn of response.serviceArns ?? []) {
      const serviceName = serviceArn.split('/').pop()?.trim()
      if (serviceName) serviceNames.add(serviceName)
    }
    nextToken = response.nextToken
  } while (nextToken)
  return [...serviceNames]
}

const describeServices = async (serviceNames: string[]): Promise<EcsServiceRecord[]> => {
  const described: EcsServiceRecord[] = []
  for (const serviceChunk of chunk(serviceNames, 10)) {
    const response = await ecs.send(new DescribeServicesCommand({
      cluster: clusterName,
      services: serviceChunk,
    }))
    described.push(...(response.services ?? []))
  }
  return described
}

const buildAwsServiceEntry = (
  service: EcsServiceRecord,
  pauseState: PauseState,
  baselineMap: Record<string, number>,
): OpsServiceHealthEntry | null => {
  const serviceName = service.serviceName?.trim()
  if (!serviceName) return null

  const tracked = resolveTrackedService(serviceName)
  if (!tracked) return null

  const desired = Math.max(0, Number(service.desiredCount ?? 0))
  const running = Math.max(0, Number(service.runningCount ?? 0))
  const pending = Math.max(0, Number(service.pendingCount ?? 0))
  const baseline = baselineMap[serviceName] ?? 0
  const latestEvent = service.events?.[0]
  const latestEventAt = toIso(latestEvent?.createdAt ?? null)

  let status: OpsServiceHealthEntry['status'] = 'unknown'
  if ((service.status ?? '').toUpperCase() !== 'ACTIVE') {
    status = 'offline'
  } else if (desired === 0 && running === 0) {
    if (baseline === 0) {
      status = 'healthy'
    } else if (pauseState.paused) {
      status = 'degraded'
    } else {
      status = 'offline'
    }
  } else if (running >= desired && pending === 0) {
    status = 'healthy'
  } else if (running > 0 || pending > 0) {
    status = 'degraded'
  } else {
    status = 'offline'
  }

  const messageParts = [`desired=${desired}`, `running=${running}`, `pending=${pending}`]
  if (baseline > 0) messageParts.push(`baseline=${baseline}`)
  if (pauseState.paused && baseline > 0 && desired === 0) messageParts.push('paused-by-ops')
  if (latestEvent?.message) messageParts.push(latestEvent.message)

  return {
    service_id: tracked.serviceId,
    display_name: tracked.displayName,
    status,
    last_active_at: latestEventAt,
    message: messageParts.join(' | '),
  }
}

const buildMissingServiceEntry = (
  tracked: typeof trackedServices[number],
  pauseState: PauseState,
): OpsServiceHealthEntry => ({
  service_id: tracked.serviceId,
  display_name: tracked.displayName,
  status: 'offline',
  last_active_at: pauseState.lastModifiedAt,
  message: `Service not found in ECS cluster ${clusterName}`,
})

export const loadAwsOpsServiceHealth = async (): Promise<OpsServiceHealthResponse> => {
  const [pauseState, baselineMap, serviceNames] = await Promise.all([
    loadPauseState(),
    loadBaselineMap(),
    listServiceNames(),
  ])

  const describedServices = serviceNames.length > 0
    ? await describeServices(serviceNames)
    : []

  const entries = describedServices
    .map((service) => buildAwsServiceEntry(service, pauseState, baselineMap))
    .filter((entry): entry is OpsServiceHealthEntry => Boolean(entry))

  const presentServiceIds = new Set(entries.map((entry) => entry.service_id))
  for (const tracked of trackedServices) {
    if (!presentServiceIds.has(tracked.serviceId)) {
      entries.push(buildMissingServiceEntry(tracked, pauseState))
    }
  }

  entries.sort((left, right) => {
    const leftOrder = serviceOrder.get(left.service_id) ?? Number.MAX_SAFE_INTEGER
    const rightOrder = serviceOrder.get(right.service_id) ?? Number.MAX_SAFE_INTEGER
    if (leftOrder !== rightOrder) return leftOrder - rightOrder
    return left.display_name.localeCompare(right.display_name)
  })

  entries.unshift({
    service_id: 'ops-pause-state',
    display_name: 'Ops Pause State',
    status: pauseState.paused ? 'degraded' : 'healthy',
    last_active_at: pauseState.lastModifiedAt,
    message: pauseState.paused
      ? `Paused via ${pauseParamName}`
      : `Active via ${pauseParamName}`,
  })

  return {
    services: entries,
    updatedAt: new Date().toISOString(),
    source: 'aws',
    message: pauseState.paused ? 'Operational services are currently paused.' : null,
  }
}
