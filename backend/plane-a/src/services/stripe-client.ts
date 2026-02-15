import Stripe from 'stripe'
import { config } from '../../../shared/config'

let client: Stripe | null = null

export const isStripeConfigured = () => {
  return Boolean(config.billing.stripe.secretKey)
}

export const getStripeClient = () => {
  if (!config.billing.stripe.secretKey) {
    throw new Error('Stripe secret key missing')
  }
  if (!client) {
    client = new Stripe(config.billing.stripe.secretKey, {
      apiVersion: '2026-01-28.clover',
    })
  }
  return client
}
