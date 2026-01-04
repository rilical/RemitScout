import type { Plan } from '~/composables/useEntitlements'

export type BillingCheckoutResult = {
  ok: boolean
  url?: string
  error?: string
}

export const useBilling = () => {
  const { request } = useApi()
  const { refreshPlan } = useEntitlements()

  const checkoutLoading = useState<boolean>('billing:checkout:loading', () => false)
  const portalLoading = useState<boolean>('billing:portal:loading', () => false)
  const error = useState<string | null>('billing:error', () => null)

  const createCheckoutSession = async (planCode: Plan): Promise<BillingCheckoutResult> => {
    error.value = null
    checkoutLoading.value = true

    try {
      const response = await request<{ url?: string; error?: string; message?: string }>(
        '/billing/checkout-session',
        {
          method: 'POST',
          body: { plan_code: planCode },
        },
      )

      if (!response.url) {
        const message = response.message || response.error || 'Checkout session unavailable'
        error.value = message
        return { ok: false, error: message }
      }

      return { ok: true, url: response.url }
    } catch (err: any) {
      const message = err?.message || 'Unable to start checkout'
      error.value = message
      return { ok: false, error: message }
    } finally {
      checkoutLoading.value = false
    }
  }

  const openBillingPortal = async (): Promise<BillingCheckoutResult> => {
    error.value = null
    portalLoading.value = true

    try {
      const response = await request<{ url?: string; error?: string; message?: string }>(
        '/billing/portal',
        { method: 'GET' },
      )

      if (!response.url) {
        const message = response.message || response.error || 'Billing portal unavailable'
        error.value = message
        return { ok: false, error: message }
      }

      if (process.client) {
        window.location.href = response.url
      }

      return { ok: true, url: response.url }
    } catch (err: any) {
      const message = err?.message || 'Unable to open billing portal'
      error.value = message
      return { ok: false, error: message }
    } finally {
      portalLoading.value = false
    }
  }

  const refreshBillingInfo = async () => {
    await refreshPlan()
  }

  return {
    checkoutLoading,
    portalLoading,
    error,
    createCheckoutSession,
    openBillingPortal,
    refreshBillingInfo,
  }
}
