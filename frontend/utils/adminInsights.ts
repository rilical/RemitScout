import type {
  AgentActionEntry,
  FailureBundleSummary,
  FailureTrendPoint,
  RepairOutcome,
  SelfHealingMetrics,
} from '~/types/agents'
import type { MttdMttrEntry, TotalCollectionErrorRow } from '~/types/data-quality'
import type { CorridorStressEntry, StressSummary } from '~/types/stress'

export type DataQualityTelemetryState = 'empty' | 'warming' | 'partial' | 'live'
export type DataQualityModuleStatus = 'healthy' | 'watch' | 'critical' | 'warming'
export type IncidentPhase = 'active' | 'resolved'

export interface DataQualityModuleInsight extends TotalCollectionErrorRow {
  cycle_minutes: number | null
  status: DataQualityModuleStatus
  risk_score: number
}

export interface DataQualityInsights {
  modules: DataQualityModuleInsight[]
  telemetryState: DataQualityTelemetryState
  totalModules: number
  activeModules: number
  totalObservations: number
  totalFailures: number
  totalCoverageChecks: number
  weightedFailureRate: number | null
  watchModules: number
  criticalModules: number
  actionRequired: DataQualityModuleInsight[]
  slowestCycleModule: DataQualityModuleInsight | null
  longestDetectionRow: MttdMttrEntry | null
  longestResolutionRow: MttdMttrEntry | null
}

export interface IncidentTimelineInsight extends FailureBundleSummary {
  phase: IncidentPhase
  action_count: number
  affected_corridor_count: number
  triage_at: string | null
  resolution_at: string | null
  latest_action_at: string | null
  latest_action_status: AgentActionEntry['status'] | null
  triage_lead_seconds: number | null
  resolution_seconds: number | null
  elapsed_seconds: number
}

export interface IncidentTimelineSummary {
  openCount: number
  resolvedCount: number
  appliedCount: number
  rejectedOrFailedCount: number
  criticalOpenCount: number
  medianOpenAgeSeconds: number | null
  medianResolutionSeconds: number | null
  watchlist: IncidentTimelineInsight[]
}

const resolvedOutcomes = new Set<RepairOutcome>(['applied', 'failed', 'rejected'])

const severityWeight = (severity: string | null | undefined): number => {
  switch (String(severity || '').toLowerCase()) {
    case 'critical':
      return 4
    case 'high':
      return 3
    case 'medium':
      return 2
    case 'low':
      return 1
    default:
      return 0
  }
}

export const getDataQualityModuleStatus = (
  row: Pick<
    TotalCollectionErrorRow,
    'total_observations' | 'failure_count' | 'parse_error_rate' | 'consecutive_failures'
  >,
): DataQualityModuleStatus => {
  if (row.total_observations <= 0 && row.failure_count <= 0) {
    return 'warming'
  }
  if (row.consecutive_failures >= 3 || row.parse_error_rate >= 0.1) {
    return 'critical'
  }
  if (row.consecutive_failures > 0 || row.parse_error_rate >= 0.03) {
    return 'watch'
  }
  return 'healthy'
}

const getCycleMinutes = (
  row: Pick<MttdMttrEntry, 'mttd_minutes' | 'mttr_minutes'>,
): number | null => {
  const total = (row.mttd_minutes ?? 0) + (row.mttr_minutes ?? 0)
  return total > 0 ? total : null
}

const toTimestamp = (value: string | null | undefined): number | null => {
  if (!value) return null
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

const compareDataQualityModules = (
  left: DataQualityModuleInsight,
  right: DataQualityModuleInsight,
): number => {
  if (right.risk_score !== left.risk_score) {
    return right.risk_score - left.risk_score
  }
  if ((right.cycle_minutes ?? -1) !== (left.cycle_minutes ?? -1)) {
    return (right.cycle_minutes ?? -1) - (left.cycle_minutes ?? -1)
  }
  if (right.total_observations !== left.total_observations) {
    return right.total_observations - left.total_observations
  }
  return left.display_name.localeCompare(right.display_name)
}

export const buildDataQualityInsights = (
  rows: TotalCollectionErrorRow[],
  mttdRows: MttdMttrEntry[],
): DataQualityInsights => {
  const cycleByModule = new Map(mttdRows.map(row => [row.module_id, getCycleMinutes(row)]))

  const modules = rows
    .map<DataQualityModuleInsight>((row) => {
      const status = getDataQualityModuleStatus(row)
      const cycle_minutes = cycleByModule.get(row.module_id) ?? null
      const risk_score
        = (status === 'critical' ? 10 : status === 'watch' ? 5 : status === 'warming' ? 1 : 0)
          + row.consecutive_failures * 2
          + row.parse_error_rate * 100
          + (cycle_minutes ?? 0) / 60
      return {
        ...row,
        cycle_minutes,
        status,
        risk_score,
      }
    })
    .sort(compareDataQualityModules)

  const totalModules = modules.length
  const activeModules = modules.filter(row => row.total_observations > 0).length
  const totalObservations = modules.reduce((sum, row) => sum + row.total_observations, 0)
  const totalFailures = modules.reduce((sum, row) => sum + row.failure_count, 0)
  const totalCoverageChecks = modules.reduce((sum, row) => sum + row.corridor_count, 0)
  const weightedFailureRate = totalObservations > 0 ? totalFailures / totalObservations : null
  const watchModules = modules.filter(row => row.status === 'watch').length
  const criticalModules = modules.filter(row => row.status === 'critical').length
  const actionRequired = modules.filter(row => row.status === 'watch' || row.status === 'critical')

  const telemetryState: DataQualityTelemetryState = (() => {
    if (totalModules === 0) return 'empty'
    if (totalObservations === 0) return 'warming'
    if (activeModules < totalModules) return 'partial'
    return 'live'
  })()

  const cycleRows = mttdRows
    .map(row => ({
      row,
      cycle_minutes: getCycleMinutes(row),
    }))
    .filter(
      (entry): entry is { row: MttdMttrEntry, cycle_minutes: number } =>
        entry.cycle_minutes !== null,
    )

  const slowestCycleRow
    = cycleRows.sort((left, right) => right.cycle_minutes - left.cycle_minutes)[0]?.row ?? null
  const slowestCycleModule = slowestCycleRow
    ? (modules.find(row => row.module_id === slowestCycleRow.module_id) ?? null)
    : null

  const longestDetectionRow
    = [...mttdRows]
      .filter(row => (row.mttd_minutes ?? 0) > 0)
      .sort((left, right) => (right.mttd_minutes ?? 0) - (left.mttd_minutes ?? 0))[0] ?? null

  const longestResolutionRow
    = [...mttdRows]
      .filter(row => (row.mttr_minutes ?? 0) > 0)
      .sort((left, right) => (right.mttr_minutes ?? 0) - (left.mttr_minutes ?? 0))[0] ?? null

  return {
    modules,
    telemetryState,
    totalModules,
    activeModules,
    totalObservations,
    totalFailures,
    totalCoverageChecks,
    weightedFailureRate,
    watchModules,
    criticalModules,
    actionRequired,
    slowestCycleModule,
    longestDetectionRow,
    longestResolutionRow,
  }
}

const isResolvedOutcome = (
  outcome: RepairOutcome | null,
): outcome is 'applied' | 'failed' | 'rejected' => Boolean(outcome && resolvedOutcomes.has(outcome))

const isResolutionAction = (action: AgentActionEntry): boolean =>
  Boolean(action.completed_at && ['completed', 'failed', 'rejected'].includes(action.status))

const median = (values: number[]): number | null => {
  if (values.length === 0) return null
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 1) {
    return sorted[middle] ?? null
  }
  const left = sorted[middle - 1]
  const right = sorted[middle]
  if (left === undefined || right === undefined) return null
  return (left + right) / 2
}

export const buildIncidentTimeline = (
  bundles: FailureBundleSummary[],
  actions: AgentActionEntry[],
  nowMs = Date.now(),
): IncidentTimelineInsight[] => {
  const actionsByModule = new Map<string, AgentActionEntry[]>()
  for (const action of actions) {
    if (!action.module_id) continue
    const entries = actionsByModule.get(action.module_id) ?? []
    entries.push(action)
    actionsByModule.set(action.module_id, entries)
  }

  for (const entries of actionsByModule.values()) {
    entries.sort(
      (left, right) => (toTimestamp(left.created_at) ?? 0) - (toTimestamp(right.created_at) ?? 0),
    )
  }

  const bundlesByModule = new Map<string, FailureBundleSummary[]>()
  for (const bundle of bundles) {
    const entries = bundlesByModule.get(bundle.module_id) ?? []
    entries.push(bundle)
    bundlesByModule.set(bundle.module_id, entries)
  }

  const incidents: IncidentTimelineInsight[] = []

  for (const moduleBundles of bundlesByModule.values()) {
    moduleBundles.sort(
      (left, right) => (toTimestamp(left.created_at) ?? 0) - (toTimestamp(right.created_at) ?? 0),
    )

    for (let index = 0; index < moduleBundles.length; index += 1) {
      const bundle = moduleBundles[index]
      if (!bundle) continue
      const createdAt = toTimestamp(bundle.created_at) ?? nowMs
      const nextBundleAt = toTimestamp(moduleBundles[index + 1]?.created_at)
      const relatedActions = (actionsByModule.get(bundle.module_id) ?? []).filter((action) => {
        const actionAt = toTimestamp(action.created_at)
        if (actionAt === null || actionAt < createdAt) return false
        if (nextBundleAt !== null && actionAt >= nextBundleAt) return false
        return true
      })
      const triageAction = relatedActions[0] ?? null
      const resolutionAction = [...relatedActions].reverse().find(isResolutionAction) ?? null
      const resolved = isResolvedOutcome(bundle.repair_outcome)
      const resolutionAt = resolved
        ? (resolutionAction?.completed_at
          ?? resolutionAction?.created_at
          ?? triageAction?.created_at
          ?? bundle.created_at)
        : null
      const endMs = toTimestamp(resolutionAt) ?? nowMs
      const elapsed_seconds = Math.max(0, Math.floor((endMs - createdAt) / 1000))
      const triageLeadSeconds = triageAction
        ? Math.max(
            0,
            Math.floor(((toTimestamp(triageAction.created_at) ?? createdAt) - createdAt) / 1000),
          )
        : null

      incidents.push({
        ...bundle,
        phase: resolved ? 'resolved' : 'active',
        action_count: relatedActions.length,
        affected_corridor_count: bundle.affected_corridors.length,
        triage_at: triageAction?.created_at ?? null,
        resolution_at: resolutionAt,
        latest_action_at: relatedActions.at(-1)?.created_at ?? null,
        latest_action_status: relatedActions.at(-1)?.status ?? null,
        triage_lead_seconds: triageLeadSeconds,
        resolution_seconds: resolved ? elapsed_seconds : null,
        elapsed_seconds,
      })
    }
  }

  return incidents.sort(
    (left, right) => (toTimestamp(right.created_at) ?? 0) - (toTimestamp(left.created_at) ?? 0),
  )
}

export const summarizeIncidentTimeline = (
  incidents: IncidentTimelineInsight[],
): IncidentTimelineSummary => {
  const openIncidents = incidents.filter(incident => incident.phase === 'active')
  const resolvedIncidents = incidents.filter(incident => incident.phase === 'resolved')
  const appliedCount = resolvedIncidents.filter(
    incident => incident.repair_outcome === 'applied',
  ).length
  const rejectedOrFailedCount = resolvedIncidents.filter(
    incident => incident.repair_outcome === 'failed' || incident.repair_outcome === 'rejected',
  ).length
  const criticalOpenCount = openIncidents.filter(
    incident => severityWeight(incident.severity) >= 3,
  ).length
  const medianOpenAgeSeconds = median(openIncidents.map(incident => incident.elapsed_seconds))
  const medianResolutionSeconds = median(
    resolvedIncidents
      .map(incident => incident.resolution_seconds)
      .filter((value): value is number => value !== null),
  )

  const watchlist = [...openIncidents]
    .sort((left, right) => {
      const severityDelta = severityWeight(right.severity) - severityWeight(left.severity)
      if (severityDelta !== 0) return severityDelta
      if (right.elapsed_seconds !== left.elapsed_seconds) {
        return right.elapsed_seconds - left.elapsed_seconds
      }
      return right.consecutive_failures - left.consecutive_failures
    })
    .slice(0, 5)

  return {
    openCount: openIncidents.length,
    resolvedCount: resolvedIncidents.length,
    appliedCount,
    rejectedOrFailedCount,
    criticalOpenCount,
    medianOpenAgeSeconds,
    medianResolutionSeconds,
    watchlist,
  }
}

export type SelfHealingTelemetryState = 'empty' | 'warming' | 'live'
export type StressTelemetryState = 'empty' | 'warming' | 'live'
export type StressFreshnessState = 'fresh' | 'delayed' | 'stale' | 'unknown'
export type StressConfidenceBand = 'high' | 'medium' | 'low' | 'manual' | 'unknown'

export interface SelfHealingInsights {
  telemetryState: SelfHealingTelemetryState
  incidents: IncidentTimelineInsight[]
  summary: IncidentTimelineSummary
  impactedModules: number
  impactedCorridors: number
  queuedActions: number
  executingActions: number
  completedActions: number
  failedActions: number
  actionSuccessRate: number | null
  repairHitRate: number | null
  latestAction: AgentActionEntry | null
  hottestIncident: IncidentTimelineInsight | null
  hottestModuleId: string | null
  totalBundlesInTrend: number
  appliedBundlesInTrend: number
}

export interface CorridorStressInsight extends CorridorStressEntry {
  age_minutes: number | null
  severity_rank: number
  confidence_band: StressConfidenceBand
}

export interface CorridorStressInsights {
  telemetryState: StressTelemetryState
  freshnessState: StressFreshnessState
  totalCorridors: number
  elevatedCount: number
  criticalCount: number
  calmCount: number
  elevatedShare: number | null
  staleCount: number
  snapshotAgeMinutes: number | null
  highestRisk: CorridorStressInsight | null
  topWatchlist: CorridorStressInsight[]
  corridors: CorridorStressInsight[]
  confidenceCounts: Record<StressConfidenceBand, number>
}

const levelRank = (level: string | null | undefined): number => {
  switch (String(level || '').toLowerCase()) {
    case 'critical':
      return 3
    case 'high':
      return 2
    case 'elevated':
      return 1
    default:
      return 0
  }
}

const toConfidenceBand = (confidence: string | null | undefined): StressConfidenceBand => {
  const normalized = String(confidence || '')
    .trim()
    .toLowerCase()
  if (!normalized) return 'unknown'
  if (normalized.includes('manual')) return 'manual'
  if (normalized === 'authoritative' || normalized === 'high') return 'high'
  if (normalized === 'medium' || normalized === 'estimated') return 'medium'
  if (normalized === 'low') return 'low'
  return 'unknown'
}

const compareStressRows = (left: CorridorStressInsight, right: CorridorStressInsight): number => {
  if (right.severity_rank !== left.severity_rank) {
    return right.severity_rank - left.severity_rank
  }
  if ((right.stress_score ?? -1) !== (left.stress_score ?? -1)) {
    return (right.stress_score ?? -1) - (left.stress_score ?? -1)
  }
  return (
    (toTimestamp(right.computed_at ?? right.date) ?? 0)
    - (toTimestamp(left.computed_at ?? left.date) ?? 0)
  )
}

const uniqueCount = (values: Array<string | null | undefined>): number =>
  new Set(values.filter((value): value is string => Boolean(value && value.trim()))).size

export const buildSelfHealingInsights = (
  metrics: SelfHealingMetrics | null,
  actions: AgentActionEntry[],
  bundles: FailureBundleSummary[],
  trends: FailureTrendPoint[],
  nowMs = Date.now(),
): SelfHealingInsights => {
  const incidents = buildIncidentTimeline(bundles, actions, nowMs)
  const summary = summarizeIncidentTimeline(incidents)
  const queuedActions = actions.filter(action =>
    ['pending', 'approved'].includes(action.status),
  ).length
  const executingActions = actions.filter(action => action.status === 'executing').length
  const completedActions = actions.filter(action => action.status === 'completed').length
  const failedActions = actions.filter(action => action.status === 'failed').length
  const latestAction
    = [...actions].sort(
      (left, right) => (toTimestamp(right.created_at) ?? 0) - (toTimestamp(left.created_at) ?? 0),
    )[0] ?? null
  const totalBundlesInTrend = trends.reduce((sum, point) => sum + point.total_bundles, 0)
  const appliedBundlesInTrend = trends.reduce((sum, point) => sum + point.applied, 0)
  const actionSuccessRate = (() => {
    const terminalActions = completedActions + failedActions
    if (terminalActions > 0) return completedActions / terminalActions
    return metrics?.auto_heal_success_rate ?? null
  })()
  const repairHitRate
    = totalBundlesInTrend > 0
      ? appliedBundlesInTrend / totalBundlesInTrend
      : (metrics?.auto_heal_success_rate ?? null)
  const modulePressure = new Map<string, number>()

  for (const bundle of bundles) {
    modulePressure.set(
      bundle.module_id,
      (modulePressure.get(bundle.module_id) ?? 0)
      + severityWeight(bundle.severity)
      + bundle.consecutive_failures,
    )
  }

  for (const action of actions) {
    if (!action.module_id) continue
    modulePressure.set(
      action.module_id,
      (modulePressure.get(action.module_id) ?? 0)
      + (action.status === 'failed' ? 3 : action.status === 'completed' ? 1 : 2),
    )
  }

  const hottestModuleId
    = [...modulePressure.entries()].sort((left, right) => {
      if (right[1] !== left[1]) return right[1] - left[1]
      return left[0].localeCompare(right[0])
    })[0]?.[0] ?? null

  const telemetryState: SelfHealingTelemetryState = (() => {
    if (!metrics && actions.length === 0 && bundles.length === 0 && trends.length === 0)
      return 'empty'
    const noRecentPressure
      = (metrics?.pending_bundles ?? 0) === 0
        && (metrics?.active_repairs ?? 0) === 0
        && (metrics?.total_bundles_24h ?? 0) === 0
        && actions.length === 0
        && bundles.length === 0
        && totalBundlesInTrend === 0
    if (noRecentPressure) return 'warming'
    return 'live'
  })()

  return {
    telemetryState,
    incidents,
    summary,
    impactedModules: uniqueCount([
      ...bundles.map(bundle => bundle.module_id),
      ...actions.map(action => action.module_id),
    ]),
    impactedCorridors: uniqueCount(bundles.flatMap(bundle => bundle.affected_corridors)),
    queuedActions,
    executingActions,
    completedActions,
    failedActions,
    actionSuccessRate,
    repairHitRate,
    latestAction,
    hottestIncident: summary.watchlist[0] ?? incidents[0] ?? null,
    hottestModuleId,
    totalBundlesInTrend,
    appliedBundlesInTrend,
  }
}

export const buildCorridorStressInsights = (
  corridors: CorridorStressEntry[],
  summary: StressSummary | null | undefined,
  updatedAt: string | null | undefined,
  nowMs = Date.now(),
): CorridorStressInsights => {
  const latestTimestamp
    = corridors
      .map(corridor => toTimestamp(corridor.computed_at ?? null))
      .filter((value): value is number => value !== null)
      .sort((left, right) => right - left)[0] ?? toTimestamp(updatedAt)

  const snapshotAgeMinutes
    = latestTimestamp === null ? null : Math.max(0, Math.floor((nowMs - latestTimestamp) / 60_000))

  const corridorInsights = corridors
    .map<CorridorStressInsight>((corridor) => {
      const timestamp = toTimestamp(corridor.computed_at ?? null) ?? latestTimestamp
      const age_minutes
        = timestamp === null ? null : Math.max(0, Math.floor((nowMs - timestamp) / 60_000))

      return {
        ...corridor,
        age_minutes,
        severity_rank: levelRank(corridor.stress_level),
        confidence_band: toConfidenceBand(corridor.confidence),
      }
    })
    .sort(compareStressRows)

  const elevatedCount = summary
    ? summary.elevated + summary.high + summary.critical
    : corridorInsights.filter(corridor => corridor.stress_level !== 'normal').length
  const criticalCount
    = summary?.critical
      ?? corridorInsights.filter(corridor => corridor.stress_level === 'critical').length
  const totalCorridors = summary?.total_corridors ?? corridorInsights.length
  const calmCount = Math.max(0, totalCorridors - elevatedCount)

  const confidenceCounts: Record<StressConfidenceBand, number> = {
    high: 0,
    medium: 0,
    low: 0,
    manual: 0,
    unknown: 0,
  }
  for (const corridor of corridorInsights) {
    confidenceCounts[corridor.confidence_band] += 1
  }

  const freshnessState: StressFreshnessState = (() => {
    if (snapshotAgeMinutes === null) return totalCorridors > 0 ? 'unknown' : 'stale'
    if (snapshotAgeMinutes <= 30) return 'fresh'
    if (snapshotAgeMinutes <= 120) return 'delayed'
    return 'stale'
  })()

  const telemetryState: StressTelemetryState = (() => {
    if (totalCorridors === 0 && !updatedAt) return 'empty'
    if (totalCorridors === 0) return 'warming'
    return 'live'
  })()

  return {
    telemetryState,
    freshnessState,
    totalCorridors,
    elevatedCount,
    criticalCount,
    calmCount,
    elevatedShare: totalCorridors > 0 ? elevatedCount / totalCorridors : null,
    staleCount: corridorInsights.filter(corridor => (corridor.age_minutes ?? 0) > 120).length,
    snapshotAgeMinutes,
    highestRisk: corridorInsights[0] ?? null,
    topWatchlist: corridorInsights
      .filter(corridor => corridor.stress_level !== 'normal')
      .slice(0, 5),
    corridors: corridorInsights,
    confidenceCounts,
  }
}
