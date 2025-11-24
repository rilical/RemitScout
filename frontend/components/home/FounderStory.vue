<template>
  <section class="py-12 sm:py-16 bg-gradient-to-br from-neutral-50 to-white">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <!-- Left: Story -->
        <div>
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 rounded-full mb-6">
            <span class="text-4xl">💡</span>
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

          <div class="mt-8 flex flex-wrap items-center gap-6">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center">
                <span class="text-2xl">🎓</span>
              </div>
              <div>
                <div class="text-sm text-neutral-600">
                  Founded by
                </div>
                <div class="font-semibold text-neutral-900">
                  Carnegie Mellon Graduate
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center">
                <span class="text-2xl">🌍</span>
              </div>
              <div>
                <div class="text-sm text-neutral-600">
                  Built for
                </div>
                <div class="font-semibold text-neutral-900">
                  Expats, by expats
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
              <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl mb-4 shadow-lg">
                <span class="text-4xl">💸</span>
              </div>
              <h3 class="text-2xl font-bold text-neutral-900 mb-2">
                The $30 Problem
              </h3>
              <p class="text-neutral-600">
                Hidden fees on every transfer
              </p>
            </div>

            <!-- Before/After comparison -->
            <div class="space-y-4">
              <div class="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-semibold text-red-900">❌ Traditional Banks</span>
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
                  <span class="text-sm font-semibold text-emerald-900">✅ Using Remit-Scout</span>
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
