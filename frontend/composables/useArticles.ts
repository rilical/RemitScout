export const useArticles = () => {
  return useLazyAsyncData('articles', async () => {
    // Mock articles data
    return [
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
    ];
  });
};

export const useArticle = (slug: string) => {
  return useLazyAsyncData(`article-${slug}`, async () => {
    // Mock article data
    const articles = (await useArticles().data.value) || [];
    return articles.find(a => a.slug === slug) || null;
  });
};
