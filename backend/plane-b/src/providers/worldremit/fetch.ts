import { randomUUID } from 'node:crypto'

import type { CollectorRequest, FetchResult } from '../../collectors/types'
import { httpRequest } from '../../collectors/http-client'
import type { ProxyTier } from '../../lib/proxy-router'
import { requireCorridorId } from '../../../../shared/corridor'
import { countryCodeMap, currencyCodeMap, payoutMethodMap } from './code-map'

const graphqlEndpoint = 'https://api.worldremit.com/graphql'
const startPageUrl = 'https://www.worldremit.com/'

const mapCountry = (code: string) => countryCodeMap[code] ?? code
const mapCurrency = (code: string) => currencyCodeMap[code] ?? code

type FetchOptions = {
  jitterMs?: number
  proxyTier?: ProxyTier
  corridorId?: string
}

const PAYOUT_METHODS_QUERY = `
  query PayoutMethods($sendCountry: CountryCode!, $receiveCountry: CountryCode!, $receiveCurrency: CurrencyCode!) {
    payOutMethods(
      payOutMethodsInput: {sendCountry: $sendCountry, receiveCountry: $receiveCountry, receiveCurrency: $receiveCurrency}
    ) {
      code
      payOutTimeEstimate
      correspondents {
        id
        name
        payOutTime
        __typename
      }
      __typename
    }
  }
`

const CREATE_CALCULATION_MUTATION = `
  mutation createCalculation($amount: BigDecimal!, $type: CalculationType!, $sendCountryCode: CountryCode!, $sendCurrencyCode: CurrencyCode!, $receiveCountryCode: CountryCode!, $receiveCurrencyCode: CurrencyCode!, $payOutMethodCode: String, $correspondentId: String) {
    createCalculation(
      calculationInput: {amount: $amount, send: {country: $sendCountryCode, currency: $sendCurrencyCode}, type: $type, receive: {country: $receiveCountryCode, currency: $receiveCurrencyCode}, payOutMethodCode: $payOutMethodCode, correspondentId: $correspondentId}
    ) {
      calculation {
        id
        isFree
        informativeSummary {
          fee {
            value {
              amount
              currency
              __typename
            }
            type
            __typename
          }
          discount {
            value {
              amount
              currency
              __typename
            }
            type
            __typename
          }
          appliedPromotions
          totalToPay {
            amount
            __typename
          }
          __typename
        }
        payInMethodsCalculations {
          totalToPay {
            amount
            currency
            __typename
          }
          payInMethod {
            name
            transferRedirectionType
            id
            icon {
              resolutions
              __typename
            }
            transferRedirectionType
            __typename
          }
          __typename
        }
        send {
          currency
          amount
          __typename
        }
        receive {
          amount
          currency
          __typename
        }
        rounding {
          sendRoundingSeed
          receiveRoundingSeed
          __typename
        }
        exchangeRate {
          value
          crossedOutValue
          __typename
        }
        __typename
      }
      errors {
        ...GenericCalculationError
        ...ValidationCalculationError
        __typename
      }
      __typename
    }
  }

  fragment GenericCalculationError on GenericCalculationError {
    __typename
    message
    genericType: type
  }

  fragment ValidationCalculationError on ValidationCalculationError {
    __typename
    message
    type
    code
    description
  }
`

type GraphQLResponse<T> = {
  data?: T
  errors?: Array<{ message: string; [key: string]: unknown }>
}

type PayoutMethodsResponse = {
  payOutMethods: Array<{
    code: string
    payOutTimeEstimate: string
    correspondents: Array<{
      id: string
      name: string
      payOutTime: string | null
      __typename: string
    }>
    __typename: string
  }>
}

type CreateCalculationResponse = {
  createCalculation: {
    calculation: {
      id: string | null
      isFree: boolean
      informativeSummary: {
        fee: {
          value: {
            amount: number
            currency: string
            __typename: string
          }
          type: string
          __typename: string
        }
        discount: {
          value: {
            amount: number
            currency: string
            __typename: string
          }
          type: string
          __typename: string
        }
        appliedPromotions: unknown[]
        totalToPay: {
          amount: number
          __typename: string
        }
        __typename: string
      }
      payInMethodsCalculations: Array<{
        totalToPay: {
          amount: number
          currency: string
          __typename: string
        }
        payInMethod: {
          name: string
          transferRedirectionType: string
          id: string
          icon: {
            resolutions: unknown[]
            __typename: string
          }
          __typename: string
        }
        __typename: string
      }>
      send: {
        currency: string
        amount: number
        __typename: string
      }
      receive: {
        amount: number
        currency: string
        __typename: string
      }
      rounding: {
        sendRoundingSeed: number
        receiveRoundingSeed: number
        __typename: string
      }
      exchangeRate: {
        value: number
        crossedOutValue: number | null
        __typename: string
      }
      __typename: string
    }
    errors: Array<{
      __typename: string
      message: string
      [key: string]: unknown
    }>
    __typename: string
  }
}

const executeGraphQL = async <T>(
  operationName: string,
  query: string,
  variables: Record<string, unknown>,
  options: FetchOptions = {},
): Promise<{ status: number; json: GraphQLResponse<T> }> => {
  const requestId = randomUUID()
  
  const response = await httpRequest({
    url: graphqlEndpoint,
    method: 'POST',
    headers: {
      accept: 'application/json',
      'accept-language': 'en',
      'content-type': 'application/json',
      origin: 'https://www.worldremit.com',
      referer: startPageUrl,
      'user-agent': 'RemitScoutCollector/1.0',
      'x-wr-platform': 'Web',
      'x-wr-requestid': requestId,
    },
    body: {
      operationName,
      query,
      variables,
    },
    jitterMs: options.jitterMs,
    proxyTier: options.proxyTier,
    corridorId: options.corridorId,
  })

  if (!response.json) {
    throw new Error('Invalid JSON response from WorldRemit GraphQL API')
  }

  return {
    status: response.status,
    json: response.json as GraphQLResponse<T>,
  }
}

export const fetchWorldRemitQuote = async (
  request: CollectorRequest,
  options: FetchOptions = {},
): Promise<FetchResult> => {
  const { sourceCountry, destCountry, sourceCurrency, destCurrency } = requireCorridorId(
    request.corridor_id,
  )

  const sendCountry = mapCountry(sourceCountry)
  const sendCurrency = mapCurrency(sourceCurrency)
  const receiveCountry = mapCountry(destCountry)
  const receiveCurrency = mapCurrency(destCurrency)
  const baseOptions = { ...options, corridorId: request.corridor_id }

  try {
    const payoutMethodsResponse = await executeGraphQL<PayoutMethodsResponse>(
      'PayoutMethods',
      PAYOUT_METHODS_QUERY,
      {
        sendCountry,
        receiveCountry,
        receiveCurrency,
      },
      baseOptions,
    )

    if (payoutMethodsResponse.json.errors || !payoutMethodsResponse.json.data?.payOutMethods?.length) {
      return {
        status: payoutMethodsResponse.status,
        bodyText: JSON.stringify(payoutMethodsResponse.json),
        payload: payoutMethodsResponse.json,
      }
    }

    const payoutMethods = payoutMethodsResponse.json.data.payOutMethods

    const requestedPayout = request.payout_method && request.payout_method !== 'other'
      ? request.payout_method
      : null

    const payoutCandidates = [...payoutMethods]
    if (requestedPayout) {
      payoutCandidates.sort((left, right) => {
        const leftMapped = payoutMethodMap[left.code] ?? left.code.toLowerCase()
        const rightMapped = payoutMethodMap[right.code] ?? right.code.toLowerCase()
        const leftScore = leftMapped === requestedPayout ? 0 : 1
        const rightScore = rightMapped === requestedPayout ? 0 : 1
        return leftScore - rightScore
      })
    }

    let selectedPayoutMethod = payoutCandidates[0]
    let calculationResponse: { status: number; json: GraphQLResponse<CreateCalculationResponse> } | null = null

    for (const candidate of payoutCandidates) {
      const payoutMethodCode = candidate.code
      const correspondentId = candidate.correspondents?.[0]?.id ?? ''

      const response = await executeGraphQL<CreateCalculationResponse>(
        'createCalculation',
        CREATE_CALCULATION_MUTATION,
        {
          amount: request.send_amount,
          type: 'SEND',
          sendCountryCode: sendCountry,
          sendCurrencyCode: sendCurrency,
          receiveCountryCode: receiveCountry,
          receiveCurrencyCode: receiveCurrency,
          payOutMethodCode: payoutMethodCode,
          correspondentId,
        },
        baseOptions,
      )

      calculationResponse = response
      const calculation = response.json.data?.createCalculation?.calculation
      const errors = response.json.data?.createCalculation?.errors
      if (!response.json.errors && calculation && (!errors || errors.length === 0)) {
        selectedPayoutMethod = candidate
        break
      }
    }

    if (!calculationResponse) {
      return {
        status: payoutMethodsResponse.status,
        bodyText: JSON.stringify(payoutMethodsResponse.json),
        payload: payoutMethodsResponse.json,
      }
    }

    if (calculationResponse.json.errors) {
      return {
        status: calculationResponse.status,
        bodyText: JSON.stringify(calculationResponse.json),
        payload: calculationResponse.json,
      }
    }

    const mappedPayoutMethod = payoutMethodMap[selectedPayoutMethod.code] ?? 'other'

    const combinedPayload = {
      payoutMethods: payoutMethodsResponse.json.data,
      calculation: calculationResponse.json.data,
      mappedPayoutMethod,
      selectedPayoutMethod,
    }

    return {
      status: calculationResponse.status,
      bodyText: JSON.stringify(combinedPayload),
      payload: combinedPayload,
    }
  } catch (error) {
    throw new Error(`WorldRemit fetch error: ${(error as Error).message}`)
  }
}
