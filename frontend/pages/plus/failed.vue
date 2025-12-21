<template>
  <div class="min-h-screen bg-slate-900 flex items-center justify-center py-12 px-4">
    <div class="max-w-2xl w-full">
      <div class="bg-slate-800 rounded-2xl border-2 border-red-500 p-8 sm:p-12 text-center">
        <!-- Error Icon -->
        <div class="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 class="text-4xl font-bold text-white mb-4">
          Payment Failed
        </h1>
        <p class="text-xl text-slate-300 mb-8">
          We were unable to process your payment. Don't worry, you have not been charged.
        </p>

        <!-- Common Reasons -->
        <div class="bg-slate-900 rounded-xl border border-slate-700 p-6 mb-8 text-left">
          <h2 class="text-lg font-bold text-white mb-4 text-center">
            Common Reasons for Payment Failure
          </h2>
          <ul class="space-y-3 text-sm text-slate-300">
            <li class="flex items-start gap-2">
              <svg class="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Insufficient funds in your account</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Incorrect card information or expired card</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Card declined by your bank</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Billing address doesn't match card</span>
            </li>
          </ul>
        </div>

        <!-- What to Do -->
        <div class="bg-slate-900 rounded-xl border border-slate-700 p-6 mb-8 text-left">
          <h2 class="text-lg font-bold text-white mb-4 text-center">
            What You Can Do
          </h2>
          <ul class="space-y-3 text-sm text-slate-300">
            <li class="flex items-start gap-2">
              <svg class="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>Check your card details and try again</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>Try a different payment method</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>Contact your bank to authorize the charge</span>
            </li>
          </ul>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink
            to="/plus/checkout"
            class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg font-semibold shadow-xl hover:shadow-2xl transition-all"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Try Again</span>
          </NuxtLink>
          <NuxtLink
            to="/contact"
            class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-lg font-semibold border-2 border-slate-600 transition-all"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Contact Support</span>
          </NuxtLink>
        </div>

        <div class="mt-8 pt-6 border-t border-slate-700">
          <p class="text-sm text-slate-400">
            Need help? Our support team is here to assist you.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Payment Failed - Remit-Scout Plus',
  meta: [
    { name: 'description', content: 'Payment was unsuccessful' },
  ],
})
</script>






