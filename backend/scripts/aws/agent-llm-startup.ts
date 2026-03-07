export type ResolvedLlmConnector = 'anthropic' | 'bedrock'

export type AgentLlmStartupValidation = {
  connector: ResolvedLlmConnector
  model: string
  promptVersion: string
  bedrockRegionPresent: boolean
  bedrockModelPresent: boolean
  anthropicKeyPresent: boolean
  anthropicSecretArnPresent: boolean
  missing: string[]
  prodLike: boolean
}

const isProdLikeEnv = (): boolean => {
  const envName = (process.env.ENVIRONMENT || process.env.NODE_ENV || '').trim().toLowerCase()
  return envName === 'staging' || envName === 'prod' || envName === 'production'
}

export const resolveLlmConnector = (): ResolvedLlmConnector => {
  const connector = (process.env.AGENT_LLM_CONNECTOR || process.env.AGENT_LLM_PROVIDER || '')
    .trim()
    .toLowerCase()
  if (connector === 'bedrock' || connector === 'anthropic') {
    return connector
  }
  return isProdLikeEnv() ? 'bedrock' : 'anthropic'
}

export const validateResolvedLlmConfig = (): AgentLlmStartupValidation => {
  const connector = resolveLlmConnector()
  const missing: string[] = []
  const prodLike = isProdLikeEnv()
  const model = process.env.AGENT_LLM_MODEL || ''
  const promptVersion = process.env.AGENT_LLM_PROMPT_VERSION || ''
  const bedrockRegionPresent = Boolean(process.env.AGENT_BEDROCK_REGION?.trim())
  const bedrockModelPresent = Boolean(process.env.AGENT_BEDROCK_MODEL_ID?.trim())
  const anthropicKeyPresent = Boolean(process.env.AGENT_ANTHROPIC_API_KEY?.trim())
  const anthropicSecretArnPresent = Boolean(process.env.AGENT_ANTHROPIC_API_KEY_SECRET_ARN?.trim())

  if (!model.trim()) {
    missing.push('AGENT_LLM_MODEL')
  }
  if (!promptVersion.trim()) {
    missing.push('AGENT_LLM_PROMPT_VERSION')
  }

  if (connector === 'anthropic') {
    if (prodLike && !anthropicSecretArnPresent) {
      missing.push('AGENT_ANTHROPIC_API_KEY_SECRET_ARN')
    }
    if (!anthropicKeyPresent) {
      missing.push('AGENT_ANTHROPIC_API_KEY')
    }
  }

  if (connector === 'bedrock') {
    if (!bedrockRegionPresent) {
      missing.push('AGENT_BEDROCK_REGION')
    }
    if (!bedrockModelPresent && !model.trim()) {
      missing.push('AGENT_BEDROCK_MODEL_ID')
    }
  }

  const validation: AgentLlmStartupValidation = {
    connector,
    model,
    promptVersion,
    bedrockRegionPresent,
    bedrockModelPresent,
    anthropicKeyPresent,
    anthropicSecretArnPresent,
    missing,
    prodLike,
  }

  if (missing.length > 0 && prodLike) {
    throw new Error(`LLM startup validation failed: ${missing.join(', ')}`)
  }

  return validation
}
