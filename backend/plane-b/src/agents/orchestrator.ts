import type { Pool } from 'pg'
import { randomUUID } from 'node:crypto'
import { createLogger } from '../../../shared/logger'
import type { JobHandler, JobContext, JobResult } from '../../../shared/types/job'
import type { FailureBundle, FailureCategory } from '../../../shared/types/failure-bundle'
import { resolveAgentConfig } from './agent-config'
import { config } from '../../../shared/config'
import { listProviders } from '../../../shared/provider-catalog'
import { FailureDetector } from './failure-detector'
import { recordCloudWatchMetric } from '../../../shared/cloudwatch-metrics'
import { captureExceptionWithContext, addBreadcrumb } from '../../../shared/error-tracker'

const logger = createLogger('plane-b.agents.orchestrator')

/**
 * Maximum number of failure bundles processed per detection cycle.
 *
 * Bundles are sorted by severity descending before the cap is applied,
 * so the most critical issues are always handled first. This prevents a
 * large correlated failure event from overwhelming the self-healing pipeline
 * and consuming runaway LLM budget.
 */
const MAX_BUNDLES_PER_CYCLE = 6

/**
 * Threshold for correlated failure detection.
 *
 * When >= CORRELATED_FAILURE_THRESHOLD bundles appear in the same detection
 * cycle the system treats the event as a platform-wide incident rather than
 * individual module regressions, escalates via CloudWatch, and skips
 * autonomous repair (which would be ineffective during a mass outage).
 */
const CORRELATED_FAILURE_THRESHOLD = 10

/**
 * PostgreSQL advisory lock key used to prevent duplicate detection scans
 * when multiple orchestrator instances are running concurrently (e.g., during
 * a rolling ECS deployment or a failover).
 */
const DETECTION_ADVISORY_LOCK_KEY = 999001

/**
 * Dispatch item — a work unit in the dispatch queue.
 */
type DispatchItem = {
  dispatchId: string
  queueName: string
  moduleId: string | null
  priority: number
  payload: Record<string, unknown>
}

/**
 * Detection cycle configuration.
 */
type DetectionCycleConfig = {
  /** Interval in ms between failure detection cycles (default: 60_000) */
  intervalMs: number
  /** Whether detection is enabled (default: true when orchestrator is enabled) */
  enabled: boolean
}

/**
 * Orchestrator health snapshot — reported by healthCheck().
 */
export type OrchestratorHealth = {
  running: boolean
  activeJobs: number
  registeredHandlers: string[]
  lastDetectionCycleAt: string | null
  detectionCycleCount: number
  totalBundlesRouted: number
  uptimeMs: number
}

/**
 * Routing target — describes which queue a failure bundle should be sent to.
 */
type RoutingTarget = {
  queueName: string
  priority: number
}

/**
 * Categories that are routed to the patch-proposer (parse-layer issues).
 */
const AGENT_METRIC_NAMESPACE = 'RemitScout/Agents'
const agentMetricDimensions = (
  extra: Record<string, string | undefined> = {},
): Record<string, string> => {
  const dims: Record<string, string> = {
    environment: process.env.ENVIRONMENT || process.env.NODE_ENV || 'development',
    service: 'remit-scout',
    connector: config.agent.llmConnector,
    model: config.agent.llmModel,
  }
  for (const [key, value] of Object.entries(extra)) {
    const normalized = (value || '').trim()
    if (normalized) {
      dims[key] = normalized.slice(0, 255)
    }
  }
  return dims
}
const CANONICAL_PROVIDER_IDS = (() => {
  try {
    return listProviders()
  } catch (error) {
    logger.warn('provider_catalog_unavailable_for_coverage_metrics', {
      error: error instanceof Error ? error.message : String(error),
    })
    return [] as string[]
  }
})()

const PATCH_PROPOSER_CATEGORIES: ReadonlySet<FailureCategory> = new Set([
  'parse',
  'dom_change',
  'data_integrity',
])

/**
 * Categories that are routed to the stress-responder (fetch-layer issues).
 */
const STRESS_RESPONDER_CATEGORIES: ReadonlySet<FailureCategory> = new Set([
  'rate_limit',
  'timeout',
  'network',
  'server_error',
])

/**
 * Agent Orchestrator — coordinates the self-healing pipeline.
 *
 * The orchestrator is the top-level controller for the agent system. It:
 * 1. Polls `silver.dispatch_queue` for pending work items
 * 2. Routes items to the appropriate handler (failure detection, parsing, contract testing)
 * 3. Schedules periodic failure detection cycles at configurable intervals
 * 4. Routes failure bundles based on category: parse failures -> patch-proposer,
 *    rate_limit/timeout failures -> stress-responder
 * 5. Manages agent lifecycle (startup, shutdown, health checking)
 * 6. Enforces concurrency limits and timeout policies
 *
 * The orchestrator runs as a long-lived ECS task and is the single entry point
 * for all agent-driven automation.
 */
export class AgentOrchestrator {
  private readonly pool: Pool
  private readonly handlers = new Map<string, JobHandler>()
  private readonly failureDetector: FailureDetector
  private running = false
  private activeJobs = 0

  /** Lifecycle tracking */
  private startedAt: number | null = null
  private lastDetectionCycleAt: string | null = null
  private detectionCycleCount = 0
  private totalBundlesRouted = 0

  /** Detection cycle scheduling */
  private detectionCycleTimer: ReturnType<typeof setTimeout> | null = null
  private detectionCycleConfig: DetectionCycleConfig = {
    intervalMs: 60_000,
    enabled: true,
  }

  constructor(pool: Pool) {
    this.pool = pool
    this.failureDetector = new FailureDetector(pool)
  }

  /**
   * Register a job handler for a specific queue.
   */
  registerHandler(queueName: string, handler: JobHandler): void {
    this.handlers.set(queueName, handler)
    logger.info('handler_registered', { queueName, handlerType: handler.handlerType })
  }

  /**
   * Configure the failure detection cycle interval.
   */
  configureDetectionCycle(config: Partial<DetectionCycleConfig>): void {
    if (config.intervalMs !== undefined) {
      this.detectionCycleConfig.intervalMs = Math.max(5_000, config.intervalMs)
    }
    if (config.enabled !== undefined) {
      this.detectionCycleConfig.enabled = config.enabled
    }
    logger.info('detection_cycle_configured', { ...this.detectionCycleConfig })
  }

  /**
   * Get current orchestrator health.
   */
  healthCheck(): OrchestratorHealth {
    return {
      running: this.running,
      activeJobs: this.activeJobs,
      registeredHandlers: [...this.handlers.keys()],
      lastDetectionCycleAt: this.lastDetectionCycleAt,
      detectionCycleCount: this.detectionCycleCount,
      totalBundlesRouted: this.totalBundlesRouted,
      uptimeMs: this.startedAt ? Date.now() - this.startedAt : 0,
    }
  }

  /**
   * Start the orchestrator polling loop.
   *
   * This starts two concurrent loops:
   * 1. The dispatch queue polling loop (processes work items)
   * 2. The failure detection scheduling loop (detects failures and enqueues repair bundles)
   */
  async start(signal?: AbortSignal): Promise<void> {
    const agentConfig = resolveAgentConfig('orchestrator')
    if (!agentConfig.enabled) {
      logger.info('orchestrator_disabled')
      return
    }

    this.startedAt = Date.now()
    addBreadcrumb('Orchestrator starting', 'agent.orchestrator', 'info')
    logger.info('orchestrator_starting', {
      pollIntervalMs: agentConfig.pollIntervalMs,
      maxConcurrentJobs: agentConfig.maxConcurrentJobs,
      detectionCycleIntervalMs: this.detectionCycleConfig.intervalMs,
      detectionCycleEnabled: this.detectionCycleConfig.enabled,
      llmConnector: config.agent.llmConnector,
      llmModel: config.agent.llmModel,
      llmPromptVersion: config.agent.llmPromptVersion,
    })
    this.running = true

    // Start the detection cycle scheduler
    this.scheduleDetectionCycle(signal)

    while (this.running && !signal?.aborted) {
      try {
        // Poll for dispatch items
        const items = await this.pollDispatchQueue(agentConfig.maxConcurrentJobs - this.activeJobs)

        for (const item of items) {
          if (this.activeJobs >= agentConfig.maxConcurrentJobs) break

          // Process item (fire-and-forget with tracking)
          this.processItem(item, agentConfig.jobTimeoutMs).catch((err) => {
            logger.error('dispatch_item_error', {
              dispatchId: item.dispatchId,
              error: err instanceof Error ? err.message : String(err),
            })
          })
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        captureExceptionWithContext(error, { component: 'orchestrator.poll' }, { agent: 'orchestrator' })
        logger.error('orchestrator_poll_error', { error: error.message })
      }

      // Wait before next poll
      await sleep(agentConfig.pollIntervalMs, signal)
    }

    // Cleanup detection cycle timer on stop
    this.cancelDetectionCycle()
    logger.info('orchestrator_stopped', {
      uptimeMs: this.startedAt ? Date.now() - this.startedAt : 0,
      detectionCycles: this.detectionCycleCount,
      totalBundlesRouted: this.totalBundlesRouted,
    })
  }

  /**
   * Stop the orchestrator gracefully.
   *
   * Cancels the detection cycle timer and signals the polling loop to exit.
   * Active jobs are allowed to complete (no hard kill).
   */
  stop(): void {
    logger.info('orchestrator_stopping', { activeJobs: this.activeJobs })
    this.running = false
    this.cancelDetectionCycle()
  }

  /**
   * Schedule periodic failure detection cycles.
   *
   * Runs on a separate timer from the dispatch queue polling loop so that
   * detection frequency can be tuned independently of work-item processing.
   */
  private scheduleDetectionCycle(signal?: AbortSignal): void {
    if (!this.detectionCycleConfig.enabled) {
      logger.info('detection_cycle_scheduling_disabled')
      return
    }

    const runCycle = async () => {
      if (!this.running || signal?.aborted) return

      await this.runFailureDetection()

      // Schedule next cycle
      if (this.running && !signal?.aborted) {
        this.detectionCycleTimer = setTimeout(() => {
          runCycle().catch((err) => {
            logger.error('detection_cycle_schedule_error', {
              error: err instanceof Error ? err.message : String(err),
            })
          })
        }, this.detectionCycleConfig.intervalMs)
      }
    }

    // Run the first cycle immediately, then schedule subsequent ones
    runCycle().catch((err) => {
      logger.error('detection_cycle_initial_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    })
  }

  /**
   * Cancel the detection cycle timer.
   */
  private cancelDetectionCycle(): void {
    if (this.detectionCycleTimer) {
      clearTimeout(this.detectionCycleTimer)
      this.detectionCycleTimer = null
    }
  }

  /**
   * Run failure detection cycle and route bundles to appropriate agents.
   *
   * Safety controls applied in order:
   *   1. Advisory lock — skips if another orchestrator instance is already scanning
   *   2. Correlated failure guard — escalates instead of repairing when >= 10 bundles detected
   *   3. Blast radius cap — processes only the top MAX_BUNDLES_PER_CYCLE by severity
   */
  private async runFailureDetection(): Promise<void> {
    // --- Advisory lock: prevent duplicate detection scans across orchestrator instances ---
    const { rows: lockRows } = await this.pool.query<{ acquired: boolean }>(
      'SELECT pg_try_advisory_lock($1) AS acquired',
      [DETECTION_ADVISORY_LOCK_KEY],
    )
    if (!lockRows[0]?.acquired) {
      logger.info('detection_cycle_skipped_lock_held', {
        reason: 'another_orchestrator_holds_detection_lock',
        lockKey: DETECTION_ADVISORY_LOCK_KEY,
      })
      return
    }

    try {
      const runId = randomUUID()
      const bundles = await this.failureDetector.detectFailures()
      const providersWithHealableEvents = new Set<string>(bundles.map((bundle) => bundle.providerId))
      this.detectionCycleCount++
      this.lastDetectionCycleAt = new Date().toISOString()

      // Emit detection cycle metric
      recordCloudWatchMetric({
        name: 'detection_cycle_count',
        value: 1,
        unit: 'Count',
        namespace: AGENT_METRIC_NAMESPACE,
        dimensions: agentMetricDimensions({
          run_id: runId,
          correlation_id: runId,
          outcome: 'completed',
        }),
        highCardinality: true,
      })

      if (bundles.length > 0) {
        logger.info('failure_bundles_created', {
          count: bundles.length,
          cycle: this.detectionCycleCount,
          runId,
        })

        // --- Correlated failure guard: escalate instead of repairing mass outages ---
        if (bundles.length >= CORRELATED_FAILURE_THRESHOLD) {
          logger.warn('correlated_failure_detected', {
            bundleCount: bundles.length,
            threshold: CORRELATED_FAILURE_THRESHOLD,
            runId,
            action: 'escalating_not_repairing',
          })
          recordCloudWatchMetric({
            name: 'correlated_failure_escalation',
            value: bundles.length,
            unit: 'Count',
            namespace: AGENT_METRIC_NAMESPACE,
            dimensions: agentMetricDimensions({
              run_id: runId,
              correlation_id: runId,
            }),
            highCardinality: true,
          })
          // Skip individual repairs — fall through to coverage telemetry only.
        } else {
          // --- Blast radius cap: sort by severity, take top MAX_BUNDLES_PER_CYCLE ---
          const severityOrder: Record<string, number> = {
            critical: 10,
            persistent: 7,
            degraded: 4,
            transient: 1,
          }
          const capped = bundles
            .sort((a, b) => (severityOrder[b.severity] ?? 0) - (severityOrder[a.severity] ?? 0))
            .slice(0, MAX_BUNDLES_PER_CYCLE)

          if (bundles.length > MAX_BUNDLES_PER_CYCLE) {
            logger.info('failure_bundles_capped', {
              total: bundles.length,
              dispatching: capped.length,
              deferred: bundles.length - capped.length,
              maxPerCycle: MAX_BUNDLES_PER_CYCLE,
              runId,
            })
            recordCloudWatchMetric({
              name: 'failure_bundles_deferred',
              value: bundles.length - capped.length,
              unit: 'Count',
              namespace: AGENT_METRIC_NAMESPACE,
              dimensions: agentMetricDimensions({
                run_id: runId,
                correlation_id: runId,
              }),
              highCardinality: true,
            })
          }

          // Route each capped bundle to the appropriate agent based on failure category
          for (const bundle of capped) {
            await this.routeFailureBundle(bundle, runId)

            // Emit failure bundle created metric
            recordCloudWatchMetric({
              name: 'failure_bundle_created',
              value: 1,
              unit: 'Count',
              namespace: AGENT_METRIC_NAMESPACE,
              dimensions: agentMetricDimensions({
                provider_id: bundle.providerId,
                route: bundle.affectedCorridors[0] ?? 'unknown',
                fetcher_source: bundle.fetcherSource,
                failure_layer: bundle.failureLayer,
                category: bundle.category,
                run_id: runId,
                correlation_id: bundle.bundleId,
              }),
              highCardinality: true,
            })
          }
        }
      }

      // 24-provider coverage telemetry contract: publish one metric per canonical provider each cycle.
      for (const providerId of CANONICAL_PROVIDER_IDS) {
        const observed = providersWithHealableEvents.has(providerId) ? 1 : 0
        recordCloudWatchMetric({
          name: 'agent_provider_healable_event',
          value: observed,
          unit: 'Count',
          namespace: AGENT_METRIC_NAMESPACE,
          dimensions: agentMetricDimensions({
            provider_id: providerId,
            run_id: runId,
            correlation_id: runId,
          }),
          highCardinality: true,
        })
      }
      recordCloudWatchMetric({
        name: 'agent_provider_coverage_gap_count',
        value: CANONICAL_PROVIDER_IDS.length - providersWithHealableEvents.size,
        unit: 'Count',
        namespace: AGENT_METRIC_NAMESPACE,
        dimensions: agentMetricDimensions({
          run_id: runId,
          correlation_id: runId,
        }),
        highCardinality: true,
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      captureExceptionWithContext(error, { component: 'orchestrator.failureDetection', cycle: this.detectionCycleCount }, { agent: 'orchestrator' })
      logger.error('failure_detection_error', { error: error.message })
    } finally {
      await this.pool.query('SELECT pg_advisory_unlock($1)', [DETECTION_ADVISORY_LOCK_KEY])
    }
  }

  /**
   * Route a failure bundle to the appropriate agent queue based on its category
   * and fetcher source.
   *
   * Routing rules:
   * - parse / dom_change / data_integrity -> 'agent-patch-propose' (patch-proposer)
   * - rate_limit / timeout / network / server_error -> 'agent-stress-respond' (stress-responder)
   * - auth -> 'agent-repair' (generic, requires human investigation)
   * - unknown -> 'agent-repair' (generic fallback)
   *
   * Priority is based on severity: critical=10, persistent=7, degraded=4, transient=1.
   */
  private async routeFailureBundle(bundle: FailureBundle, runId: string): Promise<void> {
    const target = this.resolveRoutingTarget(bundle)

    await this.enqueueDispatch(target.queueName, bundle.moduleId, {
      bundleId: bundle.bundleId,
      correlationId: bundle.bundleId,
      runId,
      category: bundle.category,
      severity: bundle.severity,
      fetcherSource: bundle.fetcherSource,
      failureLayer: bundle.failureLayer,
      providerId: bundle.providerId,
      route: bundle.affectedCorridors[0] ?? 'unknown',
      consecutiveFailures: bundle.consecutiveFailures,
    }, { priority: target.priority })

    this.totalBundlesRouted++

    addBreadcrumb(`Routed bundle ${bundle.bundleId} to ${target.queueName}`, 'agent.orchestrator', 'info')
    logger.info('failure_bundle_routed', {
      bundleId: bundle.bundleId,
      moduleId: bundle.moduleId,
      category: bundle.category,
      targetQueue: target.queueName,
      priority: target.priority,
      providerId: bundle.providerId,
      route: bundle.affectedCorridors[0] ?? 'unknown',
      runId,
      correlationId: bundle.bundleId,
    })
  }

  /**
   * Determine the routing target for a failure bundle.
   */
  private resolveRoutingTarget(bundle: FailureBundle): RoutingTarget {
    const priority = this.severityToPriority(bundle.severity)

    if (PATCH_PROPOSER_CATEGORIES.has(bundle.category)) {
      return { queueName: 'agent-patch-propose', priority }
    }

    if (STRESS_RESPONDER_CATEGORIES.has(bundle.category)) {
      return { queueName: 'agent-stress-respond', priority }
    }

    // auth and unknown fall through to the generic repair queue
    return { queueName: 'agent-repair', priority }
  }

  /**
   * Map failure severity to dispatch priority.
   */
  private severityToPriority(severity: FailureBundle['severity']): number {
    switch (severity) {
      case 'critical': return 10
      case 'persistent': return 7
      case 'degraded': return 4
      case 'transient': return 1
      default: return 0
    }
  }

  /**
   * Poll the dispatch queue for pending items.
   */
  private async pollDispatchQueue(limit: number): Promise<DispatchItem[]> {
    if (limit <= 0) return []

    const { rows } = await this.pool.query<{
      dispatch_id: string
      queue_name: string
      module_id: string | null
      priority: number
      payload: Record<string, unknown>
    }>(
      `UPDATE silver.dispatch_queue
       SET status = 'dispatched', dispatched_at = NOW(), updated_at = NOW()
       WHERE dispatch_id IN (
         SELECT dispatch_id FROM silver.dispatch_queue
         WHERE status = 'pending' AND scheduled_at <= NOW()
           AND (expires_at IS NULL OR expires_at > NOW())
         ORDER BY priority DESC, scheduled_at ASC
         LIMIT $1
         FOR UPDATE SKIP LOCKED
       )
       RETURNING dispatch_id, queue_name, module_id, priority, payload`,
      [limit],
    )

    return rows.map((r) => ({
      dispatchId: r.dispatch_id,
      queueName: r.queue_name,
      moduleId: r.module_id,
      priority: r.priority,
      payload: r.payload,
    }))
  }

  /**
   * Process a single dispatch item.
   */
  private async processItem(item: DispatchItem, timeoutMs: number): Promise<void> {
    const handler = this.handlers.get(item.queueName)
    if (!handler) {
      logger.warn('no_handler_for_queue', { queueName: item.queueName })
      await this.markDispatchStatus(item.dispatchId, 'failed', 'No handler registered')
      return
    }

    this.activeJobs++
    const jobRunId = randomUUID()

    try {
      await this.markDispatchStatus(item.dispatchId, 'processing')

      const context: JobContext = {
        pool: this.pool,
        jobRunId,
        moduleId: item.moduleId ?? '',
        corridors: (item.payload.corridors as string[]) ?? [],
        amountBuckets: (item.payload.amountBuckets as number[]) ?? [],
        params: item.payload,
      }

      // Execute with timeout
      const result = await Promise.race([
        handler.execute(context),
        timeoutPromise(timeoutMs),
      ])

      if (result.success) {
        await this.markDispatchStatus(item.dispatchId, 'completed')
      } else {
        await this.handleItemFailure(item, result.error?.message ?? 'Job failed')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await this.handleItemFailure(item, message)
    } finally {
      this.activeJobs--
    }
  }

  /**
   * Handle a failed dispatch item — retry or mark as failed.
   */
  private async handleItemFailure(item: DispatchItem, errorMessage: string): Promise<void> {
    const { rows } = await this.pool.query<{ attempt: number; max_attempts: number }>(
      `SELECT attempt, max_attempts FROM silver.dispatch_queue WHERE dispatch_id = $1`,
      [item.dispatchId],
    )

    if (rows.length === 0) return

    const { attempt, max_attempts } = rows[0]
    if (attempt < max_attempts) {
      // Retry with backoff
      const backoffMs = Math.min(30_000 * Math.pow(2, attempt), 300_000)
      await this.pool.query(
        `UPDATE silver.dispatch_queue
         SET status = 'pending', attempt = attempt + 1,
             scheduled_at = NOW() + $2 * INTERVAL '1 millisecond',
             error_message = $3, updated_at = NOW()
         WHERE dispatch_id = $1`,
        [item.dispatchId, backoffMs, errorMessage],
      )
    } else {
      await this.markDispatchStatus(item.dispatchId, 'failed', errorMessage)
    }
  }

  /**
   * Enqueue a new dispatch item.
   */
  async enqueueDispatch(
    queueName: string,
    moduleId: string | null,
    payload: Record<string, unknown>,
    options: { priority?: number; scheduledAt?: string } = {},
  ): Promise<string> {
    const dispatchId = randomUUID()
    await this.pool.query(
      `INSERT INTO silver.dispatch_queue
       (dispatch_id, queue_name, module_id, priority, payload, scheduled_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [dispatchId, queueName, moduleId, options.priority ?? 0,
       JSON.stringify(payload), options.scheduledAt ?? new Date().toISOString()],
    )
    return dispatchId
  }

  /**
   * Update dispatch item status.
   */
  private async markDispatchStatus(dispatchId: string, status: string, errorMessage?: string): Promise<void> {
    const completedAt = status === 'completed' || status === 'failed' ? 'NOW()' : 'NULL'
    await this.pool.query(
      `UPDATE silver.dispatch_queue
       SET status = $2, error_message = $3,
           completed_at = ${completedAt},
           updated_at = NOW()
       WHERE dispatch_id = $1`,
      [dispatchId, status, errorMessage ?? null],
    )
  }
}

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => { clearTimeout(timer); resolve() }, { once: true })
  })

const timeoutPromise = (ms: number): Promise<JobResult> =>
  new Promise((_, reject) => setTimeout(() => reject(new Error('Job timed out')), ms))
