/**
 * Tool types available through the Tool Gateway.
 *
 * The Tool Gateway mediates all external interactions by the agent system,
 * providing policy enforcement, audit logging, and rate limiting.
 */
export type ToolType =
  | 'http_fetch'
  | 'browser_navigate'
  | 'db_query'
  | 'redis_command'
  | 'sqs_send'
  | 'file_read'
  | 'file_write'
  | 'git_read'
  | 'git_write'
  | 'github_api'
  | 'llm_inference'
  | 'shell_exec'
  | 'playwright_discovery'

/**
 * Tool request — submitted by agents to the Tool Gateway for approval.
 */
export type ToolRequest = {
  /** Unique request ID (UUID v4) */
  requestId: string
  /** Agent that submitted the request */
  agentId: string
  /** Module context (if applicable) */
  moduleId: string | null
  /** Tool type requested */
  toolType: ToolType
  /** Operation description for audit trail */
  operation: string
  /** Tool-specific parameters */
  params: Record<string, unknown>
  /** Whether this request requires human approval */
  requiresApproval: boolean
  /** ISO 8601 timestamp when the request was submitted */
  submittedAt: string
  /** TTL in ms — request expires after this */
  ttlMs: number
}

/**
 * Tool result — returned by the Tool Gateway after execution.
 */
export type ToolResult = {
  /** Request ID this result corresponds to */
  requestId: string
  /** Whether the tool execution succeeded */
  success: boolean
  /** Result data (tool-specific) */
  data: unknown
  /** Error message if failed */
  errorMessage: string | null
  /** Duration of tool execution in ms */
  durationMs: number
  /** Whether the request was approved (for approval-required tools) */
  approved: boolean
  /** Approver (human or policy) */
  approvedBy: string | null
  /** ISO 8601 timestamp when the result was produced */
  completedAt: string
}

/**
 * Tool Gateway policy — governs what tools agents can use.
 */
export type ToolGatewayPolicy = {
  /** Allowed tool types */
  allowedTools: ToolType[]
  /** Tools that require human approval */
  approvalRequired: ToolType[]
  /** Maximum concurrent tool requests per agent */
  maxConcurrentRequests: number
  /** Rate limit: max requests per window */
  rateLimitMaxRequests: number
  /** Rate limit: window duration in ms */
  rateLimitWindowMs: number
  /** Domain allowlist for http_fetch and browser_navigate */
  domainAllowlist: string[]
  /** Whether write operations are allowed (false = read-only mode) */
  writeEnabled: boolean
}

/**
 * Default read-only policy for new agents.
 */
export const DEFAULT_TOOL_GATEWAY_POLICY: ToolGatewayPolicy = {
  allowedTools: ['http_fetch', 'db_query', 'redis_command', 'file_read', 'git_read', 'playwright_discovery'],
  approvalRequired: ['git_write', 'github_api', 'shell_exec', 'file_write'],
  maxConcurrentRequests: 3,
  rateLimitMaxRequests: 60,
  rateLimitWindowMs: 60_000,
  domainAllowlist: [],
  writeEnabled: false,
}
