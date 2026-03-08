import type { Pool } from 'pg'
import { getPool } from '../../shared/db'
import { config } from '../../shared/config'
import * as repositoriesModule from './repositories'

const pool = getPool(config.db.planeAUrl)

type PlaneARepositories = {
  alert: repositoriesModule.AlertRepository
  analytics: repositoriesModule.AnalyticsRepository
  auditLog: repositoriesModule.AuditLogRepository
  billingWebhookEvent: repositoriesModule.BillingWebhookEventRepository
  comparisonHistory: repositoriesModule.ComparisonHistoryRepository
  corridorCapability: repositoriesModule.CorridorCapabilityRepository
  corridorPriority: repositoriesModule.CorridorPriorityRepository
  exportJob: repositoriesModule.ExportJobRepository
  fxRateHistory: repositoriesModule.FxRateHistoryRepository
  fxRateRefresh: repositoriesModule.FxRateRefreshRepository
  fxRate: repositoriesModule.FxRateRepository
  goldIndices: repositoriesModule.GoldIndicesRepository
  latestQuote: repositoriesModule.LatestQuoteRepository
  newsletter: repositoriesModule.NewsletterRepository
  popularCorridor: repositoriesModule.PopularCorridorRepository
  publishedEmbed: repositoriesModule.PublishedEmbedRepository
  providerVisit: repositoriesModule.ProviderVisitRepository
  pulseCache: repositoriesModule.PulseCacheRepository
  quoteAttempt: repositoriesModule.QuoteAttemptRepository
  quoteRefresh: repositoriesModule.QuoteRefreshRepository
  recentSearch: repositoriesModule.RecentSearchRepository
  rightsMatrix: repositoriesModule.RightsMatrixRepository
  session: repositoriesModule.SessionRepository
  telemetry: repositoriesModule.TelemetryRepository
  userAccount: repositoriesModule.UserAccountRepository
  userPlan: repositoriesModule.UserPlanRepository
  watchlist: repositoriesModule.WatchlistRepository
}

type RepositoryCtor<T> = new (pool: Pool) => T

const resolveRepositoryCtor = <T>(name: string): RepositoryCtor<T> => {
  const candidate = (repositoriesModule as unknown as Record<string, unknown>)[name]
  if (typeof candidate !== 'function') {
    throw new Error(`Repository constructor "${name}" is unavailable`)
  }
  return candidate as RepositoryCtor<T>
}

export const createPlaneAContainer = () => {
  const cache: Partial<PlaneARepositories> = {}
  const getOrCreate = <K extends keyof PlaneARepositories>(key: K, ctorName: string) => {
    if (!cache[key]) {
      const ctor = resolveRepositoryCtor<PlaneARepositories[K]>(ctorName)
      cache[key] = new ctor(pool)
    }
    return cache[key] as PlaneARepositories[K]
  }

  const repositories: PlaneARepositories = {
    get alert() {
      return getOrCreate('alert', 'AlertRepository')
    },
    get analytics() {
      return getOrCreate('analytics', 'AnalyticsRepository')
    },
    get auditLog() {
      return getOrCreate('auditLog', 'AuditLogRepository')
    },
    get billingWebhookEvent() {
      return getOrCreate('billingWebhookEvent', 'BillingWebhookEventRepository')
    },
    get comparisonHistory() {
      return getOrCreate('comparisonHistory', 'ComparisonHistoryRepository')
    },
    get corridorCapability() {
      return getOrCreate('corridorCapability', 'CorridorCapabilityRepository')
    },
    get corridorPriority() {
      return getOrCreate('corridorPriority', 'CorridorPriorityRepository')
    },
    get exportJob() {
      return getOrCreate('exportJob', 'ExportJobRepository')
    },
    get fxRateHistory() {
      return getOrCreate('fxRateHistory', 'FxRateHistoryRepository')
    },
    get fxRateRefresh() {
      return getOrCreate('fxRateRefresh', 'FxRateRefreshRepository')
    },
    get fxRate() {
      return getOrCreate('fxRate', 'FxRateRepository')
    },
    get goldIndices() {
      return getOrCreate('goldIndices', 'GoldIndicesRepository')
    },
    get latestQuote() {
      return getOrCreate('latestQuote', 'LatestQuoteRepository')
    },
    get newsletter() {
      return getOrCreate('newsletter', 'NewsletterRepository')
    },
    get popularCorridor() {
      return getOrCreate('popularCorridor', 'PopularCorridorRepository')
    },
    get publishedEmbed() {
      return getOrCreate('publishedEmbed', 'PublishedEmbedRepository')
    },
    get providerVisit() {
      return getOrCreate('providerVisit', 'ProviderVisitRepository')
    },
    get pulseCache() {
      return getOrCreate('pulseCache', 'PulseCacheRepository')
    },
    get quoteAttempt() {
      return getOrCreate('quoteAttempt', 'QuoteAttemptRepository')
    },
    get quoteRefresh() {
      return getOrCreate('quoteRefresh', 'QuoteRefreshRepository')
    },
    get recentSearch() {
      return getOrCreate('recentSearch', 'RecentSearchRepository')
    },
    get rightsMatrix() {
      return getOrCreate('rightsMatrix', 'RightsMatrixRepository')
    },
    get session() {
      return getOrCreate('session', 'SessionRepository')
    },
    get telemetry() {
      return getOrCreate('telemetry', 'TelemetryRepository')
    },
    get userAccount() {
      return getOrCreate('userAccount', 'UserAccountRepository')
    },
    get userPlan() {
      return getOrCreate('userPlan', 'UserPlanRepository')
    },
    get watchlist() {
      return getOrCreate('watchlist', 'WatchlistRepository')
    },
  }

  return {
    pool,
    repositories,
  }
}

export type PlaneAContainer = ReturnType<typeof createPlaneAContainer>

export const planeAContainer: PlaneAContainer = createPlaneAContainer()
