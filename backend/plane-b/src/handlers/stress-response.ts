import type { Pool } from 'pg'
import type { FailureCategory, FailureSeverity } from '../../../shared/types/failure-bundle'
import type { JobContext, JobResult } from '../../../shared/types/job'
import { StressResponder, type CorridorStressSignal } from '../agents/stress-responder'
import { BaseJobHandler } from './base-job-handler'

const toTrimmedString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : ''

const severityToSignal = (
  severity: FailureSeverity,
): Pick<CorridorStressSignal, 'stressLevel' | 'stressScore'> => {
  switch (severity) {
    case 'critical':
      return { stressLevel: 'critical', stressScore: 0.9 }
    case 'persistent':
      return { stressLevel: 'high', stressScore: 0.7 }
    case 'degraded':
      return { stressLevel: 'elevated', stressScore: 0.45 }
    case 'transient':
    default:
      return { stressLevel: 'elevated', stressScore: 0.35 }
  }
}

const buildTriggerFactors = (
  category: FailureCategory,
  fetcherSource: string,
  failureLayer: string,
): string[] => {
  const factors = new Set<string>()
  factors.add(`failure_category:${category}`)
  if (fetcherSource) factors.add(`fetcher_source:${fetcherSource}`)
  if (failureLayer) factors.add(`failure_layer:${failureLayer}`)
  return [...factors]
}

export class StressResponseHandler extends BaseJobHandler {
  readonly handlerType = 'stress_response'

  constructor() {
    super('plane-b.handlers.stress-response')
  }

  protected async run(context: JobContext): Promise<JobResult> {
    const pool = context.pool as Pool
    const startedAt = Date.now()
    const bundleId = toTrimmedString(context.params.bundleId)
    const route = toTrimmedString(context.params.route)
    const category = (toTrimmedString(context.params.category) || 'unknown') as FailureCategory
    const severity = (toTrimmedString(context.params.severity) || 'degraded') as FailureSeverity
    const fetcherSource = toTrimmedString(context.params.fetcherSource)
    const failureLayer = toTrimmedString(context.params.failureLayer)
    const providerId = toTrimmedString(context.params.providerId)
    const consecutiveFailures = Number(context.params.consecutiveFailures || 0)

    if (!route || route === 'unknown') {
      await this.recordStressEscalation(pool, {
        bundleId,
        moduleId: context.moduleId,
        providerId,
        route,
        category,
        severity,
        fetcherSource,
        failureLayer,
        consecutiveFailures,
        action: 'manual_investigation',
        overridesApplied: 0,
      })
      await this.markBundleOutcome(pool, bundleId, 'failed')

      return {
        success: true,
        itemsProcessed: 1,
        itemsFailed: 0,
        durationMs: Date.now() - startedAt,
        metadata: {
          action: 'manual_investigation',
          reason: 'missing_corridor_route',
          bundleId,
        },
      }
    }

    const signalDefaults = severityToSignal(severity)
    const responder = new StressResponder(pool)
    const overrides = await responder.processStressSignals([
      {
        corridorId: route,
        stressLevel: signalDefaults.stressLevel,
        stressScore: signalDefaults.stressScore,
        triggerFactors: buildTriggerFactors(category, fetcherSource, failureLayer),
        detectedAt: new Date().toISOString(),
      },
    ])

    await this.recordStressEscalation(pool, {
      bundleId,
      moduleId: context.moduleId,
      providerId,
      route,
      category,
      severity,
      fetcherSource,
      failureLayer,
      consecutiveFailures,
      action: overrides.length > 0 ? 'cadence_override_applied' : 'manual_investigation',
      overridesApplied: overrides.length,
    })
    await this.markBundleOutcome(pool, bundleId, overrides.length > 0 ? 'applied' : 'failed')

    return {
      success: true,
      itemsProcessed: 1,
      itemsFailed: 0,
      durationMs: Date.now() - startedAt,
      metadata: {
        bundleId,
        route,
        overridesApplied: overrides.length,
        stressLevel: signalDefaults.stressLevel,
      },
    }
  }

  private async markBundleOutcome(
    pool: Pool,
    bundleId: string,
    outcome: 'applied' | 'failed',
  ): Promise<void> {
    if (!bundleId) return
    await pool.query(
      `UPDATE silver.failure_bundle
       SET repair_attempted = TRUE, repair_outcome = $2, updated_at = NOW()
       WHERE bundle_id = $1`,
      [bundleId, outcome],
    )
  }

  private async recordStressEscalation(
    pool: Pool,
    details: {
      bundleId: string
      moduleId: string
      providerId: string
      route: string
      category: FailureCategory
      severity: FailureSeverity
      fetcherSource: string
      failureLayer: string
      consecutiveFailures: number
      action: string
      overridesApplied: number
    },
  ): Promise<void> {
    await pool.query(
      `INSERT INTO silver.agent_action
       (agent_id, module_id, action_type, description, status, requires_approval, result)
       VALUES ($1, $2, 'stress_response', $3, 'completed', FALSE, $4)`,
      [
        'stress-response-handler',
        details.moduleId,
        `Stress response for ${details.route || 'unknown'} (${details.category}/${details.severity})`,
        JSON.stringify(details),
      ],
    )
  }
}
