import { setTimeout as sleep } from 'timers/promises'

type JitterLogger = {
  debug: (event: string, context?: Record<string, unknown>) => void
}

export const resolveJitterMs = (value: string | undefined, fallback = 0): number => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return Math.max(0, fallback)
  return Math.max(0, Math.floor(parsed))
}

export const applyJitter = async (
  logger: JitterLogger,
  label: string,
  jitterMs: number,
): Promise<void> => {
  if (!Number.isFinite(jitterMs) || jitterMs <= 0) return
  const delayMs = Math.floor(Math.random() * jitterMs)
  if (delayMs <= 0) return
  logger.debug('worker_jitter', { label, delay_ms: delayMs })
  await sleep(delayMs)
}
