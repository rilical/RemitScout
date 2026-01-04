import { createLogger } from '../../../shared/logger'
import { getStripeClient } from './stripe-client'

const logger = createLogger('plane-a.stripe-admin')

const shouldCancelSubscription = (status: string | null | undefined) => {
  if (!status) return false
  return status !== 'canceled' && status !== 'incomplete_expired'
}

export const deleteStripeCustomer = async (customerId: string): Promise<void> => {
  const stripe = getStripeClient()

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 100,
    })

    for (const subscription of subscriptions.data) {
      if (shouldCancelSubscription(subscription.status)) {
        await stripe.subscriptions.cancel(subscription.id)
      }
    }
  } catch (error) {
    logger.warn('stripe_cancel_subscriptions_failed', {
      customer_id: customerId,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  await stripe.customers.del(customerId)
}
