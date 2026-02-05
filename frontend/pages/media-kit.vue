<template>
  <div class="min-h-screen bg-white pb-24 md:pb-0">
    <CompareWidget />

    <!-- Hero -->
    <section class="relative overflow-hidden bg-gradient-to-b from-blue-600 to-blue-700 py-16 lg:py-20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" class="[&_a]:text-blue-100 [&_span]:text-white/60 [&_svg]:text-white" />

        <div class="mt-10 max-w-3xl">
          <h1 class="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Media Kit
          </h1>
          <p class="mt-4 text-xl leading-relaxed text-blue-100">
            Everything journalists, researchers, and partners need to cover RemitScout
          </p>

          <div class="mt-8 flex flex-wrap gap-3">
            <a
              :href="pressKitUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-600 shadow-sm transition-colors hover:bg-blue-50"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Press Kit
            </a>
            <NuxtLink
              to="/contact?type=press"
              class="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-transparent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Press Inquiries
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Quick Stats -->
    <section class="py-12 bg-slate-50 border-b border-slate-200">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">30+</div>
            <div class="text-sm text-slate-600 mt-1">Providers Compared</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">150+</div>
            <div class="text-sm text-slate-600 mt-1">Corridors Tracked</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">Daily</div>
            <div class="text-sm text-slate-600 mt-1">Quote Updates</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">100%</div>
            <div class="text-sm text-slate-600 mt-1">Independent</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <main id="main-content" class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div class="grid gap-12 lg:grid-cols-3">
        <!-- Main Column -->
        <div class="lg:col-span-2 space-y-12">
          <!-- About RemitScout -->
          <section>
            <h2 class="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              About RemitScout
            </h2>
            <div class="prose prose-slate max-w-none">
              <p class="text-slate-700 leading-relaxed">
                RemitScout is an independent comparison platform for international money transfers. We help migrants, expats, and international families find the best rates by focusing on what matters most: <strong>what the recipient actually receives</strong> after fees and FX markup.
              </p>
              <p class="text-slate-700 leading-relaxed">
                Built at Carnegie Mellon's Swartz Center for Entrepreneurship, we maintain a strict no pay-to-rank policy and publish our methodology openly.
              </p>
            </div>
            <div class="mt-6 flex flex-wrap gap-3">
              <a
                :href="companyFactSheetUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Company Fact Sheet
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
              <NuxtLink to="/about" class="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">
                About Page →
              </NuxtLink>
            </div>
          </section>

          <!-- Brand Assets -->
          <section>
            <h2 class="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              Brand Assets
            </h2>
            <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <!-- Logo Preview -->
              <div class="p-8 bg-slate-50 border-b border-slate-200">
                <div class="flex items-center justify-center gap-12">
                  <div class="text-center">
                    <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-3">
                      <img src="/logos/remit-scout.svg" alt="RemitScout Logo" class="h-10" />
                    </div>
                    <span class="text-xs text-slate-500">Light background</span>
                  </div>
                  <div class="text-center">
                    <div class="bg-slate-900 rounded-xl p-6 shadow-sm mb-3">
                      <img src="/logos/remit-scout.svg" alt="RemitScout Logo" class="h-10 brightness-0 invert" />
                    </div>
                    <span class="text-xs text-slate-500">Dark background</span>
                  </div>
                </div>
              </div>
              <!-- Downloads -->
              <div class="p-6 space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-semibold text-slate-900">Logo Files</p>
                    <p class="text-sm text-slate-500">SVG, PNG (all sizes)</p>
                  </div>
                  <a
                    :href="brandAssetsUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </a>
                </div>
                <div class="border-t border-slate-100 pt-4">
                  <p class="text-sm font-semibold text-slate-900 mb-3">Brand Colors</p>
                  <div class="flex flex-wrap gap-3">
                    <div class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                      <span class="h-4 w-4 rounded-full bg-blue-600" />
                      <span class="text-slate-700">Primary Blue</span>
                      <span class="text-slate-400">#2563EB</span>
                    </div>
                    <div class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                      <span class="h-4 w-4 rounded-full bg-blue-700" />
                      <span class="text-slate-700">Dark Blue</span>
                      <span class="text-slate-400">#1D4ED8</span>
                    </div>
                    <div class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                      <span class="h-4 w-4 rounded-full bg-slate-900" />
                      <span class="text-slate-700">Text</span>
                      <span class="text-slate-400">#0F172A</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Boilerplate -->
          <section>
            <h2 class="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              Company Boilerplate
            </h2>
            <div class="space-y-4">
              <div class="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <p class="text-sm font-semibold text-slate-900 mb-2">Short (1 line)</p>
                <p class="text-slate-700">Remit-Scout is an independent comparison platform that exposes the true cost of international transfers—fees, FX spreads, and what the recipient actually receives—so you find the best rate, not the loudest ad.</p>
              </div>
              <div class="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <p class="text-sm font-semibold text-slate-900 mb-2">Standard (2-3 lines)</p>
                <p class="text-slate-700">Remit-Scout is a quantitative comparison engine for cross-border transfers. We aggregate real-time quotes from 30+ providers across 150+ corridors and rank by <strong>Net Delivered Value</strong>—what the recipient actually receives after fees and FX markup. We maintain a strict no pay-to-rank policy, publish our methodology openly, and were built at Carnegie Mellon's Swartz Center for Entrepreneurship.</p>
              </div>
            </div>
          </section>

          <!-- How to Cite -->
          <section>
            <h2 class="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </div>
              How to Cite
            </h2>
            <div class="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div>
                <p class="text-sm font-semibold text-slate-900 mb-2">Index / chart citation (TEER™, RVI™, RCI™)</p>
                <code class="block bg-slate-50 rounded-lg p-3 text-sm text-slate-700 font-mono">
                  Source: Remit-Scout ([TEER|RVI|RCI]) · Synthetic volume weighted · Retrieved [DATE].
                </code>
                <p class="mt-2 text-xs text-slate-500">Use the index name you are citing (TEER, RVI, or RCI). See <NuxtLink to="/methodology" class="text-blue-600 hover:underline">methodology</NuxtLink> for citation requirements.</p>
              </div>
              <div>
                <p class="text-sm font-semibold text-slate-900 mb-2">Chart / visual with link</p>
                <code class="block bg-slate-50 rounded-lg p-3 text-sm text-slate-700 font-mono">
                  Source: Remit-Scout ([TEER|RVI|RCI]) · Synthetic volume weighted · Retrieved [DATE]. Link: [URL]
                </code>
              </div>
              <div>
                <p class="text-sm font-semibold text-slate-900 mb-2">Retail quote / corridor data</p>
                <code class="block bg-slate-50 rounded-lg p-3 text-sm text-slate-700 font-mono">
                  Source: Remit-Scout (observed retail quotes, [CORRIDOR]) · Synthetic volume weighted · Retrieved [DATE].
                </code>
              </div>
              <p class="text-sm text-slate-500">Include retrieval date; our data updates daily. TEER™, RVI™, and RCI™ are trademarks of Remit-Scout.</p>
            </div>
          </section>

          <!-- Data & Licensing -->
          <section>
            <h2 class="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              Data & Licensing
            </h2>
            <div class="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              <div class="p-6">
                <p class="font-semibold text-slate-900 mb-2">Editorial Use</p>
                <p class="text-sm text-slate-600">Quote short excerpts with attribution. Link back when possible.</p>
              </div>
              <div class="p-6">
                <p class="font-semibold text-slate-900 mb-2">Chart Republishing</p>
                <p class="text-sm text-slate-600 mb-3">For republishing charts or embedding widgets, please request permission.</p>
                <NuxtLink
                  to="/contact?type=license"
                  class="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Request License →
                </NuxtLink>
              </div>
              <div class="p-6">
                <p class="font-semibold text-slate-900 mb-2">Data Licensing & Research</p>
                <p class="text-sm text-slate-600 mb-3">For licensing requests, research partnerships, or custom analysis.</p>
                <NuxtLink
                  to="/contact?type=data"
                  class="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Contact Us →
                </NuxtLink>
              </div>
            </div>
          </section>
        </div>

        <!-- Sidebar -->
        <aside class="lg:col-span-1">
          <div class="lg:sticky lg:top-24 space-y-6">
            <!-- Press Contact -->
            <div class="bg-blue-600 rounded-2xl p-6 text-white">
              <h3 class="font-semibold text-lg mb-3">Press Contact</h3>
              <p class="text-blue-100 text-sm mb-4">For media inquiries, interviews, or expert commentary.</p>
              <a :href="`mailto:${pressEmail}`" class="block text-white font-medium hover:text-blue-100 mb-4">
                {{ pressEmail }}
              </a>
              <NuxtLink
                to="/contact?type=press"
                class="block w-full text-center rounded-xl bg-white py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
              >
                Press Inquiry Form
              </NuxtLink>
            </div>

            <!-- Quick Downloads -->
            <div class="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 class="font-semibold text-slate-900 mb-4">Quick Downloads</h3>
              <div class="space-y-3">
                <a
                  :href="pressKitUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p class="font-medium text-slate-900 text-sm">Press Kit</p>
                    <p class="text-xs text-slate-500">Logos, bios, fact sheet</p>
                  </div>
                </a>
                <a
                  :href="brandAssetsUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p class="font-medium text-slate-900 text-sm">Brand Assets</p>
                    <p class="text-xs text-slate-500">Logos in all formats</p>
                  </div>
                </a>
                <a
                  :href="companyFactSheetUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p class="font-medium text-slate-900 text-sm">Fact Sheet</p>
                    <p class="text-xs text-slate-500">Key stats & info</p>
                  </div>
                </a>
              </div>
            </div>

            <!-- Key Links -->
            <div class="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 class="font-semibold text-slate-900 mb-4">Key Links</h3>
              <div class="space-y-2">
                <NuxtLink to="/about" class="block text-sm text-blue-600 hover:text-blue-700 font-medium">
                  About Us →
                </NuxtLink>
                <NuxtLink to="/methodology" class="block text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Methodology →
                </NuxtLink>
                <NuxtLink to="/how-we-make-money" class="block text-sm text-blue-600 hover:text-blue-700 font-medium">
                  How We Make Money →
                </NuxtLink>
                <NuxtLink to="/affiliate-disclosure" class="block text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Affiliate Disclosure →
                </NuxtLink>
              </div>
            </div>

            <!-- Independence Notice -->
            <div class="bg-emerald-50 rounded-2xl border border-emerald-200 p-6">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p class="font-semibold text-emerald-900 text-sm">Independence</p>
                  <p class="text-xs text-emerald-700 mt-1">Rankings are never influenced by affiliate relationships or sponsorships.</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import CompareWidget from '~/components/shared/CompareWidget.vue'
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://remitscout.com'
const canonicalUrl = `${siteUrl}/media-kit`
const lastReviewedIso = '2025-12-20'

setSeo({
  title: 'Media Kit | RemitScout',
  description: 'Press resources, brand assets, and company information for journalists and partners covering RemitScout.',
  canonical: canonicalUrl,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Media Kit', url: canonicalUrl },
])

const hostname = (() => {
  try {
    return new URL(siteUrl).hostname
  }
  catch {
    return 'remitscout.com'
  }
})()

const pressEmail = `press@${hostname}`

const pressKitUrl = 'https://docs.google.com/document/d/YOUR_PRESS_KIT_DOC_ID/edit?usp=sharing'
const brandAssetsUrl = 'https://drive.google.com/drive/folders/YOUR_BRAND_ASSETS_FOLDER_ID?usp=sharing'
const companyFactSheetUrl = 'https://docs.google.com/document/d/YOUR_FACT_SHEET_DOC_ID/edit?usp=sharing'

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  'name': 'RemitScout',
  'url': siteUrl,
  'logo': `${siteUrl}/logos/remit-scout.svg`,
  'contactPoint': [
    {
      '@type': 'ContactPoint',
      'contactType': 'press',
      'email': pressEmail,
      'url': `${siteUrl}/contact?type=press`,
    },
  ],
}

useHead({
  meta: [
    { name: 'author', content: 'RemitScout' },
    { property: 'article:modified_time', content: lastReviewedIso },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(organizationSchema),
    },
  ],
})

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Media Kit', path: '/media-kit' },
]
</script>
