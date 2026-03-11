import type { Pool } from 'pg'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { parse as parseYaml } from 'yaml'
import { createLogger } from '../../../shared/logger'
import { config } from '../../../shared/config'
import type { FailureBundle } from '../../../shared/types/failure-bundle'
import { ToolGateway } from './tool-gateway'
import { KnowledgePlane, type KnowledgeChunk } from './knowledge-plane'
import { LLMClient } from './llm-client'
import { isLlmCircuitOpenSentinel } from './llm-circuit-breaker'
import { recordCloudWatchMetric } from '../../../shared/cloudwatch-metrics'
import { notifyAgent } from '../../../shared/agent-notifications'
import { captureExceptionWithContext } from '../../../shared/error-tracker'

const AGENT_METRIC_NAMESPACE = 'RemitScout/Agents'
const agentMetricDimensions = (
  extra: Record<string, string | undefined> = {},
): Record<string, string> => {
  const dims: Record<string, string> = {
    environment: process.env.ENVIRONMENT || process.env.NODE_ENV || 'development',
    service: 'remit-scout',
  }
  for (const [key, value] of Object.entries(extra)) {
    const normalized = (value || '').trim()
    if (normalized) {
      dims[key] = normalized.slice(0, 255)
    }
  }
  return dims
}

type PromptAsset = {
  version: string
  system: string
  task: string
  schema?: {
    required_fields?: string[]
  }
  constraints?: string[]
}

type PromptedPatchResponse = {
  providerId: string
  route: string
  detected_issue_class: string
  proposed_patch: {
    description: string
    reasoning?: string
    changes: PatchChange[]
  }
  confidence: 'high' | 'medium' | 'low'
  risk_level: 'low' | 'medium' | 'high'
}

const PROMPTS_DIR = path.resolve(__dirname, 'prompts')
const DEFAULT_PROMPT_VERSION = 'v1'

const logger = createLogger('plane-b.agents.patch-proposer')

/**
 * Maximum character length for external data embedded in LLM prompts.
 * Overly long payloads waste tokens and increase injection surface area.
 */
const MAX_PROMPT_EXTERNAL_DATA_LENGTH = 2000

/**
 * Patterns that could be used for prompt injection attacks.
 * Matches delimiters, role markers, and template tags commonly used to
 * hijack LLM system/user/assistant boundaries.
 */
const PROMPT_INJECTION_PATTERNS = /```|-{4,}|system\s*:|user\s*:|assistant\s*:|<\||\|>|<\/?(?:system|user|assistant|instruction|prompt|context|tool_call|function_call)\b[^>]*>/gi

/**
 * Sanitize external data before embedding it in LLM prompts.
 *
 * Defence-in-depth against prompt injection:
 *  1. Strips prompt-injection-style delimiters and role markers
 *  2. Escapes remaining XML-like tags so they render as literal text
 *  3. Truncates to a safe maximum length
 */
const sanitizeForPrompt = (input: string): string => {
  // Strip injection-style delimiters and role markers
  let sanitized = input.replace(PROMPT_INJECTION_PATTERNS, '')
  // Escape remaining XML-like tags so the LLM treats them as literal text
  sanitized = sanitized.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  // Truncate to prevent token budget abuse
  if (sanitized.length > MAX_PROMPT_EXTERNAL_DATA_LENGTH) {
    sanitized = sanitized.slice(0, MAX_PROMPT_EXTERNAL_DATA_LENGTH) + '... [truncated]'
  }
  return sanitized
}

/**
 * Patch proposal — a structured description of a proposed code change.
 */
export type PatchProposal = {
  bundleId: string
  moduleId: string
  providerId: string
  route: string
  detectedIssueClass: string
  riskLevel: 'low' | 'medium' | 'high'
  correlationId: string
  description: string
  affectedFiles: string[]
  changes: PatchChange[]
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
}

export type PatchChange = {
  filePath: string
  changeType: 'edit' | 'add' | 'delete'
  description: string
  /** For 'edit': the old content to replace */
  oldContent?: string
  /** For 'edit'/'add': the new content */
  newContent?: string
}

export type PatchPromptValidationResult = {
  parsed: PromptedPatchResponse | null
  reasonCode?: string
}

export const validatePatchPromptResponse = (
  value: unknown,
  bundle: Pick<FailureBundle, 'providerId' | 'affectedCorridors'>,
  requiredFields: string[] = [],
): PatchPromptValidationResult => {
  if (!value || typeof value !== 'object') {
    return { parsed: null, reasonCode: 'not_object' }
  }

  const raw = value as Record<string, unknown>
  const required = requiredFields.length > 0
    ? requiredFields
    : ['providerId', 'route', 'detected_issue_class', 'proposed_patch', 'confidence', 'risk_level']

  for (const key of required) {
    if (!(key in raw)) {
      return { parsed: null, reasonCode: `missing_${key}` }
    }
  }

  if (raw.providerId !== bundle.providerId) {
    return { parsed: null, reasonCode: 'provider_mismatch' }
  }

  const confidence = raw.confidence
  const riskLevel = raw.risk_level
  if (confidence !== 'high' && confidence !== 'medium' && confidence !== 'low') {
    return { parsed: null, reasonCode: 'invalid_confidence' }
  }
  if (riskLevel !== 'low' && riskLevel !== 'medium' && riskLevel !== 'high') {
    return { parsed: null, reasonCode: 'invalid_risk_level' }
  }

  const proposedPatch = raw.proposed_patch
  if (!proposedPatch || typeof proposedPatch !== 'object') {
    return { parsed: null, reasonCode: 'invalid_proposed_patch' }
  }
  const proposed = proposedPatch as Record<string, unknown>
  const description = typeof proposed.description === 'string' ? proposed.description.trim() : ''
  const reasoning = typeof proposed.reasoning === 'string' ? proposed.reasoning : undefined
  if (!description) {
    return { parsed: null, reasonCode: 'missing_patch_description' }
  }

  const changesRaw = Array.isArray(proposed.changes) ? proposed.changes : []
  const changes: PatchChange[] = changesRaw
    .filter((candidate): candidate is Record<string, unknown> =>
      Boolean(candidate && typeof candidate === 'object'))
    .map((candidate) => ({
      filePath: String(candidate.filePath || ''),
      changeType: String(candidate.changeType || '') as PatchChange['changeType'],
      description: String(candidate.description || ''),
      oldContent: typeof candidate.oldContent === 'string' ? candidate.oldContent : undefined,
      newContent: typeof candidate.newContent === 'string' ? candidate.newContent : undefined,
    }))
    .filter((change) => (
      (change.changeType === 'edit' || change.changeType === 'add' || change.changeType === 'delete')
      && Boolean(change.filePath)
      && change.filePath.startsWith('backend/plane-b/src/providers/')
      && Boolean(change.description)
    ))
    .slice(0, 10)

  if (changes.length === 0) {
    return { parsed: null, reasonCode: 'no_valid_changes' }
  }

  const route = typeof raw.route === 'string' && raw.route.trim()
    ? raw.route.trim()
    : bundle.affectedCorridors[0] ?? 'unknown'
  const detectedIssueClass = typeof raw.detected_issue_class === 'string'
    ? raw.detected_issue_class.trim()
    : ''
  if (!detectedIssueClass) {
    return { parsed: null, reasonCode: 'missing_detected_issue_class' }
  }

  return {
    parsed: {
      providerId: bundle.providerId,
      route,
      detected_issue_class: detectedIssueClass,
      proposed_patch: {
        description,
        reasoning,
        changes,
      },
      confidence,
      risk_level: riskLevel,
    },
  }
}

/**
 * Assembled prompt context — all evidence gathered for LLM-based proposal generation.
 */
type PromptContext = {
  /** The parser source code (parse.ts) */
  parserSource: string | null
  /** The fetch source code (fetch.ts) */
  fetchSource: string | null
  /** Relevant knowledge chunks (prior repairs, documentation, etc.) */
  knowledgeChunks: KnowledgeChunk[]
  /** The failure bundle being repaired */
  bundle: FailureBundle
  /** Parser file path */
  parserPath: string
  /** Fetch file path */
  fetchPath: string
  /** Error pattern summary for the prompt */
  errorPatternSummary: string
}

/**
 * Patch Proposer — generates parser fix proposals based on FailureBundle evidence.
 *
 * The proposer analyzes failure evidence (DOM changes, parse errors, response structure changes)
 * and generates structured patch proposals. It:
 * 1. Reads the provider's parse.ts and fetch.ts source via the tool gateway
 * 2. Retrieves relevant context from the knowledge plane (prior repairs, documentation)
 * 3. Assembles a rich prompt context with error patterns, DOM changes, and source code
 * 4. Generates a proposal via LLM analysis (falls back to heuristics if LLM unavailable)
 * 5. Records the proposal as a pending agent action requiring human approval
 */
export class PatchProposer {
  private readonly pool: Pool
  private readonly toolGateway: ToolGateway
  private readonly knowledgePlane: KnowledgePlane
  private readonly llmClient: LLMClient
  private promptCache = new Map<string, PromptAsset>()

  constructor(pool: Pool) {
    this.pool = pool
    this.toolGateway = new ToolGateway(pool)
    this.knowledgePlane = new KnowledgePlane(pool)
    this.llmClient = new LLMClient()
  }

  /**
   * Generate a patch proposal for a FailureBundle.
   */
  async propose(bundle: FailureBundle): Promise<PatchProposal | null> {
    const llmMeta = this.llmClient.getMetadata()
    const route = bundle.affectedCorridors[0] ?? 'unknown'
    const correlationId = bundle.bundleId
    const metricBase = {
      provider_id: bundle.providerId,
      route,
      fetcher_source: bundle.fetcherSource,
      failure_layer: bundle.failureLayer,
      validator_module: 'patch-validator',
      connector: llmMeta.connector,
      model: llmMeta.model,
      run_id: correlationId,
      correlation_id: correlationId,
    }

    logger.info('proposing_patch', {
      bundleId: bundle.bundleId,
      moduleId: bundle.moduleId,
      category: bundle.category,
      fetcherSource: bundle.fetcherSource,
      failureLayer: bundle.failureLayer,
      connector: llmMeta.connector,
      model: llmMeta.model,
      correlationId,
    })

    recordCloudWatchMetric({
      name: 'agent_heal_attempt_count',
      value: 1,
      unit: 'Count',
      namespace: AGENT_METRIC_NAMESPACE,
      dimensions: agentMetricDimensions({
        ...metricBase,
        outcome: 'attempted',
      }),
      highCardinality: true,
    })

    // Assemble the full prompt context
    const context = await this.assembleContext(bundle)

    // Try LLM-based proposal first, fall back to heuristics
    let proposal: PatchProposal | null = null
    if (this.llmClient.isAvailable()) {
      proposal = await this.generateLLMProposal(context)
    }
    if (!proposal) {
      proposal = this.generateHeuristicProposal(context)
    }

    if (proposal) {
      // Record the proposal as a pending agent action
      await this.pool.query(
        `INSERT INTO silver.agent_action
         (agent_id, module_id, action_type, description, status, requires_approval, result)
         VALUES ($1, $2, 'patch_proposal', $3, 'pending', TRUE, $4)`,
        [
          'patch-proposer',
          bundle.moduleId,
          `Patch proposal for ${bundle.category} failure: ${proposal.description}`,
          JSON.stringify(proposal),
        ],
      )

      // Update the failure bundle
      await this.pool.query(
        `UPDATE silver.failure_bundle
         SET repair_attempted = TRUE, repair_outcome = 'proposed', updated_at = NOW()
         WHERE bundle_id = $1`,
        [bundle.bundleId],
      )

      // Index the proposal as knowledge for future repairs
      await this.knowledgePlane.indexFailureBundle({
        bundleId: bundle.bundleId,
        moduleId: bundle.moduleId,
        providerId: bundle.providerId,
        category: bundle.category,
        errorMessage: bundle.errorMessage,
        errorType: bundle.errorType,
      })

      // Emit repair proposal metric
      recordCloudWatchMetric({
        name: 'repair_proposal_generated',
        value: 1,
        unit: 'Count',
        namespace: AGENT_METRIC_NAMESPACE,
        dimensions: agentMetricDimensions({
          ...metricBase,
          outcome: 'proposed',
          reason_code: 'success',
        }),
        highCardinality: true,
      })
      recordCloudWatchMetric({
        name: 'agent_heal_success_count',
        value: 1,
        unit: 'Count',
        namespace: AGENT_METRIC_NAMESPACE,
        dimensions: agentMetricDimensions({
          ...metricBase,
          outcome: 'success',
          reason_code: 'patch_proposal_generated',
        }),
        highCardinality: true,
      })

      // Notify #agent-ops Slack channel
      notifyAgent({
        type: 'repair_proposed',
        title: `Repair proposed for ${bundle.providerId}: ${proposal.description}`,
        severity: proposal.confidence === 'high' ? 'info' : 'warning',
        details: {
          bundleId: bundle.bundleId,
          moduleId: bundle.moduleId,
          confidence: proposal.confidence,
          changeCount: proposal.changes.length,
          category: bundle.category,
        },
      }).catch(() => {})

      logger.info('patch_proposed', {
        bundleId: bundle.bundleId,
        moduleId: bundle.moduleId,
        confidence: proposal.confidence,
        changeCount: proposal.changes.length,
        usedLLM: this.llmClient.isAvailable(),
        route: proposal.route,
        riskLevel: proposal.riskLevel,
        correlationId: proposal.correlationId,
      })
    } else {
      recordCloudWatchMetric({
        name: 'agent_heal_blocked_count',
        value: 1,
        unit: 'Count',
        namespace: AGENT_METRIC_NAMESPACE,
        dimensions: agentMetricDimensions({
          ...metricBase,
          outcome: 'blocked',
          reason_code: 'no_proposal_generated',
        }),
        highCardinality: true,
      })
    }

    return proposal
  }

  /**
   * Assemble the full prompt context by reading source files and querying knowledge.
   */
  private async assembleContext(bundle: FailureBundle): Promise<PromptContext> {
    const parserPath = `backend/plane-b/src/providers/${bundle.providerId}/parse.ts`
    const fetchPath = `backend/plane-b/src/providers/${bundle.providerId}/fetch.ts`
    const route = bundle.affectedCorridors[0] ?? 'unknown'

    // Read parser and fetch source in parallel via tool gateway
    const [parserResult, fetchResult] = await Promise.all([
      this.toolGateway.submit({
        agentId: 'patch-proposer',
        moduleId: bundle.moduleId,
        toolType: 'file_read',
        operation: `Read parser source: ${parserPath}`,
        params: {
          path: parserPath,
          providerId: bundle.providerId,
          route,
          validatorModule: 'patch-validator',
          runId: bundle.bundleId,
          correlationId: bundle.bundleId,
        },
        requiresApproval: false,
        ttlMs: 10_000,
      }),
      this.toolGateway.submit({
        agentId: 'patch-proposer',
        moduleId: bundle.moduleId,
        toolType: 'file_read',
        operation: `Read fetch source: ${fetchPath}`,
        params: {
          path: fetchPath,
          providerId: bundle.providerId,
          route,
          validatorModule: 'patch-validator',
          runId: bundle.bundleId,
          correlationId: bundle.bundleId,
        },
        requiresApproval: false,
        ttlMs: 10_000,
      }),
    ])

    if (!parserResult.success) {
      logger.warn('parser_read_failed', { bundleId: bundle.bundleId, error: parserResult.errorMessage })
    }
    if (!fetchResult.success) {
      logger.debug('fetch_read_failed', { bundleId: bundle.bundleId, error: fetchResult.errorMessage })
    }

    // Query knowledge plane for relevant context
    const knowledgeChunks = await this.queryKnowledgeContext(bundle)

    // Build error pattern summary
    const errorPatternSummary = this.buildErrorPatternSummary(bundle)

    return {
      parserSource: parserResult.success ? String(parserResult.data ?? '') : null,
      fetchSource: fetchResult.success ? String(fetchResult.data ?? '') : null,
      knowledgeChunks,
      bundle,
      parserPath,
      fetchPath,
      errorPatternSummary,
    }
  }

  /**
   * Query the knowledge plane for context relevant to the failure.
   *
   * Retrieves: prior repairs for the same provider, similar error patterns,
   * and documentation about the provider's API/DOM structure.
   */
  private async queryKnowledgeContext(bundle: FailureBundle): Promise<KnowledgeChunk[]> {
    const chunks: KnowledgeChunk[] = []

    try {
      // Search for prior repairs on this provider
      const priorRepairs = await this.knowledgePlane.search(
        `${bundle.providerId} repair ${bundle.category}`,
        { sourceType: 'repair', limit: 3 },
      )
      chunks.push(...priorRepairs)

      // Search for similar failure patterns
      const similarFailures = await this.knowledgePlane.search(
        `${bundle.errorType} ${bundle.errorMessage}`,
        { sourceType: 'failure', limit: 3 },
      )
      chunks.push(...similarFailures)

      // Search for provider documentation/code
      const providerDocs = await this.knowledgePlane.search(
        bundle.providerId,
        { sourceType: 'code', moduleId: bundle.moduleId, limit: 2 },
      )
      chunks.push(...providerDocs)
    } catch (err) {
      logger.warn('knowledge_query_error', {
        bundleId: bundle.bundleId,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    return chunks
  }

  /**
   * Build a human-readable error pattern summary for the prompt.
   */
  private buildErrorPatternSummary(bundle: FailureBundle): string {
    const lines: string[] = []

    lines.push(`Provider: ${sanitizeForPrompt(bundle.providerId)}`)
    lines.push(`Module: ${sanitizeForPrompt(bundle.moduleId)}`)
    lines.push(`Collector type: ${sanitizeForPrompt(bundle.collectorType)}`)
    lines.push(`Fetcher source: ${sanitizeForPrompt(bundle.fetcherSource)}`)
    lines.push(`Failure layer: ${sanitizeForPrompt(bundle.failureLayer)}`)
    lines.push(`Category: ${sanitizeForPrompt(bundle.category)}`)
    lines.push(`Severity: ${sanitizeForPrompt(bundle.severity)}`)
    lines.push(`Error: ${sanitizeForPrompt(bundle.errorType)}: ${sanitizeForPrompt(bundle.errorMessage)}`)
    lines.push(`Consecutive failures: ${bundle.consecutiveFailures}`)
    lines.push(`Affected corridors: ${bundle.affectedCorridors.length} (${bundle.affectedCorridors.slice(0, 5).map((c) => sanitizeForPrompt(c)).join(', ')}${bundle.affectedCorridors.length > 5 ? '...' : ''})`)

    if (bundle.httpStatuses.length > 0) {
      lines.push(`HTTP statuses observed: ${bundle.httpStatuses.join(', ')}`)
    }

    if (bundle.domSignatureHash && bundle.previousDomSignatureHash) {
      lines.push(`DOM signature changed: ${sanitizeForPrompt(bundle.previousDomSignatureHash)} -> ${sanitizeForPrompt(bundle.domSignatureHash)}`)
    }

    if (bundle.qualityFlags.length > 0) {
      lines.push(`Quality flags: ${bundle.qualityFlags.map((f) => sanitizeForPrompt(f)).join(', ')}`)
    }

    lines.push(`Time range: ${sanitizeForPrompt(String(bundle.firstFailureAt))} to ${sanitizeForPrompt(String(bundle.lastFailureAt))}`)

    return lines.join('\n')
  }

  /**
   * Generate a proposal using the LLM with rich prompt context.
   */
  private async generateLLMProposal(context: PromptContext): Promise<PatchProposal | null> {
    try {
      const prompt = await this.loadPromptAsset('patch_proposal')

      const userPromptParts: string[] = []

      userPromptParts.push(`# Prompt Version: ${prompt.version}`)
      userPromptParts.push('## Failure Evidence')
      userPromptParts.push(context.errorPatternSummary)
      userPromptParts.push('')

      if (context.parserSource) {
        // Limit source to first 200 lines to stay within token budget
        const truncated = context.parserSource.split('\n').slice(0, 200).join('\n')
        userPromptParts.push('## Parser Source (parse.ts)')
        userPromptParts.push('```typescript')
        userPromptParts.push(truncated)
        userPromptParts.push('```')
        userPromptParts.push('')
      }

      if (context.fetchSource) {
        const truncated = context.fetchSource.split('\n').slice(0, 100).join('\n')
        userPromptParts.push('## Fetch Source (fetch.ts)')
        userPromptParts.push('```typescript')
        userPromptParts.push(truncated)
        userPromptParts.push('```')
        userPromptParts.push('')
      }

      if (context.knowledgeChunks.length > 0) {
        userPromptParts.push('## Relevant Knowledge')
        for (const chunk of context.knowledgeChunks.slice(0, 5)) {
          userPromptParts.push(`### ${sanitizeForPrompt(chunk.sourceType)}: ${sanitizeForPrompt(chunk.sourcePath)}`)
          // Limit each chunk to 50 lines and sanitize content
          const truncated = chunk.content.split('\n').slice(0, 50).join('\n')
          userPromptParts.push(sanitizeForPrompt(truncated))
          userPromptParts.push('')
        }
      }

      userPromptParts.push('## Task')
      userPromptParts.push(prompt.task)
      userPromptParts.push('Respond with JSON only.')

      const response = await this.llmClient.complete({
        model: config.agent.llmModel,
        systemPrompt: prompt.system,
        userPrompt: userPromptParts.join('\n'),
        maxTokens: config.agent.llmMaxTokens,
        temperature: config.agent.llmTemperature,
      })

      const llmMeta = this.llmClient.getMetadata()
      const route = context.bundle.affectedCorridors[0] ?? 'unknown'
      const circuitOpen = isLlmCircuitOpenSentinel(response)
      recordCloudWatchMetric({
        name: 'agent_llm_latency_ms',
        value: response.durationMs,
        unit: 'Milliseconds',
        namespace: AGENT_METRIC_NAMESPACE,
        dimensions: agentMetricDimensions({
          provider_id: context.bundle.providerId,
          route,
          fetcher_source: context.bundle.fetcherSource,
          connector: llmMeta.connector,
          model: llmMeta.model,
          run_id: context.bundle.bundleId,
          correlation_id: context.bundle.bundleId,
          outcome: circuitOpen ? 'circuit_open' : 'completed',
        }),
        highCardinality: true,
      })

      if (circuitOpen) {
        logger.warn('llm_circuit_open_proposal_skipped', {
          bundleId: context.bundle.bundleId,
        })
        return null
      }

      let decoded: unknown
      try {
        decoded = JSON.parse(response.content)
      } catch {
        this.recordPromptSchemaFailure(context.bundle, 'invalid_json')
        logger.warn('llm_proposal_invalid_json', { bundleId: context.bundle.bundleId })
        return null
      }

      const parsed = this.validatePromptedResponse(
        decoded,
        context.bundle,
        prompt.schema?.required_fields,
      )
      if (!parsed) {
        return null
      }

      return {
        bundleId: context.bundle.bundleId,
        moduleId: context.bundle.moduleId,
        providerId: context.bundle.providerId,
        route: parsed.route,
        detectedIssueClass: parsed.detected_issue_class,
        riskLevel: parsed.risk_level,
        correlationId: context.bundle.bundleId,
        description: parsed.proposed_patch.description,
        affectedFiles: [...new Set(parsed.proposed_patch.changes.map((c) => c.filePath))],
        changes: parsed.proposed_patch.changes,
        confidence: parsed.confidence,
        reasoning: parsed.proposed_patch.reasoning ?? 'LLM-generated proposal',
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      captureExceptionWithContext(error, {
        component: 'patch-proposer.generateLLMProposal',
        bundleId: context.bundle.bundleId,
        moduleId: context.bundle.moduleId,
        providerId: context.bundle.providerId,
      }, { agent: 'patch-proposer' })
      logger.warn('llm_proposal_error', {
        bundleId: context.bundle.bundleId,
        error: error.message,
      })
      return null
    }
  }

  private async loadPromptAsset(name: string): Promise<PromptAsset> {
    const requestedVersion = (config.agent.llmPromptVersion || DEFAULT_PROMPT_VERSION).trim()
    const cacheKey = `${name}:${requestedVersion}`
    const cached = this.promptCache.get(cacheKey)
    if (cached) {
      return cached
    }

    const filePath = path.join(PROMPTS_DIR, `${name}.prompt.yaml`)
    try {
      const raw = await readFile(filePath, 'utf8')
      const parsed = parseYaml(raw) as {
        default_version?: string
        versions?: Record<string, Omit<PromptAsset, 'version'>>
      }
      const fallbackVersion = parsed.default_version || DEFAULT_PROMPT_VERSION
      const selectedVersion = requestedVersion || fallbackVersion
      const selected = parsed.versions?.[selectedVersion] ?? parsed.versions?.[fallbackVersion]
      if (!selected?.system || !selected?.task) {
        throw new Error(`Prompt ${name} missing version '${selectedVersion}'`)
      }
      const resolved: PromptAsset = {
        version: selectedVersion,
        system: selected.system,
        task: selected.task,
        schema: selected.schema,
        constraints: selected.constraints,
      }
      this.promptCache.set(cacheKey, resolved)
      return resolved
    } catch (error) {
      logger.warn('prompt_load_failed_fallback', {
        name,
        requestedVersion,
        error: error instanceof Error ? error.message : String(error),
      })
      const fallback = this.getDeterministicFallbackPrompt(name)
      this.promptCache.set(cacheKey, fallback)
      return fallback
    }
  }

  private getDeterministicFallbackPrompt(name: string): PromptAsset {
    if (name === 'patch_proposal') {
      return {
        version: 'fallback-v1',
        system: [
          'You are a deterministic parser repair planner for remittance collectors.',
          'Only output strict JSON.',
        ].join('\n'),
        task: [
          'Return JSON with:',
          '- providerId',
          '- route',
          '- detected_issue_class',
          '- proposed_patch: { description, reasoning, changes[] }',
          '- confidence',
          '- risk_level',
          'Only include file changes under backend/plane-b/src/providers/.',
        ].join('\n'),
        schema: {
          required_fields: [
            'providerId',
            'route',
            'detected_issue_class',
            'proposed_patch',
            'confidence',
            'risk_level',
          ],
        },
      }
    }
    return {
      version: 'fallback-v1',
      system: 'Respond with strict JSON only.',
      task: 'Generate a structured remediation response.',
    }
  }

  private recordPromptSchemaFailure(bundle: FailureBundle, reasonCode: string): void {
    const llmMeta = this.llmClient.getMetadata()
    recordCloudWatchMetric({
      name: 'agent_prompt_schema_validation_failures',
      value: 1,
      unit: 'Count',
      namespace: AGENT_METRIC_NAMESPACE,
      dimensions: agentMetricDimensions({
        provider_id: bundle.providerId,
        route: bundle.affectedCorridors[0] ?? 'unknown',
        fetcher_source: bundle.fetcherSource,
        connector: llmMeta.connector,
        model: llmMeta.model,
        run_id: bundle.bundleId,
        correlation_id: bundle.bundleId,
        reason_code: reasonCode,
      }),
      highCardinality: true,
    })
  }

  private validatePromptedResponse(
    value: unknown,
    bundle: FailureBundle,
    requiredFields: string[] = [],
  ): PromptedPatchResponse | null {
    const validation = validatePatchPromptResponse(value, bundle, requiredFields)
    if (!validation.parsed) {
      this.recordPromptSchemaFailure(bundle, validation.reasonCode || 'invalid_schema')
      if (validation.reasonCode?.startsWith('missing_')) {
        logger.warn('llm_proposal_missing_required_field', {
          bundleId: bundle.bundleId,
          reasonCode: validation.reasonCode,
        })
      }
    }
    return validation.parsed
  }

  /**
   * Generate a proposal using heuristic rules (fallback when LLM is unavailable).
   */
  private generateHeuristicProposal(context: PromptContext): PatchProposal | null {
    const { bundle, parserPath } = context

    switch (bundle.category) {
      case 'dom_change':
        return this.proposeDomChangeRepair(bundle, parserPath, context)
      case 'parse':
        return this.proposeParseErrorRepair(bundle, parserPath, context)
      default:
        logger.info('no_proposal_for_category', { category: bundle.category, bundleId: bundle.bundleId })
        return null
    }
  }

  /**
   * Propose a repair for DOM structure changes.
   */
  private proposeDomChangeRepair(bundle: FailureBundle, parserPath: string, context: PromptContext): PatchProposal {
    const changes: PatchChange[] = [{
      filePath: parserPath,
      changeType: 'edit',
      description: 'Update CSS/XPath selectors to match new DOM structure',
    }]

    // If we have the fetch source and it's a Playwright collector, also flag the fetch file
    if (context.fetchSource && bundle.fetcherSource === 'playwright') {
      changes.push({
        filePath: context.fetchPath,
        changeType: 'edit',
        description: 'Review Playwright navigation and wait selectors for DOM changes',
      })
    }

    const priorRepairNotes = context.knowledgeChunks
      .filter((c) => c.sourceType === 'repair')
      .map((c) => c.content)
      .slice(0, 2)

    let reasoning = `DOM signature changed from ${bundle.previousDomSignatureHash ?? 'unknown'} to ${bundle.domSignatureHash ?? 'unknown'}. ` +
      `${bundle.consecutiveFailures} consecutive failures across ${bundle.affectedCorridors.length} corridors. ` +
      `Fetcher source: ${bundle.fetcherSource}, failure layer: ${bundle.failureLayer}. ` +
      `Automated selector regeneration requires manual review before application.`

    if (priorRepairNotes.length > 0) {
      reasoning += ` Prior related repairs: ${priorRepairNotes.join('; ')}`
    }

    return {
      bundleId: bundle.bundleId,
      moduleId: bundle.moduleId,
      providerId: bundle.providerId,
      route: bundle.affectedCorridors[0] ?? 'unknown',
      detectedIssueClass: bundle.category,
      riskLevel: 'medium',
      correlationId: bundle.bundleId,
      description: `DOM structure changed for ${bundle.providerId} — selector regeneration needed`,
      affectedFiles: [...new Set(changes.map((c) => c.filePath))],
      changes,
      confidence: 'medium',
      reasoning,
    }
  }

  /**
   * Propose a repair for parse errors.
   */
  private proposeParseErrorRepair(bundle: FailureBundle, parserPath: string, context: PromptContext): PatchProposal {
    const changes: PatchChange[] = [{
      filePath: parserPath,
      changeType: 'edit',
      description: `Update response field mapping to handle new format. Error: ${bundle.errorMessage}`,
    }]

    // If the parser source is available, try to identify the failing line
    let codeHint = ''
    if (context.parserSource && bundle.errorMessage) {
      // Look for lines matching common parse patterns referenced in the error
      const lines = context.parserSource.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        // Check if the line contains field access patterns that might relate to the error
        if (bundle.errorMessage.includes('Cannot read') && line.includes('?.') === false && /\.\w+\.\w+/.test(line)) {
          codeHint += `Line ${i + 1} may need optional chaining: ${line.trim()}\n`
        }
        if (bundle.errorMessage.includes('NaN') && (line.includes('parseFloat') || line.includes('Number('))) {
          codeHint += `Line ${i + 1} may produce NaN: ${line.trim()}\n`
        }
      }
    }

    const priorRepairNotes = context.knowledgeChunks
      .filter((c) => c.sourceType === 'repair')
      .map((c) => c.content)
      .slice(0, 2)

    let reasoning = `Parse errors (${bundle.errorType}: ${bundle.errorMessage}) affecting ` +
      `${bundle.affectedCorridors.length} corridors with ${bundle.consecutiveFailures} consecutive failures. ` +
      `Fetcher source: ${bundle.fetcherSource}, failure layer: ${bundle.failureLayer}. ` +
      `Requires investigation of the provider's response format changes.`

    if (codeHint) {
      reasoning += ` Potential code locations:\n${codeHint}`
    }

    if (priorRepairNotes.length > 0) {
      reasoning += ` Prior related repairs: ${priorRepairNotes.join('; ')}`
    }

    return {
      bundleId: bundle.bundleId,
      moduleId: bundle.moduleId,
      providerId: bundle.providerId,
      route: bundle.affectedCorridors[0] ?? 'unknown',
      detectedIssueClass: bundle.category,
      riskLevel: 'medium',
      correlationId: bundle.bundleId,
      description: `Parse failure for ${bundle.providerId}: ${bundle.errorType} — response mapping update needed`,
      affectedFiles: [...new Set(changes.map((c) => c.filePath))],
      changes,
      confidence: 'low',
      reasoning,
    }
  }
}
