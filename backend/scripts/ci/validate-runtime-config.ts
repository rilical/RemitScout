import { assertRuntimeConfig } from '../../shared/config'

const run = () => {
  assertRuntimeConfig({
    requirePlaneA: true,
    requirePlaneB: true,
    requirePlaneC: true,
    requireRedis: true,
    requireSupabase: true,
    requireStripe: true,
    requireJwtSecret: true,
  })

  console.log('✅ Runtime configuration validation passed')
}

try {
  run()
} catch (error) {
  console.error(
    'Runtime configuration validation failed:',
    error instanceof Error ? error.message : String(error),
  )
  process.exit(1)
}
