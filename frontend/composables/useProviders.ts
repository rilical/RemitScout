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
        transferSpeed: 'Same day',
        countries: 80,
        featured: true,
        fees: '0.4%',
        speed: 'Instant',
        features: ['Transparent mid-market rates', 'Low transfer fees', 'Multi-currency accounts'],
        recentReviews: [
          { id: 1, rating: 5, author: 'Aisha', date: 'May 2025', comment: 'Clear pricing and easy to use.' },
          { id: 2, rating: 4, author: 'Carlos', date: 'Apr 2025', comment: 'Best for bank-to-bank transfers.' },
        ],
        rateTable: [
          { range: '$0-$500', fee: '$2.99', exchangeRate: 'Mid-market -0.35%', totalCost: 'Low' },
          { range: '$500-$2,000', fee: '$3.99', exchangeRate: 'Mid-market -0.30%', totalCost: 'Low' },
        ],
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
        features: ['Largest cash pickup network', 'Flexible pay-in methods'],
        recentReviews: [
          { id: 3, rating: 4, author: 'Maria', date: 'May 2025', comment: 'Reliable for cash pickup.' },
          { id: 4, rating: 3.5, author: 'Sam', date: 'Apr 2025', comment: 'Fees are higher but everywhere supports it.' },
        ],
        rateTable: [
          { range: '$0-$500', fee: '$8.99', exchangeRate: 'Mid-market -1.5%', totalCost: 'Medium' },
          { range: '$500-$2,000', fee: '$12.99', exchangeRate: 'Mid-market -1.2%', totalCost: 'Medium' },
        ],
      },
      {
        id: 'remitly',
        name: 'Remitly',
        slug: 'remitly',
        rating: 4.6,
        reviewCount: 45000,
        description: 'Send money internationally with great rates and fast delivery.',
        transferSpeed: 'Minutes–1 day',
        countries: 100,
        featured: true,
        fees: '0.5%',
        speed: 'Minutes–1 day',
        features: ['Fast cash pickup', 'Express vs. economy pricing', 'Wide payout options'],
        recentReviews: [
          { id: 5, rating: 4.5, author: 'Ravi', date: 'May 2025', comment: 'Awesome for UPI and cash in India.' },
          { id: 6, rating: 4, author: 'Lilibeth', date: 'Apr 2025', comment: 'Cash pickup in PH is quick.' },
        ],
        rateTable: [
          { range: '$0-$500', fee: '$3.99', exchangeRate: 'Mid-market -0.65%', totalCost: 'Low' },
          { range: '$500-$2,000', fee: '$5.99', exchangeRate: 'Mid-market -0.70%', totalCost: 'Low' },
        ],
      },
      {
        id: 'worldremit',
        name: 'WorldRemit',
        slug: 'worldremit',
        rating: 4.4,
        reviewCount: 38000,
        description: 'Mobile wallet and cash pickup coverage for 130+ countries.',
        transferSpeed: 'Minutes–hours',
        countries: 130,
        featured: false,
        fees: '$2-5',
        speed: 'Minutes–hours',
        features: ['Great mobile wallet reach', 'Transparent fees', 'Promo offers'],
        recentReviews: [
          { id: 7, rating: 4, author: 'Kwame', date: 'Apr 2025', comment: 'MTN Mobile Money delivery is fast.' },
          { id: 8, rating: 4.2, author: 'Ana', date: 'Mar 2025', comment: 'Good rates for small transfers.' },
        ],
        rateTable: [
          { range: '$0-$500', fee: '$2.99', exchangeRate: 'Mid-market -0.80%', totalCost: 'Low' },
          { range: '$500-$2,000', fee: '$3.99', exchangeRate: 'Mid-market -0.85%', totalCost: 'Medium' },
        ],
      },
      {
        id: 'moneygram',
        name: 'MoneyGram',
        slug: 'moneygram',
        rating: 4.0,
        reviewCount: 72000,
        description: 'Cash pickup giant with improving digital experience.',
        transferSpeed: 'Minutes–1 day',
        countries: 200,
        featured: false,
        fees: '$4-12',
        speed: 'Minutes–1 day',
        features: ['Broad agent network', 'Competitive first-transfer promos'],
        recentReviews: [
          { id: 9, rating: 3.8, author: 'Jorge', date: 'May 2025', comment: 'Works well for Mexico cash pickup.' },
          { id: 10, rating: 4.1, author: 'Fatima', date: 'Apr 2025', comment: 'Reliable but watch exchange rates.' },
        ],
        rateTable: [
          { range: '$0-$500', fee: '$4.99', exchangeRate: 'Mid-market -1.0%', totalCost: 'Medium' },
          { range: '$500-$2,000', fee: '$7.99', exchangeRate: 'Mid-market -0.95%', totalCost: 'Medium' },
        ],
      },
      {
        id: 'xoom',
        name: 'Xoom',
        slug: 'xoom',
        rating: 4.1,
        reviewCount: 56000,
        description: 'PayPal-backed transfers with strong cash pickup reach.',
        transferSpeed: 'Minutes–1 day',
        countries: 160,
        featured: false,
        fees: '$4-10',
        speed: 'Minutes–1 day',
        features: ['PayPal sign-in', 'Fast cash pickup', 'Card pay-in available'],
        recentReviews: [
          { id: 11, rating: 4.0, author: 'Emily', date: 'Apr 2025', comment: 'Great for quick cash to MX.' },
          { id: 12, rating: 3.9, author: 'Abdul', date: 'Mar 2025', comment: 'Card fees higher, bank is fine.' },
        ],
        rateTable: [
          { range: '$0-$500', fee: '$4.99', exchangeRate: 'Mid-market -1.2%', totalCost: 'Medium' },
          { range: '$500-$2,000', fee: '$6.99', exchangeRate: 'Mid-market -1.15%', totalCost: 'Medium' },
        ],
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
