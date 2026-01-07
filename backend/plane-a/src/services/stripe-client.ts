import Stripe from 'stripe'
import { config } from '../../../shared/config'
import { createMockStripeClient } from './stripe-mock'

let client: Stripe | null = null

export const getStripeClient = () => {
  if (!client) {
    client = config.billing.stripe.mockEnabled
      ? createMockStripeClient()
      : new Stripe(config.billing.stripe.secretKey, {
          apiVersion: '2025-12-15.clover',
        })
  }
  return client
}
