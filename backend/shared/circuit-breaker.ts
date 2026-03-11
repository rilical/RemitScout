import { config } from './config'
import { createLogger } from './logger'

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export type CircuitBreakerOptions = {
  name: string
  openAfterFailures?: number
  openForMs?: number
}

const logger = createLogger('shared.circuit-breaker')

const emitCircuitMetric = (from: CircuitState, to: CircuitState, circuitName: string): void => {
  void import('./cloudwatch-metrics')
    .then(({ recordCloudWatchMetric }) => {
      recordCloudWatchMetric({
        name: 'circuit_breaker_state_change',
        value: 1,
        unit: 'Count',
        dimensions: {
          provider: circuitName,
          from,
          to,
          environment: config.envName || config.env,
        },
      })
    })
    .catch(() => {
      // Ignore metric emission failures to keep the circuit breaker non-blocking.
    })
}

const emitCircuitOpsEvent = (
  type: 'circuit_open' | 'circuit_close',
  component: string,
  details: Record<string, unknown>,
): void => {
  void import('./ops-events')
    .then(({ emitOpsEvent }) => {
      emitOpsEvent({ type, component, details })
    })
    .catch(() => {
      // Ignore ops event failures to keep the circuit breaker non-blocking.
    })
}

export class CircuitBreaker {
  private readonly name: string
  private readonly openAfterFailures: number
  private readonly openForMs: number
  private state: CircuitState = 'CLOSED'
  private consecutiveFailures = 0
  private openedAtMs: number | null = null
  /** True when a HALF_OPEN probe is in-flight, preventing additional probes. */
  private halfOpenProbeInflight = false

  constructor(options: CircuitBreakerOptions) {
    this.name = options.name
    this.openAfterFailures = Math.max(1, options.openAfterFailures ?? 5)
    this.openForMs = Math.max(1000, options.openForMs ?? 60_000)
  }

  private transition(to: CircuitState, details: Record<string, unknown> = {}): void {
    const from = this.state
    if (from === to) return
    this.state = to
    if (to === 'OPEN') {
      this.openedAtMs = Date.now()
    }
    if (to !== 'OPEN') {
      this.openedAtMs = null
    }

    logger.warn('circuit_breaker_state_change', {
      circuit: this.name,
      from,
      to,
      ...details,
    })

    // Avoid static import cycle with cloudwatch-metrics by loading lazily.
    emitCircuitMetric(from, to, this.name)

    emitCircuitOpsEvent(to === 'OPEN' ? 'circuit_open' : 'circuit_close', this.name, {
      from,
      to,
      ...details,
    })
  }

  isOpen(): boolean {
    if (this.state !== 'OPEN') return false
    const openedAt = this.openedAtMs ?? 0
    return Date.now() - openedAt < this.openForMs
  }

  canAttempt(): boolean {
    if (this.state === 'CLOSED') return true
    if (this.state === 'HALF_OPEN') {
      // Only allow a single probe request while in HALF_OPEN.
      // Additional callers are rejected until the probe resolves.
      if (this.halfOpenProbeInflight) return false
      this.halfOpenProbeInflight = true
      return true
    }
    if (this.state === 'OPEN') {
      if (!this.isOpen()) {
        this.transition('HALF_OPEN', { reason: 'open_window_elapsed' })
        this.halfOpenProbeInflight = true
        return true
      }
      return false
    }
    return true
  }

  onSuccess(): void {
    this.consecutiveFailures = 0
    this.halfOpenProbeInflight = false
    if (this.state !== 'CLOSED') {
      this.transition('CLOSED', { reason: 'success' })
    }
  }

  onFailure(error: unknown): void {
    this.consecutiveFailures += 1

    // If the circuit is HALF_OPEN, a single probe failure must immediately
    // re-open the circuit with a fresh cooldown to prevent probe leakage.
    if (this.state === 'HALF_OPEN') {
      this.halfOpenProbeInflight = false
      this.transition('OPEN', {
        reason: 'half_open_probe_failed',
        consecutive_failures: this.consecutiveFailures,
        error: error instanceof Error ? error.message : String(error),
      })
      return
    }

    if (this.consecutiveFailures >= this.openAfterFailures) {
      this.transition('OPEN', {
        reason: 'failure_threshold_reached',
        consecutive_failures: this.consecutiveFailures,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
}
