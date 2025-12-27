type PublisherGateInput = {
  contributor_count?: number
  top_provider_share?: number
  top_two_share?: number
}

type PublisherGateResult = {
  allowed: boolean
  reasons: string[]
}

export const evaluatePublisherGates = (input: PublisherGateInput): PublisherGateResult => {
  const reasons: string[] = []

  if (typeof input.contributor_count !== 'number') {
    reasons.push('missing_contributor_count')
  } else if (input.contributor_count < 3) {
    reasons.push('insufficient_contributors')
  }

  if (typeof input.top_provider_share !== 'number' || typeof input.top_two_share !== 'number') {
    reasons.push('missing_dominance_metrics')
  } else {
    if (input.top_provider_share > 0.5) {
      reasons.push('dominance_top_provider')
    }
    if (input.top_two_share > 0.75) {
      reasons.push('dominance_top_two')
    }
  }

  return { allowed: reasons.length === 0, reasons }
}
