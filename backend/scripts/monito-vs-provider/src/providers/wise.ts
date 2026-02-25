import { collectWithApi, type ProviderCollectorContext, type ProviderCollectorResult } from './base'

const findNumeric = (payload: unknown): ProviderCollectorResult => {
  if (!payload || typeof payload !== 'object') {
    return {
      effectiveRate: null,
      fee: null,
      totalReceived: null,
      payoutMethod: null,
      deliveryEstimate: null,
      raw: payload,
    }
  }

  const node = payload as Record<string, unknown>

  const candidateRate =
    node.rate
    || node.exchangeRate
    || node.midMarketRate
    || node.price
    || node.data?.rate
    || node.data?.result?.rate

  const feeNode =
    node.fee
    || node.data?.fee
    || node.pricing?.fee

  const totalNode =
    node.total
    || node.totalAmount
    || node.receivedAmount
    || node.targetAmount
    || node.targetAmountTo
    || node.receiveAmount
    || node.sourceAmount

  const parse = (value: unknown): number | null => {
    if (value === null || value === undefined) return null
    if (typeof value === 'number') return Number.isFinite(value) ? value : null
    const normalized = String(value).replace(/,/g, '').replace(/[^0-9.\-]/g, '')
    const parsed = Number.parseFloat(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }

  const maybeRate = parse(candidateRate)
  const maybeFee =
    parse(feeNode) ?? parse((feeNode as Record<string, unknown> | undefined)?.total)
    ?? parse((node.quote as Record<string, unknown> | undefined)?.fee)
  const maybeTotal =
    parse(totalNode)
    ?? parse((node.quote as Record<string, unknown> | undefined)?.receivedAmount)
    ?? parse((node.result as Record<string, unknown> | undefined)?.receivedAmount)

  const deliveryEstimate =
    typeof (node.deliveryEstimate as unknown) === 'string' ? String(node.deliveryEstimate) : null

  return {
    effectiveRate: maybeRate,
    fee: maybeFee,
    totalReceived: maybeTotal,
    payoutMethod: null,
    deliveryEstimate,
    raw: payload,
  }
}

export const collectWiseApi = async (context: ProviderCollectorContext): Promise<ReturnType<typeof collectWithApi>> => {
  return collectWithApi(context, findNumeric)
}
