import { createHmac, timingSafeEqual } from 'crypto'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'

const logger = createLogger('plane-a.alert-unsubscribe')

type UnsubscribePayload = {
  sub: string
  exp: number
  v: number
}

const toBase64Url = (value: string): string => {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

const fromBase64Url = (value: string): string => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = padded.length % 4
  const normalized = padding === 0 ? padded : `${padded}${'='.repeat(4 - padding)}`
  return Buffer.from(normalized, 'base64').toString('utf8')
}

const getSecret = (): string => {
  return config.alerts.unsubscribe.secret || config.planeA.jwtSecret || ''
}

const computeSignature = (payloadPart: string, secret: string): string => {
  return createHmac('sha256', secret)
    .update(payloadPart)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export const generateAlertUnsubscribeToken = (
  userId: string,
  alertId?: string | null,
): string | null => {
  const secret = getSecret()
  if (!secret) {
    logger.warn('alert_unsubscribe_secret_missing', {
      user_id: userId,
      alert_id: alertId ?? null,
    })
    return null
  }

  const ttlHours = config.alerts.unsubscribe.tokenExpiryHours ?? 720
  const exp = Math.floor(Date.now() / 1000) + ttlHours * 60 * 60
  const payload: UnsubscribePayload = { sub: userId, exp, v: 1 }
  const payloadPart = toBase64Url(JSON.stringify(payload))
  const signature = computeSignature(payloadPart, secret)

  return `${payloadPart}.${signature}`
}

export const verifyAlertUnsubscribeToken = (token: string): { userId: string } | null => {
  const secret = getSecret()
  if (!secret) {
    logger.warn('alert_unsubscribe_secret_missing', {
      alert_id: null,
    })
    return null
  }

  const parts = token.split('.')
  if (parts.length !== 2) {
    return null
  }

  const [payloadPart, signature] = parts
  const expected = computeSignature(payloadPart, secret)

  if (signature.length !== expected.length) {
    return null
  }

  try {
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null
    }
  } catch (error) {
    logger.warn('alert_unsubscribe_signature_compare_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }

  let payload: UnsubscribePayload
  try {
    payload = JSON.parse(fromBase64Url(payloadPart)) as UnsubscribePayload
  } catch (error) {
    logger.warn('alert_unsubscribe_payload_parse_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }

  if (!payload?.sub || typeof payload.sub !== 'string') {
    return null
  }

  if (payload.exp && Date.now() / 1000 > payload.exp) {
    return null
  }

  return { userId: payload.sub }
}
