export const useArticles = () => {
  return useLazyAsyncData('articles', async () => {
    // Mock articles data
    const articles = [
      {
        slug: 'how-exchange-rates-work',
        title: 'How Exchange Rates Work',
        excerpt:
          'Understanding how currency exchange rates are determined and how they affect your transfers.',
        category: 'Basics',
        readTime: '5 min read',
        author: 'Remit-Scout Team',
        date: '2024-01-15',
        content:
          '<p>Exchange rates determine how much of one currency you can get for another...</p>',
        lastUpdated: 'January 15, 2024',
        helpfulCount: 1250,
        relatedArticles: [
          {
            slug: 'best-time-to-send-money',
            title: 'Best Time to Send Money',
            excerpt: 'When is the optimal time to make international transfers.',
          },
          {
            slug: 'hidden-fees-money-transfers',
            title: 'Hidden Fees in Money Transfers',
            excerpt: 'Learn about the different types of fees and how to avoid them.',
          },
        ],
      },
      {
        slug: 'hidden-fees-money-transfers',
        title: 'Hidden Fees in Money Transfers',
        excerpt: 'Learn about the different types of fees and how to avoid paying more than necessary.',
        category: 'Fees',
        readTime: '7 min read',
        author: 'Financial Expert',
        date: '2024-01-10',
        content:
          '<p>Transfer fees, FX markups, and receiving fees all impact what arrives. Here’s how to spot and avoid them.</p>',
        lastUpdated: 'February 2, 2024',
        helpfulCount: 840,
        relatedArticles: [
          { slug: 'how-exchange-rates-work', title: 'How Exchange Rates Work', excerpt: 'Mid-market vs. provider rates explained.' },
          { slug: 'avoid-hidden-fees', title: 'Avoid hidden fees in international transfers', excerpt: 'Checklist before you send.' },
        ],
      },
      {
        slug: 'best-time-to-send-money',
        title: 'Best Time to Send Money Internationally',
        excerpt: 'When is the optimal time to make international transfers for maximum value.',
        category: 'Strategy',
        readTime: '4 min read',
        author: 'Market Analyst',
        date: '2024-01-08',
        content: '<p>We break down volatility windows, weekend effects, and provider cut-off times.</p>',
        lastUpdated: 'March 10, 2024',
        helpfulCount: 420,
        relatedArticles: [
          { slug: 'usd-php-exchange-rate-guide', title: 'USD→PHP rate watch guide', excerpt: 'How to time remittances to the Philippines.' },
        ],
      },
      {
        slug: 'best-ways-send-money-philippines',
        title: 'Best ways to send money to the Philippines (2025)',
        excerpt: 'Fees, exchange margins and speed compared, bank, cash and mobile wallet.',
        category: 'Country Guide',
        readTime: '7 min read',
        author: 'Remit-Scout Editorial Team',
        date: '2025-05-05',
        content: '<p>We benchmark top providers on price, payout methods, and delivery for US→PH.</p>',
        lastUpdated: 'May 5, 2025',
        helpfulCount: 1090,
        relatedArticles: [
          { slug: 'wise-remitly-western-union-review', title: 'Full review: Wise vs Remitly vs Western Union', excerpt: 'Who tops US→PH transfers?' },
          { slug: 'usd-php-exchange-rate-guide', title: 'USD→PHP rate watch guide', excerpt: 'Keep more pesos in every transfer.' },
        ],
      },
      {
        slug: 'wise-vs-remitly-vs-worldremit',
        title: 'Wise vs Remitly vs WorldRemit for US→PH',
        excerpt: 'Which pays out more for $500? We tested fees, rates and delivery.',
        category: 'Comparison',
        readTime: '6 min read',
        author: 'Product Tester',
        date: '2025-05-07',
        content: '<p>Side-by-side results for bank vs. cash pickup, including promo code fine print.</p>',
        lastUpdated: 'May 7, 2025',
        helpfulCount: 690,
        relatedArticles: [
          { slug: 'best-ways-send-money-philippines', title: 'Best ways to send money to the Philippines (2025)', excerpt: 'Full corridor rundown.' },
        ],
      },
      {
        slug: 'avoid-hidden-fees',
        title: 'Avoid hidden fees in international transfers',
        excerpt: 'Spot exchange mark-ups and keep more in every transfer.',
        category: 'Money Saving',
        readTime: '5 min read',
        author: 'Remit-Scout Team',
        date: '2025-05-01',
        content: '<p>Checklist of what to review before sending, plus providers with transparent pricing.</p>',
        lastUpdated: 'May 1, 2025',
        helpfulCount: 560,
        relatedArticles: [
          { slug: 'hidden-fees-money-transfers', title: 'Hidden Fees in Money Transfers', excerpt: 'Deep dive on each fee type.' },
        ],
      },
      {
        slug: 'cash-pickup-vs-bank-deposit',
        title: 'Cash pickup vs bank deposit: what’s faster?',
        excerpt: 'When cash pickup beats bank, plus safety checks for your recipient.',
        category: 'How To',
        readTime: '4 min read',
        author: 'Service Operations',
        date: '2025-05-03',
        content: '<p>Speed trade-offs, ID requirements, and when to pick each payout option.</p>',
        lastUpdated: 'May 3, 2025',
        helpfulCount: 380,
        relatedArticles: [
          { slug: 'wise-vs-remitly-vs-worldremit', title: 'Wise vs Remitly vs WorldRemit for US→PH', excerpt: 'Cash vs. bank experiments.' },
        ],
      },
      {
        slug: 'send-money-us-to-india-guide',
        title: 'US → India corridor playbook',
        excerpt: 'UPI vs bank deposits, FX markups, and promo codes compared.',
        category: 'Country Guide',
        readTime: '6 min read',
        author: 'Remit-Scout Editorial Team',
        date: '2025-05-08',
        content: '<p>We reviewed UPI speed, NEFT cut-offs, and the cheapest fees for popular USD amounts.</p>',
        lastUpdated: 'May 8, 2025',
        helpfulCount: 540,
        relatedArticles: [
          { slug: 'wise-remitly-western-union-review', title: 'Full review: Wise vs Remitly vs Western Union', excerpt: 'Matchups for India.' },
        ],
      },
      {
        slug: 'wise-remitly-western-union-review',
        title: 'Full review: Wise vs Remitly vs Western Union',
        excerpt: 'Which provider wins on fees, rates, speed, and trust scores.',
        category: 'Comparison',
        readTime: '8 min read',
        author: 'Product Tester',
        date: '2025-05-06',
        content: '<p>We stack promo pricing, FX spreads, pay-in options, and payout coverage head to head.</p>',
        lastUpdated: 'May 6, 2025',
        helpfulCount: 610,
        relatedArticles: [
          { slug: 'best-ways-send-money-philippines', title: 'Best ways to send money to the Philippines', excerpt: 'When to switch providers.' },
        ],
      },
      {
        slug: 'travel-insurance',
        title: 'Travel insurance for frequent senders',
        excerpt: 'Cover trips while you visit family abroad—medical, baggage, and delay.',
        category: 'Travel',
        readTime: '5 min read',
        author: 'Remit-Scout Team',
        date: '2025-05-02',
        content: '<p>What remitters should look for in travel insurance, including medical limits and exclusions.</p>',
        lastUpdated: 'May 2, 2025',
        helpfulCount: 310,
        relatedArticles: [
          { slug: 'international-esim-checklist', title: 'International eSIM setup checklist', excerpt: 'Stay connected on your trip.' },
        ],
      },
      {
        slug: 'international-esim-checklist',
        title: 'International eSIM setup checklist',
        excerpt: 'Stay connected abroad without roaming; best-value providers to try.',
        category: 'Travel Tech',
        readTime: '4 min read',
        author: 'Travel Writer',
        date: '2025-05-04',
        content: '<p>Device readiness, activation steps, and starter plans we recommend for 190+ countries.</p>',
        lastUpdated: 'May 4, 2025',
        helpfulCount: 270,
        relatedArticles: [
          { slug: 'travel-insurance', title: 'Travel insurance for frequent senders', excerpt: 'Pair coverage with connectivity.' },
        ],
      },
      {
        slug: 'usd-php-exchange-rate-guide',
        title: 'USD→PHP rate watch guide',
        excerpt: 'Track live rates, avoid hidden margins, and time your transfers.',
        category: 'Exchange Rates',
        readTime: '5 min read',
        author: 'FX Analyst',
        date: '2025-05-05',
        content: '<p>Learn how to read mid-market vs. send rate, weekend spreads, and the best times to send to PH.</p>',
        lastUpdated: 'May 5, 2025',
        helpfulCount: 350,
        relatedArticles: [
          { slug: 'best-time-to-send-money', title: 'Best Time to Send Money Internationally', excerpt: 'Timing strategies that work.' },
        ],
      },
    ];

    return articles;
  });
};

export const useArticle = (slug: string) => {
  return useLazyAsyncData(`article-${slug}`, async () => {
    // Mock article data
    const articles = (await useArticles().data.value) || [];
    return articles.find(a => a.slug === slug) || null;
  });
};
