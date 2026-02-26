export type CapabilityProbeProxyTier = 'RESIDENTIAL_PREMIUM' | 'DATACENTER_ROTATING' | 'NONE'

const toProxyTier = (value: string | undefined): CapabilityProbeProxyTier | null => {
  const normalized = (value || '').trim().toUpperCase()
  if (
    normalized === 'NONE'
    || normalized === 'DATACENTER_ROTATING'
    || normalized === 'RESIDENTIAL_PREMIUM'
  ) {
    return normalized as CapabilityProbeProxyTier
  }
  return null
}

export const resolveCapabilityProbeProxyTier = (
  rawValue: string | undefined = process.env.CAPABILITY_PROBE_PROXY_TIER,
): CapabilityProbeProxyTier => {
  const parsed = toProxyTier(rawValue)
  if (parsed) return parsed
  return 'NONE'
}
