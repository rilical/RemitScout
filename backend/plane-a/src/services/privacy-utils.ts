import { createHash } from 'crypto'
import { isIP } from 'node:net'
import { config } from '../../../shared/config'

export type IpVersion = 4 | 6

export type AnonymizedIp = {
  normalizedIp: string | null
  truncatedIp: string | null
  ipHash: string | null
  ipVersion: IpVersion | null
}

type RotatingTokenOptions = {
  now?: Date
  intervalHours?: number
  salt?: string
}

const DEFAULT_ROTATION_HOURS = 24

const sanitizeIpCandidate = (value?: string | null) => {
  if (!value) return null

  let candidate = value.split(',')[0]?.trim() ?? ''
  if (!candidate) return null

  if (candidate.startsWith('[') && candidate.includes(']')) {
    candidate = candidate.slice(1, candidate.indexOf(']'))
  }

  if (candidate.startsWith('::ffff:')) {
    const mapped = candidate.slice('::ffff:'.length)
    if (isIP(mapped) === 4) {
      candidate = mapped
    }
  }

  if (isIP(candidate) === 0) {
    const hostPart = candidate.match(/^(.+):(\d+)$/)
    if (hostPart && isIP(hostPart[1] ?? '') === 4) {
      candidate = hostPart[1] ?? candidate
    }
  }

  return candidate
}

const expandIpv6 = (value: string): string[] | null => {
  const hasEmbeddedIpv4 = value.includes('.')
  const normalized = hasEmbeddedIpv4
    ? (() => {
      const lastColon = value.lastIndexOf(':')
      if (lastColon < 0) return value
      const left = value.slice(0, lastColon)
      const ipv4Part = value.slice(lastColon + 1)
      if (isIP(ipv4Part) !== 4) return value
      const octets = ipv4Part.split('.').map((part) => Number(part))
      if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
        return value
      }
      const h1 = ((octets[0] << 8) | octets[1]).toString(16)
      const h2 = ((octets[2] << 8) | octets[3]).toString(16)
      return `${left}:${h1}:${h2}`
    })()
    : value

  const chunks = normalized.split('::')
  if (chunks.length > 2) return null

  const left = chunks[0]?.split(':').filter(Boolean) ?? []
  const right = chunks[1]?.split(':').filter(Boolean) ?? []
  const missing = 8 - (left.length + right.length)

  if (missing < 0) return null
  if (chunks.length === 1 && missing !== 0) return null

  const expanded = [
    ...left,
    ...Array.from({ length: missing }, () => '0'),
    ...right,
  ].map((chunk) => chunk.padStart(4, '0').toLowerCase())

  if (expanded.length !== 8) return null
  return expanded
}

const truncateIpv6 = (value: string): string | null => {
  const groups = expandIpv6(value)
  if (!groups) return null
  return `${groups.slice(0, 4).join(':')}:0000:0000:0000:0000`
}

const resolveSalt = (explicit?: string): string => {
  const resolved = explicit ?? config.privacy?.hashSalt ?? ''
  if (!resolved) {
    throw new Error(
      'Privacy hash salt is not configured. Set PRIVACY_HASH_SALT environment variable.',
    )
  }
  return resolved
}

const hashValue = (value: string, salt?: string) =>
  createHash('sha256')
    .update(`${resolveSalt(salt)}:${value}`)
    .digest('hex')

export const normalizeIpAddress = (value?: string | null): string | null => {
  const candidate = sanitizeIpCandidate(value)
  if (!candidate) return null
  return isIP(candidate) === 0 ? null : candidate
}

export const truncateIpAddress = (value?: string | null): string | null => {
  const normalized = normalizeIpAddress(value)
  if (!normalized) return null

  const version = isIP(normalized)
  if (version === 4) {
    const octets = normalized.split('.')
    if (octets.length !== 4) return null
    return `${octets[0]}.${octets[1]}.${octets[2]}.0`
  }

  if (version === 6) {
    return truncateIpv6(normalized)
  }

  return null
}

export const anonymizeIpAddress = (value?: string | null): AnonymizedIp => {
  const normalizedIp = normalizeIpAddress(value)
  if (!normalizedIp) {
    return {
      normalizedIp: null,
      truncatedIp: null,
      ipHash: null,
      ipVersion: null,
    }
  }

  const ipVersion = isIP(normalizedIp) as IpVersion
  const truncatedIp = truncateIpAddress(normalizedIp)
  const hashSource = truncatedIp || normalizedIp

  return {
    normalizedIp,
    truncatedIp,
    ipHash: hashSource ? hashValue(hashSource) : null,
    ipVersion,
  }
}

export const extractBrowserFamily = (userAgent?: string | null): string | null => {
  if (!userAgent) return null
  const ua = userAgent.toLowerCase()

  if (ua.includes('edg/')) return 'edge'
  if (ua.includes('opr/') || ua.includes('opera')) return 'opera'
  if (ua.includes('samsungbrowser/')) return 'samsung_internet'
  if (ua.includes('firefox/') || ua.includes('fxios/')) return 'firefox'
  if (ua.includes('crios/') || ua.includes('chrome/') || ua.includes('chromium/')) return 'chrome'
  if (ua.includes('safari/') && !ua.includes('chrome/') && !ua.includes('chromium/')) return 'safari'
  if (ua.includes('trident/') || ua.includes('msie ')) return 'internet_explorer'
  if (ua.includes('postmanruntime/')) return 'postman'
  if (ua.includes('curl/')) return 'curl'
  if (ua.includes('wget/')) return 'wget'

  return 'other'
}

const toBucketStart = (date: Date, intervalHours: number) => {
  const safeHours = Number.isFinite(intervalHours) && intervalHours > 0
    ? Math.floor(intervalHours)
    : DEFAULT_ROTATION_HOURS
  const bucketMs = safeHours * 60 * 60 * 1000
  const bucketStartMs = Math.floor(date.getTime() / bucketMs) * bucketMs
  return new Date(bucketStartMs)
}

export const deriveRotatingToken = (
  stableSeed: string,
  options: RotatingTokenOptions = {},
) => {
  const trimmed = stableSeed.trim()
  if (!trimmed) return null

  const now = options.now ?? new Date()
  const intervalHours =
    options.intervalHours
    ?? config.privacy?.sessionRotationHours
    ?? DEFAULT_ROTATION_HOURS
  const bucketStart = toBucketStart(now, intervalHours)
  const bucketKey = bucketStart.toISOString()
  const salt = options.salt ?? config.privacy?.sessionSalt ?? ''
  const token = hashValue(`${trimmed}:${bucketKey}`, salt)

  return {
    token,
    bucketStart,
    intervalHours: Math.max(1, Math.floor(intervalHours)),
  }
}
