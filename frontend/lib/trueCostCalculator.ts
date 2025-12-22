import type { TrueCostBreakdown, MarketDepth, BankComparisonData } from '~/types/remit'

export function calculateSpreadBps(midMarketRate: number, providerRate: number): number {
  if (midMarketRate === 0) return 0
  const spread = (midMarketRate - providerRate) / midMarketRate
  return Math.round(spread * 10000)
}

export function calculateSpreadPercent(midMarketRate: number, providerRate: number): number {
  if (midMarketRate === 0) return 0
  return ((midMarketRate - providerRate) / midMarketRate) * 100
}

export function calculateHiddenMarkup(
  amount: number,
  midMarketRate: number,
  providerRate: number
): number {
  if (midMarketRate === 0) return 0
  const midMarketReceive = amount * midMarketRate
  const providerReceive = amount * providerRate
  const lossInRecvCurrency = midMarketReceive - providerReceive
  const lossInSendCurrency = lossInRecvCurrency / midMarketRate
  return Math.round(lossInSendCurrency * 100) / 100
}

export function calculateTrueCost(upfrontFee: number, hiddenMarkup: number): number {
  return Math.round((upfrontFee + hiddenMarkup) * 100) / 100
}

export function calculateTotalCostPercent(totalCost: number, amount: number): number {
  if (amount === 0) return 0
  return Math.round((totalCost / amount) * 10000) / 100
}

export function calculateDelta(providerCost: number, bestCost: number): number {
  return Math.round((providerCost - bestCost) * 100) / 100
}

export function calculateDeltaPercent(delta: number, amount: number): number {
  if (amount === 0) return 0
  return Math.round((delta / amount) * 10000) / 100
}

export function buildTrueCostBreakdown(
  amount: number,
  upfrontFee: number,
  midMarketRate: number,
  providerRate: number,
  bestTotalCost: number = 0
): TrueCostBreakdown {
  const hiddenMarkup = calculateHiddenMarkup(amount, midMarketRate, providerRate)
  const hiddenMarkupPercent = calculateSpreadPercent(midMarketRate, providerRate)
  const totalCost = calculateTrueCost(upfrontFee, hiddenMarkup)
  const totalCostPercent = calculateTotalCostPercent(totalCost, amount)
  const spreadBps = calculateSpreadBps(midMarketRate, providerRate)
  const deltaFromBest = calculateDelta(totalCost, bestTotalCost)
  const deltaPercent = calculateDeltaPercent(deltaFromBest, amount)

  return {
    upfrontFee,
    hiddenMarkup,
    hiddenMarkupPercent: Math.round(hiddenMarkupPercent * 100) / 100,
    totalCost,
    totalCostPercent,
    deltaFromBest,
    deltaPercent,
    midMarketRate,
    providerRate,
    spreadBps,
  }
}

export function buildMarketDepth(
  providers: Array<{ name: string; rate: number }>
): MarketDepth {
  if (providers.length === 0) {
    return {
      bestRate: 0,
      bestProvider: '',
      secondBestRate: 0,
      secondBestProvider: '',
      medianRate: 0,
      worstRate: 0,
      worstProvider: '',
      spreadRange: 0,
      spreadRangeBps: 0,
      providerCount: 0,
    }
  }

  const sorted = [...providers].sort((a, b) => b.rate - a.rate)
  const best = sorted[0]
  const secondBest = sorted[1] || sorted[0]
  const worst = sorted[sorted.length - 1]
  
  const rates = sorted.map(p => p.rate)
  const midIndex = Math.floor(rates.length / 2)
  const medianRate = rates.length % 2 === 0
    ? (rates[midIndex - 1] + rates[midIndex]) / 2
    : rates[midIndex]

  const spreadRange = best.rate - worst.rate
  const spreadRangeBps = best.rate > 0
    ? Math.round((spreadRange / best.rate) * 10000)
    : 0

  return {
    bestRate: best.rate,
    bestProvider: best.name,
    secondBestRate: secondBest.rate,
    secondBestProvider: secondBest.name,
    medianRate,
    worstRate: worst.rate,
    worstProvider: worst.name,
    spreadRange: Math.round(spreadRange * 10000) / 10000,
    spreadRangeBps,
    providerCount: providers.length,
  }
}

export function buildBankComparison(
  amount: number,
  midMarketRate: number,
  bankRate: number,
  bankFee: number,
  bestSpecialistRate: number,
  bestSpecialistFee: number,
  bestSpecialistName: string
): BankComparisonData {
  const bankMarkup = calculateHiddenMarkup(amount, midMarketRate, bankRate)
  const bankTotalCost = calculateTrueCost(bankFee, bankMarkup)

  const bestSpecialistMarkup = calculateHiddenMarkup(amount, midMarketRate, bestSpecialistRate)
  const bestSpecialistTotalCost = calculateTrueCost(bestSpecialistFee, bestSpecialistMarkup)

  const savings = bankTotalCost - bestSpecialistTotalCost
  const savingsPercent = bankTotalCost > 0
    ? Math.round((savings / bankTotalCost) * 100)
    : 0

  return {
    bankMarkup: Math.round(bankMarkup * 100) / 100,
    bankFee,
    bankTotalCost: Math.round(bankTotalCost * 100) / 100,
    bestSpecialistMarkup: Math.round(bestSpecialistMarkup * 100) / 100,
    bestSpecialistFee,
    bestSpecialistTotalCost: Math.round(bestSpecialistTotalCost * 100) / 100,
    bestSpecialistName,
    savings: Math.round(savings * 100) / 100,
    savingsPercent,
  }
}

export function formatCurrency(value: number, currency: string = 'USD'): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    PHP: '₱',
    INR: '₹',
    MXN: '$',
    NGN: '₦',
  }
  const symbol = symbols[currency] || '$'
  return `${symbol}${value.toFixed(2)}`
}

export function formatBps(bps: number): string {
  return `${bps} bps`
}

export function formatPercent(percent: number): string {
  return `${percent.toFixed(2)}%`
}

export function getCostSeverity(totalCostPercent: number): 'low' | 'medium' | 'high' | 'extreme' {
  if (totalCostPercent < 1) return 'low'
  if (totalCostPercent < 2) return 'medium'
  if (totalCostPercent < 4) return 'high'
  return 'extreme'
}

export function getMarkupSeverity(spreadBps: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (spreadBps < 50) return 'excellent'
  if (spreadBps < 100) return 'good'
  if (spreadBps < 200) return 'fair'
  return 'poor'
}

