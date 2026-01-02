import { createLogger } from '../../shared/logger'

export type ProbeResult = {
  success: boolean
  providerId?: string
  corridorsTested: number
  corridorsSucceeded: number
  corridorsFailed: number
  durationMs: number
  errors?: Array<{ corridor: string; error: string }>
}

export const createProbeRunner = (options: {
  providerId: string
  corridors?: readonly string[]
  timeoutMs?: number
  retries?: number
  onResult?: (result: ProbeResult) => void
}) => {
  const logger = createLogger(`script.probe.${options.providerId}`)
  const timeoutMs = options.timeoutMs ?? 300000
  const retries = options.retries ?? 0
  const corridorCount = options.corridors?.length ?? 0

  return {
    async run(collectorFn: () => Promise<boolean>): Promise<ProbeResult> {
      const startTime = Date.now()
      let lastError: Error | null = null

      for (let attempt = 0; attempt <= retries; attempt++) {
        let timeoutId: ReturnType<typeof setTimeout> | null = null
        try {
          const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(
              () => reject(new Error(`Probe timeout after ${timeoutMs}ms`)),
              timeoutMs,
            )
          })

          const ok = await Promise.race([collectorFn(), timeoutPromise])
          const durationMs = Date.now() - startTime

          const result: ProbeResult = {
            success: ok,
            providerId: options.providerId,
            corridorsTested: corridorCount,
            corridorsSucceeded: ok ? corridorCount : 0,
            corridorsFailed: ok ? 0 : corridorCount,
            durationMs,
          }

          if (options.onResult) {
            options.onResult(result)
          }

          return result
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error))
          if (attempt < retries) {
            logger.warn('probe_retry', { attempt: attempt + 1, error: lastError.message })
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
          }
        } finally {
          if (timeoutId) {
            clearTimeout(timeoutId)
          }
        }
      }

      const durationMs = Date.now() - startTime
      const result: ProbeResult = {
        success: false,
        providerId: options.providerId,
        corridorsTested: corridorCount,
        corridorsSucceeded: 0,
        corridorsFailed: corridorCount,
        durationMs,
        errors: [{ corridor: 'all', error: lastError?.message ?? 'Unknown error' }],
      }

      if (options.onResult) {
        options.onResult(result)
      }

      return result
    },
  }
}

export const outputProbeResult = (result: ProbeResult, format: 'json' | 'text' = 'json') => {
  if (format === 'json') {
    console.log(JSON.stringify(result, null, 2))
  } else {
    console.log(`Probe ${result.success ? 'PASSED' : 'FAILED'}`)
    console.log(`Provider: ${result.providerId}`)
    console.log(`Duration: ${result.durationMs}ms`)
    console.log(`Corridors: ${result.corridorsSucceeded}/${result.corridorsTested} succeeded`)
    if (result.errors) {
      console.log('Errors:')
      result.errors.forEach(e => console.log(`  - ${e.corridor}: ${e.error}`))
    }
  }
}
