<template>
  <div class="min-h-screen bg-white pb-20 md:pb-0 break-words [overflow-wrap:anywhere] [hyphens:auto]">
    <!-- Reusable Compare Widget -->
    <CompareWidget />

    <!-- Hero Section -->
    <div class="relative bg-gradient-to-br from-slate-50 to-white py-12 lg:py-16 overflow-hidden">
      <!-- Abstract Background Graphics with Question Marks & FAQ Icons -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <!-- Gradient orbs -->
        <div class="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-blue-400/20 via-blue-300/15 to-transparent rounded-full blur-3xl" />
        <div class="absolute -bottom-20 -left-20 w-96 h-96 bg-gradient-to-tr from-emerald-400/20 via-emerald-300/15 to-transparent rounded-full blur-3xl" />
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-purple-300/15 via-blue-300/15 to-emerald-300/15 rounded-full blur-3xl" />

        <!-- Question Mark Icons (Primary Theme) -->
        <div class="absolute top-24 right-28 opacity-15">
          <div class="relative">
            <div
              class="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-ping"
              style="animation-duration: 3s;"
            />
            <svg
              class="relative w-24 h-24 text-blue-500/35 animate-float"
              style="animation-delay: 0s;"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        <div class="absolute bottom-36 left-32 opacity-15">
          <div class="relative">
            <div
              class="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-ping"
              style="animation-duration: 4s; animation-delay: 1s;"
            />
            <svg
              class="relative w-20 h-20 text-emerald-500/35 animate-float"
              style="animation-delay: 1.5s;"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        <div class="absolute top-1/3 left-24 opacity-12">
          <svg
            class="w-16 h-16 text-purple-500/30 animate-float"
            style="animation-delay: 2s;"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <div class="absolute bottom-1/4 right-28 opacity-12">
          <svg
            class="w-14 h-14 text-blue-500/30 animate-float"
            style="animation-delay: 2.5s;"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <!-- FAQ Related Icons -->
        <div class="absolute top-1/4 right-20 opacity-10">
          <svg
            class="w-18 h-18 text-blue-400/25 animate-float"
            style="animation-delay: 1s;"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        <div class="absolute bottom-1/3 left-20 opacity-10">
          <svg
            class="w-16 h-16 text-emerald-400/25 animate-float"
            style="animation-delay: 3s;"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <!-- Help/Support Icons -->
        <div class="absolute top-1/2 right-16 opacity-8">
          <svg
            class="w-12 h-12 text-purple-500/20 animate-float"
            style="animation-delay: 1.5s;"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>

        <div class="absolute bottom-1/4 left-16 opacity-8">
          <svg
            class="w-10 h-10 text-blue-500/20 animate-float"
            style="animation-delay: 3.5s;"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <!-- Geometric shapes -->
        <div class="absolute top-40 right-1/3 w-32 h-32 border border-blue-300/10 rounded-2xl rotate-12 opacity-8" />
        <div class="absolute bottom-40 left-1/3 w-24 h-24 border border-emerald-300/10 rounded-full -rotate-12 opacity-8" />
        <div class="absolute top-1/4 left-1/2 w-28 h-28 border border-purple-300/10 rounded-lg rotate-45 opacity-8" />

        <!-- Subtle grid pattern -->
        <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div class="container mx-auto px-4 max-w-5xl text-center relative z-10">
        <Breadcrumbs :items="breadcrumbItems" />
        <h1 class="mb-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl [text-wrap:balance]">
          Your Guide to Sending Money
          <span class="block sm:inline text-blue-600 whitespace-nowrap">Internationally</span>
        </h1>
        <p class="mx-auto max-w-2xl text-lg text-slate-600 sm:text-xl">
          Everything you need to know about transfers, banking abroad, <span class="whitespace-nowrap">staying connected</span>, and <span class="whitespace-nowrap">living as an expat</span>.
        </p>
        <div class="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-600">
          <NuxtLink
            to="/methodology"
            class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-800 hover:text-blue-700"
          >
            <span>🧪</span><span>See our methodology</span>
          </NuxtLink>
          <NuxtLink
            to="/about"
            class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-800 hover:text-blue-700"
          >
            <span>👤</span><span>About the founder</span>
          </NuxtLink>
          <NuxtLink
            to="/how-we-make-money"
            class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-800 hover:text-blue-700"
          >
            <span>📜</span><span>How we make money</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Main Content Sections -->
    <div class="container mx-auto px-4 py-12 max-w-6xl">
      <!-- Section 1: Money Transfer Basics -->
      <section class="mb-16">
        <div class="mb-8 flex items-start justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">
              <svg
                class="h-7 w-7 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </div>
            <div>
              <h2 class="text-3xl font-bold text-slate-900">
                Money Transfer Basics
              </h2>
              <p class="mt-1 text-slate-600 [text-wrap:pretty]">
                Understanding fees, rates, and how transfers work
              </p>
            </div>
          </div>
          <NuxtLink
            to="/send-money/us-to-in"
            class="hidden sm:flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
          >
            Compare Rates
            <svg
              class="h-4 w-4"
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

        <div class="space-y-3">
          <FaqAccordion :faqs="transferBasicsFaqs" />
        </div>
      </section>

      <!-- Section 2: Banking Abroad -->
      <section class="mb-16">
        <div class="mb-8 flex items-start justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
              <svg
                class="h-7 w-7 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <div>
              <h2 class="text-3xl font-bold text-slate-900">
                Banking Abroad
              </h2>
              <p class="mt-1 text-slate-600 [text-wrap:pretty]">
                Multi-currency accounts, neobanks, and managing money overseas
              </p>
            </div>
          </div>
          <NuxtLink
            to="/learn"
            class="hidden sm:flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            Read Guides
            <svg
              class="h-4 w-4"
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

        <div class="space-y-3">
          <FaqAccordion :faqs="bankingFaqs" />
        </div>
      </section>

      <!-- Section 3: Staying Connected -->
      <section class="mb-16">
        <div class="mb-8 flex items-start justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100">
              <svg
                class="h-7 w-7 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                />
              </svg>
            </div>
            <div>
              <h2 class="text-3xl font-bold text-slate-900">
                Staying Connected
              </h2>
              <p class="mt-1 text-slate-600 [text-wrap:pretty]">
                eSIM, SIM cards, and internet when traveling
              </p>
            </div>
          </div>
          <NuxtLink
            to="/esim"
            class="hidden sm:flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-100 transition-colors"
          >
            Browse eSIMs
            <svg
              class="h-4 w-4"
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

        <div class="space-y-3">
          <FaqAccordion :faqs="connectivityFaqs" />
        </div>
      </section>

      <!-- Section 4: Health & Insurance -->
      <section class="mb-16">
        <div class="mb-8 flex items-start justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100">
              <svg
                class="h-7 w-7 text-rose-600"
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
              <h2 class="text-3xl font-bold text-slate-900">
                Health & Insurance
              </h2>
              <p class="mt-1 text-slate-600 [text-wrap:pretty]">
                Coverage, requirements, and staying safe abroad
              </p>
            </div>
          </div>
          <NuxtLink
            to="/contact"
            class="hidden sm:flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
          >
            Get Help
            <svg
              class="h-4 w-4"
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

        <div class="space-y-3">
          <FaqAccordion :faqs="insuranceFaqs" />
        </div>
      </section>

      <!-- Why Trust Us Section -->
      <section class="mb-16 rounded-3xl bg-gradient-to-br from-slate-50 to-blue-50 p-8 lg:p-12">
        <div class="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <div class="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2">
              <span class="text-2xl">💡</span>
              <span class="text-sm font-semibold text-blue-900">Our Story</span>
            </div>
            <h2 class="mb-4 text-3xl font-bold text-slate-900 lg:text-4xl [text-wrap:balance]">
              Why Trust Remit-Scout?
            </h2>
            <div class="space-y-4 text-lg leading-relaxed text-slate-700 [text-wrap:pretty]">
              <p>
                When <span class="font-semibold text-blue-600">Omar Ghabayen</span> moved from Jordan to study at Carnegie Mellon, his family sent money to help with expenses. Every single transfer lost <span class="font-semibold text-blue-600">$30 to hidden fees</span> $15 at each bank.
              </p>
              <p>
                For a student on a tight budget, that wasn't pocket change—it was two weeks of groceries or a textbook. Back in Jordan, $30 is a family's weekly groceries.
              </p>
              <p>
                That frustration led to building Remit-Scout: a completely transparent platform where <span class="font-semibold">providers can't pay to rank higher</span>. We show you which option gets the most money to your recipient.
              </p>
            </div>

            <div class="mt-8 flex flex-wrap gap-6">
              <div class="flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <span class="text-2xl">🎓</span>
                </div>
                <div>
                  <div class="text-sm text-slate-600">
                    Founded by
                  </div>
                  <div class="font-semibold text-slate-900">
                    Carnegie Mellon Graduate
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <span class="text-2xl">🌍</span>
                </div>
                <div>
                  <div class="text-sm text-slate-600">
                    Built for
                  </div>
                  <div class="font-semibold text-slate-900">
                    Expats, by expats
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div class="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-xl lg:p-8">
              <h3 class="mb-6 text-center text-xl font-bold text-slate-900">
                The $30 Problem
              </h3>

              <div class="space-y-4 [text-wrap:pretty]">
                <div class="rounded-xl border-2 border-red-200 bg-red-50 p-4">
                  <div class="mb-2 text-sm font-semibold text-red-900">
                    ❌ Traditional Banks
                  </div>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span>Amount sent:</span>
                      <span class="font-semibold">$300</span>
                    </div>
                    <div class="flex justify-between text-red-600">
                      <span>Sending fee:</span>
                      <span class="font-semibold">-$15</span>
                    </div>
                    <div class="flex justify-between text-red-600">
                      <span>Receiving fee:</span>
                      <span class="font-semibold">-$15</span>
                    </div>
                    <div class="flex justify-between border-t border-red-200 pt-2">
                      <span class="font-bold">Received:</span>
                      <span class="font-bold text-red-600">$270</span>
                    </div>
                  </div>
                </div>

                <div class="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4">
                  <div class="mb-2 text-sm font-semibold text-emerald-900">
                    ✅ Using Remit-Scout
                  </div>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span>Amount sent:</span>
                      <span class="font-semibold">$300</span>
                    </div>
                    <div class="flex justify-between text-emerald-600">
                      <span>Total fees:</span>
                      <span class="font-semibold">-$3</span>
                    </div>
                    <div class="flex justify-between text-slate-400">
                      <span>Hidden fees:</span>
                      <span class="font-semibold">$0</span>
                    </div>
                    <div class="flex justify-between border-t border-emerald-200 pt-2">
                      <span class="font-bold">Received:</span>
                      <span class="font-bold text-emerald-600">$297</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-6 rounded-xl bg-blue-50 p-4 text-center">
                <div class="text-3xl font-bold text-blue-600">
                  $27 saved
                </div>
                <div class="text-sm text-slate-600">
                  per transfer
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Learn More CTA -->
      <section class="rounded-3xl bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-center text-white shadow-2xl lg:p-12">
        <h2 class="mb-3 text-3xl font-bold lg:text-4xl">
          Want to dive deeper?
        </h2>
        <p class="mx-auto mb-8 max-w-2xl text-lg text-blue-100 [text-wrap:pretty]">
          Explore our in-depth guides, country playbooks, and expert insights on everything expat life.
        </p>
        <div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <NuxtLink
            to="/learn"
            class="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 text-lg font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
          >
            Browse All Guides
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
          <NuxtLink
            to="/contact"
            class="inline-flex items-center gap-2 rounded-lg border-2 border-blue-400 bg-blue-700/50 px-8 py-4 text-lg font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Contact Support
          </NuxtLink>
        </div>
      </section>
    </div>

    <!-- Trust Metrics / Statistics Strip -->
    <TrustMetricsStrip />
  </div>
</template>

<script setup lang="ts">
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import FaqAccordion from '~/components/shared/FaqAccordion.vue'
import CompareWidget from '~/components/shared/CompareWidget.vue'
import TrustMetricsStrip from '~/components/home/TrustMetricsStrip.vue'
import { useStructuredData } from '~/composables/useStructuredData'
import { setSeo } from '~/composables/useSeo'

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Frequently Asked Questions', path: '/faq' },
]

// Money Transfer Basics FAQs
const transferBasicsFaqs = [
  {
    question: 'How does international money transfer work?',
    answer: '<p>International money transfers allow you to send funds from your account to a recipient in another country. The provider converts your currency to the recipient\'s currency using an exchange rate, then delivers it to their bank account, mobile wallet, or for cash pickup.</p><p class="mt-2">Modern online services can complete transfers in minutes to hours, while traditional banks may take 3-5 business days.</p>',
  },
  {
    question: 'What\'s the difference between a transfer fee and an exchange rate markup?',
    answer: '<p>A <strong>transfer fee</strong> is the upfront charge you see (e.g., $5.99). An <strong>exchange rate markup</strong> is hidden in the rate they offer you versus the real "mid-market" rate.</p><p class="mt-2">For example: Real rate is 1.00, provider gives you 0.98 = 2% markup. On $1,000, that\'s $20 hidden. Always check "Total Received" to see the true cost.</p>',
  },
  {
    question: 'How long does an international transfer take?',
    answer: '<p>Speed varies by method:</p><ul class="list-disc pl-5 space-y-1 mt-2"><li><strong>Instant (0-30 min):</strong> Debit card to mobile wallet</li><li><strong>Same day:</strong> Many online providers to bank accounts</li><li><strong>1-3 days:</strong> Bank transfers, ACH</li><li><strong>3-5 days:</strong> Traditional banks, wire transfers</li></ul><p class="mt-2">Weekends and holidays can add delays.</p>',
  },
  {
    question: 'What details do I need to send money?',
    answer: '<p>You typically need:</p><ul class="list-disc pl-5 space-y-1 mt-2"><li>Recipient\'s full name (as on their ID)</li><li>For bank: Account number + routing/SWIFT/IBAN code</li><li>For cash pickup: Just name and location</li><li>For mobile wallet: Phone number</li></ul>',
  },
  {
    question: 'Are there limits on how much I can send?',
    answer: '<p>Yes, limits vary by provider and your verification level:</p><ul class="list-disc pl-5 space-y-1 mt-2"><li><strong>Unverified:</strong> $500-$1,000</li><li><strong>Email verified:</strong> $2,500-$5,000</li><li><strong>ID verified:</strong> $10,000-$50,000+</li></ul><p class="mt-2">Banks typically allow higher amounts but charge more.</p>',
  },
  {
    question: 'Can I track my transfer?',
    answer: '<p>Yes! All modern providers offer tracking via app or website. You\'ll get updates when:</p><ul class="list-disc pl-5 space-y-1 mt-2"><li>Transfer is initiated</li><li>Funds are received by provider</li><li>Currency is exchanged</li><li>Money is available to recipient</li></ul>',
  },
  {
    question: 'What happens if my transfer fails?',
    answer: '<p>Transfers can fail due to incorrect details, compliance checks, or recipient bank issues. If this happens:</p><ul class="list-disc pl-5 space-y-1 mt-2"><li>You\'ll be notified immediately</li><li>Funds are refunded to your original payment method</li><li>Refunds typically take 3-5 business days</li><li>Fees are usually refunded</li></ul>',
  },
  {
    question: 'Is it cheaper to send large amounts?',
    answer: '<p>Generally, yes. Many providers charge a percentage fee (e.g., 1%), so larger amounts cost more in absolute terms but the same percentage. However:</p><ul class="list-disc pl-5 space-y-1 mt-2"><li>Fixed fees ($5) are better for large amounts</li><li>Some providers offer better rates for $5,000+</li><li>Banks may have flat wire fees that benefit large transfers</li></ul>',
  },
]

// Banking Abroad FAQs
const bankingFaqs = [
  {
    question: 'Can I open a bank account abroad as a non-resident?',
    answer: '<p>It depends on the country and bank. Traditional banks often require proof of local address, employment, or residency visa. However, <strong>digital banks (neobanks)</strong> typically make it much easier:</p><ul class="list-disc pl-5 space-y-1 mt-2"><li>Open accounts remotely</li><li>Multi-currency support</li><li>No minimum balance</li><li>Lower fees than traditional banks</li></ul>',
  },
  {
    question: 'What is a multi-currency account?',
    answer: '<p>A multi-currency account lets you hold, send, and receive money in multiple currencies (USD, EUR, GBP, etc.) within one account. Benefits include:</p><ul class="list-disc pl-5 space-y-1 mt-2"><li>Avoid conversion fees when traveling</li><li>Lock in good exchange rates</li><li>Get local account details (IBAN, routing numbers)</li><li>Popular with freelancers and expats</li></ul>',
  },
  {
    question: 'Do I need to close my home country bank account?',
    answer: '<p><strong>No, and you shouldn\'t!</strong> Keep your home account for:</p><ul class="list-disc pl-5 space-y-1 mt-2"><li>Receiving income (salary, investments)</li><li>Maintaining credit history</li><li>Paying bills back home</li><li>Emergency access to funds</li></ul><p class="mt-2">Use a neobank or local account for day-to-day expenses abroad.</p>',
  },
  {
    question: 'What should I look for when choosing a bank as an expat?',
    answer: '<p>Consider these factors when choosing a bank abroad:</p><ul class="list-disc pl-5 space-y-1 mt-2"><li><strong>Multi-currency support:</strong> Hold and exchange multiple currencies without high fees</li><li><strong>Low fees:</strong> Minimal transaction fees and favorable exchange rates</li><li><strong>Global access:</strong> ATM access worldwide with low or no withdrawal fees</li><li><strong>Remote account opening:</strong> Ability to open accounts without local residency</li><li><strong>Digital features:</strong> Mobile banking, instant notifications, and online account management</li></ul>',
  },
  {
    question: 'How do I avoid foreign transaction fees?',
    answer: '<p>Foreign transaction fees (1-3%) add up fast. Avoid them by:</p><ul class="list-disc pl-5 space-y-1 mt-2"><li>Using a neobank debit card with no foreign transaction fees</li><li>Credit cards with no foreign fees</li><li>Withdraw large amounts less frequently</li><li>Pay in local currency instead of your home currency</li></ul>',
  },
  {
    question: 'Can I get a mortgage or loan abroad?',
    answer: '<p>Yes, but it\'s harder as a foreigner. You typically need:</p><ul class="list-disc pl-5 space-y-1 mt-2"><li>Residency permit or work visa</li><li>Local employment or income proof</li><li>Down payment (20-40% vs. 10-20% for locals)</li><li>Higher interest rates</li></ul><p class="mt-2">Some countries (Portugal, Spain) offer favorable terms to attract foreign investors.</p>',
  },
  {
    question: 'What documents do I need to open a bank account abroad?',
    answer: '<p>Standard requirements:</p><ul class="list-disc pl-5 space-y-1 mt-2"><li>Passport or national ID</li><li>Proof of address (utility bill, lease)</li><li>Visa or residency permit</li><li>Tax identification number</li><li>Reference letter from your home bank (sometimes)</li></ul>',
  },
]

// Staying Connected FAQs
const connectivityFaqs = [
  {
    question: 'What is an eSIM and how does it work?',
    answer: '<p>An <strong>eSIM</strong> is a digital SIM card embedded in your phone. Instead of swapping physical SIM cards, you download a data plan and activate it instantly. Perfect for travelers who want local data without buying physical SIMs.</p><p class="mt-2">Supported by iPhone XS+, recent Samsung, Google Pixel, and most flagships from 2020+.</p>',
  },
  {
    question: 'Do I need an eSIM or should I buy a local SIM?',
    answer: '<p><strong>eSIM is better if:</strong></p><ul class="list-disc pl-5 space-y-1 mt-2"><li>You travel frequently</li><li>Visiting multiple countries</li><li>Need data immediately upon landing</li><li>Want to keep your home number active</li></ul><p class="mt-2"><strong>Local SIM is better if:</strong></p><ul class="list-disc pl-5 space-y-1 mt-2"><li>Staying long-term (3+ months)</li><li>Need a local phone number for calls</li><li>Your phone doesn\'t support eSIM</li></ul>',
  },
  {
    question: 'How much data do I need while traveling?',
    answer: '<p>Depends on usage:</p><ul class="list-disc pl-5 space-y-1 mt-2"><li><strong>Light (1-3 GB):</strong> Maps, messaging, emails</li><li><strong>Medium (5-10 GB):</strong> Social media, browsing, video calls</li><li><strong>Heavy (20+ GB):</strong> Streaming, hotspot, work</li></ul><p class="mt-2">Tip: Use Wi-Fi at hotels/cafes to conserve data.</p>',
  },
  {
    question: 'Can I use my home SIM abroad?',
    answer: '<p>Yes, but it\'s expensive. Roaming charges can be $10-15/day. Some carriers offer international plans ($5-10/day), but eSIM or local SIM is still cheaper for trips longer than 3 days.</p>',
  },
  {
    question: 'Which eSIM provider is best?',
    answer: '<p>Top eSIM providers:</p><ul class="list-disc pl-5 space-y-1 mt-2"><li><strong>Airalo:</strong> Best global coverage, cheapest</li><li><strong>Holafly:</strong> Unlimited data options</li><li><strong>Nomad:</strong> Best for Asia</li><li><strong>GigSky:</strong> Best for business travelers</li></ul>',
  },
  {
    question: 'How do I set up an eSIM?',
    answer: '<p>Setting up an eSIM is simple:</p><ol class="list-decimal pl-5 space-y-1 mt-2"><li>Buy an eSIM plan from a provider</li><li>Scan the QR code they send</li><li>Install the eSIM profile on your phone</li><li>Activate it (usually instant)</li><li>Switch to eSIM in settings</li></ol><p class="mt-2">Takes 2-5 minutes total.</p>',
  },
  {
    question: 'Can I have multiple eSIMs on one phone?',
    answer: '<p>Yes! Most modern phones can store 5-10 eSIM profiles but only use 1-2 at a time (dual SIM). This is perfect for travelers who want a home eSIM + travel eSIM active simultaneously.</p>',
  },
]

// Health & Insurance FAQs
const insuranceFaqs = [
  {
    question: 'Do I need international health insurance?',
    answer: '<p><strong>Yes, in most cases.</strong> Your domestic insurance likely won\'t cover you abroad. International health insurance provides:</p><ul class="list-disc pl-5 space-y-1 mt-2"><li>Coverage in your destination country</li><li>Emergency medical evacuation</li><li>Prescription medications</li><li>Routine checkups and dental</li></ul><p class="mt-2">Many countries require proof of insurance for visa applications.</p>',
  },
  {
    question: 'What\'s the difference between travel and expat insurance?',
    answer: '<p><strong>Travel insurance:</strong> Short-term (days to months), covers emergencies only, cheaper.</p><p class="mt-2"><strong>Expat/international insurance:</strong> Long-term (1+ years), comprehensive coverage including routine care, more expensive but necessary for residency visas.</p>',
  },
  {
    question: 'How much does international health insurance cost?',
    answer: '<p>Varies widely by age, coverage, and location:</p><ul class="list-disc pl-5 space-y-1 mt-2"><li><strong>Basic (emergency only):</strong> $50-100/month</li><li><strong>Comprehensive (incl. dental, vision):</strong> $200-500/month</li><li><strong>Premium (USA coverage):</strong> $500-1,500/month</li></ul><p class="mt-2">Younger travelers pay less; USA coverage is most expensive.</p>',
  },
  {
    question: 'Does travel insurance cover COVID-19?',
    answer: '<p>Most modern travel insurance plans now cover COVID-19 for:</p><ul class="list-disc pl-5 space-y-1 mt-2"><li>Medical treatment abroad</li><li>Emergency evacuation</li><li>Trip cancellation (if you test positive)</li></ul><p class="mt-2">However, coverage varies by provider—always read the fine print.</p>',
  },
  {
    question: 'What is medical evacuation insurance?',
    answer: '<p>Medical evacuation (medevac) insurance covers the cost of emergency transport to a hospital equipped to treat you. This can cost $50,000-$200,000+ if you need to be flown from a remote location or developing country to a major hospital.</p><p class="mt-2">Essential if traveling to remote areas or countries with limited medical facilities.</p>',
  },
  {
    question: 'Can I buy insurance after arriving abroad?',
    answer: '<p>Some providers allow it, but coverage may not start immediately (7-30 day waiting period). It\'s always better to buy insurance <strong>before</strong> you leave to ensure coverage from day one and avoid issues with pre-existing conditions.</p>',
  },
  {
    question: 'Do I need insurance if my destination has free healthcare?',
    answer: '<p>Even in countries with public healthcare (UK NHS, Canada), you may:</p><ul class="list-disc pl-5 space-y-1 mt-2"><li>Not qualify as a non-resident</li><li>Face long wait times</li><li>Need to pay upfront and file for reimbursement</li></ul><p class="mt-2">Private insurance gives you access to faster, better care.</p>',
  },
]

// SEO & Structured Data
const { addFAQSchema, addBreadcrumbSchema } = useStructuredData()
const { public: { siteUrl } } = useRuntimeConfig()

setSeo({
  title: 'International Money Transfer FAQ & Expat Guide | Remit-Scout',
  description: 'Complete guide to sending money internationally, banking abroad, eSIMs, and expat insurance. Get answers from someone who\'s been there.',
  canonical: `${siteUrl}/faq`,
  ogImage: `${siteUrl}/images/og/faq.jpg`,
})

addBreadcrumbSchema([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'FAQ', url: `${siteUrl}/faq` },
])

// Combine all FAQs for schema
const allFaqs = [
  ...transferBasicsFaqs,
  ...bankingFaqs,
  ...connectivityFaqs,
  ...insuranceFaqs,
]

addFAQSchema(allFaqs.map(f => ({
  question: f.question,
  answer: f.answer.replace(/<[^>]*>/g, ''),
})))
</script>
