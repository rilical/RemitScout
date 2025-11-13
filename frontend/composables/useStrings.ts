export const useStrings = () => {
  const STR = {
    hero: {
      h1: 'Send more home, pay less in fees.',
      sub: 'Compare live rates, fees and delivery speed from 30+ licensed providers. Find the best way to support your family abroad.',
      cta: 'Compare 30+ providers',
      pill: 'Typical savings vs bank last month: 3–9%. Estimates based on fees + exchange margin.',
      micro: 'Secure & private • No spam • Switching is free'
    },
    stickyBar: { 
      cta: 'Compare', 
      changeRoute: 'Change route' 
    },
    corridors: {
      title: 'Popular with expats near you',
      note: 'Fees and times vary by amount and payout method.'
    },
    explainer: {
      title: 'Bank vs specialist providers (today)',
      tooltip: 'Exchange margin is the hidden mark‑up vs the mid‑market rate. We compare total cost (fees + margin).',
      disclaimer: 'Rates are indicative. Always check the live quote before sending.'
    },
    trust: {
      title: 'Trust & independence',
      bullets: [
        'Independent & unbiased. Our rankings are based on total cost and speed, providers can\'t pay to improve placement.',
        'Real‑time data. Quotes are refreshed around the clock and reflect fees + exchange margins.',
        'Secure & private. We never sell your personal data.',
        'Expat‑focused support. Help choosing the safest, quickest option for your family.'
      ],
      badgeCaption: 'Regulation applies to providers. We don\'t handle your money.'
    },
    methodology: {
      h2: 'How Remit-Scout makes money',
      lines: [
        'Remit-Scout is free to use. We compare providers independently and rank by total cost to you and delivery speed.',
        'We may earn a referral fee if you choose a provider via our links, we might receive a commission at no extra cost to you.',
        'No pay‑to‑rank. Providers cannot pay us to rank higher; we publish our methodology.'
      ],
      link: 'Read our full methodology',
      close: 'Got it'
    },
    providers: {
      title: 'Compare providers for your route',
      filterLabel: 'Filter',
      sortLabel: 'Sort by',
      disclosure: 'We may earn a commission if you choose a provider, this never affects ranking.'
    },
    alerts: {
      title: 'Get rate alerts',
      sub: 'We\'ll email you when the rate hits your target so you can send more for less.',
      emailPH: 'you@example.com',
      ratePH: 'e.g., PHP 57.00 per USD',
      weekly: 'Also send a weekly digest',
      cta: 'Create alert',
      success: 'Alert created. We\'ll email you when the rate reaches your target. You can unsubscribe anytime.'
    },
    testimonials: { 
      title: 'What expats say about Remit-Scout',
      note: 'Individual results vary by provider, amount and timing.'
    },
    stats: {
      title: 'Built for expats who send money often',
      items: [
        '50,000+ users served', 
        '2.5M+ in transfers analyzed', 
        '30+ providers compared', 
        '150 countries covered'
      ],
      avgSavings: 'Average savings vs big banks: 3–9%',
      typicalSpeed: 'Typical delivery speed: 15 min – 1 day'
    },
    guides: { 
      title: 'Guides for your route', 
      more: 'Explore all guides →' 
    },
    countries: {
      title: 'Compare providers by country'
    },
    footer: {
      disclosure: 'Remit-Scout is an independent comparison service. We may earn a referral fee if you choose a provider via our links, this never affects our rankings. Providers are regulated in their operating regions. We do not handle your money.',
      copyright: `© ${new Date().getFullYear()} Remit-Scout. All rights reserved.`
    },
    notice: {
      text: 'Independent & free. Providers cannot buy better rankings.',
      link: 'How we make money'
    },
    formErrors: {
      required: 'This field is required.',
      amountMin: 'Enter an amount of at least 1',
      amountMax: 'For amounts above 10,000, some providers require extra verification.',
      invalidEmail: 'Enter a valid email address.',
      invalidRate: 'Enter a valid rate.',
      unsupportedCorridor: 'We don\'t have quotes for this route yet. Try Bank or Cash pickup.'
    },
    tooltips: {
      amount: 'We\'ll include fees + exchange margin to show the total cost.',
      method: 'Delivery time and fees depend on payout method.'
    }
  };

  return { STR };
};


