<script setup lang="ts">
import { setSeo } from '~/composables/useSeo'

const { public: { siteUrl } } = useRuntimeConfig()
const { request } = useApi()

type ComplianceStatusResponse = {
  certifications?: {
    soc2_type_ii?: {
      status?: string
      report_date?: string | null
      report_state?: string
      report_url?: string | null
      expires_on?: string | null
    }
  }
}

const { data: complianceStatus } = await useAsyncData<ComplianceStatusResponse>(
  'institutions-compliance-status',
  async () => {
    try {
      return await request<ComplianceStatusResponse>('/compliance/status', { method: 'GET' })
    }
    catch {
      return {
        certifications: {
          soc2_type_ii: {
            status: 'in_progress',
          },
        },
      }
    }
  },
  {
    default: () => ({
      certifications: {
        soc2_type_ii: {
          status: 'in_progress',
        },
      },
    }),
  },
)

const soc2StatusLabel = computed(() => {
  const status = (complianceStatus.value?.certifications?.soc2_type_ii?.status || 'in_progress').toLowerCase()
  const reportState = (complianceStatus.value?.certifications?.soc2_type_ii?.report_state || '').toLowerCase()
  if (reportState === 'audited') {
    return 'SOC 2 Type II status: audited.'
  }
  if (status === 'compliant') return 'SOC 2 Type II status: compliant.'
  if (status === 'not_started') return 'SOC 2 Type II status: not started.'
  if (status === 'not_applicable') return 'SOC 2 Type II status: not applicable.'
  return 'SOC 2 Type II status: in progress.'
})

const mailtoHref = 'mailto:support@remit-scout.com?subject=Institutional%20inquiry'

setSeo({
  title: 'Security & Compliance (NDA) | Remit-Scout',
  description: 'Security and compliance documentation available upon request.',
  canonical: `${siteUrl}/institutions/compliance`,
  noindex: true,
  ogImage: false,
})

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Institutions', path: '/institutions' },
  { name: 'Security & compliance', path: '/institutions/compliance' },
]
</script>

<template>
  <div class="min-h-screen bg-neutral-50">
    <section class="py-10 sm:py-14">
      <div class="mx-auto max-w-page px-page-x">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-8 rounded-3xl border border-rs-border bg-surface p-8 sm:p-10 shadow-sm">
          <p class="text-body-sm font-semibold text-brand-600 uppercase tracking-wide mb-3">
            Security & compliance
          </p>
          <h1 class="text-h2 font-bold text-rs-fg mb-4 leading-tight">
            Institutional access
          </h1>
          <p class="text-body text-neutral-700 leading-relaxed mb-3">
            Security and compliance documentation available upon request.
          </p>
          <p class="text-body text-neutral-700 leading-relaxed mb-8">
            {{ soc2StatusLabel }}
          </p>

          <div class="flex flex-wrap gap-3">
            <a
              :href="mailtoHref"
              class="inline-flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-body font-semibold text-white shadow-sm motion-safe:transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 focus:ring-offset-neutral-50"
            >
              Contact us
            </a>
            <a
              :href="mailtoHref"
              class="inline-flex items-center justify-center rounded-xl border border-rs-border bg-surface px-6 py-3 text-body font-semibold text-neutral-800 motion-safe:transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 focus:ring-offset-neutral-50"
            >
              support@remit-scout.com
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
