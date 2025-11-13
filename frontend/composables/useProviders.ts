export const useProviders = (filters?: any) => {
  return useLazyAsyncData('providers', async () => {
    // Mock providers data
    return [
      {
        id: 'wise',
        name: 'Wise',
        slug: 'wise',
        rating: 4.8,
        reviewCount: 125000,
        description: 'Fast, cheap international money transfers with real exchange rates.',
        transferSpeed: '1-2 days',
        countries: 80,
        featured: true,
        fees: '0.4%',
        speed: 'Instant',
      },
      {
        id: 'western-union',
        name: 'Western Union',
        slug: 'western-union',
        rating: 4.2,
        reviewCount: 89000,
        description: 'Global money transfer service with cash pickup options.',
        transferSpeed: 'Minutes',
        countries: 200,
        featured: false,
        fees: '$5-15',
        speed: 'Instant',
      },
      {
        id: 'remitly',
        name: 'Remitly',
        slug: 'remitly',
        rating: 4.6,
        reviewCount: 45000,
        description: 'Send money internationally with great rates and fast delivery.',
        transferSpeed: '1-3 days',
        countries: 100,
        featured: true,
        fees: '0.5%',
        speed: '1-3 days',
      },
    ];
  });
};

export const useProvider = (slug: string) => {
  return useLazyAsyncData(`provider-${slug}`, async () => {
    // Mock provider data
    const providers = (await useProviders().data.value) || [];
    return providers.find(p => p.slug === slug) || null;
  });
};
