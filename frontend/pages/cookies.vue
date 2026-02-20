<template>
  <LegalPageShell
    title="Cookie Policy"
    subtitle="How Remit-Scout uses cookies and similar technologies."
    badge="Cookies"
    :last-updated-label="lastUpdatedLabel"
    :last-updated-iso="lastUpdatedIso"
    :breadcrumb-items="breadcrumbItems"
    :toc="tocItems"
    :highlights="highlights"
    :related="relatedLinks"
  >
    <div class="prose prose-lg max-w-none prose-headings:font-semibold prose-headings:text-rs-fg prose-a:font-semibold prose-a:text-brand-600">
      <p class="mb-6 text-body-lg leading-relaxed">
        This Cookie Policy explains how <strong class="text-brand-600">Remit-Scout</strong> uses cookies and similar technologies
        to operate, secure, and improve our comparison platform. If required by law, we
        will ask for consent before placing non-essential cookies.
      </p>

      <div class="my-8 rounded-lg border-l-4 border-primary-500 bg-primary-50 p-6">
        <h3 class="mb-2 text-body-lg font-semibold text-primary-900">
          Important Information
        </h3>
        <p class="text-primary-800 leading-relaxed">
          <strong class="text-brand-600">Remit-Scout</strong> uses cookies to enhance your experience, ensure security, and improve our platform.
          We use essential cookies for core functionality, and (with your consent) functional, analytics, and marketing cookies.
          Marketing cookies may be used for ads and attribution to help keep the free plan free. You can control cookie preferences
          through your browser settings, our cookie banner, or the “Manage cookies” link in the footer.
        </p>
      </div>

      <h2
        id="what-are-cookies"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        What are cookies?
      </h2>
      <p class="mb-6 leading-relaxed">
        Cookies are small text files stored on your device when you visit a website. They help
        remember preferences, keep sessions secure, and provide anonymous usage insights. Cookies
        enable websites to recognize your device and remember information about your visit, such as
        your preferred language and other settings.
      </p>

      <h2
        id="how-we-use-cookies"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        How we use cookies
      </h2>
      <p class="mb-4 leading-relaxed">
        <strong class="text-brand-600">Remit-Scout</strong> uses cookies for the following purposes:
      </p>
      <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
        <li><strong class="text-brand-600">Essential operations:</strong> Enable core features like session security and site stability.</li>
        <li><strong class="text-brand-600">Functional:</strong> Remember preferences like your last corridor.</li>
        <li><strong class="text-brand-600">Analytics:</strong> Understand how people use Remit-Scout so we can improve accuracy and performance.</li>
        <li><strong class="text-brand-600">Marketing:</strong> Ads and attribution (only after opt-in where required by law).</li>
        <li><strong class="text-brand-600">Security:</strong> Detect abuse, prevent fraud, and protect the service.</li>
      </ul>

      <h2
        id="types-of-cookies"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        Types of cookies we use
      </h2>
      <p class="mb-4 leading-relaxed">
        We use the following categories of cookies:
      </p>
      <ul class="mb-6 list-inside list-disc space-y-2 leading-relaxed">
        <li><strong class="text-brand-600">Essential cookies:</strong> Required for the website to function properly. These cookies cannot be disabled.</li>
        <li><strong class="text-brand-600">Functional cookies:</strong> Remember local preferences like your corridor and UI choices.</li>
        <li><strong class="text-brand-600">Analytics cookies:</strong> Help us measure usage patterns and improve the experience (opt-in where required).</li>
        <li><strong class="text-brand-600">Marketing cookies:</strong> Used for ads and attribution (opt-in where required).</li>
      </ul>
      <p class="mb-6 leading-relaxed">
        We do not use cookies to sell personal data. If we introduce new categories in the future,
        we will update this policy and request consent where required by law.
      </p>

      <h2
        id="manage-preferences"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        Manage your preferences
      </h2>
      <p class="mb-4 leading-relaxed">
        You can control or delete cookies through your browser settings. Most browsers allow you to
        refuse or accept cookies, or to delete existing cookies. If a cookie banner is shown on our
        website, you can update your choices there at any time. Please note that disabling certain
        cookies may limit your ability to use some features of our platform.
      </p>
      <button
        type="button"
        class="not-prose mb-6 inline-flex items-center gap-2 rounded-lg border border-brand-600 px-5 py-2.5 text-body font-semibold text-brand-600 hover:bg-brand-600 hover:text-white motion-safe:transition-colors"
        @click="openCookiePreferences"
      >
        Manage cookie preferences
      </button>

      <h2
        id="third-party-services"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        Third-party services
      </h2>
      <p class="mb-6 leading-relaxed">
        Some infrastructure, analytics, and advertising partners may set cookies or use similar technologies.
        Where required by law, marketing/ads and analytics will only run after you opt in. Providers are contractually required
        to protect data and use it only for the configured purposes.
      </p>

      <h2
        id="policy-updates"
        class="mb-4 text-h3 font-bold text-neutral-900"
      >
        Updates to this policy
      </h2>
      <p class="mb-6 leading-relaxed">
        We may update this Cookie Policy from time to time to reflect legal, technical, or product changes.
        The updated version will include a new "Last updated" date. Your continued use of our services
        after changes constitutes acceptance of the updated policy. We encourage you to review this policy
        periodically to stay informed about how we use cookies.
      </p>
    </div>

    <template #sidebar>
      <div class="rounded-2xl border border-primary-200 bg-primary-50 p-5">
        <h3 class="text-body-sm font-semibold text-primary-900">
          Need help with privacy or cookies?
        </h3>
        <p class="mt-2 text-body-sm text-primary-800 leading-relaxed">
          Visit our <NuxtLink
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

const { public: { siteUrl } } = useRuntimeConfig()
const { open } = useCookiePreferencesModal()

const openCookiePreferences = () => open()

const lastUpdatedIso = '2026-02-09'
const lastUpdatedLabel = 'February 9, 2026'

const highlights = [
  {
    title: 'Clear categories',
    body: 'Essential, functional, analytics, and marketing cookies.',
  },
  {
    title: 'Consent first',
    body: 'Non-essential cookies require consent where legally required.',
  },
  {
    title: 'You stay in control',
    body: 'Update preferences any time via browser settings or the banner.',
  },
]

const tocItems = [
  { id: 'what-are-cookies', label: 'What are cookies?' },
  { id: 'how-we-use-cookies', label: 'How we use cookies' },
  { id: 'types-of-cookies', label: 'Types of cookies' },
  { id: 'manage-preferences', label: 'Manage preferences' },
  { id: 'third-party-services', label: 'Third-party services' },
  { id: 'policy-updates', label: 'Policy updates' },
]

const relatedLinks = [
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
  {
    title: 'Disclosure Policy',
    description: 'Transparency and partnerships.',
    to: '/legal/disclosure',
  },
]

defineOgImage({
  component: 'OgImageDefault',
  props: {
    title: 'Cookie Policy',
    description: 'Learn how Remit-Scout uses cookies and how you can manage your preferences.',
  },
})

setSeo({
  title: 'Cookie Policy & Preferences | Remit-Scout',
  description:
    'Learn how Remit-Scout uses essential, functional, analytics, and marketing cookies, and how you can manage your preferences.',
  canonical: `${siteUrl}/cookies`,
  ogImage: false,
  ogType: 'article',
  publishedTime: lastUpdatedIso,
  modifiedTime: lastUpdatedIso,
  author: 'Remit-Scout Editorial Team',
  tags: ['cookies', 'privacy'],
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Legal', url: `${siteUrl}/legal` },
  { name: 'Cookie Policy', url: `${siteUrl}/cookies` },
])

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': 'Cookie Policy',
        'url': `${siteUrl}/cookies`,
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
  { name: 'Cookie Policy', path: '/cookies' },
]
</script>
