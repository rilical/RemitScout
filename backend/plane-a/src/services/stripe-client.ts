import Stripe from 'stripe'
import { config } from '../../../shared/config'
import { createMockStripeClient } from './stripe-mock'

let client: Stripe | null = null

const isDevEnv = () => {
  return config.env === 'development' || config.env === 'dev' || config.env === 'test'
}

export const isStripeMockEnabled = () => {
  return config.billing.stripe.mockEnabled && isDevEnv()
}

export const isStripeMockMisconfigured = () => {
  return config.billing.stripe.mockEnabled && !isDevEnv()
}

export const isStripeConfigured = () => {
  return Boolean(config.billing.stripe.secretKey) || isStripeMockEnabled()
}

export const getStripeClient = () => {
  if (isStripeMockMisconfigured()) {
    throw new Error('Stripe mock cannot be enabled in production')
  }
  if (!config.billing.stripe.secretKey && !isStripeMockEnabled()) {
    throw new Error('Stripe secret key missing')
  }
  if (!client) {
    client = isStripeMockEnabled()
      ? createMockStripeClient()
      : new Stripe(config.billing.stripe.secretKey, {
          apiVersion: '2025-12-15.clover',
        })
  }
  return client
}
