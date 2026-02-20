<template>
  <footer class="bg-neutral-900 text-white">
    <div class="container mx-auto px-4 py-16">
      <div class="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 mb-12">
        <!-- Company Info -->
        <div class="lg:col-span-1">
          <div class="mb-6">
            <NuxtImg
              src="/png/SVG/LOGO.svg"
              alt="RemitScout"
              width="64"
              height="80"
              loading="lazy"
              class="h-20 w-auto mb-4 object-contain"
            />
            <p class="text-body font-bold text-white mb-3">
              Money, made global.
            </p>
            <p class="text-body-sm text-white/70 leading-relaxed max-w-xs">
              Compare rates and fees from 30+ licensed providers. Find the best deal for your international money transfer.
            </p>
          </div>
        </div>

        <!-- Services -->
        <div>
          <h3 class="mb-5 text-body font-semibold text-white tracking-tight">
            Services
          </h3>
          <ul class="space-y-3">
            <li>
              <NuxtLink
                to="/send-money"
                class="text-neutral-400 hover:text-white motion-safe:transition-colors text-body-sm"
              >
                Compare Rates
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/learn/providers"
                class="text-neutral-400 hover:text-white motion-safe:transition-colors text-body-sm"
              >
                Provider Reviews
              </NuxtLink>
            </li>
            <li v-if="pulseEnabled">
              <NuxtLink
                to="/pulse"
                class="text-neutral-400 hover:text-white motion-safe:transition-colors text-body-sm"
              >
                Pulse
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/plus"
                class="text-neutral-400 hover:text-white motion-safe:transition-colors text-body-sm"
              >
                Plus
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Company -->
        <div>
          <h3 class="mb-5 text-body font-semibold text-white tracking-tight">
            Company
          </h3>
          <ul class="space-y-3">
            <li>
              <NuxtLink
                to="/about"
                class="text-neutral-400 hover:text-white motion-safe:transition-colors text-body-sm"
              >
                About Us
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/methodology"
                class="text-neutral-400 hover:text-white motion-safe:transition-colors text-body-sm"
              >
                Methodology
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/contact"
                class="text-neutral-400 hover:text-white motion-safe:transition-colors text-body-sm"
              >
                Contact
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/faq"
                class="text-neutral-400 hover:text-white motion-safe:transition-colors text-body-sm"
              >
                FAQ
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Legal -->
        <div>
          <h3 class="mb-5 text-body font-semibold text-white tracking-tight">
            Legal
          </h3>
          <ul class="space-y-3">
            <li>
              <NuxtLink
                to="/legal/privacy"
                class="text-neutral-400 hover:text-white motion-safe:transition-colors text-body-sm"
              >
                Privacy Policy
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/legal/terms"
                class="text-neutral-400 hover:text-white motion-safe:transition-colors text-body-sm"
              >
                Terms of Service
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/legal/disclosure"
                class="text-neutral-400 hover:text-white motion-safe:transition-colors text-body-sm"
              >
                Affiliate Disclosure
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/legal/how-we-make-money"
                class="text-neutral-400 hover:text-white motion-safe:transition-colors text-body-sm"
              >
                How We Make Money
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/corrections"
                class="text-neutral-400 hover:text-white motion-safe:transition-colors text-body-sm"
              >
                Corrections
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <!-- Institutional Section -->
      <div
        v-if="enterpriseEnabled"
        class="border-t border-white/10 pt-8 mb-8"
      >
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-surface/10">
              <svg
                class="w-5 h-5 text-white/80"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <h3 class="text-body-sm font-semibold text-white">
                For institutions
              </h3>
              <p class="text-body-sm text-white/60">
                Institutional details available under NDA
              </p>
            </div>
          </div>
          <nav
            class="flex flex-wrap items-center gap-x-6 gap-y-2"
            aria-label="Institutional links"
          >
            <NuxtLink
              to="/institutions"
              class="text-body-sm text-neutral-400 hover:text-white motion-safe:transition-colors"
            >
              Institutions
            </NuxtLink>
            <NuxtLink
              to="/methodology"
              class="text-body-sm text-neutral-400 hover:text-white motion-safe:transition-colors"
            >
              Provenance
            </NuxtLink>
          </nav>
        </div>
      </div>

      <div class="pt-8 border-t border-white/20">
        <p class="text-body-sm text-white/50 leading-relaxed mb-6 max-w-3xl">
          Remit-Scout is an independent comparison service. We may earn affiliate commissions when you click provider links and sign up.
          Our editorial content remains unbiased and focused on helping you find the best money transfer solution for your needs.
        </p>

        <div class="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p class="text-body-sm text-white/60">
            © {{ new Date().getFullYear() }} Remit-Scout LLC. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useFeatureFlags } from '~/composables/useFeatureFlags'
import { useCookiePreferencesModal } from '~/composables/useCookiePreferencesModal'

defineEmits<{
  'open-modal': []
}>()

const { pulseEnabled, enterpriseEnabled } = useFeatureFlags()
const { open } = useCookiePreferencesModal()

const openCookiePreferences = () => open()
</script>
