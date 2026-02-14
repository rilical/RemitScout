<template>
  <div class="min-h-screen bg-surface">
    <CompareWidget />

    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-surface py-16 lg:py-24">
      <div class="container">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-12 max-w-4xl">
          <div
            v-if="category"
            class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-surface px-4 py-2 text-body-sm font-semibold text-brand-700 shadow-md mb-6"
          >
            <span>{{ categoryIcon }}</span>
            {{ category }}
          </div>
          <h1 class="text-hero font-bold tracking-tight mb-6">
            <template v-if="title.includes('Remit-Scout')">
              <span class="text-neutral-900">{{ title.replace('Remit-Scout', '') }}</span>
              <span class="text-brand-600">Remit-Scout</span>
            </template>
            <template v-else>
              <span class="text-neutral-900">{{ titleWords.slice(0, -1).join(' ') }}</span>
              <span class="text-brand-600"> {{ titleWords[titleWords.length - 1] }}</span>
            </template>
          </h1>
          <p
            v-if="subtitle"
            class="text-h4 text-neutral-600 font-medium mb-6 leading-relaxed"
          >
            {{ subtitle }}
          </p>
          <div class="flex flex-wrap items-center gap-4 text-body-sm text-neutral-600">
            <div
              v-if="author"
              class="flex items-center gap-2"
            >
              <div
                v-if="author.avatar"
                class="w-8 h-8 rounded-full overflow-hidden bg-neutral-100"
              >
                <NuxtImg
                  :src="author.avatar"
                  :alt="author.name"
                  width="32"
                  height="32"
                  loading="lazy"
                  format="webp"
                  class="w-full h-full object-cover"
                />
              </div>
              <div
                v-else
                class="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-body-sm font-bold text-brand-600"
              >
                {{ author.name.charAt(0).toUpperCase() }}
              </div>
              <span class="font-medium text-neutral-900">{{ author.name }}</span>
            </div>
            <span v-if="author && readTime">•</span>
            <span v-if="readTime">{{ readTime }}</span>
            <span v-if="readTime && updated">•</span>
            <span v-if="updated">Updated {{ updated }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content with Sidebar -->
    <section class="py-16 lg:py-20 bg-surface">
      <div class="container">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <!-- Main Content -->
          <div class="lg:col-span-8">
            <!-- Featured Image -->
            <div
              v-if="featuredImage"
              class="mb-12 -mx-page-x rounded-2xl overflow-hidden"
            >
              <NuxtImg
                :src="featuredImage"
                :alt="title"
                width="1200"
                height="630"
                sizes="sm:100vw md:720px"
                loading="eager"
                format="webp"
                class="w-full h-auto max-h-[600px] object-cover"
              />
            </div>

            <!-- Article Content -->
            <article class="prose prose-lg max-w-none">
              <slot name="content" />
            </article>

            <!-- Author -->
            <div
              v-if="author"
              class="mt-12"
            >
              <Author
                :name="author.name"
                :title="author.title"
                :bio="author.bio"
                :avatar="author.avatar"
                :social="author.social"
              />
            </div>

            <!-- More Guides -->
            <div class="mt-12">
              <MoreGuides
                :exclude-slug="slug"
                :category-key="categoryKey"
                :limit="3"
              />
            </div>
          </div>

          <!-- Sidebar -->
          <aside class="lg:col-span-4">
            <div class="space-y-8 lg:sticky lg:top-20">
              <!-- Save + Alert (Guide CTA) -->
              <div class="rounded-2xl border border-neutral-200 bg-surface p-6">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-2">
                  Save this & get alerts
                </h3>
                <p class="text-body-sm text-neutral-700 mb-4">
                  Save a corridor and set an alert—Remit‑Scout will remember it for your next transfer.
                </p>
                <SaveAlertButtons
                  :target="guideAlertTarget"
                  :label="guideAlertLabel"
                  source="guide"
                />
              </div>

              <!-- Why Trust Us (Compact) -->
              <div class="rounded-2xl border border-neutral-200 bg-surface p-6">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-4">
                  Why Trust Us
                </h3>
                <ul class="space-y-3 text-body-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-0.5">✓</span>
                    <span>100% independent rankings</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-0.5">✓</span>
                    <span>Live rates, updated constantly</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-0.5">✓</span>
                    <span>Providers cannot pay to rank higher</span>
                  </li>
                </ul>
                <NuxtLink
                  to="/methodology"
                  class="mt-4 inline-flex items-center gap-1 text-body-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  Our methodology
                  <svg
                    class="w-4 h-4"
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

              <AdPlacement
                placement="blog_sidebar"
                layout="vertical"
                wrapper-class="rounded-xl"
                min-height="160px"
              />
            </div>
          </aside>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section
      v-if="faqs && faqs.length > 0"
      class="py-16 lg:py-20 bg-surface"
    >
      <div class="mx-auto max-w-4xl px-page-x">
        <div class="text-center mb-12">
          <h2 class="text-h2 font-bold text-neutral-900 mb-4">
            Frequently Asked Questions
          </h2>
        </div>
        <FaqAccordion :faqs="faqs" />
      </div>
    </section>

    <!-- Newsletter Signup -->
    <NewsletterSignup v-if="showNewsletter" />

    <!-- Reusable Sections -->
    <WhyTrustUs v-if="showWhyTrustUs" />
    <TrustMetricsStrip
      v-if="showImpact"
      bg-class="bg-neutral-900"
    />
    <FounderStory v-if="showOurStory" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import WhyTrustUs from '~/components/home/WhyTrustUs.vue'
import TrustMetricsStrip from '~/components/home/TrustMetricsStrip.vue'
import FounderStory from '~/components/home/FounderStory.vue'
import NewsletterSignup from '~/components/home/NewsletterSignup.vue'
import FaqAccordion from '~/components/shared/FaqAccordion.vue'
import Author from '~/components/blog/Author.vue'
import MoreGuides from '~/components/blog/MoreGuides.vue'

interface AuthorData {
  name: string
  title?: string
  bio?: string
  avatar?: string
  social?: {
    twitter?: string
    linkedin?: string
  }
}

interface Faq {
  question: string
  answer: string
}

interface Props {
  title: string
  subtitle?: string
  category?: string
  categoryIcon?: string
  categoryKey?: string
  readTime?: string
  updated?: string
  featuredImage?: string
  author?: AuthorData
  slug?: string
  faqs?: Faq[]
  showWhyTrustUs?: boolean
  showImpact?: boolean
  showOurStory?: boolean
  showNewsletter?: boolean
  breadcrumbItems?: Array<{ name: string, path: string }>
}

const props = withDefaults(defineProps<Props>(), {
  showWhyTrustUs: false,
  showImpact: false,
  showOurStory: false,
  showNewsletter: true,
  breadcrumbItems: () => [
    { name: 'Home', path: '/' },
    { name: 'Learn', path: '/learn' },
  ],
})

const titleWords = computed(() => props.title.split(' '))

const { form } = useCompareForm()

const guideAlertTarget = computed(() => ({
  type: 'corridor' as const,
  from: form.value.from || 'US',
  to: form.value.to || 'PH',
  method: form.value.method || 'bank',
}))

const guideAlertLabel = computed(() => `${guideAlertTarget.value.from}→${guideAlertTarget.value.to} • ${guideAlertTarget.value.method}`)
</script>
