<template>
  <footer class="bg-gray-900 text-white">
    <div class="container mx-auto px-4 py-16">
      <div class="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 mb-12">
        <!-- Company Info -->
        <div class="lg:col-span-1">
          <div class="mb-6">
            <img
              src="/logos/remit-scout.svg"
              alt="RemitScout"
              class="h-8 w-auto mb-3"
            >
            <p class="text-sm text-gray-400 font-medium mb-4">
              For expats, by expats.
            </p>
            <p class="text-sm text-gray-400 leading-relaxed max-w-xs">
              Independent comparison platform helping you find the best rates and lowest fees for international money transfers. Compare 30+ licensed providers in seconds.
            </p>
          </div>
          <div class="flex space-x-5">
            <a
              href="#"
              class="text-gray-400 hover:text-white transition-colors"
              aria-label="Facebook"
            >
              <svg
                class="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z"
                />
              </svg>
            </a>
            <a
              href="#"
              class="text-gray-400 hover:text-white transition-colors"
              aria-label="Twitter"
            >
              <svg
                class="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84"
                />
              </svg>
            </a>
            <a
              href="#"
              class="text-gray-400 hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <svg
                class="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M12.017 0H7.99C3.58 0 0 3.58 0 7.99v4.02c0 4.41 3.58 7.99 7.99 7.99h4.027c4.41 0 7.99-3.58 7.99-7.99V7.99C20.007 3.58 16.427 0 12.017 0zm5.17 12.01c0 2.85-2.32 5.17-5.17 5.17H7.99c-2.85 0-5.17-2.32-5.17-5.17V7.99c0-2.85 2.32-5.17 5.17-5.17h4.027c2.85 0 5.17 2.32 5.17 5.17v4.02z"
                  clip-rule="evenodd"
                />
                <path
                  fill-rule="evenodd"
                  d="M10 5.38a4.62 4.62 0 100 9.24 4.62 4.62 0 000-9.24zm0 7.62a3 3 0 110-6 3 3 0 010 6z"
                  clip-rule="evenodd"
                />
                <circle
                  cx="14.8"
                  cy="5.2"
                  r="1.1"
                />
              </svg>
            </a>
          </div>
        </div>

        <!-- Services -->
        <div>
          <h3 class="mb-5 text-base font-semibold text-white tracking-tight">
            Services
          </h3>
          <ul class="space-y-3">
            <li>
              <NuxtLink
                to="/send-money"
                class="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Money Transfers
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/esim"
                class="text-gray-400 hover:text-white transition-colors text-sm"
              >
                eSIM Cards
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/providers"
                class="text-gray-400 hover:text-white transition-colors text-sm"
              >
                All Providers
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/learn"
                class="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Learn
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Company -->
        <div>
          <h3 class="mb-5 text-base font-semibold text-white tracking-tight">
            Company
          </h3>
          <ul class="space-y-3">
            <li>
              <NuxtLink
                to="/about"
                class="text-gray-400 hover:text-white transition-colors text-sm"
              >
                About Us
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/contact"
                class="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Contact
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/methodology"
                class="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Methodology
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/affiliate-partnerships"
                class="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Partnerships
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/faq"
                class="text-gray-400 hover:text-white transition-colors text-sm"
              >
                FAQ
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Legal -->
        <div>
          <h3 class="mb-5 text-base font-semibold text-white tracking-tight">
            Legal
          </h3>
          <ul class="space-y-3">
            <li>
              <NuxtLink
                to="/legal/privacy"
                class="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Privacy Policy
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/legal/terms"
                class="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Terms of Service
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/legal/disclosure"
                class="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Affiliate Disclosure
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/how-we-make-money"
                class="text-gray-400 hover:text-white transition-colors text-sm"
              >
                How We Make Money
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <div class="pt-8 border-t border-gray-800">
        <p class="text-xs text-gray-500 leading-relaxed mb-6 max-w-3xl">
          Remit-Scout is an independent comparison service. We may earn affiliate commissions when you click provider links and sign up. Our editorial content remains unbiased and focused on helping you find the best money transfer solution for your needs.
        </p>

        <div class="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p class="text-sm text-gray-500">
            © {{ new Date().getFullYear() }} Remit-Scout. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
defineEmits<{
  'open-modal': []
}>()
</script>
