export const useOffers = () => {
  return useLazyAsyncData('offers', async () => {
    // Mock offers data
    return [
      {
        id: '1',
        provider: 'Wise',
        amount: 1000,
        fee: 4.5,
        rate: 1.1234,
        deliveryTime: '1-2 days',
        totalReceived: 1123.4,
      },
      {
        id: '2',
        provider: 'Western Union',
        amount: 1000,
        fee: 12.0,
        rate: 1.1156,
        deliveryTime: 'Minutes',
        totalReceived: 1115.6,
      },
      {
        id: '3',
        provider: 'Remitly',
        amount: 1000,
        fee: 5.0,
        rate: 1.12,
        deliveryTime: '1-3 days',
        totalReceived: 1120.0,
      },
    ];
  });
};
