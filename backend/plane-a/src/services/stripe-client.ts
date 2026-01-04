import Stripe from 'stripe'
import { config } from '../../../shared/config'

let client: Stripe | null = null

export const getStripeClient = () => {
  if (!client) {
    client = new Stripe(config.billing.stripe.secretKey, {
      apiVersion: '2025-12-15.clover',
    })
  }
  return client
}
