import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const repoRoot = path.resolve(__dirname, '..', '..', '..')
const stackPath = path.join(repoRoot, 'infrastructure', 'cdk', 'lib', 'remit-scout-stack.ts')
const stackSource = fs.readFileSync(stackPath, 'utf8')

test('staging ops-pause baselines include plane A and plane C managed services', () => {
  assert.match(
    stackSource,
    /const planeABaseline = 1[\s\S]*const planeCBaseline = 1[\s\S]*addManagedService\(ecsServices\.planeAService, planeABaseline\)[\s\S]*addManagedService\(ecsServices\.planeCService, planeCBaseline\)/,
  )
})
