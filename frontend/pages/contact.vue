<template>
  <div class="min-h-screen bg-surface">
    <div class="py-10">
      <div class="mx-auto max-w-page px-page-x">
        <Breadcrumbs :items="breadcrumbItems" />
        <!-- Hero Section -->
        <div class="mb-10 rounded-3xl border border-rs-border bg-surface p-10 shadow-xl relative overflow-hidden">
          <div>
            <div class="inline-flex items-center gap-2 rounded-full border border-rs-border bg-surface px-4 py-2 text-body-sm font-semibold uppercase tracking-[0.2em] text-neutral-600 mb-6">
              Contact
            </div>
            <h1 class="mb-6 text-h1 font-bold text-rs-fg">
              Get in touch with <span class="text-brand-600">Remit-Scout</span>
            </h1>
            <p class="mb-4 text-body-lg text-neutral-600">
              Have questions about our data, a provider, or working with us? We're here to help.
            </p>
            <p class="text-body-sm text-rs-muted">
              Advertiser disclosure —
              <NuxtLink to="/legal/disclosure" class="font-semibold text-brand-600 hover:text-brand-700 underline">Read disclosure</NuxtLink>
            </p>
            <p class="mb-6 mt-3 text-body-sm text-neutral-600">
              We can't assist with individual transactions — please contact the provider directly for transfer support.
            </p>

            <!-- Important Note -->
            <div class="mb-8 rounded-xl border border-warning-200 bg-warning-50 p-4">
              <div class="flex items-start gap-3">
                <svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-warning-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                <p class="text-body-sm font-medium text-warning-800">
                  For an ongoing transaction, contact the provider's support team directly — they have access to your transfer details and can resolve it fastest.
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <!-- Contact Form -->
              <div class="text-rs-fg">
                <h2 class="mb-6 text-h3 font-bold text-rs-fg">
                  Send a message
                </h2>

                <form
                  class="space-y-5"
                  @submit.prevent="handleSubmit"
                >
                  <div
                    v-if="submitSuccess"
                    class="rounded-lg bg-success-50 border border-success-200 p-4"
                  >
                    <div class="flex items-center gap-2">
                      <svg class="h-5 w-5 text-success-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                      <p class="text-body-sm text-success-800">{{ submitSuccess }}</p>
                    </div>
                  </div>

                  <div
                    v-if="submitError"
                    class="rounded-lg bg-danger-50 border border-danger-200 p-4"
                  >
                    <div class="flex items-center gap-2">
                      <svg class="h-5 w-5 text-danger-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                      </svg>
                      <p class="text-body-sm text-danger-600">{{ submitError }}</p>
                    </div>
                  </div>

                  <div>
                    <label for="name" class="mb-1.5 block text-body-sm font-medium text-neutral-600">
                      Name <span class="text-danger-600">*</span>
                    </label>
                    <input
                      id="name"
                      v-model="form.name"
                      type="text"
                      required
                      :disabled="isSubmitting"
                      class="w-full rounded-lg border px-3 py-2.5 text-neutral-900 focus:outline-none focus:ring-2 motion-safe:transition-colors"
                      :class="errors.name ? 'border-danger-600 focus:ring-danger-600' : 'border-neutral-300 focus:ring-brand-500'"
                    >
                    <p v-if="errors.name" class="mt-1 text-body-sm text-danger-600">{{ errors.name }}</p>
                  </div>

                  <div>
                    <label for="email" class="mb-1.5 block text-body-sm font-medium text-neutral-600">
                      Email <span class="text-danger-600">*</span>
                    </label>
                    <input
                      id="email"
                      v-model="form.email"
                      type="email"
                      required
                      :disabled="isSubmitting"
                      class="w-full rounded-lg border px-3 py-2.5 text-neutral-900 focus:outline-none focus:ring-2 motion-safe:transition-colors"
                      :class="errors.email ? 'border-danger-600 focus:ring-danger-600' : 'border-neutral-300 focus:ring-brand-500'"
                    >
                    <p v-if="errors.email" class="mt-1 text-body-sm text-danger-600">{{ errors.email }}</p>
                  </div>

                  <!-- Subject picker -->
                  <div>
                    <p class="mb-2 text-body-sm font-medium text-neutral-600">
                      What's this about? <span class="text-danger-600">*</span>
                    </p>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="opt in subjectOptions"
                        :key="opt.value"
                        type="button"
                        :disabled="isSubmitting"
                        class="rounded-full px-4 py-1.5 text-body-sm font-semibold border motion-safe:transition-all focus:outline-none"
                        :class="form.subject === opt.value
                          ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700'"
                        @click="form.subject = opt.value"
                      >
                        {{ opt.label }}
                      </button>
                    </div>
                    <p v-if="errors.subject" class="mt-1 text-body-sm text-danger-600">{{ errors.subject }}</p>
                  </div>

                  <div>
                    <label for="message" class="mb-1.5 block text-body-sm font-medium text-neutral-600">
                      Message <span class="text-danger-600">*</span>
                    </label>
                    <textarea
                      id="message"
                      v-model="form.message"
                      rows="5"
                      required
                      :disabled="isSubmitting"
                      class="w-full rounded-lg border px-3 py-2.5 text-neutral-900 focus:outline-none focus:ring-2 motion-safe:transition-colors"
                      :class="errors.message ? 'border-danger-600 focus:ring-danger-600' : 'border-neutral-300 focus:ring-brand-500'"
                    />
                    <div class="mt-1 flex items-center justify-between">
                      <p v-if="errors.message" class="text-body-sm text-danger-600">{{ errors.message }}</p>
                      <p class="ml-auto text-body-sm text-neutral-500">{{ form.message.length }}/5000</p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    :disabled="isSubmitting"
                    class="w-full rounded-lg px-4 py-2.5 text-body font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 motion-safe:transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    :class="isSubmitting ? 'bg-neutral-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700'"
                  >
                    <span v-if="isSubmitting" class="flex items-center justify-center gap-2">
                      <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending…
                    </span>
                    <span v-else>Send message</span>
                  </button>
                </form>
              </div>

              <!-- Resources -->
              <div class="space-y-3">
                <h3 class="text-h4 font-bold text-neutral-900 mb-4">
                  Explore resources
                </h3>

                <NuxtLink
                  to="/learn/providers"
                  class="group flex items-center gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 hover:border-brand-300 hover:bg-brand-50 motion-safe:transition-all"
                >
                  <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-100">
                    <svg class="h-5 w-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-neutral-900 group-hover:text-brand-700">Provider Reviews</p>
                    <p class="text-body-sm text-neutral-500">Compare trusted money transfer services</p>
                  </div>
                  <svg class="h-4 w-4 text-neutral-400 flex-shrink-0 group-hover:translate-x-0.5 group-hover:text-brand-600 motion-safe:transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </NuxtLink>

                <NuxtLink
                  to="/learn"
                  class="group flex items-center gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 hover:border-brand-300 hover:bg-brand-50 motion-safe:transition-all"
                >
                  <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-100">
                    <svg class="h-5 w-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-neutral-900 group-hover:text-brand-700">Guides</p>
                    <p class="text-body-sm text-neutral-500">Expert guides and insights on remittances</p>
                  </div>
                  <svg class="h-4 w-4 text-neutral-400 flex-shrink-0 group-hover:translate-x-0.5 group-hover:text-brand-600 motion-safe:transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </NuxtLink>

                <NuxtLink
                  to="/methodology"
                  class="group flex items-center gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 hover:border-brand-300 hover:bg-brand-50 motion-safe:transition-all"
                >
                  <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-100">
                    <svg class="h-5 w-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-neutral-900 group-hover:text-brand-700">Our Methodology</p>
                    <p class="text-body-sm text-neutral-500">How we compare and score providers</p>
                  </div>
                  <svg class="h-4 w-4 text-neutral-400 flex-shrink-0 group-hover:translate-x-0.5 group-hover:text-brand-600 motion-safe:transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </NuxtLink>

                <NuxtLink
                  to="/about"
                  class="group flex items-center gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 hover:border-brand-300 hover:bg-brand-50 motion-safe:transition-all"
                >
                  <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-100">
                    <svg class="h-5 w-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-neutral-900 group-hover:text-brand-700">About Remit-Scout</p>
                    <p class="text-body-sm text-neutral-500">Our story and mission</p>
                  </div>
                  <svg class="h-4 w-4 text-neutral-400 flex-shrink-0 group-hover:translate-x-0.5 group-hover:text-brand-600 motion-safe:transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- FAQ Section -->
    <section class="py-16 bg-neutral-50">
      <div class="mx-auto max-w-page px-page-x">
        <div class="mx-auto max-w-3xl">
          <div class="text-center mb-10">
            <h2 class="mb-2 text-h2 font-bold text-neutral-900">
              Frequently asked questions
            </h2>
            <p class="text-body text-neutral-600">
              Common questions about our data, comparisons, and how to get the most from Remit-Scout.
            </p>
          </div>
          <FaqAccordion :faqs="contactFaqs" />
          <div class="mt-8 text-center">
            <NuxtLink
              to="/faq"
              class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-white font-semibold hover:bg-brand-700 motion-safe:transition-colors"
            >
              View all FAQs
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Why You Can Trust Us Section -->
    <WhyTrustUs />

    <!-- External link confirm -->
    <Teleport to="body">
      <div
        v-if="showExternalLinkModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 px-4"
        role="dialog"
        aria-modal="true"
      >
        <div class="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl">
          <div class="mb-4 flex items-start gap-3">
            <div class="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-brand-700">
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
              <h3 class="text-body-lg font-semibold text-rs-fg">
                Leave Remit-Scout?
              </h3>
              <p class="text-body-sm text-neutral-700 mt-1">
                You're about to visit an external site. We vet links, but it will open in a new tab.
              </p>
            </div>
          </div>
          <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="w-full rounded-lg border border-rs-border px-4 py-2 text-body-sm font-semibold text-neutral-700 hover:bg-neutral-50 sm:w-auto"
              @click="closeExternalLinkModal"
            >
              Stay here
            </button>
            <button
              type="button"
              class="w-full rounded-lg bg-primary-600 px-4 py-2 text-body-sm font-semibold text-white hover:bg-primary-700 sm:w-auto"
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
import { ref, reactive } from 'vue'
import FaqAccordion from '~/components/shared/FaqAccordion.vue'
import WhyTrustUs from '~/components/home/WhyTrustUs.vue'
import { setSeo, jsonLdBreadcrumb, jsonLdOrganization } from '~/composables/useSeo'
import { useApi } from '~/composables/useApi'

// Breadcrumbs
const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Contact', path: '/contact' },
]

const { public: { siteUrl } } = useRuntimeConfig()

defineOgImage({
  component: 'OgImageDefault',
  props: {
    title: 'Contact',
    description: 'Get help with transfers, provider comparisons, data issues, or partnership inquiries.',
  },
})

setSeo({
  title: 'Contact Us | Get Help with Money Transfers | Remit-Scout',
  description:
    'Contact Remit-Scout for help with transfers, provider comparisons, data issues, or partnerships. We respond quickly and route you to the right resources.',
  canonical: `${siteUrl}/contact`,
  ogImage: false,
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

const subjectOptions = [
  { value: 'General Question', label: 'General question' },
  { value: 'Rate or Data Issue', label: 'Rate or data issue' },
  { value: 'Missing Provider or Corridor', label: 'Missing provider or corridor' },
  { value: 'Partnership & Affiliate', label: 'Partnership & affiliate' },
  { value: 'Institutional Data Access', label: 'Institutional data access' },
  { value: 'Press & Media', label: 'Press & media' },
  { value: 'Bug Report', label: 'Bug report' },
  { value: 'Other', label: 'Other' },
]

// Contact form state
const { request } = useApi()
const isSubmitting = ref(false)
const submitSuccess = ref('')
const submitError = ref('')

const form = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
})

const errors = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
})

const validateForm = (): boolean => {
  let isValid = true

  // Reset errors
  errors.name = ''
  errors.email = ''
  errors.subject = ''
  errors.message = ''

  // Validate name
  if (!form.name.trim()) {
    errors.name = 'Name is required'
    isValid = false
  }
  else if (form.name.length > 200) {
    errors.name = 'Name must be less than 200 characters'
    isValid = false
  }

  // Validate email
  if (!form.email.trim()) {
    errors.email = 'Email is required'
    isValid = false
  }
  else if (!/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Please enter a valid email address'
    isValid = false
  }
  else if (form.email.length > 200) {
    errors.email = 'Email must be less than 200 characters'
    isValid = false
  }

  // Validate subject
  if (!form.subject) {
    errors.subject = 'Please select a subject'
    isValid = false
  }
  else if (form.subject.length > 200) {
    errors.subject = 'Subject must be less than 200 characters'
    isValid = false
  }

  // Validate message
  if (!form.message.trim()) {
    errors.message = 'Message is required'
    isValid = false
  }
  else if (form.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters'
    isValid = false
  }
  else if (form.message.length > 5000) {
    errors.message = 'Message must be less than 5000 characters'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  submitSuccess.value = ''
  submitError.value = ''

  if (!validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    const response = await request<{ success: boolean, message?: string, error?: string }>(
      '/contact',
      {
        method: 'POST',
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject,
          message: form.message.trim(),
        },
      },
    )

    if (response.success) {
      submitSuccess.value = response.message || 'Thank you for contacting us. We will get back to you soon.'

      // Reset form
      form.name = ''
      form.email = ''
      form.subject = ''
      form.message = ''

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    else {
      submitError.value = response.message || 'Failed to send message. Please try again.'
    }
  }
  catch (error: any) {
    const errorMessage = error?.data?.message || error?.message || 'An error occurred while sending your message. Please try again later.'
    submitError.value = errorMessage

    // Scroll to top to show error message
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  finally {
    isSubmitting.value = false
  }
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
