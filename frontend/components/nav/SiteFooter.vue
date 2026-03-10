<template>
  <footer class="bg-neutral-900 text-white">
    <div class="container mx-auto px-4 py-16">
      <div class="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 mb-12">
        <!-- Company Info -->
        <div class="lg:col-span-1">
          <div class="mb-6">
            <NuxtImg
              src="/png/SVG/FULL_LOGO.svg"
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

      <div class="pt-8 border-t border-white/20">
        <p class="text-body-sm text-white/50 leading-relaxed mb-6 max-w-3xl">
          Remit-Scout is an independent comparison service. We may earn affiliate commissions when you click provider links and sign up.
          Our editorial content remains unbiased and focused on helping you find the best money transfer solution for your needs.
        </p>

        <div class="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p class="text-body-sm text-white/60">
            © {{ new Date().getFullYear() }} Remit-Scout LLC. All rights reserved.
          </p>
          <nav
            class="flex items-center gap-4"
            aria-label="Social links"
          >
            <a
              v-if="BRAND.social?.x"
              :href="BRAND.social.x"
              target="_blank"
              rel="noopener noreferrer"
              class="text-white/60 hover:text-white transition-colors"
              aria-label="Remit-Scout on X"
            >
              <svg
                class="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M18.901 1.999H22l-7.518 8.585 8.828 11.416H16.15l-5.12-6.594L5.01 22H2l8.053-9.186L1.5 2h5.9l4.596 5.962L18.901 2Zm-1.04 18.13h1.742L6.79 3.775H4.946l12.915 16.354Z" />
              </svg>
            </a>
            <a
              v-if="BRAND.social?.facebook"
              :href="BRAND.social.facebook"
              target="_blank"
              rel="noopener noreferrer"
              class="text-white/60 hover:text-white transition-colors"
              aria-label="Remit-Scout on Facebook"
            >
              <svg
                class="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M22.676 12.163C22.676 6.56 18.129 2 12.526 2 6.923 2 2.376 6.55 2.376 12.153c0 5.022 3.666 9.198 8.438 9.967v-7.05h-2.54v-2.917h2.54v-2.22c0-2.507 1.493-3.89 3.771-3.89 1.093 0 2.238.194 2.238.194v2.46h-1.26c-1.242 0-1.63.77-1.63 1.56v1.896h2.774l-.443 2.917h-2.331V22c4.772-.77 8.438-4.945 8.438-9.967z" />
              </svg>
            </a>
            <a
              v-if="BRAND.social?.linkedin"
              :href="BRAND.social.linkedin"
              target="_blank"
              rel="noopener noreferrer"
              class="text-white/60 hover:text-white transition-colors"
              aria-label="Remit-Scout on LinkedIn"
            >
              <svg
                class="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M19.4 19.4h-2.8v-4.9c0-1.17-.02-2.68-1.64-2.68-1.64 0-1.89 1.28-1.89 2.59V19.4h-2.8V9.5h2.69v1.35h.04c.37-.7 1.28-1.43 2.63-1.43 2.81 0 3.32 1.85 3.32 4.26V19.4zM7 7.5c-.9 0-1.63-.74-1.63-1.65s.73-1.65 1.63-1.65 1.63.74 1.63 1.65S7.9 7.5 7 7.5zM8.4 19.4H5.6V9.5H8.4v9.9zM20.2 2H3.8C2.81 2 2 2.81 2 3.8v16.4C2 21.19 2.81 22 3.8 22h16.4c.99 0 1.8-.81 1.8-1.8V3.8c0-.99-.81-1.8-1.8-1.8z" />
              </svg>
            </a>
          </nav>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useFeatureFlags } from '~/composables/useFeatureFlags'
import { BRAND } from '~/content/brand'

defineEmits<{
  'open-modal': []
}>()

const { pulseEnabled } = useFeatureFlags()
</script>
