import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('provider probe lambda wiring', () => {
  it('loads generic probe workload after runtime env resolution without dynamic import poisoning', () => {
    const file = path.join(process.cwd(), 'scripts', 'aws', 'provider-probe-lambda.ts')
    const content = readFileSync(file, 'utf8')

    expect(content).not.toContain("from '../lib/generic-probe'")
    expect(content).toContain("require('../lib/generic-probe')")
    expect(content).not.toContain("await import('../lib/generic-probe')")
    expect(content).toContain('DATABASE_URL_PLANE_B is required but not set after resolution')
  })
})
