import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import ipaddr from 'ipaddr.js'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'

const logger = createLogger('plane-a.ip-allowlist')

const splitCsv = (value: string | undefined) => {
  if (!value) return []
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

const parseForwardedIps = (value: string | string[] | undefined): string[] => {
  const raw = Array.isArray(value) ? value.join(',') : value
  if (typeof raw !== 'string' || !raw.trim()) return []
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

const isCloudFrontForwardedRequest = (request: FastifyRequest): boolean => {
  const headers = request.headers ?? {}
  const cfId = headers['x-amz-cf-id']
  if (typeof cfId === 'string' && cfId.trim()) return true

  const via = headers.via
  const values = Array.isArray(via) ? via : [via]
  return values.some((value) => typeof value === 'string' && value.toLowerCase().includes('cloudfront'))
}

export const resolveClientIp = (request: FastifyRequest): string | null => {
  const remoteIp = request.ip || null
  if (remoteIp && !isCloudFrontForwardedRequest(request)) {
    return remoteIp
  }

  const headers = request.headers ?? {}
  const forwarded = headers['x-forwarded-for']
  const forwardedIps = parseForwardedIps(forwarded)
  const lastForwardedIp = forwardedIps.at(-1) || null
  if (lastForwardedIp) {
    return lastForwardedIp
  }

  return remoteIp
}

const isIpInCidr = (ip: string, cidr: string): boolean => {
  try {
    const parsedIp = ipaddr.parse(ip)
    const normalizedCidr = cidr.includes('/') ? cidr : `${cidr}/32`
    const [range, prefix] = ipaddr.parseCIDR(normalizedCidr)
    return parsedIp.match(range, prefix)
  } catch (error) {
    logger.debug('admin_ip_cidr_parse_failed', {
      ip,
      cidr,
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

export const registerAdminIpAllowlist = (app: FastifyInstance, cidrAllowlist?: string[]) => {
  const allowlist = Array.isArray(cidrAllowlist)
    ? cidrAllowlist.filter(Boolean)
    : splitCsv(config.planeA.adminIpAllowlistRaw)

  if (allowlist.length === 0) {
    logger.warn('admin_ip_allowlist_empty', {
      message: 'No admin IP allowlist configured. Admin endpoints (/api/v1/ops, /api/v1/admin, '
        + '/api/v1/audit, /api/v1/analytics, /api/v1/indices/corrections) are not IP-restricted. '
        + 'Set ADMIN_IP_ALLOWLIST to a comma-separated list of CIDRs to enable IP filtering.',
      env: config.env,
    })
    return
  }

  logger.info('admin_ip_allowlist_registered', {
    cidr_count: allowlist.length,
    env: config.env,
  })

  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const path = request.url.split('?')[0] || ''
    const protectedPrefixes = [
      '/api/v1/ops',
      '/api/v1/admin',
      '/api/v1/audit',
      '/api/v1/analytics',
      '/api/v1/indices/corrections',
    ]
    const protectedExact = new Set(['/api/v1/telemetry/analytics'])
    const isProtected =
      protectedPrefixes.some(prefix => path.startsWith(prefix))
      || protectedExact.has(path)
    if (!isProtected) return

    const ip = resolveClientIp(request)
    if (!ip) {
      logger.debug('admin_ip_allowlist_check', { path, ip: null, result: 'denied_no_ip' })
      reply.code(403)
      return reply.send({
        error: 'forbidden',
        code: 'admin_ip_unresolved',
      })
    }
    const allowed = allowlist.some((cidr) => isIpInCidr(ip, cidr))

    logger.debug('admin_ip_allowlist_check', { path, ip, result: allowed ? 'allowed' : 'denied' })

    if (allowed) return

    logger.warn('admin_ip_blocked', {
      ip,
      path,
    })
    reply.code(403)
    return reply.send({
      error: 'forbidden',
      code: 'admin_ip_not_allowlisted',
    })
  })
}
