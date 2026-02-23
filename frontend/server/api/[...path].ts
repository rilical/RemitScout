import { createError, defineEventHandler } from 'h3'
import { proxyToBackend } from '~/server/utils/backendProxy'

const ALLOWED_PATH_PREFIXES = [
  '/providers',
  '/quotes',
  '/corridors',
  '/popular-corridors',
  '/corridor-currencies',
  '/offers',
  '/ads',
  '/bank-vs-specialist',
  '/geo',
  '/click',
  '/newsletter',
  '/recent-searches',
  '/billing',
  '/me',
  '/watchlist',
  '/alerts',
  '/exports',
  '/sessions',
  '/telemetry',
  '/marketing',
  '/pulse',
  '/rates',
  '/ops',
  '/analytics',
  '/audit',
  '/admin',
] as const

export default defineEventHandler(async (event) => {
  const params = event.context.params?.path
  const suffix = Array.isArray(params) ? params.join('/') : params || ''
  const target = suffix ? `/${suffix}` : '/'

  const decodedTarget = (() => {
    try {
      return decodeURIComponent(target)
    }
    catch {
      return target
    }
  })()

  // Block path traversal / weird proxies.
  if (decodedTarget.includes('..') || decodedTarget.includes('//')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid path' })
  }

  // Restrict to known backend API prefixes so clients can't probe internal endpoints via the BFF.
  if (target !== '/' && !ALLOWED_PATH_PREFIXES.some(prefix => target.startsWith(prefix))) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  return await proxyToBackend(event, target)
})
