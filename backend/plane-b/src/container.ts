import type { Pool } from 'pg'
import { createPool } from '../../shared/db'
import { config } from '../../shared/config'
import * as repositoriesModule from './repositories'

type PlaneBRepositories = {
  b2bSweep: repositoriesModule.B2bSweepRepository
  circuitBreaker: repositoriesModule.CircuitBreakerRepository
  corridor: repositoriesModule.CorridorRepository
  freshnessReport: repositoriesModule.FreshnessReportRepository
  fxRateRefresh: repositoriesModule.FxRateRefreshRepository
  ingestionRun: repositoriesModule.IngestionRunRepository
  latestQuote: repositoriesModule.LatestQuoteRepository
  opsAlert: repositoriesModule.OpsAlertRepository
  provider: repositoriesModule.ProviderRepository
  providerCapability: repositoriesModule.ProviderCapabilityRepository
  providerRate: repositoriesModule.ProviderRateRepository
  pulseCache: repositoriesModule.PulseCacheRepository
  quoteAttempt: repositoriesModule.QuoteAttemptRepository
  quoteRecord: repositoriesModule.QuoteRecordRepository
  quoteRefresh: repositoriesModule.QuoteRefreshRepository
  rightsMatrix: repositoriesModule.RightsMatrixRepository
  signal: repositoriesModule.SignalRepository
  webhook: repositoriesModule.WebhookRepository
}

type RepositoryCtor<T> = new (pool: Pool) => T

const resolveRepositoryCtor = <T>(name: string): RepositoryCtor<T> => {
  const candidate = (repositoriesModule as unknown as Record<string, unknown>)[name]
  if (typeof candidate !== 'function') {
    throw new Error(`Repository constructor "${name}" is unavailable`)
  }
  return candidate as RepositoryCtor<T>
}

export const createPlaneBContainer = (pool: Pool = createPool(config.db.planeBUrl)) => {
  const cache: Partial<PlaneBRepositories> = {}
  const getOrCreate = <K extends keyof PlaneBRepositories>(key: K, ctorName: string) => {
    if (!cache[key]) {
      const ctor = resolveRepositoryCtor<PlaneBRepositories[K]>(ctorName)
      cache[key] = new ctor(pool)
    }
    return cache[key] as PlaneBRepositories[K]
  }

  const repositories: PlaneBRepositories = {
    get b2bSweep() {
      return getOrCreate('b2bSweep', 'B2bSweepRepository')
    },
    get circuitBreaker() {
      return getOrCreate('circuitBreaker', 'CircuitBreakerRepository')
    },
    get corridor() {
      return getOrCreate('corridor', 'CorridorRepository')
    },
    get freshnessReport() {
      return getOrCreate('freshnessReport', 'FreshnessReportRepository')
    },
    get fxRateRefresh() {
      return getOrCreate('fxRateRefresh', 'FxRateRefreshRepository')
    },
    get ingestionRun() {
      return getOrCreate('ingestionRun', 'IngestionRunRepository')
    },
    get latestQuote() {
      return getOrCreate('latestQuote', 'LatestQuoteRepository')
    },
    get opsAlert() {
      return getOrCreate('opsAlert', 'OpsAlertRepository')
    },
    get provider() {
      return getOrCreate('provider', 'ProviderRepository')
    },
    get providerCapability() {
      return getOrCreate('providerCapability', 'ProviderCapabilityRepository')
    },
    get providerRate() {
      return getOrCreate('providerRate', 'ProviderRateRepository')
    },
    get pulseCache() {
      return getOrCreate('pulseCache', 'PulseCacheRepository')
    },
    get quoteAttempt() {
      return getOrCreate('quoteAttempt', 'QuoteAttemptRepository')
    },
    get quoteRecord() {
      return getOrCreate('quoteRecord', 'QuoteRecordRepository')
    },
    get quoteRefresh() {
      return getOrCreate('quoteRefresh', 'QuoteRefreshRepository')
    },
    get rightsMatrix() {
      return getOrCreate('rightsMatrix', 'RightsMatrixRepository')
    },
    get signal() {
      return getOrCreate('signal', 'SignalRepository')
    },
    get webhook() {
      return getOrCreate('webhook', 'WebhookRepository')
    },
  }

  return { pool, repositories }
}

export type PlaneBContainer = ReturnType<typeof createPlaneBContainer>
