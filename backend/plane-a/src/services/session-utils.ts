import { createHash } from 'crypto'
import type { FastifyRequest } from 'fastify'
import { config } from '../../../shared/config'

const parseBearerToken = (header?: string) => {
  if (!header) return null
  const trimmed = header.trim()
  if (!trimmed.toLowerCase().startsWith('bearer ')) return null
  const token = trimmed.slice('bearer '.length).trim()
  return token || null
}

const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex')

export const deriveSessionId = (request: FastifyRequest): string | null => {
  const claims = request.user?.claims as Record<string, unknown> | undefined
  const candidates = [
    claims?.session_id,
    claims?.sid,
    claims?.jti,
  ]
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  const token = parseBearerToken(request.headers.authorization)
  if (token) {
    return hashToken(token)
  }

  return null
}

export const extractExpiresAt = (request: FastifyRequest): Date | null => {
  const claims = request.user?.claims as Record<string, unknown> | undefined
  const exp = claims?.exp
  if (typeof exp === 'number' && Number.isFinite(exp)) {
    return new Date(exp * 1000)
  }
  return null
}

export const detectDeviceType = (userAgent?: string | null): string | null => {
  if (!userAgent) return null
  const ua = userAgent.toLowerCase()
  if (ua.includes('ipad') || ua.includes('tablet')) {
    return 'tablet'
  }
  if (ua.includes('mobi') || ua.includes('android')) {
    return 'mobile'
  }
  return 'desktop'
}

const normalizeHeaderValue = (value: string | string[] | undefined) => {
  if (!value) return null
  if (Array.isArray(value)) {
    return value[0] ?? null
  }
  return value
}

export const getLocationFromHeaders = (
  headers: FastifyRequest['headers'],
): string | null => {
  const explicitHeader = config.geo.countryHeader?.toLowerCase()
  if (explicitHeader && explicitHeader in headers) {
    const value = normalizeHeaderValue(headers[explicitHeader])
    if (value) return value
  }

  const candidates = ['cloudfront-viewer-country', 'cf-ipcountry', 'x-country-code']
  for (const header of candidates) {
    const value = normalizeHeaderValue(headers[header])
    if (value) return value
  }

  return null
}

export const maskIpAddress = (ip?: string | null): string | null => {
  if (!ip) return null
  if (ip.includes('.')) {
    const parts = ip.split('.')
    if (parts.length === 4) {
      parts[3] = '***'
      return parts.join('.')
    }
    return ip
  }
  if (ip.includes(':')) {
    const parts = ip.split(':')
    if (parts.length >= 4) {
      return `${parts.slice(0, 3).join(':')}:****`
    }
    return ip
  }
  return ip
}
