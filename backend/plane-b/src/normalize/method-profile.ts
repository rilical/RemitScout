import { CanonicalPayinMethod, CanonicalPayoutMethod } from './canonical'

export type MethodProfile =
  | 'bank_to_bank'
  | 'card_to_bank'
  | 'bank_to_cash'
  | 'card_to_cash'
  | 'bank_to_wallet'
  | 'card_to_wallet'

const isCardPayin = (payin: CanonicalPayinMethod) =>
  payin === 'debit_card' ||
  payin === 'credit_card' ||
  payin === 'apple_pay' ||
  payin === 'google_pay'

export const deriveMethodProfile = (
  payin: CanonicalPayinMethod,
  payout: CanonicalPayoutMethod,
): MethodProfile | null => {
  const payinCategory = isCardPayin(payin) ? 'card' : payin === 'bank_transfer' ? 'bank' : 'other'
  const payoutCategory =
    payout === 'bank_deposit'
      ? 'bank'
      : payout === 'cash_pickup'
        ? 'cash'
        : payout === 'mobile_wallet'
          ? 'wallet'
          : 'other'

  if (payinCategory === 'bank' && payoutCategory === 'bank') return 'bank_to_bank'
  if (payinCategory === 'card' && payoutCategory === 'bank') return 'card_to_bank'
  if (payinCategory === 'bank' && payoutCategory === 'cash') return 'bank_to_cash'
  if (payinCategory === 'card' && payoutCategory === 'cash') return 'card_to_cash'
  if (payinCategory === 'bank' && payoutCategory === 'wallet') return 'bank_to_wallet'
  if (payinCategory === 'card' && payoutCategory === 'wallet') return 'card_to_wallet'
  return null
}
