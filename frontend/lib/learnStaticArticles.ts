export type LearnStaticArticle = {
  slug: string
  title: string
  excerpt: string
  categoryKey: string
  readTime: string
  level: string
  lastUpdated: string
}

// Canonical list of Vue-based Learn guides. Keep this in sync with actual pages under `frontend/pages/learn/*`.
export const LEARN_STATIC_ARTICLES: LearnStaticArticle[] = [
  {
    slug: 'why-compare-before-every-transfer',
    title: 'Why You Must Compare Before Every Transfer',
    excerpt: 'Even on the same transfer, the difference between providers can be hundreds of dollars. Here\'s why you must compare before every transfer.',
    categoryKey: 'money-transfer-basics',
    readTime: '5 min read',
    level: 'Beginner',
    lastUpdated: 'December 2024',
  },
  {
    slug: 'hidden-exchange-rate-fees-explained',
    title: 'Hidden Fees Explained<br><span class="text-body font-normal">(FX Markup vs Fee)</span>',
    excerpt: 'Learn the difference between FX markup and transfer fees, and why "no fee" doesn\'t mean no cost.',
    categoryKey: 'fees-hidden-costs',
    readTime: '6 min read',
    level: 'Intermediate',
    lastUpdated: 'December 2024',
  },
  {
    slug: 'how-exchange-rates-work',
    title: 'How Exchange Rates Work<br><span class="text-body font-normal">(and why they change)</span>',
    excerpt: 'Mid-market vs send rate, FX spreads, and the levers that move your transfer price.',
    categoryKey: 'exchange-rates-timing',
    readTime: '6 min read',
    level: 'Beginner',
    lastUpdated: 'December 2024',
  },
  {
    slug: 'how-to-read-remittance-quote',
    title: 'How to Read a Quote<br><span class="text-body font-normal">("Recipient Gets")</span>',
    excerpt: 'Understand what "Recipient Gets" really means and how to compare quotes effectively.',
    categoryKey: 'money-transfer-basics',
    readTime: '5 min read',
    level: 'Beginner',
    lastUpdated: 'December 2024',
  },
  {
    slug: 'why-checkout-price-differs',
    title: 'Why Checkout Differs<br><span class="text-body font-normal">and What to Do</span>',
    excerpt: 'Why the final price at checkout might differ from the quote, and what you can do about it.',
    categoryKey: 'fees-hidden-costs',
    readTime: '4 min read',
    level: 'Beginner',
    lastUpdated: 'December 2024',
  },
  {
    slug: 'bank-transfer-vs-card-vs-cash-pickup',
    title: 'Bank Transfer vs Card vs Cash Pickup',
    excerpt: 'Compare different transfer methods: bank transfer, card payment, and cash pickup options.',
    categoryKey: 'money-transfer-basics',
    readTime: '7 min read',
    level: 'Beginner',
    lastUpdated: 'December 2024',
  },
  {
    slug: 'bank-transfer-vs-card-funding',
    title: 'Bank Transfer vs Card Funding: Which Is Cheaper (and When)?',
    excerpt: 'Understand when bank transfer funding is cheaper than card funding, and when speed matters more than cost.',
    categoryKey: 'money-transfer-basics',
    readTime: '6 min read',
    level: 'Beginner',
    lastUpdated: 'December 2024',
  },
  {
    slug: 'choose-right-delivery-method',
    title: 'Choose the Right Delivery Method: Bank Deposit vs Cash Pickup vs Mobile Money',
    excerpt: 'Learn which payout method works best for your needs: bank deposit, cash pickup, or mobile money.',
    categoryKey: 'money-transfer-basics',
    readTime: '7 min read',
    level: 'Beginner',
    lastUpdated: 'December 2024',
  },
  {
    slug: 'how-fast-is-international-money-transfer',
    title: 'How Long Transfers Take (Speed Buckets)',
    excerpt: 'Understand transfer speed buckets: instant, same-day, next-day, and multi-day transfers.',
    categoryKey: 'speed-delivery',
    readTime: '5 min read',
    level: 'Beginner',
    lastUpdated: 'December 2024',
  },
  {
    slug: 'best-time-to-send-money',
    title: 'Best Time to Send Money',
    excerpt: 'Practical guidance on when to send money, without over-optimizing for rate movements.',
    categoryKey: 'exchange-rates-timing',
    readTime: '6 min read',
    level: 'Intermediate',
    lastUpdated: 'December 2024',
  },
  {
    slug: 'promo-codes-intro-rates',
    title: 'Promo Rates and "$0 Fee" Traps',
    excerpt: 'Understand promotional rates, introductory offers, and "$0 fee" marketing traps.',
    categoryKey: 'fees-hidden-costs',
    readTime: '5 min read',
    level: 'Intermediate',
    lastUpdated: 'December 2024',
  },
]
