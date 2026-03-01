import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'

const logger = createLogger('plane-b.agents.llm-client')

export type LLMConnectorKind = 'anthropic' | 'bedrock'

/**
 * LLM completion request.
 */
export type LLMCompletionRequest = {
  model?: string
  systemPrompt: string
  userPrompt: string
  maxTokens?: number
  temperature?: number
}

/**
 * LLM completion response.
 */
export type LLMCompletionResponse = {
  content: string
  model: string
  usage: {
    inputTokens: number
    outputTokens: number
  }
  durationMs: number
}

export type LlmClientConfig = {
  connector: LLMConnectorKind
  model: string
  maxTokens: number
  temperature: number
  anthropicApiKey?: string
  bedrockRegion?: string
  bedrockModelId?: string
}

export type LLMConnector = {
  readonly connector: LLMConnectorKind
  readonly model: string
  isAvailable(): boolean
  sendMessage(request: LLMCompletionRequest): Promise<LLMCompletionResponse>
}

const toTextContent = (value: unknown): string => {
  if (!Array.isArray(value)) return ''
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return ''
      const typed = item as { type?: string; text?: string }
      if (typed.type !== 'text') return ''
      return typeof typed.text === 'string' ? typed.text : ''
    })
    .join('')
}

class AnthropicConnector implements LLMConnector {
  readonly connector: LLMConnectorKind = 'anthropic'
  readonly model: string
  private readonly apiKey: string | undefined
  private readonly maxTokens: number
  private readonly temperature: number

  constructor(options: LlmClientConfig) {
    this.apiKey = options.anthropicApiKey
    this.model = options.model
    this.maxTokens = options.maxTokens
    this.temperature = options.temperature
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey)
  }

  async sendMessage(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const startedAt = Date.now()
    const model = request.model || this.model
    if (!this.apiKey) {
      throw new Error('Anthropic connector is not configured (missing API key).')
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: request.maxTokens ?? this.maxTokens,
        temperature: request.temperature ?? this.temperature,
        system: request.systemPrompt,
        messages: [{ role: 'user', content: request.userPrompt }],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Anthropic API error ${response.status}: ${errorText}`)
    }

    const body = await response.json() as {
      content?: Array<{ type?: string; text?: string }>
      model?: string
      usage?: { input_tokens?: number; output_tokens?: number }
    }

    return {
      content: toTextContent(body.content),
      model: body.model || model,
      usage: {
        inputTokens: Number(body.usage?.input_tokens ?? 0),
        outputTokens: Number(body.usage?.output_tokens ?? 0),
      },
      durationMs: Date.now() - startedAt,
    }
  }
}

class BedrockConnector implements LLMConnector {
  readonly connector: LLMConnectorKind = 'bedrock'
  readonly model: string
  private readonly bedrockModelId: string
  private readonly region: string
  private readonly maxTokens: number
  private readonly temperature: number
  private readonly client: BedrockRuntimeClient

  constructor(options: LlmClientConfig) {
    this.model = options.model
    this.bedrockModelId = options.bedrockModelId || options.model
    this.region = options.bedrockRegion || process.env.AWS_REGION || ''
    this.maxTokens = options.maxTokens
    this.temperature = options.temperature
    this.client = new BedrockRuntimeClient({ region: this.region })
  }

  isAvailable(): boolean {
    return Boolean(this.region && this.bedrockModelId)
  }

  async sendMessage(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const startedAt = Date.now()
    if (!this.isAvailable()) {
      throw new Error('Bedrock connector is not configured (missing region/model).')
    }

    const model = request.model || this.model
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: request.maxTokens ?? this.maxTokens,
      temperature: request.temperature ?? this.temperature,
      system: request.systemPrompt,
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: request.userPrompt }],
        },
      ],
    }

    const response = await this.client.send(
      new InvokeModelCommand({
        modelId: this.bedrockModelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload),
      }),
    )

    if (!response.body) {
      throw new Error('Bedrock InvokeModel returned an empty body.')
    }

    const raw = Buffer.from(response.body as Uint8Array).toString('utf8')
    const body = JSON.parse(raw) as {
      content?: Array<{ type?: string; text?: string }>
      model?: string
      usage?: { input_tokens?: number; output_tokens?: number }
    }

    return {
      content: toTextContent(body.content),
      model: body.model || model || this.bedrockModelId,
      usage: {
        inputTokens: Number(body.usage?.input_tokens ?? 0),
        outputTokens: Number(body.usage?.output_tokens ?? 0),
      },
      durationMs: Date.now() - startedAt,
    }
  }
}

const normalizeClientConfig = (input: Partial<LlmClientConfig>): LlmClientConfig => {
  const connector = (input.connector || 'anthropic') as LLMConnectorKind
  const model = input.model || 'claude-sonnet-4-20250514'
  return {
    connector,
    model,
    maxTokens: input.maxTokens ?? 2048,
    temperature: input.temperature ?? 0.2,
    anthropicApiKey: input.anthropicApiKey,
    bedrockRegion: input.bedrockRegion,
    bedrockModelId: input.bedrockModelId,
  }
}

export const buildLlmClient = (input: Partial<LlmClientConfig> = {}): LLMConnector => {
  const options = normalizeClientConfig(input)

  if (options.connector === 'anthropic') {
    return new AnthropicConnector(options)
  }

  if (options.connector === 'bedrock') {
    const region = (options.bedrockRegion || '').trim()
    const modelId = (options.bedrockModelId || options.model || '').trim()
    if (!region || !modelId) {
      throw new Error(
        'Invalid AGENT_LLM configuration: bedrock connector requires AGENT_BEDROCK_REGION and AGENT_BEDROCK_MODEL_ID/AGENT_LLM_MODEL.',
      )
    }
    return new BedrockConnector(options)
  }

  throw new Error(`Unsupported AGENT_LLM_CONNECTOR '${options.connector}'.`)
}

const buildDefaultClient = (): LLMConnector => {
  return buildLlmClient({
    connector: config.agent.llmConnector,
    model: config.agent.llmModel,
    maxTokens: config.agent.llmMaxTokens,
    temperature: config.agent.llmTemperature,
    anthropicApiKey: config.agent.anthropicApiKey,
    bedrockRegion: config.agent.bedrockRegion,
    bedrockModelId: config.agent.bedrockModelId,
  })
}

/**
 * High-level LLM client used by the agent layer.
 */
export class LLMClient {
  private readonly connector: LLMConnector
  private readonly defaultModel: string
  private readonly defaultMaxTokens: number
  private readonly defaultTemperature: number

  constructor(connector: LLMConnector = buildDefaultClient()) {
    this.connector = connector
    this.defaultModel = connector.model
    this.defaultMaxTokens = config.agent.llmMaxTokens
    this.defaultTemperature = config.agent.llmTemperature
  }

  isAvailable(): boolean {
    return this.connector.isAvailable()
  }

  getMetadata(): { connector: LLMConnectorKind; model: string } {
    return {
      connector: this.connector.connector,
      model: this.defaultModel,
    }
  }

  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    if (!this.isAvailable()) {
      logger.debug('llm_stub_mode', {
        connector: this.connector.connector,
        model: request.model || this.defaultModel,
      })
      return {
        content: `[LLM stub: ${this.connector.connector} connector not configured]`,
        model: request.model || this.defaultModel,
        usage: { inputTokens: 0, outputTokens: 0 },
        durationMs: 0,
      }
    }

    return this.connector.sendMessage({
      model: request.model || this.defaultModel,
      systemPrompt: request.systemPrompt,
      userPrompt: request.userPrompt,
      maxTokens: request.maxTokens ?? this.defaultMaxTokens,
      temperature: request.temperature ?? this.defaultTemperature,
    })
  }

  async analyzeFailure(context: {
    moduleId: string
    providerId: string
    errorMessage: string
    errorType: string
    parserSnippet?: string
    domSignatureChanged?: boolean
  }): Promise<{ diagnosis: string; suggestedAction: string; confidence: string }> {
    const response = await this.complete({
      model: this.defaultModel,
      systemPrompt: [
        'You are a parser repair agent for a web scraping/API collection system.',
        'Analyze the failure evidence and provide a structured diagnosis.',
        'Respond in JSON format: { "diagnosis": "...", "suggestedAction": "...", "confidence": "high|medium|low" }',
      ].join('\n'),
      userPrompt: [
        `Module: ${context.moduleId}`,
        `Provider: ${context.providerId}`,
        `Error: ${context.errorType}: ${context.errorMessage}`,
        context.domSignatureChanged ? 'DOM signature has changed.' : '',
        context.parserSnippet ? `Parser code:\n\`\`\`typescript\n${context.parserSnippet}\n\`\`\`` : '',
      ].filter(Boolean).join('\n'),
      maxTokens: 512,
      temperature: 0.1,
    })

    try {
      return JSON.parse(response.content)
    } catch {
      return {
        diagnosis: response.content,
        suggestedAction: 'manual_investigation',
        confidence: 'low',
      }
    }
  }
}
