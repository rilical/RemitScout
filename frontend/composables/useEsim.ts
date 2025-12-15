import {
  esimPlans,
  travelTools,
  atmFeeData,
  getEsimPlansByCountry,
  getCheapestEsimPlan,
  getAtmFees,
  type EsimPlan,
  type TravelTool,
  type AtmFeeData,
} from '~/utils/esim-data'

export const useEsim = () => {
  const getAllEsimPlans = (): EsimPlan[] => {
    return esimPlans
  }

  const getEsimPlansForCountry = (countryCode: string): EsimPlan[] => {
    return getEsimPlansByCountry(countryCode)
  }

  const findCheapestPlan = (countryCode: string, minDays: number = 7): EsimPlan | undefined => {
    return getCheapestEsimPlan(countryCode, minDays)
  }

  const searchEsimPlans = (params: {
    country?: string
    minData?: number // in GB
    maxPrice?: number
    minDays?: number
  }): EsimPlan[] => {
    let results = [...esimPlans]

    if (params.country !== undefined) {
      results = results.filter(plan =>
        plan.countryCode === params.country!
        || plan.country.toLowerCase().includes(params.country!.toLowerCase()),
      )
    }

    if (params.minData !== undefined) {
      results = results.filter(plan => plan.dataGB >= params.minData!)
    }

    if (params.maxPrice !== undefined) {
      results = results.filter(plan => plan.price <= params.maxPrice!)
    }

    if (params.minDays !== undefined) {
      results = results.filter(plan => plan.duration >= params.minDays!)
    }

    return results.sort((a, b) => a.price - b.price)
  }

  const getPopularDestinations = (): Array<{ country: string, countryCode: string, planCount: number }> => {
    const destinations = new Map<string, { country: string, countryCode: string, count: number }>()

    esimPlans.forEach((plan) => {
      const key = plan.countryCode
      if (destinations.has(key)) {
        const dest = destinations.get(key)!
        dest.count++
      }
      else {
        destinations.set(key, {
          country: plan.country,
          countryCode: plan.countryCode,
          count: 1,
        })
      }
    })

    return Array.from(destinations.values())
      .map(d => ({ country: d.country, countryCode: d.countryCode, planCount: d.count }))
      .sort((a, b) => b.planCount - a.planCount)
      .slice(0, 6)
  }

  const getTravelTools = (): TravelTool[] => {
    return travelTools
  }

  const getAtmFeeInfo = (countryCode: string): AtmFeeData | undefined => {
    return getAtmFees(countryCode)
  }

  const calculateRoamingVsEsim = (params: {
    carrierDailyRate: number
    tripDays: number
    countryCode: string
  }): { roamingCost: number, esimCost: number, savings: number, recommendedPlan?: EsimPlan } => {
    const roamingCost = params.carrierDailyRate * params.tripDays
    const cheapestPlan = getCheapestEsimPlan(params.countryCode, params.tripDays)

    if (cheapestPlan) {
      const esimCost = cheapestPlan.price
      const savings = roamingCost - esimCost
      return {
        roamingCost,
        esimCost,
        savings,
        recommendedPlan: cheapestPlan,
      }
    }

    return {
      roamingCost,
      esimCost: 0,
      savings: 0,
    }
  }

  const formatDataAmount = (gb: number): string => {
    if (gb >= 999) return 'Unlimited'
    if (gb < 1) return `${gb * 1000}MB`
    return `${gb}GB`
  }

  return {
    getAllEsimPlans,
    getEsimPlansForCountry,
    findCheapestPlan,
    searchEsimPlans,
    getPopularDestinations,
    getTravelTools,
    getAtmFeeInfo,
    calculateRoamingVsEsim,
    formatDataAmount,
  }
}

