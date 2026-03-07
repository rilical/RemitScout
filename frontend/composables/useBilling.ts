import type { Plan } from '~/composables/useEntitlements'
import { mapPlanStateFailureMessage } from '~/composables/usePlanStateError'

export type BillingCheckoutResult = {
  ok: boolean
  url?: string
  sessionId?: string
  error?: string
}

export const useBilling = () => {
  const { request } = useApi()
  const { refreshPlan } = useEntitlements()

  const getErrorMessage = (error: unknown, fallback: string) => {
    return mapPlanStateFailureMessage(error, fallback, {
      customer_not_found: 'No billing profile was found for this account yet. Start checkout to create one.',
      unsupported_plan_code: 'That plan cannot be purchased in self-serve checkout.',
    })
  }

  const isSafeBillingRedirect = (value: string): boolean => {
    if (!value) return false
    try {
      const parsed = new URL(value, import.meta.client ? window.location.origin : 'https://example.com')
      if (!/^https?:$/.test(parsed.protocol)) return false
      const host = parsed.hostname.toLowerCase()
      if (import.meta.client && parsed.origin === window.location.origin) return true
      return host === 'billing.stripe.com' || host.endsWith('.stripe.com')
    }
    catch {
      return false
    }
  }

  const checkoutLoading = useState<boolean>('billing:checkout:loading', () => false)
  const portalLoading = useState<boolean>('billing:portal:loading', () => false)
  const error = useState<string | null>('billing:error', () => null)

  const createCheckoutSession = async (planCode: Plan, billingInterval: 'month' | 'year' = 'month'): Promise<BillingCheckoutResult> => {
    error.value = null
    checkoutLoading.value = true

    try {
      const response = await request<{ url?: string, session_id?: string, error?: string, message?: string }>(
        '/billing/checkout-session',
        {
          method: 'POST',
          body: { plan_code: planCode, billing_interval: billingInterval },
        },
      )

      if (!response.url) {
        const message = response.message || response.error || 'Checkout session unavailable'
        error.value = message
        return { ok: false, error: message }
      }

      return { ok: true, url: response.url, sessionId: response.session_id }
    }
    catch (err: unknown) {
      const message = getErrorMessage(err, 'Unable to start checkout')
      error.value = message
      return { ok: false, error: message }
    }
    finally {
      checkoutLoading.value = false
    }
  }

  const openBillingPortal = async (): Promise<BillingCheckoutResult> => {
    error.value = null
    portalLoading.value = true

    try {
      const response = await request<{ url?: string, error?: string, message?: string }>(
        '/billing/portal',
        { method: 'GET' },
      )

      if (!response.url) {
        const message = response.message || response.error || 'Billing portal unavailable'
        error.value = message
        return { ok: false, error: message }
      }

      if (!isSafeBillingRedirect(response.url)) {
        const message = 'Invalid billing portal URL.'
        error.value = message
        return { ok: false, error: message }
      }

      if (import.meta.client) {
        window.location.assign(response.url)
      }

      return { ok: true, url: response.url }
    }
    catch (err: unknown) {
      const message = getErrorMessage(err, 'Unable to open billing portal')
      error.value = message
      return { ok: false, error: message }
    }
    finally {
      portalLoading.value = false
    }
  }

  const refreshBillingInfo = async () => {
    await refreshPlan()
  }

  const verifyCheckoutSession = async (sessionId: string): Promise<BillingCheckoutResult> => {
    error.value = null
    try {
      await request('/billing/verify-session', {
        method: 'POST',
        body: { sessionId },
      })
      await refreshPlan()
      return { ok: true }
    }
    catch (err: unknown) {
      const message = getErrorMessage(err, 'Unable to verify checkout')
      error.value = message
      return { ok: false, error: message }
    }
  }

  return {
    checkoutLoading,
    portalLoading,
    error,
    createCheckoutSession,
    openBillingPortal,
    verifyCheckoutSession,
    refreshBillingInfo,
  }
}
