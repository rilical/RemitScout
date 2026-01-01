export type BlockDetectionResult = {
  blocked: boolean
  reason: string | null
}

const blockKeywords = ['captcha', 'access denied', 'bot', 'challenge', 'forbidden', 'too many requests']

export const detectBlock = (status?: number | null, bodyText?: string | null): BlockDetectionResult => {
  if (status === 403) {
    return { blocked: true, reason: 'http_403' }
  }
  if (status === 429) {
    return { blocked: true, reason: 'http_429' }
  }

  if (bodyText) {
    const lowered = bodyText.toLowerCase()
    for (const keyword of blockKeywords) {
      if (lowered.includes(keyword)) {
        return { blocked: true, reason: `keyword_${keyword.replace(/\s+/g, '_')}` }
      }
    }
  }

  return { blocked: false, reason: null }
}
