import { WESTERNUNION_HEALTH_CORRIDORS } from '../shared/westernunion-corridors'
import { fetchWesternUnionQuote } from '../plane-b/src/providers/westernunion/fetch'
import { extractWesternUnionMethodPairs } from '../plane-b/src/providers/westernunion/parse'

type MethodSnapshot = {
  fundIns: Set<string>
  services: Set<string>
  serviceNames: Set<string>
  payoutMnemonics: Set<string>
  methodPairs: Set<string>
  promoKeys: Set<string>
}

const collectPromoKeys = (payload: Record<string, unknown>, snapshot: MethodSnapshot) => {
  const services = (payload.services_groups as Array<Record<string, unknown>> | undefined) ?? []
  for (const service of services) {
    const payGroups = (service.pay_groups as Array<Record<string, unknown>> | undefined) ?? []
    for (const payGroup of payGroups) {
      for (const key of Object.keys(payGroup)) {
        const lowered = key.toLowerCase()
        if (lowered.includes('promo') || lowered.includes('discount')) {
          snapshot.promoKeys.add(key)
        }
      }
    }
  }
}

const main = async () => {
  const snapshot: MethodSnapshot = {
    fundIns: new Set(),
    services: new Set(),
    serviceNames: new Set(),
    payoutMnemonics: new Set(),
    methodPairs: new Set(),
    promoKeys: new Set(),
  }

  for (const corridorId of WESTERNUNION_HEALTH_CORRIDORS) {
    const request = {
      provider_id: 'westernunion',
      corridor_id: corridorId,
      amount_bucket: 100,
      payin_method: 'bank_transfer',
      payout_method: 'bank_deposit',
      send_amount: 100,
      locale: 'en-US',
    }

    const result = await fetchWesternUnionQuote(request, { forceAllPayins: true, jitterMs: 250 })
    if (result.status !== 200 || !result.payload || typeof result.payload !== 'object') {
      console.log(`[WU] ${corridorId} -> status=${result.status}`)
      continue
    }

    const payload = result.payload as Record<string, unknown>
    const services = (payload.services_groups as Array<Record<string, unknown>> | undefined) ?? []
    for (const service of services) {
      if (service.service) {
        snapshot.services.add(String(service.service))
      }
      if (service.service_name) {
        snapshot.serviceNames.add(String(service.service_name))
      }
      if (service.fund_out_mnem) {
        snapshot.payoutMnemonics.add(String(service.fund_out_mnem))
      }
      const payGroups = (service.pay_groups as Array<Record<string, unknown>> | undefined) ?? []
      for (const payGroup of payGroups) {
        if (payGroup.fund_in) {
          snapshot.fundIns.add(String(payGroup.fund_in))
        }
      }
    }

    collectPromoKeys(payload, snapshot)

    const pairs = extractWesternUnionMethodPairs(payload)
    for (const pair of pairs) {
      snapshot.methodPairs.add(`${pair.payin_method}:${pair.payout_method}`)
    }

    console.log(`[WU] ${corridorId} -> service_groups=${services.length}`)
  }

  console.log('\nWU Observation Summary')
  console.log('fund_in codes:', Array.from(snapshot.fundIns).sort())
  console.log('service codes:', Array.from(snapshot.services).sort())
  console.log('service names:', Array.from(snapshot.serviceNames).sort())
  console.log('fund_out mnemonics:', Array.from(snapshot.payoutMnemonics).sort())
  console.log('method pairs:', Array.from(snapshot.methodPairs).sort())
  console.log('promo keys:', Array.from(snapshot.promoKeys).sort())
}

main().catch((error) => {
  console.error('WU observation failed:', error)
  process.exit(1)
})
