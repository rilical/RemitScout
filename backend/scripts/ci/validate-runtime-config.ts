import { type RuntimeConfigRequirements } from '../../shared/config'
import { validateConfigOrThrow } from '../../shared/config-schema'
import { auditConfig } from '../../shared/config-audit'

const run = () => {
  const requirements: RuntimeConfigRequirements = {
    requirePlaneA: true,
    requirePlaneB: true,
    requirePlaneCDb: true,
    requirePlaneC: true,
    requireRedis: true,
    requireQueues: true,
    requireStorage: true,
    requireAlerts: true,
    requireSupabase: true,
    requireStripe: true,
    requireJwtSecret: true,
  }

  // Schema-driven validation (includes paths and env var names).
  validateConfigOrThrow(requirements)

  const audit = auditConfig(requirements)
  if (audit.warnings.length > 0) {
    // Warnings are still worth surfacing in CI output.
    console.warn('⚠️ Config warnings (empty strings):', audit.warnings)
  }

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
