<template>
  <div class="min-h-screen bg-gray-100 py-8">
    <div class="mx-auto max-w-4xl px-4">
      <div class="mb-8">
        <NuxtLink
          to="/dashboard"
          class="text-brand-600 hover:underline text-sm font-medium"
        >
          ← Back to dashboard
        </NuxtLink>
        <h1 class="mt-2 text-2xl font-bold text-neutral-800">
          Alert email preview
        </h1>
        <p class="mt-1 text-sm text-neutral-600">
          This is the full email users receive when a rate alert fires.
        </p>
      </div>

      <div
        class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg"
        style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;"
      >
        <div
          class="p-4 text-sm text-neutral-500 border-b border-neutral-200 bg-neutral-50"
        >
          <strong>From:</strong> Remit-Scout Alerts &lt;alerts@remitscout.com&gt; · <strong>Subject:</strong> Rate Alert: {{ sampleMessage }}
        </div>

        <div
          class="bg-[#f4f6fb] p-6 md:p-8"
          style="background-color: #f4f6fb;"
        >
          <div
            class="mx-auto max-w-[600px] rounded-2xl border border-[#e6edf5] bg-white shadow-lg overflow-hidden"
            style="max-width: 600px; background: #ffffff; border: 1px solid #e6edf5; border-radius: 16px; box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);"
          >
            <div
              class="px-8 py-7 text-white"
              style="background: #1d4ed8; color: #ffffff; padding: 28px 32px;"
            >
              <div
                class="text-xs uppercase tracking-widest opacity-85"
                style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; opacity: 0.85;"
              >
                Remit-Scout
              </div>
              <div
                class="mt-1.5 text-2xl font-bold"
                style="font-size: 24px; font-weight: 700; margin-top: 6px;"
              >
                Rate Alert
              </div>
              <div
                class="mt-2 text-sm opacity-85"
                style="font-size: 13px; margin-top: 8px; opacity: 0.85;"
              >
                {{ summaryTarget }}
              </div>
            </div>

            <div
              class="px-8 py-7"
              style="padding: 24px 32px 28px;"
            >
              <div
                class="rounded-xl border border-[#e6edf5] bg-[#f7f9fc] px-[18px] py-4 text-[15px] leading-relaxed"
                style="background: #f7f9fc; border: 1px solid #e6edf5; border-radius: 12px; padding: 16px 18px; font-size: 15px; line-height: 1.6;"
              >
                {{ sampleMessage }}
              </div>

              <table
                class="mt-[18px] w-full text-[13px] border-collapse"
                style="margin-top: 18px; font-size: 13px; border-collapse: collapse;"
                role="presentation"
              >
                <tbody>
                  <tr>
                    <td
                      class="py-1.5 pr-2 align-top font-semibold text-[#52616b] w-[32%]"
                      style="padding: 6px 0; color: #52616b; width: 32%; font-weight: 600; vertical-align: top;"
                    >
                      Metric
                    </td>
                    <td
                      class="py-1.5 text-[#1f2933] align-top"
                      style="padding: 6px 0; color: #1f2933; vertical-align: top;"
                    >
                      Recipient gets
                    </td>
                  </tr>
                  <tr>
                    <td
                      class="py-1.5 pr-2 align-top font-semibold text-[#52616b]"
                      style="padding: 6px 0; color: #52616b; font-weight: 600; vertical-align: top;"
                    >
                      Condition
                    </td>
                    <td
                      class="py-1.5 text-[#1f2933] align-top"
                      style="padding: 6px 0; color: #1f2933; vertical-align: top;"
                    >
                      at least
                    </td>
                  </tr>
                  <tr>
                    <td
                      class="py-1.5 pr-2 align-top font-semibold text-[#52616b]"
                      style="padding: 6px 0; color: #52616b; font-weight: 600; vertical-align: top;"
                    >
                      Threshold
                    </td>
                    <td
                      class="py-1.5 text-[#1f2933] align-top"
                      style="padding: 6px 0; color: #1f2933; vertical-align: top;"
                    >
                      1,200
                    </td>
                  </tr>
                  <tr>
                    <td
                      class="py-1.5 pr-2 align-top font-semibold text-[#52616b]"
                      style="padding: 6px 0; color: #52616b; font-weight: 600; vertical-align: top;"
                    >
                      Current value
                    </td>
                    <td
                      class="py-1.5 text-[#1f2933] align-top"
                      style="padding: 6px 0; color: #1f2933; vertical-align: top;"
                    >
                      1,215
                    </td>
                  </tr>
                  <tr>
                    <td
                      class="py-1.5 pr-2 align-top font-semibold text-[#52616b]"
                      style="padding: 6px 0; color: #52616b; font-weight: 600; vertical-align: top;"
                    >
                      Corridor
                    </td>
                    <td
                      class="py-1.5 text-[#1f2933] align-top"
                      style="padding: 6px 0; color: #1f2933; vertical-align: top;"
                    >
                      USD → MXN (bank)
                    </td>
                  </tr>
                </tbody>
              </table>

              <div
                class="mt-5"
                style="margin-top: 20px;"
              >
                <NuxtLink
                  to="/dashboard?tab=alerts"
                  class="inline-block rounded-[10px] bg-[#1d4ed8] px-5 py-3 text-sm font-semibold text-white no-underline"
                  style="display: inline-block; padding: 12px 20px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; background: #1d4ed8; border-radius: 10px;"
                >
                  View Alert
                </NuxtLink>
              </div>

              <div
                class="mt-5 border-t border-[#e6edf5] pt-4 text-xs text-[#6b7785] leading-relaxed"
                style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e6edf5; font-size: 12px; color: #6b7785; line-height: 1.6;"
              >
                <div>
                  Recipient gets at least 1,200 · Corridor: USD → MXN (bank)
                </div>
                <div
                  class="mt-2.5"
                  style="margin-top: 10px;"
                >
                  <NuxtLink
                    to="/dashboard?tab=account&section=notifications"
                    class="text-[#6b7785] underline"
                    style="color: #6b7785; text-decoration: underline;"
                  >
                    Manage notification preferences
                  </NuxtLink>
                  <span class="mx-1"> · </span>
                  <span class="text-[#6b7785] underline cursor-default">
                    Unsubscribe
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

useHead({
  title: 'Alert email preview | Remit-Scout',
})

const sampleMessage = 'Recipient gets crossed above 1,200 USD. The best provider for USD → MXN (bank) now delivers at least this amount.'
const summaryTarget = 'USD → MXN (bank)'
</script>
