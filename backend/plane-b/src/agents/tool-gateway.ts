import type { Pool } from 'pg'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve, normalize } from 'node:path'
import { createLogger } from '../../../shared/logger'
import { config } from '../../../shared/config'
import type { ToolType, ToolRequest, ToolResult, ToolGatewayPolicy } from '../../../shared/types/tool-gateway'
import { DEFAULT_TOOL_GATEWAY_POLICY } from '../../../shared/types/tool-gateway'
import type { AgentId } from './agent-config'
import { recordCloudWatchMetric } from '../../../shared/cloudwatch-metrics'
import { notifyAgent } from '../../../shared/agent-notifications'
import { captureExceptionWithContext } from '../../../shared/error-tracker'
import { getRedisClient } from '../../../shared/redis'

const AGENT_METRIC_NAMESPACE = 'RemitScout/Agents'
const agentMetricDimensions = (
  extra: Record<string, string | undefined> = {},
): Record<string, string> => {
  const dims: Record<string, string> = {
    environment: process.env.ENVIRONMENT || process.env.NODE_ENV || 'development',
    service: 'remit-scout',
    connector: config.agent.llmConnector,
    model: config.agent.llmModel,
  }
  for (const [key, value] of Object.entries(extra)) {
    const normalized = (value || '').trim()
    if (normalized) {
      dims[key] = normalized.slice(0, 255)
    }
  }
  return dims
}

const logger = createLogger('plane-b.agents.tool-gateway')

/**
 * Per-agent policy overrides.
 *
 * Each agent can have a restricted set of tools and custom rate limits.
 * If no override exists for an agent, the gateway's default policy is used.
 */
type AgentPolicyOverride = {
  /** Allowed tool types for this agent (subset of gateway policy) */
  allowedTools: ToolType[]
  /** Per-agent rate limit (requests per window) */
  rateLimitMaxRequests: number
  /** Per-agent rate limit window in ms */
  rateLimitWindowMs: number
}

/**
 * Rate limit entry — tracks per-agent and per-tool request counts.
 */
type RateLimitEntry = {
  count: number
  windowStart: number
}

/**
 * Built-in per-agent policy overrides.
 *
 * These define the principle of least privilege for each agent:
 * - failure-detector: read-only DB access
 * - patch-proposer: file reads + DB + knowledge retrieval
 * - patch-validator: file reads + DB
 * - stress-responder: DB + Redis (for cadence overrides)
 * - orchestrator: full read access
 */
const AGENT_POLICY_OVERRIDES: Partial<Record<AgentId, AgentPolicyOverride>> = {
  'failure-detector': {
    allowedTools: ['db_query'],
    rateLimitMaxRequests: 120,
    rateLimitWindowMs: 60_000,
  },
  'patch-proposer': {
    allowedTools: ['db_query', 'file_read', 'http_fetch', 'llm_inference'],
    rateLimitMaxRequests: 30,
    rateLimitWindowMs: 60_000,
  },
  'patch-validator': {
    allowedTools: ['db_query', 'file_read'],
    rateLimitMaxRequests: 60,
    rateLimitWindowMs: 60_000,
  },
  'patch-deployer': {
    allowedTools: ['db_query', 'file_read', 'file_write', 'git_read', 'git_write', 'github_api'],
    rateLimitMaxRequests: 20,
    rateLimitWindowMs: 60_000,
  },
  'stress-responder': {
    allowedTools: ['db_query', 'redis_command'],
    rateLimitMaxRequests: 60,
    rateLimitWindowMs: 60_000,
  },
  'orchestrator': {
    allowedTools: ['db_query', 'redis_command', 'file_read', 'git_read'],
    rateLimitMaxRequests: 120,
    rateLimitWindowMs: 60_000,
  },
}

/**
 * Tool Gateway — mediates all external interactions by the agent system.
 *
 * Every tool invocation by an agent flows through the gateway, which:
 * 1. Validates the request against the agent's specific policy (least-privilege)
 * 2. Validates against the gateway-level default policy
 * 3. Checks per-agent and per-tool rate limits
 * 4. Logs the request to `silver.agent_tool_request`
 * 5. Executes the tool (or queues for approval)
 * 6. Logs the result to `silver.agent_tool_result`
 *
 * The gateway enforces the principle that agents NEVER directly call external
 * services — all I/O is mediated, audited, and policy-gated.
 *
 * Fetch-layer tools:
 * - http_fetch: Plain HTTP GET/POST (used by stress-responder for health probes)
 * - browser_navigate: Playwright page navigation (used for DOM signature capture)
 * - db_query: Read-only SQL SELECT (used by all agents for evidence gathering)
 */
export class ToolGateway {
  private readonly pool: Pool
  private readonly policy: ToolGatewayPolicy
  private activeRequests = 0

  /** Per-agent spend tracking (cumulative cost in USD) */
  private agentSpend = new Map<string, number>()
  /** Maximum spend per agent before requests are blocked (USD) */
  private static readonly MAX_SPEND_PER_AGENT_USD = 50

  /** Per-agent rate limit tracking */
  private agentRateLimits = new Map<string, RateLimitEntry>()
  /** Per-agent-per-tool rate limit tracking (key: "agentId:toolType") */
  private toolRateLimits = new Map<string, RateLimitEntry>()

  /** Per-tool rate limits (requests per minute) */
  private static readonly TOOL_RATE_LIMITS: Partial<Record<ToolType, number>> = {
    http_fetch: 30,
    browser_navigate: 10,
    llm_inference: 10,
    github_api: 15,
    shell_exec: 5,
  }

  constructor(pool: Pool, policy?: ToolGatewayPolicy) {
    this.pool = pool
    this.policy = policy ?? DEFAULT_TOOL_GATEWAY_POLICY
  }

  private extractRequestTelemetryDims(
    request: Omit<ToolRequest, 'requestId' | 'submittedAt'>,
  ): Record<string, string> {
    const params = request.params || {}
    const asString = (value: unknown): string | undefined =>
      typeof value === 'string' && value.trim() ? value.trim() : undefined

    const route =
      asString(params.route) ||
      asString(params.corridorId) ||
      asString(params.corridor) ||
      'unknown'
    const providerId =
      asString(params.providerId) ||
      asString(params.provider_id) ||
      'unknown'
    const validatorModule =
      asString(params.validatorModule) ||
      asString(params.validator_module) ||
      (request.moduleId || 'unknown')
    const runId =
      asString(params.runId) ||
      asString(params.run_id) ||
      asString(params.correlationId) ||
      asString(params.correlation_id) ||
      request.moduleId ||
      request.agentId

    return {
      provider_id: providerId,
      route,
      validator_module: validatorModule,
      run_id: runId,
      correlation_id: runId,
      tool_type: request.toolType,
      agent_id: request.agentId,
    }
  }

  /**
   * Submit a tool request for execution.
   */
  async submit(request: Omit<ToolRequest, 'requestId' | 'submittedAt'>): Promise<ToolResult> {
    const requestId = randomUUID()
    const submittedAt = new Date().toISOString()
    const startedAt = Date.now()
    const requestDims = this.extractRequestTelemetryDims(request)

    // Emit tool request metric
    recordCloudWatchMetric({
      name: 'tool_request_total',
      value: 1,
      unit: 'Count',
      namespace: AGENT_METRIC_NAMESPACE,
      dimensions: agentMetricDimensions({
        ...requestDims,
        outcome: 'submitted',
      }),
      highCardinality: true,
    })

    // Policy check 1: Agent-level tool authorization
    const agentDenied = this.checkAgentAuthorization(request.agentId, request.toolType)
    if (agentDenied) {
      return this.deny(requestId, request, startedAt, agentDenied)
    }

    // Policy check 2: Gateway-level tool allowlist
    if (!this.policy.allowedTools.includes(request.toolType)) {
      return this.deny(requestId, request, startedAt, `Tool type '${request.toolType}' not in gateway allowedTools`)
    }

    // Policy check 3: Write operations
    if (!this.policy.writeEnabled && isWriteTool(request.toolType)) {
      return this.deny(requestId, request, startedAt, 'Write operations disabled by gateway policy')
    }

    // Policy check 4: Domain allowlist for HTTP tools (fail-closed)
    if (request.toolType === 'http_fetch' || request.toolType === 'browser_navigate') {
      const url = request.params.url as string | undefined
      if (!url) {
        return this.deny(requestId, request, startedAt, 'Missing required param: url')
      }
      if (this.policy.domainAllowlist.length === 0) {
        return this.deny(requestId, request, startedAt, 'Domain allowlist is empty — all HTTP requests denied (fail-closed)')
      }
      if (!this.isDomainAllowed(url)) {
        return this.deny(requestId, request, startedAt, `Domain not in allowlist: ${url}`)
      }
    }

    // Concurrency check
    if (this.activeRequests >= this.policy.maxConcurrentRequests) {
      return this.deny(requestId, request, startedAt, 'Max concurrent requests exceeded')
    }

    // Rate limit check: per-agent
    if (!this.checkAgentRateLimit(request.agentId)) {
      return this.deny(requestId, request, startedAt, `Agent '${request.agentId}' rate limit exceeded`)
    }

    // Rate limit check: per-agent-per-tool
    if (!this.checkToolRateLimit(request.agentId, request.toolType)) {
      return this.deny(requestId, request, startedAt, `Tool '${request.toolType}' rate limit exceeded for agent '${request.agentId}'`)
    }

    // Spend check: block if agent exceeds spend limit (applies to cost-bearing tools)
    if (request.toolType === 'llm_inference' || request.toolType === 'http_fetch') {
      const currentSpend = this.agentSpend.get(request.agentId) ?? 0
      if (currentSpend >= ToolGateway.MAX_SPEND_PER_AGENT_USD) {
        return this.deny(requestId, request, startedAt, `Agent '${request.agentId}' spend limit exceeded ($${currentSpend.toFixed(2)}/$${ToolGateway.MAX_SPEND_PER_AGENT_USD})`)
      }
    }

    // Check if approval is required
    const needsApproval = request.requiresApproval || this.policy.approvalRequired.includes(request.toolType)

    // Log the request
    await this.logRequest(requestId, request, submittedAt, needsApproval)

    if (needsApproval) {
      logger.info('tool_request_pending_approval', { requestId, toolType: request.toolType, agentId: request.agentId })
      return {
        requestId,
        success: false,
        data: null,
        errorMessage: 'Pending human approval',
        durationMs: Date.now() - startedAt,
        approved: false,
        approvedBy: null,
        completedAt: new Date().toISOString(),
      }
    }

    // Execute the tool
    this.activeRequests++
    try {
      const result = await this.executeTool(request.toolType, request.params, request.ttlMs)

      // Track estimated spend for cost-bearing tools
      if (request.toolType === 'llm_inference') {
        const estimatedCost = 0.01 // conservative per-call estimate
        const current = this.agentSpend.get(request.agentId) ?? 0
        const updatedSpend = current + estimatedCost
        this.agentSpend.set(request.agentId, updatedSpend)

        // Warn at 80% of spend cap (fire once on first crossing)
        const SPEND_WARNING_THRESHOLD = 0.8
        const warningLimit = ToolGateway.MAX_SPEND_PER_AGENT_USD * SPEND_WARNING_THRESHOLD
        if (updatedSpend >= warningLimit && current < warningLimit) {
          recordCloudWatchMetric({
            name: 'agent_spend_warning',
            value: updatedSpend,
            unit: 'None',
            namespace: AGENT_METRIC_NAMESPACE,
            dimensions: agentMetricDimensions({ agent_id: request.agentId }),
          })
          void notifyAgent({
            type: 'spend_warning',
            title: `Agent '${request.agentId}' reached ${Math.round((updatedSpend / ToolGateway.MAX_SPEND_PER_AGENT_USD) * 100)}% spend ($${updatedSpend.toFixed(2)}/$${ToolGateway.MAX_SPEND_PER_AGENT_USD}).`,
            severity: 'warning',
            details: { agentId: request.agentId, currentSpend: updatedSpend, limit: ToolGateway.MAX_SPEND_PER_AGENT_USD },
          })
        }
      }

      const toolResult: ToolResult = {
        requestId,
        success: true,
        data: result,
        errorMessage: null,
        durationMs: Date.now() - startedAt,
        approved: true,
        approvedBy: 'policy',
        completedAt: new Date().toISOString(),
      }

      recordCloudWatchMetric({
        name: 'tool_request_success',
        value: 1,
        unit: 'Count',
        namespace: AGENT_METRIC_NAMESPACE,
        dimensions: agentMetricDimensions({
          ...requestDims,
          outcome: 'success',
          reason_code: 'executed',
        }),
        highCardinality: true,
      })
      await this.logResult(toolResult)
      return toolResult
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      captureExceptionWithContext(error, {
        component: 'tool-gateway.executeTool',
        requestId,
        agentId: request.agentId,
        toolType: request.toolType,
      }, { agent: 'tool-gateway' })
      const toolResult: ToolResult = {
        requestId,
        success: false,
        data: null,
        errorMessage: error.message,
        durationMs: Date.now() - startedAt,
        approved: true,
        approvedBy: 'policy',
        completedAt: new Date().toISOString(),
      }

      recordCloudWatchMetric({
        name: 'tool_request_error',
        value: 1,
        unit: 'Count',
        namespace: AGENT_METRIC_NAMESPACE,
        dimensions: agentMetricDimensions({
          ...requestDims,
          outcome: 'error',
          reason_code: error.message.slice(0, 64),
        }),
        highCardinality: true,
      })
      await this.logResult(toolResult)
      return toolResult
    } finally {
      this.activeRequests--
    }
  }

  /**
   * Check whether an agent is authorized to use a specific tool type.
   *
   * Returns null if authorized, or an error message string if denied.
   */
  private checkAgentAuthorization(agentId: string, toolType: ToolType): string | null {
    const override = AGENT_POLICY_OVERRIDES[agentId as AgentId]
    if (!override) {
      // No override — fall through to gateway-level policy
      return null
    }

    if (!override.allowedTools.includes(toolType)) {
      return `Agent '${agentId}' is not authorized to use tool '${toolType}'. Allowed: ${override.allowedTools.join(', ')}`
    }

    return null
  }

  /**
   * Check per-agent rate limit using the agent's policy override or gateway default.
   */
  private checkAgentRateLimit(agentId: string): boolean {
    const override = AGENT_POLICY_OVERRIDES[agentId as AgentId]
    const maxRequests = override?.rateLimitMaxRequests ?? this.policy.rateLimitMaxRequests
    const windowMs = override?.rateLimitWindowMs ?? this.policy.rateLimitWindowMs

    return this.checkRateLimitEntry(this.agentRateLimits, agentId, maxRequests, windowMs)
  }

  /**
   * Check per-agent-per-tool rate limit.
   *
   * Some tools (http_fetch, browser_navigate, llm_inference) have their own
   * per-minute limits to prevent abuse.
   */
  private checkToolRateLimit(agentId: string, toolType: ToolType): boolean {
    const toolLimit = ToolGateway.TOOL_RATE_LIMITS[toolType]
    if (toolLimit === undefined) return true // No per-tool limit

    const key = `${agentId}:${toolType}`
    return this.checkRateLimitEntry(this.toolRateLimits, key, toolLimit, 60_000)
  }

  /**
   * Generic rate limit check against a sliding window counter.
   */
  private checkRateLimitEntry(
    store: Map<string, RateLimitEntry>,
    key: string,
    maxRequests: number,
    windowMs: number,
  ): boolean {
    const now = Date.now()
    const entry = store.get(key)

    if (!entry || now - entry.windowStart > windowMs) {
      store.set(key, { count: 1, windowStart: now })
      return true
    }

    if (entry.count >= maxRequests) {
      return false
    }

    entry.count++
    return true
  }

  /**
   * Execute a tool operation.
   *
   * Supported tool types:
   * - db_query: Read-only SQL (SELECT/WITH)
   * - redis_command: Redis operations (stub)
   * - http_fetch: HTTP GET/POST with timeout
   * - browser_navigate: Playwright page fetch (stub)
   * - file_read: Read a file from the repository
   * - llm_inference: LLM completion (delegated to caller)
   */
  private async executeTool(toolType: ToolType, params: Record<string, unknown>, ttlMs: number): Promise<unknown> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), ttlMs)

    try {
      switch (toolType) {
        case 'db_query':
          return this.executeDbQuery(params)
        case 'redis_command':
          return this.executeRedisCommand(params)
        case 'http_fetch':
          return this.executeHttpFetch(params, controller.signal)
        case 'browser_navigate':
          return this.executeBrowserNavigate(params)
        case 'file_read':
          return this.executeFileRead(params)
        case 'github_api':
          return this.executeGitHubApi(params, controller.signal)
        default:
          throw new Error(`Tool type '${toolType}' execution not yet implemented`)
      }
    } finally {
      clearTimeout(timeout)
    }
  }

  /**
   * Execute a read-only database query.
   */
  private async executeDbQuery(params: Record<string, unknown>): Promise<unknown> {
    const sql = params.sql as string
    if (!sql) throw new Error('Missing required param: sql')

    // Safety: strip SQL block comments (/* ... */) and line comments (-- ...)
    // before validating the query type, to prevent bypass via comment-prefixed DML.
    const stripped = sql
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/--[^\n]*/g, '')
      .trim()
      .toUpperCase()

    if (!stripped.startsWith('SELECT') && !stripped.startsWith('WITH')) {
      throw new Error('Only SELECT/WITH queries allowed through tool gateway')
    }

    // Block stacked queries (semicolons) to prevent appended DML
    if (stripped.includes(';')) {
      throw new Error('Semicolons are not allowed in tool gateway queries')
    }

    const values = (params.values as unknown[]) ?? []
    const { rows } = await this.pool.query(sql, values)
    return rows
  }

  /**
   * Execute a read-only Redis command.
   *
   * Supported commands: GET, HGET, HGETALL, KEYS, TTL, EXISTS, TYPE, SCARD, SMEMBERS
   * Write commands are blocked to prevent agents from mutating cache state.
   */
  private async executeRedisCommand(params: Record<string, unknown>): Promise<unknown> {
    const command = (params.command as string)?.toUpperCase()
    if (!command) throw new Error('Missing required param: command')

    const args = (params.args as string[]) ?? []

    const allowedCommands = new Set([
      'GET', 'HGET', 'HGETALL', 'KEYS', 'TTL', 'PTTL',
      'EXISTS', 'TYPE', 'SCARD', 'SMEMBERS', 'LLEN', 'LRANGE',
      'MGET', 'SISMEMBER',
    ])

    if (!allowedCommands.has(command)) {
      throw new Error(`Redis command '${command}' is not allowed through tool gateway. Only read commands permitted.`)
    }

    const client = await getRedisClient()
    if (!client) {
      throw new Error('Redis client not available')
    }

    const result = await client.sendCommand([command, ...args])
    return result
  }

  /**
   * Execute an HTTP fetch request with abort signal support.
   *
   * Supported params:
   * - url (string, required): The URL to fetch
   * - method (string, optional): HTTP method (default: 'GET')
   * - headers (Record<string,string>, optional): Request headers
   * - body (string, optional): Request body for POST/PUT
   */
  private async executeHttpFetch(
    params: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<unknown> {
    const url = params.url as string
    if (!url) throw new Error('Missing required param: url')

    const method = (params.method as string) ?? 'GET'
    const headers = (params.headers as Record<string, string>) ?? {}
    const body = params.body as string | undefined

    const response = await fetch(url, {
      method,
      headers,
      body: method !== 'GET' && method !== 'HEAD' ? body : undefined,
      signal,
    })

    const responseBody = await response.text()
    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseBody.slice(0, 50_000), // Cap response size
    }
  }

  /**
   * Execute a Playwright browser navigation.
   *
   * In ECS containers with Playwright installed, this will launch a headless
   * browser. Otherwise falls back to http_fetch for basic page content.
   */
  private async executeBrowserNavigate(params: Record<string, unknown>): Promise<unknown> {
    const url = params.url as string
    if (!url) throw new Error('Missing required param: url')

    // Check for Playwright availability at runtime
    try {
      // Use a non-static dynamic import so backend builds don't require
      // playwright-core at compile time in minimal runtime images.
      const dynamicImport = new Function('m', 'return import(m)') as (m: string) => Promise<any>
      const { chromium } = await dynamicImport('playwright-core')
      const browser = await chromium.launch({ headless: true })
      try {
        const page = await browser.newPage()
        await page.goto(url, { timeout: 30_000, waitUntil: 'domcontentloaded' })
        const content = await page.content()
        const title = await page.title()
        return {
          url,
          title,
          content: content.slice(0, 100_000),
          truncated: content.length > 100_000,
        }
      } finally {
        await browser.close()
      }
    } catch {
      // Playwright not available — fall back to http_fetch
      logger.info('browser_navigate_fallback_to_http', { url })
      return this.executeHttpFetch({ url, method: 'GET' }, new AbortController().signal)
    }
  }

  /**
   * Execute a file read operation.
   *
   * Safety: Only allows reading files under permitted directories
   * to prevent arbitrary filesystem access. Paths are normalized to
   * prevent directory traversal attacks.
   */
  private async executeFileRead(params: Record<string, unknown>): Promise<unknown> {
    const filePath = params.path as string
    if (!filePath) throw new Error('Missing required param: path')

    // Safety: restrict to known safe paths
    const safePrefixes = [
      'backend/plane-b/src/providers/',
      'backend/plane-b/src/collectors/',
      'backend/plane-b/src/normalize/',
      'backend/shared/',
    ]

    // Normalize to prevent directory traversal
    const normalized = normalize(filePath).replace(/\\/g, '/')
    if (normalized.includes('..')) {
      throw new Error(`File read denied: path traversal detected in '${filePath}'`)
    }

    if (!safePrefixes.some((prefix) => normalized.startsWith(prefix))) {
      throw new Error(`File read denied: path '${normalized}' is not in a permitted directory`)
    }

    // Resolve against the project root (cwd)
    const absolutePath = resolve(process.cwd(), normalized)

    try {
      const content = await readFile(absolutePath, 'utf-8')
      return {
        path: normalized,
        available: true,
        content: content.slice(0, 100_000), // Cap at 100KB
        truncated: content.length > 100_000,
        sizeBytes: content.length,
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {
          path: normalized,
          available: false,
          note: 'File not found. Use db_query to fetch indexed source from knowledge_chunk instead.',
        }
      }
      throw new Error(`File read failed for '${normalized}': ${error.message}`)
    }
  }

  /**
   * Execute a GitHub API request.
   *
   * Supported params:
   * - method (string): HTTP method (GET/POST/PUT/PATCH/DELETE)
   * - endpoint (string): API path (e.g. /repos/owner/repo/pulls)
   * - token (string): GitHub token for authentication
   * - body (object, optional): Request body for POST/PUT/PATCH
   */
  private async executeGitHubApi(
    params: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<unknown> {
    const method = (params.method as string) ?? 'GET'
    const endpoint = params.endpoint as string
    const token = params.token as string
    const body = params.body as Record<string, unknown> | undefined

    if (!endpoint) throw new Error('Missing required param: endpoint')
    if (!token) throw new Error('Missing required param: token')

    const url = endpoint.startsWith('https://')
      ? endpoint
      : `https://api.github.com${endpoint}`

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    })

    const responseText = await response.text()
    let responseData: unknown
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = responseText.slice(0, 10_000)
    }

    if (!response.ok) {
      throw new Error(`GitHub API ${method} ${endpoint} returned ${response.status}: ${responseText.slice(0, 500)}`)
    }

    return responseData
  }

  private deny(
    requestId: string,
    request: Omit<ToolRequest, 'requestId' | 'submittedAt'>,
    startedAt: number,
    reason: string,
  ): ToolResult {
    const requestDims = this.extractRequestTelemetryDims(request)
    // Emit blocked metric
    recordCloudWatchMetric({
      name: 'tool_request_blocked',
      value: 1,
      unit: 'Count',
      namespace: AGENT_METRIC_NAMESPACE,
      dimensions: agentMetricDimensions({
        ...requestDims,
        outcome: 'blocked',
        reason_code: reason.slice(0, 64),
      }),
      highCardinality: true,
    })
    // Notify #agent-ops of policy violations
    notifyAgent({
      type: 'tool_gateway_violation',
      title: `Tool request denied: ${request.toolType} by ${request.agentId}`,
      severity: 'warning',
      details: {
        requestId,
        agentId: request.agentId,
        toolType: request.toolType,
        reason,
      },
    }).catch(() => {})
    logger.warn('tool_request_denied', { requestId, toolType: request.toolType, agentId: request.agentId, reason })
    return {
      requestId,
      success: false,
      data: null,
      errorMessage: reason,
      durationMs: Date.now() - startedAt,
      approved: false,
      approvedBy: null,
      completedAt: new Date().toISOString(),
    }
  }

  private isDomainAllowed(url: string): boolean {
    try {
      const hostname = new URL(url).hostname
      return this.policy.domainAllowlist.some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
      )
    } catch {
      return false
    }
  }

  private async logRequest(
    requestId: string,
    request: Omit<ToolRequest, 'requestId' | 'submittedAt'>,
    submittedAt: string,
    requiresApproval: boolean,
  ): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO silver.agent_tool_request
         (request_id, agent_id, module_id, tool_type, operation, params, requires_approval, ttl_ms, submitted_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [requestId, request.agentId, request.moduleId, request.toolType, request.operation,
         JSON.stringify(request.params), requiresApproval, request.ttlMs, submittedAt],
      )
    } catch (err) {
      logger.error('tool_request_log_error', { requestId, error: err instanceof Error ? err.message : String(err) })
    }
  }

  private async logResult(result: ToolResult): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO silver.agent_tool_result
         (request_id, success, data, error_message, duration_ms, approved, approved_by, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [result.requestId, result.success, result.data ? JSON.stringify(result.data) : null,
         result.errorMessage, result.durationMs, result.approved, result.approvedBy, result.completedAt],
      )
    } catch (err) {
      logger.error('tool_result_log_error', { requestId: result.requestId, error: err instanceof Error ? err.message : String(err) })
    }
  }
}

const isWriteTool = (toolType: ToolType): boolean =>
  toolType === 'file_write' || toolType === 'git_write' || toolType === 'github_api' || toolType === 'shell_exec'
