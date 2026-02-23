export const BRAND = {
  displayName: 'Remit-Scout',
  emails: {
    support: 'support@remit-scout.com',
    partnerships: 'partnership@remit-scout.com',
  },
  // Only set these when you have real, owned social URLs. Do not guess.
  social: {
    x: 'https://x.com/remitscout',
    facebook: 'https://www.facebook.com/remit.scout.global/',
    linkedin: 'https://www.linkedin.com/company/remit-scout/',
  },
} as const

export const BOILERPLATE = {
  independentComparison:
    'We are an independent comparison platform. Rankings and recommendations are data-driven and are not for sale.',
  notAMoneyTransmitter:
    'Remit-Scout is not a money transfer provider and does not move funds. Transfers are completed directly with licensed third-party providers.',
  affiliateDisclosureShort:
    'We may earn a commission when you click provider links. This does not affect rankings.',
  updatedFallback: 'Updated —',
} as const
