import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import type { ISignalRepository, SignalHistoryInput } from '../interfaces/signal-repository.interface'

export class SignalRepository implements ISignalRepository {
  constructor(private readonly pool: Pool) {}

  async insertSignal(input: SignalHistoryInput): Promise<void> {
    await query(
      `INSERT INTO gold.signal_history
       (signal_type, provider_id, corridor_id, current_rate, avg_24h, stddev_24h, z_score, detected_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        input.signalType,
        input.providerId,
        input.corridorId,
        input.currentRate,
        input.avg24h,
        input.stdDev24h,
        input.zScore,
      ],
      this.pool,
    )
  }
}
