<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/60 backdrop-blur-sm"
      aria-label="Close dialog"
      @click="$emit('close')"
    />

    <!-- Modal -->
    <div
      ref="modalRef"
      class="relative w-full max-w-lg rounded-2xl border border-neutral-700 bg-neutral-800 shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pulse-share-title"
      tabindex="-1"
      @keydown.esc="$emit('close')"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-neutral-700 px-6 py-4">
        <h2 id="pulse-share-title" class="text-body-lg font-bold text-white">
          {{ modeTitle }}
        </h2>
        <button
          class="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
          aria-label="Close dialog"
          @click="$emit('close')"
        >
          <Icon name="x" :size="20" class="text-current" />
        </button>
      </div>

      <div class="flex border-b border-neutral-700">
        <button
          class="text-body-sm flex-1 px-4 py-3 font-semibold transition-colors"
          :class="
            embedTab === 'iframe'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-neutral-400 hover:text-neutral-200'
          "
          @click="embedTab = 'iframe'"
        >
          Embed Code
        </button>
        <button
          class="text-body-sm flex-1 px-4 py-3 font-semibold transition-colors"
          :class="
            embedTab === 'image'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-neutral-400 hover:text-neutral-200'
          "
          @click="embedTab = 'image'"
        >
          Download Visual
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        <template v-if="embedTab === 'iframe'">
          <p class="mb-4 text-neutral-400">
            Publish a durable static embed and paste this code into your website. Viewers only
            access the public published URL created here.
          </p>

          <!-- Options -->
          <div class="mb-4 flex flex-wrap gap-4">
            <div>
              <label for="pulse-embed-theme" class="text-body-sm mb-1 block text-neutral-400"
                >Theme</label
              >
              <select
                id="pulse-embed-theme"
                v-model="embedTheme"
                class="text-body-sm rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-white focus:border-brand-600 focus:outline-none"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
            <div>
              <label for="pulse-embed-width" class="text-body-sm mb-1 block text-neutral-400"
                >Width</label
              >
              <input
                id="pulse-embed-width"
                v-model="embedWidth"
                type="text"
                class="text-body-sm w-24 rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-white focus:border-brand-600 focus:outline-none"
                placeholder="100%"
              />
            </div>
            <div>
              <label for="pulse-embed-height" class="text-body-sm mb-1 block text-neutral-400"
                >Height</label
              >
              <input
                id="pulse-embed-height"
                v-model="embedHeight"
                type="text"
                class="text-body-sm w-24 rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-white focus:border-brand-600 focus:outline-none"
                placeholder="400"
              />
            </div>
          </div>

          <div class="mb-4">
            <button
              class="text-body-sm inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
              :disabled="embedGenerating"
              @click="publishStaticEmbed"
            >
              {{ embedGenerating ? 'Publishing embed…' : 'Publish Static Embed' }}
            </button>
            <p class="mt-2 text-[11px] text-neutral-500">
              Published embeds are immutable, enterprise-only assets that remain public until you
              revoke them.
            </p>
          </div>

          <div
            v-if="embedPublishedId"
            class="mb-4 rounded-lg border border-success-200 bg-success-50 px-3 py-3 text-[11px] text-success-800"
          >
            <div class="font-semibold">Published embed ready</div>
            <div class="mt-1">
              Published ID: <span class="font-mono">{{ embedPublishedId }}</span>
            </div>
            <div v-if="embedPublishedAt" class="mt-1">
              Published: {{ new Date(embedPublishedAt).toLocaleString() }}
            </div>
          </div>

          <p v-if="embedError" class="text-body-sm mb-3 text-danger-600">
            {{ embedError }}
          </p>

          <!-- Embed Code -->
          <div class="relative">
            <pre
              class="text-body-sm overflow-x-auto rounded-lg border border-neutral-700 bg-neutral-900 p-4 text-neutral-300"
            ><code>{{ embedCode }}</code></pre>
            <button
              class="text-body-sm absolute right-2 top-2 flex items-center gap-1.5 rounded bg-neutral-700 px-2 py-1 text-white transition-colors hover:bg-neutral-600 disabled:opacity-60"
              :disabled="!embedCode"
              @click="copyEmbedCode"
            >
              <Icon :name="copiedEmbed ? 'check' : 'copy'" :size="16" class="text-current" />
              {{ copiedEmbed ? 'Copied!' : 'Copy' }}
            </button>
          </div>

          <!-- Preview -->
          <div class="mt-6">
            <p class="text-body-sm mb-2 text-neutral-400">Preview:</p>
            <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
              <iframe
                v-if="embedUrl"
                :src="embedUrl"
                :width="embedWidth"
                :height="embedHeight"
                frameborder="0"
                style="border-radius: 8px"
              />
              <div
                v-else
                class="text-body-sm flex h-[200px] items-center justify-center text-neutral-500"
              >
                Publish a static embed to preview it here.
              </div>
            </div>
          </div>

          <!-- Attribution note -->
          <p class="mt-4 text-[11px] text-neutral-500">
            Public embeds always render the published static artifact and include a "Powered by
            Remit-Scout" backlink.
          </p>
        </template>

        <template v-else-if="embedTab === 'image'">
          <p class="mb-4 text-neutral-400">
            Download the rendered chart card as PNG, SVG, or PDF. Visual exports preserve legends,
            context, and attribution for reports, media kits, and presentations.
          </p>

          <!-- Image includes -->
          <div class="mb-6 rounded-lg border border-neutral-700 bg-neutral-900 p-4">
            <p class="text-body-sm mb-3 font-semibold text-white">Visual export includes:</p>
            <ul class="text-body-sm space-y-2 text-neutral-400">
              <li class="flex items-center gap-2">
                <span
                  class="flex h-5 w-5 items-center justify-center rounded-full bg-success-600/20 text-success-600"
                >
                  <svg
                    class="h-3 w-3"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                </span>
                Full chart card with legends, notes, and footer attribution
              </li>
              <li class="flex items-center gap-2">
                <span
                  class="flex h-5 w-5 items-center justify-center rounded-full bg-success-600/20 text-success-600"
                >
                  <svg
                    class="h-3 w-3"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                </span>
                Retina-ready PNG and PDF output for reports and slide decks
              </li>
              <li class="flex items-center gap-2">
                <span
                  class="flex h-5 w-5 items-center justify-center rounded-full bg-success-600/20 text-success-600"
                >
                  <svg
                    class="h-3 w-3"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                </span>
                Editable SVG output for editorial and design teams
              </li>
              <li class="flex items-center gap-2">
                <span
                  class="flex h-5 w-5 items-center justify-center rounded-full bg-success-600/20 text-success-600"
                >
                  <svg
                    class="h-3 w-3"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                </span>
                Current corridor and chart metadata exactly as rendered
              </li>
            </ul>
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              v-for="format in visualExportButtons"
              :key="format.value"
              class="text-body-sm rounded-lg bg-brand-600 px-4 py-3 font-bold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="imageExporting || !chartContainerRef"
              @click="downloadVisual(format.value)"
            >
              {{
                imageExporting && activeVisualFormat === format.value
                  ? `Generating ${format.label}...`
                  : `Download ${format.label}`
              }}
            </button>
          </div>

          <p v-if="imageError" class="text-body-sm mt-2 text-danger-600">
            {{ imageError }}
          </p>

          <p v-if="!chartContainerRef" class="mt-2 text-[11px] text-neutral-500">
            Visual export is available when a chart is currently rendered on the page.
          </p>

          <!-- Usage tips -->
          <div class="mt-6 rounded-lg border border-neutral-700 bg-neutral-900 p-4">
            <p class="text-body-sm mb-2 font-semibold text-white">Usage tips for editorial teams</p>
            <ul class="space-y-1 text-[11px] text-neutral-400">
              <li>
                Use PNG for slides, SVG for publication design, and PDF for compliance packets.
              </li>
              <li>Include alt text like: "{{ shareTitle }} — Source: Remit-Scout".</li>
              <li>
                Use the embed code above when you need a static published embed instead of a
                downloadable asset.
              </li>
            </ul>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue';
import type { PulseFilters, TimeRange } from '~/types/pulse';
import { getChartById } from '~/lib/pulseChartRegistry';
import { createPulsePublishedEmbed } from '~/lib/pulseApi';
import { Icon } from '~/ui';
import { useFocusTrap } from '~/composables/useFocusTrap';
import {
  CHART_VISUAL_EXPORT_FORMATS,
  type ChartVisualExportFormat,
  useChartImageExport,
} from '~/composables/useChartImageExport';
import { mapPlanStateFailureMessage } from '~/composables/usePlanStateError';

interface Props {
  chartId: string;
  filters: PulseFilters;
  range?: TimeRange;
  /** Optional ref to the chart container element for image export */
  chartContainerRef?: HTMLElement | null;
}

const props = withDefaults(defineProps<Props>(), {
  range: '30d',
  chartContainerRef: null,
});

defineEmits<{
  close: [];
}>();

const modalRef = ref<HTMLElement | null>(null);
const { activate, deactivate } = useFocusTrap(modalRef);
const copiedEmbed = ref(false);
const embedTheme = ref<'dark' | 'light'>('dark');
const embedWidth = ref('100%');
const embedHeight = ref('400');
const embedTab = ref<'iframe' | 'image'>('iframe');
const embedPublishedId = ref<string | null>(null);
const embedPublishedAt = ref<string | null>(null);
const embedPublicUrl = ref('');
const embedGenerating = ref(false);
const embedError = ref<string | null>(null);
const imageError = ref<string | null>(null);
const activeVisualFormat = ref<ChartVisualExportFormat | null>(null);

const { exportVisual, exporting: imageExporting } = useChartImageExport();
const visualExportButtons: Array<{ value: ChartVisualExportFormat; label: string }> =
  CHART_VISUAL_EXPORT_FORMATS.map(format => ({
    value: format,
    label: format.toUpperCase(),
  }));

const chartMeta = computed(() => getChartById(props.chartId));

const modeTitle = computed(() => {
  return embedTab.value === 'image' ? 'Download Chart Visuals' : 'Publish Static Embed';
});

const baseUrl = computed(() => {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
});

onMounted(async () => {
  await nextTick();
  activate();
});

onBeforeUnmount(() => {
  deactivate();
});

const corridorLabel = computed(() => {
  if (props.filters.corridor === 'global') return 'Global';
  return props.filters.corridor.toUpperCase();
});

const embedUrl = computed(() => {
  if (embedPublicUrl.value) return embedPublicUrl.value;
  if (!embedPublishedId.value) return '';
  const params = new URLSearchParams();
  params.set('published_id', embedPublishedId.value);
  return `${baseUrl.value}/embed/pulse/${props.chartId}?${params.toString()}`;
});

const embedCode = computed(() => {
  if (!embedUrl.value) return '';
  return `<iframe
  src="${embedUrl.value}"
  width="${embedWidth.value}"
  height="${embedHeight.value}"
  frameborder="0"
  loading="lazy"
  style="border: 0; border-radius: 8px;"
  title="${shareTitle.value} — Remit-Scout"
  allow="clipboard-write"
></iframe>`;
});

const shareTitle = computed(() => {
  return chartMeta.value?.title || 'Remit-Pulse Chart';
});

const resetPublishedEmbed = () => {
  embedPublishedId.value = null;
  embedPublishedAt.value = null;
  embedPublicUrl.value = '';
  copiedEmbed.value = false;
  embedError.value = null;
};

watch(
  () => [
    props.chartId,
    props.filters.corridor,
    props.filters.corridorId || '',
    props.filters.amount,
    props.filters.fundingMethod,
    props.filters.payoutMethod,
    props.range,
    embedTheme.value,
  ],
  () => {
    if (!embedPublishedId.value && !embedPublicUrl.value) return;
    resetPublishedEmbed();
  },
);

function resolvePublishedEmbedError(error: unknown): string {
  const data =
    error && typeof error === 'object' && 'data' in error
      ? ((error as { data?: Record<string, unknown> }).data ?? null)
      : null;
  if (data?.error === 'published_embed_limit_reached') {
    const max = typeof data.maxPublishedEmbeds === 'number' ? data.maxPublishedEmbeds : 100;
    return `Published embed limit reached. Revoke an existing embed or contact support. Max: ${max}.`;
  }
  return mapPlanStateFailureMessage(error, 'Failed to publish static embed.', {
    enterprise_required:
      'Enterprise embed access is required to publish static Pulse embeds.',
    plan_inactive: 'Your paid plan is inactive. Reactivate billing to publish static embeds.',
    forbidden: 'Enterprise embed access is required to publish static Pulse embeds.',
  });
}

async function publishStaticEmbed() {
  if (embedGenerating.value) return;
  embedGenerating.value = true;
  embedError.value = null;

  try {
    const payoutMethod: 'bank' | 'cash' | 'wallet' =
      props.filters.payoutMethod === 'cash'
        ? 'cash'
        : props.filters.payoutMethod === 'wallet'
          ? 'wallet'
          : 'bank';
    const response = await createPulsePublishedEmbed({
      chart_id: props.chartId,
      corridor: props.filters.corridor,
      corridor_id: props.filters.corridorId || 'US-PH-USD-PHP',
      amount: props.filters.amount,
      funding_method: props.filters.fundingMethod,
      payout_method: payoutMethod,
      range: props.range,
      theme: embedTheme.value,
    });
    embedPublishedId.value = response.publishedId;
    embedPublishedAt.value = response.publishedAt;
    embedPublicUrl.value = response.publicUrl;
  } catch (error) {
    embedError.value = resolvePublishedEmbedError(error);
  } finally {
    embedGenerating.value = false;
  }
}

async function copyEmbedCode() {
  if (!embedUrl.value) {
    embedError.value = 'Publish a static embed before copying embed code.';
    return;
  }
  try {
    await navigator.clipboard.writeText(embedCode.value);
    copiedEmbed.value = true;
    setTimeout(() => {
      copiedEmbed.value = false;
    }, 2000);
  } catch (e) {
    useLogger('PulseShareModal').error('Failed to copy', e);
  }
}

async function downloadVisual(format: ChartVisualExportFormat) {
  if (!props.chartContainerRef) return;
  imageError.value = null;
  activeVisualFormat.value = format;
  try {
    await exportVisual(props.chartContainerRef, {
      title: shareTitle.value,
      subtitle: `${corridorLabel.value} · $${props.filters.amount}`,
      source: `Source: Remit-Scout · remit-scout.com/pulse · ${corridorLabel.value}`,
      filename: `remit-scout-${props.chartId}-${props.filters.corridor}`,
      format,
    });
  } catch (e) {
    imageError.value = e instanceof Error ? e.message : 'Failed to generate visual export.';
  } finally {
    activeVisualFormat.value = null;
  }
}
</script>
