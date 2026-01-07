import { randomUUID } from 'node:crypto'

import type { CollectorRequest, FetchResult } from '../../collectors/types'
import { httpRequest } from '../../collectors/http-client'
import type { ProxyTier } from '../../lib/proxy-router'
import { requireCorridorId } from '../../../../shared/corridor'
import { countryCodeMap, currencyCodeMap, payoutMethodMap } from './code-map'
import { getUserAgentForCorridor } from '../../collectors/user-agent'

const graphqlEndpoint = 'https://api.worldremit.com/graphql'
const startPageUrl = 'https://www.worldremit.com/'

const mapCountry = (code: string) => countryCodeMap[code] ?? code
const mapCurrency = (code: string) => currencyCodeMap[code] ?? code

type FetchOptions = {
  jitterMs?: number
  proxyTier?: ProxyTier
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
  corridorId: string,
  options: FetchOptions = {},
): Promise<{ status: number; bodyText: string; json: GraphQLResponse<T> | null }> => {
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
      'user-agent': getUserAgentForCorridor(corridorId),
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
    corridorId,
  })

  return {
    status: response.status,
    bodyText: response.bodyText,
    json: response.json as GraphQLResponse<T> | null,
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

  const payoutMethodsResponse = await executeGraphQL<PayoutMethodsResponse>(
    'PayoutMethods',
    PAYOUT_METHODS_QUERY,
    {
      sendCountry,
      receiveCountry,
      receiveCurrency,
    },
    request.corridor_id,
    options,
  )

  if (
    !payoutMethodsResponse.json ||
    payoutMethodsResponse.json.errors ||
    !payoutMethodsResponse.json.data?.payOutMethods?.length
  ) {
    return {
      status: payoutMethodsResponse.status,
      bodyText: payoutMethodsResponse.bodyText,
      payload: payoutMethodsResponse.json ?? payoutMethodsResponse.bodyText,
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
  let calculationResponse: {
    status: number
    bodyText: string
    json: GraphQLResponse<CreateCalculationResponse> | null
  } | null = null

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
      request.corridor_id,
      options,
    )

    calculationResponse = response
    const calculation = response.json?.data?.createCalculation?.calculation
    const errors = response.json?.data?.createCalculation?.errors
    if (!response.json?.errors && calculation && (!errors || errors.length === 0)) {
      selectedPayoutMethod = candidate
      break
    }
  }

  if (!calculationResponse) {
    return {
      status: payoutMethodsResponse.status,
      bodyText: payoutMethodsResponse.bodyText,
      payload: payoutMethodsResponse.json ?? payoutMethodsResponse.bodyText,
    }
  }

  if (calculationResponse.json?.errors) {
    return {
      status: calculationResponse.status,
      bodyText: calculationResponse.bodyText,
      payload: calculationResponse.json ?? calculationResponse.bodyText,
    }
  }

  if (!calculationResponse.json?.data) {
    return {
      status: calculationResponse.status,
      bodyText: calculationResponse.bodyText,
      payload: calculationResponse.json ?? calculationResponse.bodyText,
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
    bodyText: calculationResponse.bodyText,
    payload: combinedPayload,
  }
}
