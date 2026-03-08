import '../../shared/load-env'
import {
  evaluateMeChecks,
  readSmokeMeExpectations,
  resolveSmokeApiBaseUrl,
  resolveSmokeErrorCode,
  resolveSmokeRootBaseUrl,
} from './alerts-watchlists-smoke'

type Check = {
  name: string
  ok: boolean
  note?: string
}

type SupabasePasswordSignInResponse = {
  access_token?: string
  error?: string
  error_description?: string
}

type MeApiKeysResponse = {
  success?: boolean
  keys?: Array<{
    key_id?: string
    name?: string | null
    revoked_at?: string | null
  }>
}

type MeApiKeyMutationResponse = {
  success?: boolean
  token?: string
  api_key?: {
    key_id?: string
    key_prefix?: string
    scopes?: string[]
  }
  error?: string
  maxKeys?: number
}

type PublishedEmbedsResponse = {
  success?: boolean
  embeds?: Array<{
    id?: string
    revokedAt?: string | null
  }>
  error?: string
}

type PublishedEmbedMutationResponse = {
  success?: boolean
  publishedId?: string
  publicUrl?: string
  variants?: Array<{ publicUrl?: string }>
  error?: string
  message?: string
}

type PublicPublishedEmbedResponse = {
  publishedId?: string
  error?: string
}

type BillingHistoryResponse = {
  invoices?: unknown[]
  error?: string
  details?: {
    error?: string
  }
}

type NotificationSettings = {
  emailEnabled: boolean
  smsEnabled: boolean
  pushEnabled: boolean
  rateAlerts: boolean
  weeklySummary: boolean
  marketUpdates: boolean
  productUpdates: boolean
  promotional: boolean
  updatedAt: string | null
}

type NotificationsResponse = {
  settings?: NotificationSettings
  error?: string
}

type MeExportJobsResponse = {
  success?: boolean
  jobs?: Array<{
    id?: string
    status?: string
  }>
  error?: string
  message?: string
}

type MeExportJobMutationResponse = {
  success?: boolean
  job?: {
    id?: string
    status?: string
  }
  error?: string
  message?: string
}

type ApiKeyExportsListResponse = {
  success?: boolean
  jobs?: Array<{
    id?: string
    status?: string
  }>
  error?: string
  message?: string
}

type ApiKeyExportMutationResponse = {
  success?: boolean
  job?: {
    id?: string
    status?: string
  }
  error?: string
  message?: string
}

type ApiKeyExportGetResponse = {
  success?: boolean
  job?: {
    id?: string
    status?: string
  }
  error?: string
}

type ApiKeyExportDownloadResponse = {
  success?: boolean
  url?: string
  expiresIn?: number
  error?: string
}

type TriangulatedSeriesResponse = {
  corridorId?: string
  series?: Array<{
    date?: string
    confidence?: string | null
    contributingSignals?: unknown[]
  }>
  error?: string
}

const mustEnv = (key: string): string => {
  const value = process.env[key]
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${key}`)
  }
  return value.trim()
}

const toInteger = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(String(value || '').trim(), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const jsonFetch = async <T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<{ status: number; body: T }> => {
  const res = await fetch(url, init)
  const contentType = res.headers.get('content-type') || ''
  const body: unknown = contentType.includes('application/json')
    ? await res.json().catch(() => ({}))
    : await res.text().catch(() => '')
  return { status: res.status, body: body as T }
}

const signInSupabase = async (): Promise<string> => {
  const supabaseUrl = mustEnv('SUPABASE_URL')
  const apiKey =
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim()
    || process.env.SUPABASE_ANON_KEY?.trim()
    || ''
  if (!apiKey) {
    throw new Error('Missing SUPABASE_PUBLISHABLE_KEY (or SUPABASE_ANON_KEY)')
  }

  const email = mustEnv('SMOKE_USER_EMAIL')
  const password = mustEnv('SMOKE_USER_PASSWORD')

  const { status, body } = await jsonFetch<SupabasePasswordSignInResponse>(
    `${supabaseUrl.replace(/\/$/, '')}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    },
  )

  const token = typeof body?.access_token === 'string' ? body.access_token : ''
  if (status >= 400 || !token) {
    throw new Error(`Supabase sign-in failed status=${status} body=${JSON.stringify(body)}`)
  }
  return token
}

export const readEnterpriseConfig = (env: NodeJS.ProcessEnv = process.env) => ({
  corridorId: env.SMOKE_ENTERPRISE_CORRIDOR_ID?.trim() || 'US-MX-USD-MXN',
  amountBucket: toInteger(env.SMOKE_ENTERPRISE_AMOUNT_BUCKET, 500),
  methodProfile: env.SMOKE_ENTERPRISE_METHOD_PROFILE?.trim() || 'standard_bank',
  allowEmptyTriangulation:
    ['1', 'true', 'yes', 'on'].includes((env.SMOKE_ALLOW_EMPTY_TRIANGULATION || '').trim().toLowerCase()),
  allowExportPipelineDegraded:
    ['1', 'true', 'yes', 'on'].includes((env.SMOKE_ALLOW_EXPORT_PIPELINE_DEGRADED || '').trim().toLowerCase()),
})

const isActiveSmokeApiKey = (
  key: NonNullable<MeApiKeysResponse['keys']>[number] | undefined,
): key is NonNullable<MeApiKeysResponse['keys']>[number] & { key_id: string } => {
  if (!key || typeof key.key_id !== 'string' || key.key_id.length === 0) {
    return false
  }
  if (typeof key.revoked_at === 'string' && key.revoked_at.length > 0) {
    return false
  }
  return typeof key.name === 'string' && key.name.startsWith('release-smoke:')
}

const isoDate = (value: Date) => value.toISOString().slice(0, 10)

const buildRecentExportDateWindow = (days: number) => {
  const end = new Date()
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - Math.max(0, days - 1))
  return {
    dateFrom: isoDate(start),
    dateTo: isoDate(end),
  }
}

const main = async () => {
  const smokeBaseUrl = mustEnv('SMOKE_BASE_URL')
  const rootBase = resolveSmokeRootBaseUrl(smokeBaseUrl)
  const apiBase = resolveSmokeApiBaseUrl(smokeBaseUrl)
  const authToken = await signInSupabase()
  const authHeaders = { Authorization: `Bearer ${authToken}` }
  const config = readEnterpriseConfig()
  const meExpectations = {
    ...readSmokeMeExpectations(),
    effectivePlanCode:
      readSmokeMeExpectations().effectivePlanCode || 'enterprise',
    requireEnterpriseEntitlements:
      readSmokeMeExpectations().requireEnterpriseEntitlements ?? true,
  }

  const checks: Check[] = []
  const record = (check: Check) => checks.push(check)

  let createdApiKeyId: string | null = null
  let createdApiKeyToken: string | null = null
  let publishedEmbedId: string | null = null
  let originalSettings: NotificationSettings | null = null

  try {
    {
      const { status } = await jsonFetch(`${rootBase}/healthz`)
      record({ name: 'GET /healthz', ok: status < 400, note: `status=${status}` })
    }
    {
      const { status } = await jsonFetch(`${rootBase}/readyz`)
      record({ name: 'GET /readyz', ok: status < 400, note: `status=${status}` })
    }
    {
      const { status, body } = await jsonFetch(`${apiBase}/me`, {
        headers: authHeaders,
      })
      for (const check of evaluateMeChecks(status, body as never, meExpectations)) {
        record(check)
      }
    }

    {
      const listApiKeys = () => jsonFetch<MeApiKeysResponse>(`${apiBase}/me/api-keys`, {
        headers: authHeaders,
      })

      let { status, body } = await listApiKeys()
      let cleanedSmokeKeys = 0

      if (status < 400 && body?.success === true && Array.isArray(body?.keys)) {
        for (const key of body.keys.filter(isActiveSmokeApiKey)) {
          const cleanup = await jsonFetch<{ success?: boolean; error?: string }>(
            `${apiBase}/me/api-keys/${key.key_id}`,
            {
              method: 'DELETE',
              headers: authHeaders,
            },
          )
          if (cleanup.status < 400 && cleanup.body?.success === true) {
            cleanedSmokeKeys += 1
          }
        }

        if (cleanedSmokeKeys > 0) {
          const refreshed = await listApiKeys()
          status = refreshed.status
          body = refreshed.body
        }
      }

      record({
        name: 'GET /me/api-keys',
        ok: status < 400 && body?.success === true && Array.isArray(body?.keys),
        note: `status=${status} keys=${Array.isArray(body?.keys) ? body.keys.length : 'n/a'}${cleanedSmokeKeys > 0 ? ` cleaned=${cleanedSmokeKeys}` : ''}`,
      })
    }

    {
      const tag = new Date().toISOString().replace(/[:.]/g, '-')
      const { status, body } = await jsonFetch<MeApiKeyMutationResponse>(`${apiBase}/me/api-keys`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `release-smoke:${tag}`,
          scopes: ['indices:read', 'exports:read'],
        }),
      })

      createdApiKeyId = typeof body?.api_key?.key_id === 'string' ? body.api_key.key_id : null
      createdApiKeyToken = typeof body?.token === 'string' ? body.token : null

      record({
        name: 'POST /me/api-keys',
        ok:
          status < 400
          && body?.success === true
          && Boolean(createdApiKeyId)
          && Boolean(createdApiKeyToken),
        note: status < 400
          ? `status=${status} key_id=${String(createdApiKeyId)}`
          : `status=${status} error=${String(resolveSmokeErrorCode(body))}`,
      })
    }

    if (createdApiKeyId) {
      const { status, body } = await jsonFetch<MeApiKeyMutationResponse>(
        `${apiBase}/me/api-keys/${createdApiKeyId}/rotate`,
        {
          method: 'POST',
          headers: authHeaders,
        },
      )
      const rotatedToken = typeof body?.token === 'string' ? body.token : ''
      if (status < 400 && rotatedToken) {
        createdApiKeyToken = rotatedToken
      }
      record({
        name: 'POST /me/api-keys/:keyId/rotate',
        ok: status < 400 && body?.success === true && Boolean(rotatedToken),
        note: status < 400
          ? `status=${status}`
          : `status=${status} error=${String(resolveSmokeErrorCode(body))}`,
      })
    } else {
      record({
        name: 'POST /me/api-keys/:keyId/rotate',
        ok: false,
        note: 'skipped because api key creation failed',
      })
    }

    {
      const { status, body } = await jsonFetch<PublishedEmbedMutationResponse>(
        `${apiBase}/indices/published-embeds`,
        {
          method: 'POST',
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            corridor_id: config.corridorId,
            amount_bucket: config.amountBucket,
            method_profile: config.methodProfile,
            days: 30,
            theme: 'dark',
          }),
        },
      )

      publishedEmbedId = typeof body?.publishedId === 'string' ? body.publishedId : null
      record({
        name: 'POST /indices/published-embeds',
        ok: status < 400 && body?.success === true && Boolean(publishedEmbedId),
        note: status < 400
          ? `status=${status} published_id=${String(publishedEmbedId)}`
          : `status=${status} error=${String(resolveSmokeErrorCode(body))}`,
      })
    }

    {
      const { status, body } = await jsonFetch<PublishedEmbedsResponse>(`${apiBase}/me/published-embeds?limit=20`, {
        headers: authHeaders,
      })
      const embedVisible = Boolean(
        publishedEmbedId
        && body?.embeds?.some((embed) => embed.id === publishedEmbedId),
      )
      record({
        name: 'GET /me/published-embeds',
        ok: status < 400 && body?.success === true && (!publishedEmbedId || embedVisible),
        note: `status=${status} embeds=${Array.isArray(body?.embeds) ? body.embeds.length : 'n/a'}`,
      })
    }

    if (publishedEmbedId) {
      const { status, body } = await jsonFetch<PublicPublishedEmbedResponse>(
        `${apiBase}/public/indices/published-embeds/${publishedEmbedId}`,
      )
      record({
        name: 'GET /public/indices/published-embeds/:id',
        ok: status < 400 && body?.publishedId === publishedEmbedId,
        note: status < 400
          ? `status=${status}`
          : `status=${status} error=${String(resolveSmokeErrorCode(body))}`,
      })
    } else {
      record({
        name: 'GET /public/indices/published-embeds/:id',
        ok: false,
        note: 'skipped because published embed creation failed',
      })
    }

    {
      const { status, body } = await jsonFetch<BillingHistoryResponse>(`${apiBase}/billing/history`, {
        headers: authHeaders,
      })
      const errorCode = resolveSmokeErrorCode(body)
      record({
        name: 'GET /billing/history',
        ok:
          status < 400
          || (status < 500 && errorCode === 'customer_not_found'),
        note:
          status < 400
            ? `status=${status} invoices=${Array.isArray(body?.invoices) ? body.invoices.length : 'n/a'}`
            : `status=${status} error=${String(errorCode || body?.error || '')}`,
      })
    }

    {
      const { status, body } = await jsonFetch<NotificationsResponse>(`${apiBase}/notifications/preferences`, {
        headers: authHeaders,
      })
      originalSettings = body?.settings ?? null
      record({
        name: 'GET /notifications/preferences',
        ok: status < 400 && Boolean(originalSettings),
        note: `status=${status}`,
      })
    }

    if (originalSettings) {
      const nextSettings = {
        rateAlerts: originalSettings.rateAlerts,
        weeklySummary: originalSettings.weeklySummary,
        marketUpdates: originalSettings.marketUpdates,
        productUpdates: originalSettings.productUpdates,
        promotional: !originalSettings.promotional,
        pushEnabled: originalSettings.pushEnabled,
      }
      const { status, body } = await jsonFetch<NotificationsResponse>(
        `${apiBase}/notifications/preferences`,
        {
          method: 'PUT',
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(nextSettings),
        },
      )
      record({
        name: 'PUT /notifications/preferences',
        ok: status < 400 && body?.settings?.promotional === nextSettings.promotional,
        note: `status=${status} promotional=${String(body?.settings?.promotional)}`,
      })
    } else {
      record({
        name: 'PUT /notifications/preferences',
        ok: false,
        note: 'skipped because preferences could not be loaded',
      })
    }

    {
      const { status, body } = await jsonFetch<MeExportJobsResponse>(`${apiBase}/me/export-jobs?limit=10`, {
        headers: authHeaders,
      })
      record({
        name: 'GET /me/export-jobs',
        ok: status < 400 && body?.success === true && Array.isArray(body?.jobs),
        note: status < 400
          ? `status=${status} jobs=${Array.isArray(body?.jobs) ? body.jobs.length : 'n/a'}`
          : `status=${status} error=${String(resolveSmokeErrorCode(body))}`,
      })
    }

    let meExportJobId: string | null = null
    {
      const { status, body } = await jsonFetch<MeExportJobMutationResponse>(
        `${apiBase}/me/export-jobs`,
        {
          method: 'POST',
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobType: 'indices',
            format: 'csv',
            corridorIds: [config.corridorId],
          }),
        },
      )
      meExportJobId = typeof body?.job?.id === 'string' ? body.job.id : null
      const exportError = resolveSmokeErrorCode(body)
      record({
        name: 'POST /me/export-jobs',
        ok:
          status < 400 && body?.success === true && Boolean(meExportJobId)
          || (
            config.allowExportPipelineDegraded
            && status === 503
            && Boolean(exportError || body?.error)
          ),
        note:
          status < 400
            ? `status=${status} job_id=${String(meExportJobId)}`
            : `status=${status} error=${String(exportError || body?.error || '')}`,
      })
    }

    if (meExportJobId) {
      const { status, body } = await jsonFetch<MeExportJobsResponse>(`${apiBase}/me/export-jobs?limit=20`, {
        headers: authHeaders,
      })
      const found = body?.jobs?.some((job) => job.id === meExportJobId)
      record({
        name: 'GET /me/export-jobs includes created job',
        ok: status < 400 && body?.success === true && found === true,
        note: `status=${status} found=${String(found)}`,
      })
    } else {
      record({
        name: 'GET /me/export-jobs includes created job',
        ok: config.allowExportPipelineDegraded,
        note: 'skipped because export creation did not produce a job id',
      })
    }

    if (createdApiKeyToken) {
      const apiKeyHeaders = { 'x-api-key': createdApiKeyToken }
      const exportWindow = buildRecentExportDateWindow(7)

      {
        const { status, body } = await jsonFetch<TriangulatedSeriesResponse>(
          `${apiBase}/indices/triangulated/${config.corridorId}?amount_bucket=${config.amountBucket}&method_profile=${encodeURIComponent(config.methodProfile)}`,
          {
            headers: apiKeyHeaders,
          },
        )
        const series = Array.isArray(body?.series) ? body.series : []
        const hasSignals = series.some((point) => Array.isArray(point.contributingSignals) && point.contributingSignals.length > 0)
        record({
          name: 'GET /indices/triangulated/:corridorId',
          ok:
            status < 400
            && (
              config.allowEmptyTriangulation
              || (series.length > 0 && hasSignals)
            ),
          note: `status=${status} points=${series.length} signals=${hasSignals ? 'present' : 'missing'}`,
        })
      }

      {
        const { status, body } = await jsonFetch<ApiKeyExportsListResponse>(`${apiBase}/exports?limit=10`, {
          headers: apiKeyHeaders,
        })
        record({
          name: 'GET /exports (x-api-key)',
          ok: status < 400 && body?.success === true && Array.isArray(body?.jobs),
          note: `status=${status} jobs=${Array.isArray(body?.jobs) ? body.jobs.length : 'n/a'}`,
        })
      }

      let apiKeyExportJobId: string | null = null
      {
        const { status, body } = await jsonFetch<ApiKeyExportMutationResponse>(`${apiBase}/exports`, {
          method: 'POST',
          headers: {
            ...apiKeyHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dataType: 'indices',
            format: 'csv',
            corridorIds: [config.corridorId],
            dateFrom: exportWindow.dateFrom,
            dateTo: exportWindow.dateTo,
          }),
        })
        apiKeyExportJobId = typeof body?.job?.id === 'string' ? body.job.id : null
        record({
          name: 'POST /exports (x-api-key)',
          ok:
            status < 400 && body?.success === true && Boolean(apiKeyExportJobId)
            || (
              config.allowExportPipelineDegraded
              && status === 503
              && Boolean(resolveSmokeErrorCode(body) || body?.error)
            ),
          note:
            status < 400
              ? `status=${status} job_id=${String(apiKeyExportJobId)}`
              : `status=${status} error=${String(resolveSmokeErrorCode(body) || body?.error || '')}`,
        })
      }

      if (apiKeyExportJobId) {
        const { status, body } = await jsonFetch<ApiKeyExportGetResponse>(
          `${apiBase}/exports/${apiKeyExportJobId}`,
          {
            headers: apiKeyHeaders,
          },
        )
        record({
          name: 'GET /exports/:id (x-api-key)',
          ok: status < 400 && body?.success === true && body?.job?.id === apiKeyExportJobId,
          note: `status=${status} job_status=${String(body?.job?.status || '')}`,
        })

        const download = await jsonFetch<ApiKeyExportDownloadResponse>(
          `${apiBase}/exports/${apiKeyExportJobId}/download`,
          {
            headers: apiKeyHeaders,
          },
        )
        record({
          name: 'GET /exports/:id/download (x-api-key)',
          ok:
            (download.status < 400 && typeof download.body?.url === 'string')
            || download.body?.error === 'export_not_ready',
          note:
            download.status < 400
              ? `status=${download.status} download=ready`
              : `status=${download.status} error=${String(download.body?.error || '')}`,
        })
      } else {
        record({
          name: 'GET /exports/:id (x-api-key)',
          ok: config.allowExportPipelineDegraded,
          note: 'skipped because API key export creation did not produce a job id',
        })
        record({
          name: 'GET /exports/:id/download (x-api-key)',
          ok: config.allowExportPipelineDegraded,
          note: 'skipped because API key export creation did not produce a job id',
        })
      }
    } else {
      record({
        name: 'GET /indices/triangulated/:corridorId',
        ok: false,
        note: 'skipped because API key creation/rotation failed',
      })
      record({
        name: 'GET /exports (x-api-key)',
        ok: false,
        note: 'skipped because API key creation/rotation failed',
      })
      record({
        name: 'POST /exports (x-api-key)',
        ok: false,
        note: 'skipped because API key creation/rotation failed',
      })
      record({
        name: 'GET /exports/:id (x-api-key)',
        ok: false,
        note: 'skipped because API key creation/rotation failed',
      })
      record({
        name: 'GET /exports/:id/download (x-api-key)',
        ok: false,
        note: 'skipped because API key creation/rotation failed',
      })
    }
  } finally {
    if (originalSettings) {
      const restore = await jsonFetch<NotificationsResponse>(`${apiBase}/notifications/preferences`, {
        method: 'PUT',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rateAlerts: originalSettings.rateAlerts,
          weeklySummary: originalSettings.weeklySummary,
          marketUpdates: originalSettings.marketUpdates,
          productUpdates: originalSettings.productUpdates,
          promotional: originalSettings.promotional,
          pushEnabled: originalSettings.pushEnabled,
        }),
      }).catch((error) => ({
        status: 0,
        body: { error: error instanceof Error ? error.message : String(error) } as NotificationsResponse,
      }))

      record({
        name: 'cleanup /notifications/preferences restore',
        ok: restore.status < 400,
        note: `status=${restore.status}`,
      })
    }

    if (publishedEmbedId) {
      const revoke = await jsonFetch<PublishedEmbedMutationResponse>(
        `${apiBase}/me/published-embeds/${publishedEmbedId}/revoke`,
        {
          method: 'POST',
          headers: authHeaders,
        },
      ).catch((error) => ({
        status: 0,
        body: { error: error instanceof Error ? error.message : String(error) } as PublishedEmbedMutationResponse,
      }))

      record({
        name: 'cleanup /me/published-embeds/:id/revoke',
        ok: revoke.status < 400 && revoke.body?.success === true,
        note: `status=${revoke.status}`,
      })
    }

    if (createdApiKeyId) {
      const revoke: { status: number; body: { success?: boolean; error?: string } } =
        await jsonFetch<{ success?: boolean; error?: string }>(
        `${apiBase}/me/api-keys/${createdApiKeyId}`,
        {
          method: 'DELETE',
          headers: authHeaders,
        },
      ).catch((error) => ({
        status: 0,
        body: { error: error instanceof Error ? error.message : String(error) },
      }))

      record({
        name: 'cleanup DELETE /me/api-keys/:keyId',
        ok: revoke.status < 400 && revoke.body?.success === true,
        note: `status=${revoke.status}`,
      })
    }
  }

  const failures = checks.filter((check) => !check.ok)
  for (const check of checks) {
    console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.name}${check.note ? ` | ${check.note}` : ''}`)
  }

  if (failures.length > 0) {
    console.error(`\nEnterprise/triangulation smoke failed: ${failures.length} checks failed`)
    process.exit(1)
  }

  console.log('\nEnterprise/triangulation smoke passed.')
}

if (require.main === module) {
  main().catch((error) => {
    console.error(
      'Enterprise/triangulation smoke crashed:',
      error instanceof Error ? error.message : String(error),
    )
    process.exit(1)
  })
}
