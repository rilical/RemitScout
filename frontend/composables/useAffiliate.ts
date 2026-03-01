export const useAffiliate = () => {
  const trackClick = (_providerId: string, _offerId?: string) => {
    // TODO: Implement affiliate click tracking via server API
  }

  const trackConversion = (_providerId: string, _amount?: number) => {
    // TODO: Implement affiliate conversion tracking via server API
  }

  return {
    trackClick,
    trackConversion,
  }
}
