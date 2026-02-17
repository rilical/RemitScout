<template>
  <LegalPageShell
    title="Do Not Sell or Share My Personal Information"
    subtitle="California residents can opt out of the sale or sharing of personal information."
    badge="CCPA"
    :last-updated-label="lastUpdatedLabel"
    :last-updated-iso="lastUpdatedIso"
    :breadcrumb-items="breadcrumbItems"
    :related="relatedLinks"
  >
    <div class="prose prose-lg max-w-none prose-headings:font-semibold prose-headings:text-rs-fg prose-a:font-semibold prose-a:text-brand-600">
      <p class="mb-6 text-body-lg leading-relaxed">
        If you are a California resident, you may have the right to opt out of the “sale” or “sharing”
        of personal information under the California Consumer Privacy Act (CCPA/CPRA).
      </p>

      <div class="my-8 rounded-lg border-l-4 border-primary-500 bg-primary-50 p-6">
        <h3 class="mb-2 text-body-lg font-semibold text-primary-900">
          One-click opt out (recommended)
        </h3>
        <p class="text-primary-800 leading-relaxed">
          Use the button below to disable marketing cookies. This may also limit personalized ads and attribution.
        </p>
        <div class="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-primary-600 bg-primary-600 px-5 py-3 text-body-sm font-semibold text-white hover:bg-primary-700 hover:border-primary-700 motion-safe:transition-colors focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2"
            @click="optOut"
          >
            Disable marketing cookies
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-rs-border bg-white px-5 py-3 text-body-sm font-semibold text-rs-fg hover:bg-neutral-50 motion-safe:transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
            @click="openCookiePreferences"
          >
            Cookie settings
          </button>
        </div>
      </div>

      <h2
        id="what-this-means"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        What this means
      </h2>
      <p class="mb-6 leading-relaxed">
        We use essential cookies to run the site. With your consent (where required), we may use analytics and marketing
        technologies to understand usage and support our free plan through ads. Choosing to opt out disables marketing cookies
        and related processing on this device/browser.
      </p>

      <h2
        id="other-options"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        Other options
      </h2>
      <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
        <li>Use your browser settings to block or delete cookies.</li>
        <li>Visit our <NuxtLink to="/cookies">Cookie Policy</NuxtLink> for more details.</li>
        <li>Contact us if you need assistance with privacy choices.</li>
      </ul>
    </div>

    <template #sidebar>
      <div class="rounded-2xl border border-primary-200 bg-primary-50 p-5">
        <h3 class="text-body-sm font-semibold text-primary-900">
          Questions about privacy?
        </h3>
        <p class="mt-2 text-body-sm text-primary-800 leading-relaxed">
          See our <NuxtLink
            to="/legal/privacy"
            class="font-semibold underline hover:text-primary-900"
          >Privacy Policy</NuxtLink>
          or <NuxtLink
            to="/contact"
            class="font-semibold underline hover:text-primary-900"
          >contact us</NuxtLink>.
        </p>
      </div>
    </template>
  </LegalPageShell>
</template>

<script setup lang="ts">
import LegalPageShell from '~/components/legal/LegalPageShell.vue'
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'
import { useCookiePreferencesModal } from '~/composables/useCookiePreferencesModal'
import { usePrivacySettings } from '~/composables/usePrivacySettings'

const { public: { siteUrl } } = useRuntimeConfig()
const { open } = useCookiePreferencesModal()
const { saveSettings } = usePrivacySettings()

const openCookiePreferences = () => open()

const optOut = async () => {
  await saveSettings({ marketing: false })
  open()
}

const lastUpdatedIso = '2026-02-17'
const lastUpdatedLabel = 'February 17, 2026'

const relatedLinks = [
  {
    title: 'Cookie Policy',
    description: 'How we use cookies and how to manage preferences.',
    to: '/cookies',
  },
  {
    title: 'Privacy Policy',
    description: 'How we protect your data.',
    to: '/legal/privacy',
  },
  {
    title: 'Terms of Service',
    description: 'The legal agreement.',
    to: '/legal/terms',
  },
]

defineOgImage({
  component: 'OgImageDefault',
  props: {
    title: 'Do Not Sell or Share',
    description: 'Opt out of marketing cookies and related data sharing.',
  },
})

setSeo({
  title: 'Do Not Sell or Share My Personal Information | Remit-Scout',
  description: 'California residents can opt out of the sale or sharing of personal information. Disable marketing cookies and manage preferences under CCPA/CPRA.',
  canonical: `${siteUrl}/legal/do-not-sell`,
  ogImage: false,
  ogType: 'article',
  publishedTime: lastUpdatedIso,
  modifiedTime: lastUpdatedIso,
  author: 'Remit-Scout Editorial Team',
  tags: ['ccpa', 'privacy'],
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Legal', url: `${siteUrl}/legal` },
  { name: 'Do Not Sell', url: `${siteUrl}/legal/do-not-sell` },
])

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': 'Do Not Sell or Share My Personal Information',
        'url': `${siteUrl}/legal/do-not-sell`,
        'datePublished': lastUpdatedIso,
        'dateModified': lastUpdatedIso,
        'publisher': {
          '@type': 'Organization',
          'name': 'Remit-Scout',
          'url': siteUrl,
        },
      }),
    },
  ],
})

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Legal', path: '/legal' },
  { name: 'Do Not Sell', path: '/legal/do-not-sell' },
]
</script>
