import { useTelemetry } from '~/composables/useTelemetry'

export type AffiliateClickInput = {
  providerId: string
  targetUrl: string
  corridorId?: string
  quotedRate?: number
  quotedFee?: number
  offerId?: string
  source?: string
}

export type AffiliateConversionInput = {
  providerId: string
  corridorId?: string
  amount?: number
  currency?: string
  offerId?: string
  source?: string
}

export const useAffiliate = () => {
  const { trackClick, trackConversion } = useTelemetry()

  const trackAffiliateClick = async (input: AffiliateClickInput) => {
    await trackClick({
      provider_id: input.providerId,
      corridor_id: input.corridorId,
      target_url: input.targetUrl,
      quoted_rate: input.quotedRate,
      quoted_fee: input.quotedFee,
      is_affiliate: true,
      utm: input.offerId ? { affiliate_offer_id: input.offerId } : undefined,
    })
  }

  const trackAffiliateConversion = async (input: AffiliateConversionInput) => {
    await trackConversion({
      provider_id: input.providerId,
      corridor_id: input.corridorId,
      conversion_value: input.amount,
      conversion_currency: input.currency,
      offer_id: input.offerId,
      source: input.source,
    })
  }

  return {
    trackClick: trackAffiliateClick,
    trackConversion: trackAffiliateConversion,
  }
}
