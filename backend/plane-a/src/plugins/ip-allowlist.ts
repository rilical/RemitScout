import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import ipaddr from 'ipaddr.js'
import { createLogger } from '../../../shared/logger'

const logger = createLogger('plane-a.ip-allowlist')

const splitCsv = (value: string | undefined) => {
  if (!value) return []
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

const resolveClientIp = (request: FastifyRequest): string | null => {
  const forwarded = request.headers['x-forwarded-for']
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded
  if (typeof raw === 'string' && raw.trim()) {
    const first = raw.split(',')[0]?.trim() || ''
    if (first) return first
  }
  return request.ip || null
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

export const registerAdminIpAllowlist = (app: FastifyInstance) => {
  const allowlist = splitCsv(
    process.env.ADMIN_IP_ALLOWLIST ||
      process.env.WAF_ADMIN_ALLOWLIST_IPS ||
      process.env.WAF_ALLOWLIST_IPS ||
      '',
  )
  if (allowlist.length === 0) {
    return
  }

  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const path = request.url.split('?')[0] || ''
    const protectedPrefixes = ['/api/v1/ops', '/api/v1/admin', '/api/v1/audit', '/api/v1/analytics']
    const protectedExact = new Set(['/api/v1/telemetry/analytics'])
    const isProtected =
      protectedPrefixes.some(prefix => path.startsWith(prefix))
      || protectedExact.has(path)
    if (!isProtected) return

    const ip = resolveClientIp(request)
    if (!ip) {
      reply.code(403)
      return reply.send({ error: 'forbidden' })
    }
    const allowed = allowlist.some((cidr) => isIpInCidr(ip, cidr))
    if (allowed) return

    logger.warn('admin_ip_blocked', {
      ip,
      path,
    })
    reply.code(403)
    return reply.send({ error: 'forbidden' })
  })
}
