export type IngestFanoutQueueStateInput = {
  mode: string
  url?: string | null
  tier1Url?: string | null
  tier2Url?: string | null
}

export type IngestFanoutQueueState = {
  singleQueueConfigured: boolean
  tieredConfigured: boolean
  tierMisconfigured: boolean
  enabled: boolean
  enabledForQueueProducer: boolean
}

export const resolveIngestFanoutQueueState = (
  input: IngestFanoutQueueStateInput,
): IngestFanoutQueueState => {
  const singleQueueConfigured = Boolean(input.url)
  const tieredConfigured = Boolean(input.tier1Url && input.tier2Url)
  const tierMisconfigured =
    (Boolean(input.tier1Url) || Boolean(input.tier2Url))
    && !tieredConfigured

  return {
    singleQueueConfigured,
    tieredConfigured,
    tierMisconfigured,
    enabled: input.mode !== 'off' && (singleQueueConfigured || tieredConfigured),
    enabledForQueueProducer: input.mode === 'queue' && (singleQueueConfigured || tieredConfigured),
  }
}
