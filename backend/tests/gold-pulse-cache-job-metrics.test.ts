import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('gold pulse cache job metrics wiring', () => {
  it('emits batch metrics for start, complete, and failure paths', () => {
    const file = path.join(process.cwd(), 'scripts', 'gold-pulse-cache-job.ts')
    const content = readFileSync(file, 'utf8')

    expect(content).toContain("recordBatchJobMetric('gold-pulse-cache-job', 'job_start'")
    expect(content).toContain("recordBatchJobMetric('gold-pulse-cache-job', 'job_complete'")
    expect(content).toContain("recordBatchJobMetric('gold-pulse-cache-job', 'job_failure'")
  })
})
