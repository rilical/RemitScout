import { resolveAlansariDestination } from './supported-corridors'

const normalizeToken = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')

const payinMethodMap: Record<string, string> = {
  bank_transfer: 'bank_transfer',
  banktransfer: 'bank_transfer',
  bank: 'bank_transfer',
  transfer: 'bank_transfer',
}

const payoutMethodMap: Record<string, string> = {
  bank_deposit: 'bank_deposit',
  bank: 'bank_deposit',
  transfer: 'bank_deposit',
  bank_transfer: 'bank_deposit',
  cash_pickup: 'cash_pickup',
  cashpickup: 'cash_pickup',
  cash: 'cash_pickup',
}

const payoutMethodToTransferType: Record<string, string> = {
  cash_pickup: 'CP',
  bank_deposit: 'BT',
}

export const normalizeMethodToken = (value?: string | null): string => {
  if (!value) return ''
  return normalizeToken(value)
}

export const mapPayinMethod = (value?: string | null): string => {
  if (!value) return 'other'
  const token = normalizeMethodToken(value)
  if (!token) return 'other'
  return payinMethodMap[token] ?? 'other'
}

export const mapPayoutMethod = (value?: string | null): string => {
  if (!value) return 'other'
  const token = normalizeMethodToken(value)
  if (!token) return 'other'
  return payoutMethodMap[token] ?? 'other'
}

export const resolveTransferType = (method?: string | null): string => {
  if (!method) return payoutMethodToTransferType.bank_deposit
  const token = normalizeMethodToken(method)
  return payoutMethodToTransferType[token] ?? payoutMethodToTransferType.bank_deposit
}

export const resolveDestination = (country: string, currency: string) => {
  return resolveAlansariDestination(country, currency)
}

export const ALANSARI_SOURCE_CURRENCY_ID = 91
