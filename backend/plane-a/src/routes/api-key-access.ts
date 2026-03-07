import type { FastifyRequest } from 'fastify'

export const RETAIL_API_KEY_SCOPES = ['indices:read', 'corridors:read', 'exports:read'] as const

export type ApiKeyScope = (typeof RETAIL_API_KEY_SCOPES)[number]
export type ApiKeyAudience = 'none' | 'retail' | 'institutional' | 'both'
export type ApiKeyAccessPolicy = {
  audience: ApiKeyAudience
  requiredScope?: ApiKeyScope
}

const DEFAULT_API_KEY_ACCESS_POLICY: ApiKeyAccessPolicy = { audience: 'none' }

export const DEFAULT_RETAIL_API_KEY_SCOPES: ApiKeyScope[] = ['indices:read', 'corridors:read']

export const isRetailApiKeyScope = (value: string): value is ApiKeyScope => {
  return (RETAIL_API_KEY_SCOPES as readonly string[]).includes(value)
}

export const normalizeRetailApiKeyScopes = (scopes?: string[]): ApiKeyScope[] => {
  const values = Array.isArray(scopes) ? scopes : []
  const normalized = values
    .map((scope) => scope.trim().toLowerCase())
    .filter(isRetailApiKeyScope)

  return Array.from(new Set(normalized))
}

export const apiKeyAccessConfig = (policy: ApiKeyAccessPolicy) => ({
  apiKeyAccess: policy,
})

export const resolveApiKeyAccessPolicy = (request: FastifyRequest): ApiKeyAccessPolicy => {
  return request.routeOptions?.config?.apiKeyAccess ?? DEFAULT_API_KEY_ACCESS_POLICY
}

export const apiKeyAudienceAllows = (
  policy: ApiKeyAccessPolicy,
  audience: Exclude<ApiKeyAudience, 'none' | 'both'>,
): boolean => {
  return policy.audience === 'both' || policy.audience === audience
}

export const isInstitutionalApiKeyRoute = (request: FastifyRequest): boolean => {
  return apiKeyAudienceAllows(resolveApiKeyAccessPolicy(request), 'institutional')
}
