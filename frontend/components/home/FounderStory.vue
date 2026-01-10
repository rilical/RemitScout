<template>
  <section class="py-12 sm:py-16 bg-gradient-to-br from-neutral-50 to-white">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <!-- Left: Story -->
        <div>
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 rounded-full mb-6">
            <svg class="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span class="text-lg sm:text-xl font-semibold text-brand-700">The Story Behind Remit-Scout</span>
          </div>

          <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-6">
            $30 Shouldn't Disappear Into <span class="whitespace-nowrap">Thin Air</span>
          </h2>
          <div class="space-y-4 text-lg text-neutral-700 leading-relaxed">
            <p>
              When <span class="font-semibold text-brand-600">Omar Ghabayen</span> moved from Jordan to study at <span class="font-semibold whitespace-nowrap">Carnegie Mellon University</span>, his family would send him pocket money to help with expenses.
            </p>

            <p>
              Every single time, <span class="font-semibold text-brand-600">$30 vanished</span>. $15 disappeared at the sending bank in Jordan, another $15 at his receiving bank in the US. For a student living on a tight budget, that wasn't just pocket change it was <span class="font-semibold">two weeks of groceries</span>, or <span class="font-semibold">a textbook</span>, or <span class="font-semibold">a tank of gas</span>.
            </p>

            <p>
              Back home in Jordan, $30 goes even further. It's <span class="font-semibold text-brand-600">a family's weekly groceries</span>, or <span class="font-semibold">three days of wages</span> for many workers. Omar realized: what seems like pocket change in one country can make a real difference in another.
            </p>

            <p>
              That frustration led to building <span class="font-semibold text-brand-600">Remit-Scout</span>, a completely transparent comparison platform where <span class="font-semibold">providers can't pay to rank higher</span>. We just show you which option gets the most money to your recipient, because every dollar matters when you're sending money home.
            </p>
          </div>

          <div class="mt-8">
            <div class="flex items-center gap-3">
              <div>
                <div class="text-sm text-neutral-600">
                  Founded by
                </div>
                <div class="font-semibold text-neutral-900">
                  Carnegie Mellon Graduate
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Visual Impact -->
        <div class="relative">
          <!-- Main card -->
          <div class="bg-white rounded-3xl border-2 border-neutral-200 p-8 shadow-2xl relative z-10">
            <div class="text-center mb-6">
              <h1 class="text-3xl font-bold text-brand-600 mb-3">
                The $30 Problem
              </h1>
              <h2 class="text-xl font-semibold text-neutral-600">
                Hidden fees on every transfer
              </h2>
            </div>

            <!-- Before/After comparison -->
            <div class="space-y-4">
              <div class="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span class="text-sm font-semibold text-red-900">Traditional Banks</span>
                  </div>
                </div>
                <div class="space-y-2 text-sm text-neutral-700">
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
                  <div class="pt-2 border-t border-red-200 flex justify-between">
                    <span class="font-bold">Received:</span>
                    <span class="font-bold text-red-600">$270</span>
                  </div>
                </div>
              </div>

              <div class="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span class="text-sm font-semibold text-emerald-900">Using Remit-Scout</span>
                  </div>
                </div>
                <div class="space-y-2 text-sm text-neutral-700">
                  <div class="flex justify-between">
                    <span>Amount sent:</span>
                    <span class="font-semibold">$300</span>
                  </div>
                  <div class="flex justify-between text-emerald-600">
                    <span>Total fees:</span>
                    <span class="font-semibold">-$3</span>
                  </div>
                  <div class="flex justify-between text-neutral-400">
                    <span>Hidden fees:</span>
                    <span class="font-semibold">$0</span>
                  </div>
                  <div class="pt-2 border-t border-emerald-200 flex justify-between">
                    <span class="font-bold">Received:</span>
                    <span class="font-bold text-emerald-600">$297</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-6 text-center p-4 bg-brand-50 rounded-xl">
              <div class="text-3xl font-bold text-brand-600 mb-1">
                $27 saved
              </div>
              <div class="text-sm text-neutral-600">
                per transfer
              </div>
            </div>
          </div>

          <!-- Floating elements -->
          <div class="absolute -top-6 -right-6 w-32 h-32 bg-brand-100 rounded-full blur-3xl opacity-50" />
          <div class="absolute -bottom-6 -left-6 w-32 h-32 bg-purple-100 rounded-full blur-3xl opacity-50" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
</script>
