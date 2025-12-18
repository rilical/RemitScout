<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <Breadcrumbs :items="breadcrumbItems" />

      <div class="mx-auto max-w-6xl">
        <!-- Hero Section -->
        <div class="mb-8 rounded-lg bg-white p-8 shadow-md">
          <h1 class="mb-6 text-4xl font-bold text-gray-900">
            Get in touch with <span class="text-primary-600">Remit-Scout</span>
          </h1>
          <p class="mb-4 text-lg text-gray-600">
            Have questions about money transfers or need help choosing the right provider? We're
            here to help.
          </p>
          <p class="text-sm text-gray-500">
            Advertiser disclosure
          </p>
          <p class="mb-6 mt-4 text-gray-600">
            We are unfortunately not able to answer questions about your individual money transfers.
            Please refer to our frequently asked questions below or use the contact form for general
            inquiries.
          </p>

          <!-- Important Note -->
          <div class="mb-8 rounded-lg border-l-4 border-orange-500 bg-orange-50 p-4">
            <div class="flex">
              <svg
                class="mr-3 h-6 w-6 flex-shrink-0 text-orange-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
              <div>
                <p class="text-sm font-medium text-orange-800">
                  Please note that if you have a question about an ongoing transaction with a
                  provider recommended by Remit-Scout, the quickest way to get an answer is to
                  contact their support directly.
                </p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <!-- Contact Form -->
            <div class="text-gray-900">
              <h2 class="mb-6 text-2xl font-bold text-gray-900">
                Get in Touch
              </h2>

              <form class="space-y-6">
                <div>
                  <label
                    for="name"
                    class="mb-2 block text-sm font-medium text-gray-600"
                  >Name</label>
                  <input
                    id="name"
                    type="text"
                    class="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                </div>

                <div>
                  <label
                    for="email"
                    class="mb-2 block text-sm font-medium text-gray-600"
                  >Email</label>
                  <input
                    id="email"
                    type="email"
                    class="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                </div>

                <div>
                  <label
                    for="subject"
                    class="mb-2 block text-sm font-medium text-gray-600"
                  >Subject</label>
                  <select
                    id="subject"
                    class="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option class="text-gray-900">General Question</option>
                    <option class="text-gray-900">Provider Comparison</option>
                    <option class="text-gray-900">Technical Support</option>
                    <option class="text-gray-900">Partnership Inquiry</option>
                    <option class="text-gray-900">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    for="message"
                    class="mb-2 block text-sm font-medium text-gray-600"
                  >Message</label>
                  <textarea
                    id="message"
                    rows="6"
                    class="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <button
                  type="submit"
                  class="w-full rounded-md bg-brand-600 px-4 py-2 text-white font-semibold hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>

            <!-- Location & Resources -->
            <div>
              <h2 class="mb-6 text-2xl font-bold text-gray-900">
                Location
              </h2>

              <div class="mb-8 space-y-6">
                <div class="flex items-start">
                  <svg
                    class="mr-3 mt-1 h-6 w-6 flex-shrink-0 text-primary-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <div>
                    <h3 class="font-semibold text-gray-900">
                      Remit-Scout's Office
                    </h3>
                    <p class="mt-1 text-gray-600">
                      Remit-Scout's team is based in the
                      <button
                        type="button"
                        class="font-medium text-primary-600 hover:text-primary-700 underline"
                        @click="handleExternalLink('https://www.cmu.edu/swartz-center-for-entrepreneurship/')"
                      >
                        Swartz Center for Entrepreneurship
                      </button>
                      at Carnegie Mellon University.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Internal Links -->
              <div class="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
                <h3 class="mb-5 text-xl font-bold text-gray-900">
                  Explore Our Resources
                </h3>
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <NuxtLink
                    to="/learn/providers"
                    class="group relative flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div class="mb-2 flex items-center gap-3">
                      <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100">
                        <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div class="flex-1">
                        <span class="font-semibold text-gray-900 group-hover:text-primary-700">Provider Reviews</span>
                        <p class="mt-1 text-xs text-gray-600">Compare trusted money transfer services</p>
                      </div>
                    </div>
                    <svg
                      class="absolute right-4 top-4 h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-primary-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </NuxtLink>

                  <NuxtLink
                    to="/learn"
                    class="group relative flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div class="mb-2 flex items-center gap-3">
                      <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100">
                        <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div class="flex-1">
                        <span class="font-semibold text-gray-900 group-hover:text-primary-700">Learn Guides</span>
                        <p class="mt-1 text-xs text-gray-600">Expert guides and insights</p>
                      </div>
                    </div>
                    <svg
                      class="absolute right-4 top-4 h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-primary-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </NuxtLink>

                  <NuxtLink
                    to="/about"
                    class="group relative flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div class="mb-2 flex items-center gap-3">
                      <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100">
                        <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div class="flex-1">
                        <span class="font-semibold text-gray-900 group-hover:text-primary-700">About Us</span>
                        <p class="mt-1 text-xs text-gray-600">Our story and mission</p>
                      </div>
                    </div>
                    <svg
                      class="absolute right-4 top-4 h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-primary-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </NuxtLink>

                  <NuxtLink
                    to="/methodology"
                    class="group relative flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div class="mb-2 flex items-center gap-3">
                      <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100">
                        <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                      </div>
                      <div class="flex-1">
                        <span class="font-semibold text-gray-900 group-hover:text-primary-700">Our Methodology</span>
                        <p class="mt-1 text-xs text-gray-600">How we compare providers</p>
                      </div>
                    </div>
                    <svg
                      class="absolute right-4 top-4 h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-primary-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mini FAQ Section -->
        <div class="mb-8 rounded-lg bg-white p-8 shadow-md">
          <h2 class="mb-6 text-3xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>
          <FaqAccordion :faqs="contactFaqs" />
          <div class="mt-6 text-center">
            <NuxtLink
              to="/faq"
              class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-white font-semibold hover:bg-primary-700 transition-colors"
            >
              View All FAQs
              <svg
                class="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Why You Can Trust Us Section -->
    <WhyTrustUs />

    <!-- External link confirm -->
    <Teleport to="body">
      <div
        v-if="showExternalLinkModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
        role="dialog"
        aria-modal="true"
      >
        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-start gap-3">
            <div class="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <svg
                class="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-slate-900">
                Leave Remit-Scout?
              </h3>
              <p class="text-sm text-slate-700 mt-1">
                You're about to visit an external site. We vet links, but it will open in a new tab.
              </p>
            </div>
          </div>
          <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
              @click="closeExternalLinkModal"
            >
              Stay here
            </button>
            <button
              type="button"
              class="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 sm:w-auto"
              @click="confirmExternalLink"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import FaqAccordion from '~/components/shared/FaqAccordion.vue'
import WhyTrustUs from '~/components/home/WhyTrustUs.vue'
import { setSeo, jsonLdBreadcrumb, jsonLdOrganization } from '~/composables/useSeo'

// Breadcrumbs
const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Contact', path: '/contact' },
]

const { public: { siteUrl } } = useRuntimeConfig()

setSeo({
  title: 'Contact Us | Get Help with Money Transfers | Remit-Scout',
  description:
    'Contact Remit-Scout for help with money transfer questions, provider comparisons, or technical support. Based in Carnegie Mellon University\'s Swartz Center for Entrepreneurship.',
  canonical: `${siteUrl}/contact`,
  ogImage: `${siteUrl}/images/og/contact.jpg`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Contact', url: `${siteUrl}/contact` },
])

jsonLdOrganization(siteUrl)

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        'name': 'Contact Remit-Scout',
        'url': `${siteUrl}/contact`,
        'description': 'Contact Remit-Scout for help with money transfer questions, provider comparisons, or technical support.',
        'publisher': {
          '@type': 'Organization',
          'name': 'Remit-Scout',
          'url': siteUrl,
        },
      }),
    },
  ],
})

const showExternalLinkModal = ref(false)
const pendingExternalUrl = ref('')

const handleExternalLink = (url: string) => {
  pendingExternalUrl.value = url
  showExternalLinkModal.value = true
}

const confirmExternalLink = () => {
  if (pendingExternalUrl.value) {
    window.open(pendingExternalUrl.value, '_blank', 'noopener,noreferrer')
    closeExternalLinkModal()
  }
}

const closeExternalLinkModal = () => {
  showExternalLinkModal.value = false
  pendingExternalUrl.value = ''
}

// Mini FAQ for contact page
const contactFaqs = [
  {
    question: 'How can I use Remit-Scout to find the best ways to send money?',
    answer:
      'Use our comparison tool to search for your specific transfer corridor (e.g., US to Mexico). We show real quotes from multiple providers, including fees and exchange rates. Compare the total amount your recipient will receive to find the best option. <a href="/learn" class="font-semibold text-primary-600 hover:text-primary-700 underline">Learn more about using our comparison tool</a>.',
  },
  {
    question: 'Can you help me find the best option for my transfer?',
    answer:
      'Our comparison tool automatically shows you the best options based on your transfer amount and corridor. We compare real quotes from trusted providers, factoring in fees and exchange rates. <a href="/faq" class="font-semibold text-primary-600 hover:text-primary-700 underline">See our FAQ</a> for more details on how comparisons work.',
  },
  {
    question: 'I did a comparison but you didn\'t list any option for my transfer?',
    answer:
      'If no options appear, it may be that we don\'t currently have providers available for that specific corridor or transfer type. Try different search parameters, or check our <a href="/send-money" class="font-semibold text-primary-600 hover:text-primary-700 underline">popular corridors</a> to see what\'s available. For questions about specific transfers, contact the provider directly.',
  },
  {
    question: 'I simply use my bank to send money abroad, do I really need to compare other options?',
    answer:
      'Banks often charge high fees and offer less competitive exchange rates than specialized money transfer services. <a href="/learn" class="font-semibold text-primary-600 hover:text-primary-700 underline">Our guides explain the hidden costs</a> of bank transfers and show how much you could save by using dedicated remittance services.',
  },
  {
    question: 'Can I trust a company I found on Remit-Scout but have never heard about before?',
    answer:
      'We thoroughly research and test providers before listing them. All providers on our platform are legitimate, regulated services. Read our <a href="/providers" class="font-semibold text-primary-600 hover:text-primary-700 underline">provider reviews</a> for detailed information about each service, including regulatory status and user feedback. <a href="/methodology" class="font-semibold text-primary-600 hover:text-primary-700 underline">Learn more about our vetting process</a>.',
  },
]
</script>
