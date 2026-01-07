import type Stripe from 'stripe'
import { config } from '../../../shared/config'

type MockSession = {
  id: string
  url: string
  customer: string
  status: string
  payment_status: string
}

type MockSubscription = {
  id: string
  status: string
  current_period_end: number
  items: {
    data: Array<{
      price: { unit_amount: number; currency: string }
    }>
  }
  default_payment_method: {
    type: string
    card: { last4: string; brand: string; exp_month: number; exp_year: number }
  }
}

const sessions = new Map<string, MockSession>()
const subscriptions = new Map<string, MockSubscription>()

const makeId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`

const nowSeconds = () => Math.floor(Date.now() / 1000)

const buildSubscription = (customerId: string): MockSubscription => {
  const id = `sub_${customerId.slice(-8)}`
  if (subscriptions.has(id)) {
    return subscriptions.get(id)!
  }
  const subscription: MockSubscription = {
    id,
    status: 'active',
    current_period_end: nowSeconds() + 30 * 24 * 60 * 60,
    items: {
      data: [
        {
          price: {
            unit_amount: 999,
            currency: 'usd',
          },
        },
      ],
    },
    default_payment_method: {
      type: 'card',
      card: {
        last4: '4242',
        brand: 'visa',
        exp_month: 12,
        exp_year: 2030,
      },
    },
  }
  subscriptions.set(id, subscription)
  return subscription
}

export const createMockStripeClient = (): Stripe => {
  const frontendBase = config.billing.stripe.frontendBaseUrl || 'http://localhost:3000'

  const mock = {
    customers: {
      create: async () => ({
        id: makeId('cus'),
      }),
    },
    checkout: {
      sessions: {
        create: async (params: { customer: string }) => {
          const id = makeId('cs')
          const session: MockSession = {
            id,
            url: `${frontendBase}/mock-stripe/checkout?session_id=${id}`,
            customer: params.customer,
            status: 'complete',
            payment_status: 'paid',
          }
          sessions.set(id, session)
          return session
        },
        retrieve: async (id: string) => {
          return (
            sessions.get(id) ?? {
              id,
              customer: 'cus_mock',
              status: 'open',
              payment_status: 'unpaid',
            }
          )
        },
      },
    },
    subscriptions: {
      retrieve: async (id: string) => {
        return subscriptions.get(id) ?? buildSubscription('cus_mock')
      },
      list: async (params: { customer: string }) => {
        return { data: [buildSubscription(params.customer)] }
      },
    },
    invoices: {
      list: async () => ({
        data: [],
      }),
    },
    billingPortal: {
      sessions: {
        create: async () => ({
          url: `${frontendBase}/mock-stripe/portal`,
        }),
      },
    },
    webhooks: {
      constructEvent: (body: Buffer | string) => {
        try {
          const payload = JSON.parse(Buffer.isBuffer(body) ? body.toString('utf8') : body)
          return payload
        } catch {
          return {
            type: 'unknown',
            data: { object: {} },
          }
        }
      },
    },
  }

  return mock as unknown as Stripe
}
