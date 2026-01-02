import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import type {
  CircuitBreakerOpenRecord,
  CircuitBreakerRecord,
  CircuitBreakerStateRecord,
  ICircuitBreakerRepository,
} from '../interfaces/circuit-breaker-repository.interface'

export class CircuitBreakerRepository implements ICircuitBreakerRepository {
  constructor(private readonly pool: Pool) {}

  async openCircuit(
    providerId: string,
    corridorId: string | null,
    reason: string,
    cooldownUntil: string | null,
  ): Promise<void> {
    await query(
      `INSERT INTO silver.circuit_breaker
       (provider_id, corridor_id, state, reason, cooldown_until)
       VALUES ($1, $2, 'open', $3, $4)
       ON CONFLICT (provider_id, corridor_id) DO UPDATE SET
         state = EXCLUDED.state,
         reason = EXCLUDED.reason,
         cooldown_until = EXCLUDED.cooldown_until,
         updated_at = NOW()`,
      [providerId, corridorId, reason, cooldownUntil],
      this.pool,
    )
  }

  async halfOpenCircuit(
    providerId: string,
    corridorId: string | null,
    cooldownUntil: string | null,
  ): Promise<void> {
    await query(
      `INSERT INTO silver.circuit_breaker
       (provider_id, corridor_id, state, reason, cooldown_until)
       VALUES ($1, $2, 'half_open', NULL, $3)
       ON CONFLICT (provider_id, corridor_id) DO UPDATE SET
         state = EXCLUDED.state,
         reason = NULL,
         cooldown_until = EXCLUDED.cooldown_until,
         updated_at = NOW()`,
      [providerId, corridorId, cooldownUntil],
      this.pool,
    )
  }

  async closeCircuit(providerId: string, corridorId: string | null): Promise<void> {
    await query(
      `INSERT INTO silver.circuit_breaker
       (provider_id, corridor_id, state, reason, cooldown_until)
       VALUES ($1, $2, 'closed', NULL, NULL)
       ON CONFLICT (provider_id, corridor_id) DO UPDATE SET
         state = EXCLUDED.state,
         reason = NULL,
         cooldown_until = NULL,
         updated_at = NOW()`,
      [providerId, corridorId],
      this.pool,
    )
  }

  async getCircuitState(
    providerId: string,
    corridorId: string | null,
  ): Promise<CircuitBreakerStateRecord | null> {
    const result = await query<CircuitBreakerStateRecord>(
      `SELECT state, cooldown_until
         FROM silver.circuit_breaker
        WHERE provider_id = $1
          AND corridor_id ${corridorId ? '= $2' : 'IS NULL'}`,
      corridorId ? [providerId, corridorId] : [providerId],
      this.pool,
    )
    return result.rows[0] ?? null
  }

  async loadOpenCircuits(providerId: string): Promise<CircuitBreakerOpenRecord[]> {
    const result = await query<CircuitBreakerOpenRecord>(
      `SELECT corridor_id, cooldown_until
         FROM silver.circuit_breaker
        WHERE provider_id = $1
          AND state = 'open'`,
      [providerId],
      this.pool,
    )
    return result.rows
  }

  async closeExpiredOpenCircuits(providerId: string): Promise<void> {
    await query(
      `UPDATE silver.circuit_breaker
          SET state = 'closed',
              updated_at = NOW()
        WHERE provider_id = $1
          AND state = 'open'
          AND cooldown_until IS NOT NULL
          AND cooldown_until <= NOW()`,
      [providerId],
      this.pool,
    )
  }

  async loadAllCircuits(): Promise<CircuitBreakerRecord[]> {
    const result = await query<CircuitBreakerRecord>(
      'SELECT provider_id, corridor_id, state, cooldown_until FROM silver.circuit_breaker',
      [],
      this.pool,
    )
    return result.rows
  }
}
