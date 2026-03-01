import { config } from '../../../shared/config'
import type { ToolGatewayPolicy } from '../../../shared/types/tool-gateway'
import { DEFAULT_TOOL_GATEWAY_POLICY } from '../../../shared/types/tool-gateway'

/**
 * Agent identifiers used throughout the system.
 */
export type AgentId =
  | 'failure-detector'
  | 'patch-proposer'
  | 'patch-validator'
  | 'patch-deployer'
  | 'stress-responder'
  | 'orchestrator'
  | 'parser-handler'
  | 'contract-test-handler'

/**
 * Agent configuration — governs behavior and resource limits.
 */
export type AgentConfig = {
  /** Unique agent identifier */
  agentId: AgentId
  /** Whether the agent is enabled */
  enabled: boolean
  /** Polling interval in ms for the dispatch queue */
  pollIntervalMs: number
  /** Maximum concurrent jobs */
  maxConcurrentJobs: number
  /** Job timeout in ms */
  jobTimeoutMs: number
  /** Tool gateway policy override (uses default if not specified) */
  toolPolicy: ToolGatewayPolicy
  /** Whether the agent requires human approval for actions */
  requiresApproval: boolean
}

/**
 * Resolves agent configuration from environment variables.
 */
export const resolveAgentConfig = (agentId: AgentId): AgentConfig => {
  const prefix = `AGENT_${agentId.toUpperCase().replace(/-/g, '_')}`
  const envEnabled = process.env[`${prefix}_ENABLED`]
  const envPollMs = process.env[`${prefix}_POLL_INTERVAL_MS`]
  const envMaxJobs = process.env[`${prefix}_MAX_CONCURRENT_JOBS`]
  const envTimeoutMs = process.env[`${prefix}_JOB_TIMEOUT_MS`]
  const envApproval = process.env[`${prefix}_REQUIRES_APPROVAL`]

  return {
    agentId,
    enabled: envEnabled === 'true',
    pollIntervalMs: envPollMs ? Number(envPollMs) : 30_000,
    maxConcurrentJobs: envMaxJobs ? Number(envMaxJobs) : 1,
    jobTimeoutMs: envTimeoutMs ? Number(envTimeoutMs) : 120_000,
    toolPolicy: { ...DEFAULT_TOOL_GATEWAY_POLICY },
    requiresApproval: envApproval !== 'false', // default true
  }
}

/**
 * All known agent configurations.
 */
export const AGENT_CONFIGS: Record<AgentId, () => AgentConfig> = {
  'failure-detector': () => resolveAgentConfig('failure-detector'),
  'patch-proposer': () => resolveAgentConfig('patch-proposer'),
  'patch-validator': () => resolveAgentConfig('patch-validator'),
  'patch-deployer': () => resolveAgentConfig('patch-deployer'),
  'stress-responder': () => resolveAgentConfig('stress-responder'),
  'orchestrator': () => resolveAgentConfig('orchestrator'),
  'parser-handler': () => resolveAgentConfig('parser-handler'),
  'contract-test-handler': () => resolveAgentConfig('contract-test-handler'),
}
