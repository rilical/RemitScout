import { createId } from '~/utils/id'
import type { Method } from '~/types/remit'

export type CompareRun = {
  id: string
  from: string
  to: string
  method: Method
  amount: number
  label: string
  createdAt: string
  path?: string
}

function normalizeMethod(method: Method | undefined): Method {
  return method ?? 'bank'
}

function normalizeCountryCode(code: string) {
  return code.trim().toUpperCase()
}

function sameRun(a: Pick<CompareRun, 'from' | 'to' | 'method' | 'amount'>, b: Pick<CompareRun, 'from' | 'to' | 'method' | 'amount'>) {
  return a.from === b.from && a.to === b.to && a.method === b.method && a.amount === b.amount
}

export const useCompareHistory = () => {
  const { isAuthenticated } = useAuth()
  const { request } = useApi()
  const { state: runs, hydrated, reset } = usePersistedState<CompareRun[]>(
    'compare:history',
    () => [],
    { validate: (value): value is CompareRun[] => Array.isArray(value), requiredConsent: 'functional' },
  )

  const count = computed(() => runs.value.length)

  function record(input: {
    from: string
    to: string
    method?: Method
    amount: number
    label?: string
    path?: string
  }) {
    const normalized: Omit<CompareRun, 'id' | 'createdAt' | 'label'> & { label: string } = {
      from: normalizeCountryCode(input.from),
      to: normalizeCountryCode(input.to),
      method: normalizeMethod(input.method),
      amount: input.amount,
      label: input.label ?? `${normalizeCountryCode(input.from)}→${normalizeCountryCode(input.to)} • ${normalizeMethod(input.method)} • ${input.amount}`,
      path: input.path,
    }

    const now = new Date().toISOString()
    const existing = runs.value.find(r => sameRun(r, normalized)) ?? null
    if (existing) {
      const updated: CompareRun = { ...existing, ...normalized, createdAt: now }
      runs.value = [updated, ...runs.value.filter(r => r.id !== existing.id)].slice(0, 50)
      return updated
    }

    const next: CompareRun = {
      id: createId('cmp'),
      createdAt: now,
      ...normalized,
    }

    runs.value = [next, ...runs.value].slice(0, 50)

    if (import.meta.client && isAuthenticated.value) {
      void request('/history', {
        method: 'POST',
        body: {
          from_country: normalized.from,
          to_country: normalized.to,
          amount: normalized.amount,
          method: normalized.method,
          path: normalized.path,
        },
      }).catch(() => {
        // Ignore sync errors to avoid blocking UI
      })
    }

    return next
  }

  function remove(id: string) {
    runs.value = runs.value.filter(r => r.id !== id)
  }

  return {
    runs,
    hydrated,
    count,
    record,
    remove,
    reset,
  }
}
