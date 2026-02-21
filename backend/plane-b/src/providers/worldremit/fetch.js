"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchWorldRemitQuote = void 0;
const node_crypto_1 = require("node:crypto");
const http_client_1 = require("../../collectors/http-client");
const corridor_1 = require("../../../../shared/corridor");
const code_map_1 = require("./code-map");
const user_agent_1 = require("../../collectors/user-agent");
const graphqlEndpoint = 'https://api.worldremit.com/graphql';
const startPageUrl = 'https://www.worldremit.com/';
const mapCountry = (code) => code_map_1.countryCodeMap[code] ?? code;
const mapCurrency = (code) => code_map_1.currencyCodeMap[code] ?? code;
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
`;
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
`;
const executeGraphQL = async (operationName, query, variables, corridorId, options = {}) => {
    const requestId = (0, node_crypto_1.randomUUID)();
    const response = await (0, http_client_1.httpRequest)({
        url: graphqlEndpoint,
        method: 'POST',
        headers: {
            accept: 'application/json',
            'accept-language': 'en',
            'content-type': 'application/json',
            origin: 'https://www.worldremit.com',
            referer: startPageUrl,
            'user-agent': (0, user_agent_1.getUserAgentForCorridor)(corridorId),
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
    });
    return {
        status: response.status,
        bodyText: response.bodyText,
        json: response.json,
    };
};
const fetchWorldRemitQuote = async (request, options = {}) => {
    const { sourceCountry, destCountry, sourceCurrency, destCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const sendCountry = mapCountry(sourceCountry);
    const sendCurrency = mapCurrency(sourceCurrency);
    const receiveCountry = mapCountry(destCountry);
    const receiveCurrency = mapCurrency(destCurrency);
    const payoutMethodsResponse = await executeGraphQL('PayoutMethods', PAYOUT_METHODS_QUERY, {
        sendCountry,
        receiveCountry,
        receiveCurrency,
    }, request.corridor_id, options);
    if (!payoutMethodsResponse.json ||
        payoutMethodsResponse.json.errors ||
        !payoutMethodsResponse.json.data?.payOutMethods?.length) {
        return {
            status: payoutMethodsResponse.status,
            bodyText: payoutMethodsResponse.bodyText,
            payload: payoutMethodsResponse.json ?? payoutMethodsResponse.bodyText,
        };
    }
    const payoutMethods = payoutMethodsResponse.json.data.payOutMethods;
    const requestedPayout = request.payout_method && request.payout_method !== 'other'
        ? request.payout_method
        : null;
    const payoutCandidates = [...payoutMethods];
    if (requestedPayout) {
        payoutCandidates.sort((left, right) => {
            const leftMapped = code_map_1.payoutMethodMap[left.code] ?? left.code.toLowerCase();
            const rightMapped = code_map_1.payoutMethodMap[right.code] ?? right.code.toLowerCase();
            const leftScore = leftMapped === requestedPayout ? 0 : 1;
            const rightScore = rightMapped === requestedPayout ? 0 : 1;
            return leftScore - rightScore;
        });
    }
    let selectedPayoutMethod = payoutCandidates[0];
    let calculationResponse = null;
    for (const candidate of payoutCandidates) {
        const payoutMethodCode = candidate.code;
        const correspondentId = candidate.correspondents?.[0]?.id ?? '';
        const response = await executeGraphQL('createCalculation', CREATE_CALCULATION_MUTATION, {
            amount: request.send_amount,
            type: 'SEND',
            sendCountryCode: sendCountry,
            sendCurrencyCode: sendCurrency,
            receiveCountryCode: receiveCountry,
            receiveCurrencyCode: receiveCurrency,
            payOutMethodCode: payoutMethodCode,
            correspondentId,
        }, request.corridor_id, options);
        calculationResponse = response;
        const calculation = response.json?.data?.createCalculation?.calculation;
        const errors = response.json?.data?.createCalculation?.errors;
        if (!response.json?.errors && calculation && (!errors || errors.length === 0)) {
            selectedPayoutMethod = candidate;
            break;
        }
    }
    if (!calculationResponse) {
        return {
            status: payoutMethodsResponse.status,
            bodyText: payoutMethodsResponse.bodyText,
            payload: payoutMethodsResponse.json ?? payoutMethodsResponse.bodyText,
        };
    }
    if (calculationResponse.json?.errors) {
        return {
            status: calculationResponse.status,
            bodyText: calculationResponse.bodyText,
            payload: calculationResponse.json ?? calculationResponse.bodyText,
        };
    }
    if (!calculationResponse.json?.data) {
        return {
            status: calculationResponse.status,
            bodyText: calculationResponse.bodyText,
            payload: calculationResponse.json ?? calculationResponse.bodyText,
        };
    }
    const mappedPayoutMethod = code_map_1.payoutMethodMap[selectedPayoutMethod.code] ?? 'other';
    const combinedPayload = {
        payoutMethods: payoutMethodsResponse.json.data,
        calculation: calculationResponse.json.data,
        mappedPayoutMethod,
        selectedPayoutMethod,
    };
    return {
        status: calculationResponse.status,
        bodyText: calculationResponse.bodyText,
        payload: combinedPayload,
    };
};
exports.fetchWorldRemitQuote = fetchWorldRemitQuote;
