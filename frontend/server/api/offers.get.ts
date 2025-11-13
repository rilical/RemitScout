export default defineEventHandler(async event => {
  const query = getQuery(event);

  // Mock offers data based on query parameters
  const offers = [
    {
      id: '1',
      provider: 'Wise',
      providerSlug: 'wise',
      amount: Number.parseFloat(query.amount as string) || 1000,
      fromCurrency: (query.from as string) || 'USD',
      toCurrency: (query.to as string) || 'EUR',
      fee: 4.5,
      exchangeRate: 0.85,
      deliveryTime: '1-2 business days',
      totalReceived: (Number.parseFloat(query.amount as string) || 1000) * 0.85 - 4.5,
      rating: 4.8,
      features: ['No hidden fees', 'Real exchange rate', 'Bank transfer'],
    },
    {
      id: '2',
      provider: 'Western Union',
      providerSlug: 'western-union',
      amount: Number.parseFloat(query.amount as string) || 1000,
      fromCurrency: (query.from as string) || 'USD',
      toCurrency: (query.to as string) || 'EUR',
      fee: 15.0,
      exchangeRate: 0.82,
      deliveryTime: 'Minutes',
      totalReceived: (Number.parseFloat(query.amount as string) || 1000) * 0.82 - 15.0,
      rating: 4.2,
      features: ['Cash pickup', 'Instant transfer', 'Global locations'],
    },
    {
      id: '3',
      provider: 'Remitly',
      providerSlug: 'remitly',
      amount: Number.parseFloat(query.amount as string) || 1000,
      fromCurrency: (query.from as string) || 'USD',
      toCurrency: (query.to as string) || 'EUR',
      fee: 2.99,
      exchangeRate: 0.84,
      deliveryTime: '1-3 business days',
      totalReceived: (Number.parseFloat(query.amount as string) || 1000) * 0.84 - 2.99,
      rating: 4.6,
      features: ['Express delivery', 'Mobile app', 'Great rates'],
    },
  ];

  return {
    offers,
    totalResults: offers.length,
    searchParams: query,
  };
});
