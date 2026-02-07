export function formatMoney(
  amount: number,
  opts: { currency: string, locale?: string, maximumFractionDigits?: number },
): string {
  const locale = opts.locale ?? 'en-US'
  const currency = opts.currency

  try {
    const nf = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      ...(opts.maximumFractionDigits !== undefined
        ? {
            minimumFractionDigits: opts.maximumFractionDigits,
            maximumFractionDigits: opts.maximumFractionDigits,
          }
        : {}),
    })

    return nf.format(amount)
  }
  catch {
    return `${currency} ${String(amount)}`
  }
}
