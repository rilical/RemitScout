<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type ComponentPublicInstance } from 'vue'
import { DataTable, Icon } from '~/ui'
import { formatDate, formatRelativeTime } from '~/shared/lib/format'
import { useApi } from '~/composables/useApi'
import { useEntitlements } from '~/composables/useEntitlements'
import { useEnterpriseApiKeys } from '~/composables/useEnterpriseApiKeys'
import { useEnterpriseEmbeds } from '~/composables/useEnterpriseEmbeds'
import { useEnterpriseExports } from '~/composables/useEnterpriseExports'
import {
  CHART_VISUAL_EXPORT_FORMATS,
  type ChartVisualExportFormat,
  useChartImageExport,
} from '~/composables/useChartImageExport'
import { buildCorridorSearchText, formatCorridorCountryPair } from '~/utils/corridorLabels'
import { getCountryByCode } from '~/utils/countries-currencies'
import CountrySelect from '~/components/shared/CountrySelect.vue'

type EmbedVisualKey = 'teer' | 'rci' | 'rvi_bps'
type NoticeTone = 'danger' | 'warning' | 'info'
type EnterpriseExportJobType = 'history' | 'watchlist' | 'alerts' | 'all' | 'indices'
type EnterpriseExportFormat = 'csv' | 'pdf' | 'parquet'

type EnterpriseCorridorRecord = {
  corridorId: string
  sourceCountry: string
  destCountry: string
  sourceCurrency: string
  destCurrency: string
  dataTier: number
  exportCadenceMinutes: number
  collectionCadenceMinutes: number
  collectionTier: 'tier_1' | 'tier_2'
  isUsdOrigin: boolean
  dataPoints: number
  lastUpdated: string | null
}

type EnterpriseCorridorResponse = {
  totalCorridors: number
  corridors: EnterpriseCorridorRecord[]
}

type EnterpriseNotice = {
  tone: NoticeTone
  title: string
  body: string
}

const EXPORT_DELAY_THRESHOLD_MINUTES = 15

const SCOPE_META: Record<string, { label: string, description: string, icon: string }> = {
  'indices:read': { label: 'Market Indices', description: 'TEER, RCI, RVI time-series and latest values for any corridor', icon: 'chart-bar' },
  'corridors:read': { label: 'Corridor Coverage', description: 'Provider coverage, freshness status, and publish-gate metadata per corridor', icon: 'globe-alt' },
  'exports:read': { label: 'Data Exports', description: 'CSV and Parquet bulk extracts of index data (premium tier)', icon: 'arrow-down-tray' },
}

const EXPORT_JOB_TYPE_LABELS: Record<string, string> = {
  history: 'Quote history',
  watchlist: 'Watchlist',
  alerts: 'Alerts',
  all: 'All data',
  indices: 'TEER / RCI / RVI',
  history_csv: 'Quote history CSV',
  history_parquet: 'Quote history Parquet',
  watchlist_csv: 'Watchlist CSV',
  alerts_csv: 'Alerts CSV',
  all_csv: 'All data CSV',
  all_pdf: 'All data PDF',
  all_parquet: 'All data Parquet',
  indices_csv: 'Indices CSV',
  indices_pdf: 'Indices PDF',
  indices_parquet: 'Indices Parquet',
}

const INDEX_DEFINITIONS: Record<string, { full: string, description: string }> = {
  teer: { full: 'Total Effective Exchange Rate', description: 'The all-in rate including fees — what the recipient effectively receives.' },
  rci: { full: 'Remittance Cost Index', description: 'Total cost as a % of send amount — lower is cheaper.' },
  rvi_bps: { full: 'Rate Volatility Index', description: 'Pricing dispersion across providers in basis points — higher means more variation.' },
}

const EXPORT_TYPE_DESCRIPTIONS: Record<string, string> = {
  history: 'Historical rate comparisons across all providers you\'ve checked.',
  watchlist: 'Your saved corridor rates tracked over time.',
  alerts: 'Alert trigger history and rate snapshots.',
  all: 'Complete data export across all categories.',
  indices: 'TEER, RCI, and RVI index time-series for selected corridors.',
}

const windowOptions = [
  { label: '1 week', value: 7 },
  { label: '2 weeks', value: 14 },
  { label: '1 month', value: 30 },
  { label: '2 months', value: 60 },
  { label: '3 months', value: 90 },
]

const themeOptions = [
  { label: 'Dark', value: 'dark' },
  { label: 'Light', value: 'light' },
]

const exportTypeOptions: Array<{ label: string, value: EnterpriseExportJobType }> = [
  { label: 'Quote history', value: 'history' },
  { label: 'Watchlist', value: 'watchlist' },
  { label: 'Alerts', value: 'alerts' },
  { label: 'All data', value: 'all' },
  { label: 'TEER / RCI / RVI', value: 'indices' },
]

const exportFormatOptions: Array<{ label: string, value: EnterpriseExportFormat }> = [
  { label: 'CSV', value: 'csv' },
  { label: 'PDF', value: 'pdf' },
  { label: 'Parquet', value: 'parquet' },
]

const windowLabel = computed(() => windowOptions.find(o => o.value === embedDays.value)?.label ?? `${embedDays.value}d`)

const { apiAccess, apiTier, apiRateLimitRpm, indicesEmbedsEnabled, indicesExportsEnabled, limits }
  = useEntitlements()
const { request } = useApi()

const {
  apiKeys,
  apiKeysLoading,
  apiKeysError,
  apiKeyName,
  apiKeyScopes,
  apiKeyToken,
  apiKeyTokenLabel,
  apiKeyCopyStatus,
  showApiReference,
  maxApiKeys,
  availableScopes,
  activeApiKeyCount,
  apiKeyFromRow,
  columns: apiKeyTableColumns,
  rowKey: apiKeyTableRowKey,
  fetchApiKeys,
  createKey: createEnterpriseApiKey,
  rotateKey: rotateEnterpriseApiKey,
  revokeKey: revokeEnterpriseApiKey,
  copyToken: copyApiKeyToken,
} = useEnterpriseApiKeys()

const {
  corridorId: embedCorridorId,
  amountBucket: embedAmountBucket,
  methodProfile: embedMethodProfile,
  days: embedDays,
  theme: embedTheme,
  copyStatus: embedCopyStatus,
  publishedId: embedPublishedId,
  publishedAt: embedPublishedAt,
  publishedGenerating: embedPublishedGenerating,
  publishedError: embedPublishedError,
  indices: embedIndices,
  embedUrls,
  embedCodes,
  publishEmbed,
  copyEmbedCode,
  copyPublishedValue,
  publishedEmbeds,
  publishedEmbedsLoading,
  publishedEmbedsError,
  fetchPublishedEmbeds,
  revokePublishedEmbed,
  methodProfileOptions,
  amountBucketPresets,
} = useEnterpriseEmbeds()

const {
  jobs: exportJobs,
  loading: exportJobsLoading,
  error: exportJobsError,
  jobType: exportJobType,
  format: exportFormat,
  dateFrom: exportDateFrom,
  dateTo: exportDateTo,
  corridorIdsText: exportCorridorIdsText,
  parsedCorridorIds: exportCorridorIds,
  exportWindowLimitDays,
  creating: exportCreating,
  columns: exportJobTableColumns,
  rowKey: exportJobTableRowKey,
  fromRow: exportJobFromRow,
  statusClasses: exportStatusClasses,
  fetchJobs: fetchExportJobs,
  createJob: createExportJob,
  downloadJob: downloadExport,
} = useEnterpriseExports()

const { exportVisual, exporting: visualExporting } = useChartImageExport()
const embedVisualButtons: Array<{ value: ChartVisualExportFormat, label: string }>
  = CHART_VISUAL_EXPORT_FORMATS.map(format => ({
    value: format,
    label: format.toUpperCase(),
  }))

const embedPreviewFrames = ref<Record<EmbedVisualKey, HTMLIFrameElement | null>>({
  teer: null,
  rci: null,
  rvi_bps: null,
})
const embedVisualErrors = ref<Record<EmbedVisualKey, string | null>>({
  teer: null,
  rci: null,
  rvi_bps: null,
})
const activeVisualExportKey = ref<EmbedVisualKey | null>(null)
const activeVisualExportFormat = ref<ChartVisualExportFormat | null>(null)
const corridors = ref<EnterpriseCorridorRecord[]>([])
const corridorsLoading = ref(false)
const corridorsError = ref<string | null>(null)
const embedCorridorInput = ref(embedCorridorId.value)
const exportCorridorSearch = ref('')
const embedFormError = ref<string | null>(null)
const exportFormError = ref<string | null>(null)
const revokeConfirmId = ref<string | null>(null)
let revokeConfirmTimeout: ReturnType<typeof setTimeout> | null = null

const embedFromCountry = ref('')
const embedToCountry = ref('')
const exportFromCountry = ref('')
const exportToCountry = ref('')

const embedMatchingCorridors = computed(() => {
  if (!embedFromCountry.value || !embedToCountry.value) return []
  return corridors.value.filter(
    c => c.sourceCountry === embedFromCountry.value && c.destCountry === embedToCountry.value,
  )
})

const exportMatchingCorridors = computed(() => {
  if (!exportFromCountry.value || !exportToCountry.value) return []
  return corridors.value.filter(
    c => c.sourceCountry === exportFromCountry.value && c.destCountry === exportToCountry.value,
  )
})

const goldSendCountries = computed(() =>
  [...new Set(corridors.value.map(c => c.sourceCountry))].sort(),
)
const goldReceiveCountries = computed(() =>
  [...new Set(corridors.value.map(c => c.destCountry))].sort(),
)

function handleEmbedCountrySelected(direction: 'from' | 'to', countryCode: string) {
  if (direction === 'from') embedFromCountry.value = countryCode
  else embedToCountry.value = countryCode
  autoSelectEmbedCorridor()
}

function autoSelectEmbedCorridor() {
  const matches = embedMatchingCorridors.value
  if (matches.length === 1) {
    selectEmbedCorridor(matches[0].corridorId)
  }
  else if (matches.length === 0) {
    embedCorridorInput.value = ''
  }
}

function handleExportCountrySelected(direction: 'from' | 'to', countryCode: string) {
  if (direction === 'from') exportFromCountry.value = countryCode
  else exportToCountry.value = countryCode
}

function addMatchingExportCorridors() {
  for (const corridor of exportMatchingCorridors.value) {
    if (!selectedExportCorridorIdSet.value.has(corridor.corridorId)) {
      addExportCorridor(corridor.corridorId)
    }
  }
}

function handleExportJobTypeChange(value: string | number) {
  const next = String(value)
  if (exportTypeOptions.some(option => option.value === next)) {
    exportJobType.value = next as EnterpriseExportJobType
  }
}

function handleExportFormatChange(value: string | number) {
  const next = String(value)
  if (exportFormatOptions.some(option => option.value === next)) {
    exportFormat.value = next as EnterpriseExportFormat
  }
}

function formatOptionalDate(value: string | null) {
  return value ? formatDate(value) : '—'
}

function formatOptionalRelativeTime(value: string | null) {
  return value ? formatRelativeTime(value) : '—'
}

const showGettingStarted = ref(
  import.meta.client ? localStorage.getItem('rs-enterprise-getting-started-dismissed') !== '1' : true,
)

const normalizeCorridorId = (value: string) => value.toUpperCase().trim()

const selectedExportCorridorIds = computed({
  get: () => exportCorridorIds.value,
  set: (next: string[]) => {
    exportCorridorIdsText.value = next.join('\n')
  },
})

const selectedExportCorridorIdSet = computed(() => new Set(selectedExportCorridorIds.value))

const apiKeyUsageLabel = computed(() => `${activeApiKeyCount.value}/${maxApiKeys.value}`)
const activePublishedEmbedCount = computed(
  () => publishedEmbeds.value.filter(embed => !embed.revokedAt).length,
)
const corridorCatalogCount = computed(() => corridors.value.length)

const selectedMethodLabel = computed(() =>
  methodProfileOptions.find(o => o.value === embedMethodProfile.value)?.label ?? 'Bank deposit',
)

const selectedEmbedCorridor = computed(
  () =>
    corridors.value.find(
      corridor => corridor.corridorId === normalizeCorridorId(embedCorridorId.value),
    ) ?? null,
)

function sortCorridorsForDisplay(list: EnterpriseCorridorRecord[]): EnterpriseCorridorRecord[] {
  return [...list].sort((a, b) => {
    const aUs = a.sourceCountry === 'US' ? 0 : 1
    const bUs = b.sourceCountry === 'US' ? 0 : 1
    if (aUs !== bUs) return aUs - bUs
    if (a.sourceCountry !== b.sourceCountry) return a.sourceCountry.localeCompare(b.sourceCountry)
    return (b.dataPoints ?? 0) - (a.dataPoints ?? 0)
  })
}

const embedCorridorCandidates = computed(() => {
  const query = embedCorridorInput.value.trim().toLowerCase()
  if (!query) {
    return sortCorridorsForDisplay(corridors.value).slice(0, 12)
  }

  return sortCorridorsForDisplay(
    corridors.value
      .filter((corridor) => {
        return [
          buildCorridorSearchText(corridor.corridorId),
          corridor.sourceCountry,
          corridor.destCountry,
          corridorTitle(corridor),
          corridorSubtitle(corridor),
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)
      }),
  ).slice(0, 12)
})

const exportCorridorCandidates = computed(() => {
  const query = exportCorridorSearch.value.trim().toLowerCase()
  const available = corridors.value.filter(
    corridor => !selectedExportCorridorIdSet.value.has(corridor.corridorId),
  )

  if (!query) {
    return sortCorridorsForDisplay(available).slice(0, 12)
  }

  return sortCorridorsForDisplay(
    available
      .filter((corridor) => {
        return [
          buildCorridorSearchText(corridor.corridorId),
          corridor.sourceCountry,
          corridor.destCountry,
          corridorTitle(corridor),
          corridorSubtitle(corridor),
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)
      }),
  ).slice(0, 12)
})

const selectedExportCorridors = computed(() =>
  selectedExportCorridorIds.value
    .map(corridorId => corridors.value.find(item => item.corridorId === corridorId) ?? null)
    .filter((corridor): corridor is EnterpriseCorridorRecord => corridor !== null),
)

const delayedExportJobs = computed(() =>
  exportJobs.value.filter((job) => {
    const ageMinutes = getJobAgeMinutes(job.createdAt)
    return (
      ['queued', 'running'].includes(job.status)
      && ageMinutes !== null
      && ageMinutes >= EXPORT_DELAY_THRESHOLD_MINUTES
    )
  }),
)

const enterpriseNotices = computed<EnterpriseNotice[]>(() => {
  const notices: EnterpriseNotice[] = []

  if (publishedEmbedsError.value || embedPublishedError.value) {
    notices.push({
      tone: 'danger',
      title: 'Embed publishing is degraded',
      body:
        embedPublishedError.value
        || publishedEmbedsError.value
        || 'Published embeds are failing on this environment. Treat the embed section as degraded until the storage layer is restored.',
    })
  }

  if (delayedExportJobs.value.length > 0) {
    notices.push({
      tone: 'warning',
      title: 'Export processing is delayed',
      body: `${delayedExportJobs.value.length} export job${delayedExportJobs.value.length === 1 ? '' : 's'} ha${delayedExportJobs.value.length === 1 ? 's' : 've'} been queued for more than ${EXPORT_DELAY_THRESHOLD_MINUTES} minutes. Export creation works, but delivery is not healthy on this environment.`,
    })
  }

  if (corridorsError.value) {
    notices.push({
      tone: 'warning',
      title: 'Corridor catalog unavailable',
      body: corridorsError.value,
    })
  }

  if (!apiAccess.value) {
    notices.push({
      tone: 'info',
      title: 'API access is not enabled',
      body: 'The enterprise dashboard can still show billing and export entitlements, but direct API features are locked until API access is enabled for this account.',
    })
  }

  return notices
})

const effectiveEmbedError = computed(() => embedFormError.value || embedPublishedError.value)
const effectiveExportError = computed(() => exportFormError.value || exportJobsError.value)

watch(
  () => embedCorridorId.value,
  (value) => {
    const selectedCorridor = corridors.value.find(
      corridor => corridor.corridorId === normalizeCorridorId(value),
    )
    const nextValue = selectedCorridor
      ? corridorTitle(selectedCorridor)
      : formatCorridorCountryPair(value, ' -> ')
    if (embedCorridorInput.value !== nextValue) {
      embedCorridorInput.value = nextValue
    }
  },
  { immediate: true },
)

function setEmbedPreviewFrame(
  key: EmbedVisualKey,
  frame: Element | ComponentPublicInstance | null,
) {
  embedPreviewFrames.value[key] = frame instanceof HTMLIFrameElement ? frame : null
}

function corridorSubtitle(corridor: EnterpriseCorridorRecord) {
  const parts = [`Tier ${corridor.dataTier}`, `Updated every ${formatCadence(corridor.exportCadenceMinutes)}`]
  if (corridor.lastUpdated) {
    const ago = formatRelativeTime(corridor.lastUpdated)
    if (ago) parts.push(`Last: ${ago}`)
  }
  return parts.join(' • ')
}

function corridorTitle(corridor: EnterpriseCorridorRecord) {
  return formatCorridorCountryPair(corridor.corridorId, ' -> ')
}

function formatCadence(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) return 'Unknown cadence'
  if (minutes < 60) return `${minutes} min`
  if (minutes % 60 === 0) return `${minutes / 60} hr`
  return `${minutes} min`
}

function formatJobAgeMinutes(createdAt: string) {
  const created = new Date(createdAt)
  if (Number.isNaN(created.getTime())) return null
  return Math.floor((Date.now() - created.getTime()) / 60_000)
}

function getJobAgeMinutes(createdAt: string) {
  return formatJobAgeMinutes(createdAt)
}

function formatJobAgeLabel(createdAt: string) {
  const ageMinutes = formatJobAgeMinutes(createdAt)
  if (ageMinutes === null) return 'Created recently'
  if (ageMinutes < 1) return 'Created just now'
  if (ageMinutes < 60) return `Queued ${ageMinutes} min ago`
  const ageHours = Math.floor(ageMinutes / 60)
  if (ageHours < 24) return `Queued ${ageHours}h ago`
  return `Queued ${formatRelativeTime(createdAt)}`
}

function formatExportJobType(jobType: string) {
  return EXPORT_JOB_TYPE_LABELS[jobType] || jobType.replace(/_/g, ' ')
}

function formatPublishedEmbedTitle(title: string) {
  return title.replace(/\b[A-Z]{2}-[A-Z]{2}(?:-[A-Z]{3}-[A-Z]{3})?\b/g, corridorId =>
    formatCorridorCountryPair(corridorId, ' -> '),
  )
}

function getNoticeClasses(tone: NoticeTone) {
  if (tone === 'danger') {
    return 'border-danger-200 bg-danger-50 text-danger-900'
  }
  if (tone === 'warning') {
    return 'border-warning-200 bg-warning-50 text-warning-900'
  }
  return 'border-brand-100 bg-brand-50 text-brand-900'
}

function getNoticeIcon(tone: NoticeTone) {
  if (tone === 'danger') return 'exclamation-triangle'
  if (tone === 'warning') return 'clock'
  return 'info'
}

function isDelayedJob(job: { status: string, createdAt: string }) {
  const ageMinutes = getJobAgeMinutes(job.createdAt)
  return (
    ['queued', 'running'].includes(job.status)
    && ageMinutes !== null
    && ageMinutes >= EXPORT_DELAY_THRESHOLD_MINUTES
  )
}

function selectEmbedCorridor(corridorId: string) {
  embedCorridorId.value = corridorId
  const corridor = corridors.value.find(item => item.corridorId === corridorId)
  embedCorridorInput.value = corridor
    ? corridorTitle(corridor)
    : formatCorridorCountryPair(corridorId, ' -> ')
  embedFormError.value = null
}

function addExportCorridor(corridorId: string) {
  selectedExportCorridorIds.value = [...selectedExportCorridorIds.value, corridorId]
  exportCorridorSearch.value = ''
  exportFormError.value = null
}

function removeExportCorridor(corridorId: string) {
  selectedExportCorridorIds.value = selectedExportCorridorIds.value.filter(id => id !== corridorId)
}

function useEmbedCorridorForExport() {
  if (!selectedEmbedCorridor.value) {
    return
  }
  if (selectedExportCorridorIdSet.value.has(selectedEmbedCorridor.value.corridorId)) {
    return
  }
  addExportCorridor(selectedEmbedCorridor.value.corridorId)
}

async function handlePublishEmbed() {
  embedFormError.value = null
  if (!selectedEmbedCorridor.value) {
    embedFormError.value = 'Choose a country pair from the corridor catalog before publishing.'
    return
  }

  embedCorridorId.value = selectedEmbedCorridor.value.corridorId
  await publishEmbed()
}

async function handleCreateExport() {
  exportFormError.value = null

  if (exportJobType.value === 'indices' && selectedExportCorridorIds.value.length === 0) {
    exportFormError.value = 'Add at least one corridor for TEER / RCI / RVI exports.'
    return
  }

  await createExportJob()
}

function commitEmbedSearch() {
  if (embedCorridorCandidates.value.length > 0) {
    selectEmbedCorridor(embedCorridorCandidates.value[0].corridorId)
  }
}

function commitExportSearch() {
  if (exportCorridorCandidates.value.length > 0) {
    addExportCorridor(exportCorridorCandidates.value[0].corridorId)
  }
}

function dismissGettingStarted() {
  showGettingStarted.value = false
  if (import.meta.client) localStorage.setItem('rs-enterprise-getting-started-dismissed', '1')
}

function initiateRevoke(embedId: string) {
  if (revokeConfirmTimeout) clearTimeout(revokeConfirmTimeout)
  revokeConfirmId.value = embedId
  revokeConfirmTimeout = setTimeout(() => {
    revokeConfirmId.value = null
  }, 3000)
}

function confirmRevoke(embedId: string) {
  if (revokeConfirmTimeout) clearTimeout(revokeConfirmTimeout)
  revokeConfirmId.value = null
  revokePublishedEmbed(embedId)
}

function truncateUrl(url: string): string {
  try {
    const u = new URL(url)
    const path = u.pathname + u.search
    if (path.length <= 40) return u.host + path
    return u.host + path.slice(0, 20) + '…' + path.slice(-12)
  }
  catch {
    return url.length > 60 ? url.slice(0, 30) + '…' + url.slice(-12) : url
  }
}

function countryByCode(code: string): string | null {
  const country = getCountryByCode(code)
  return country?.name ?? null
}

function buildGroupHeaders(candidates: EnterpriseCorridorRecord[]): Map<string, string> {
  const headers = new Map<string, string>()
  for (let i = 0; i < candidates.length; i++) {
    const current = candidates[i]!
    const prev = i > 0 ? candidates[i - 1] : null
    if (!prev || prev.sourceCountry !== current.sourceCountry) {
      headers.set(current.corridorId, countryByCode(current.sourceCountry) ?? current.sourceCountry)
    }
  }
  return headers
}

const embedGroupHeaders = computed(() => buildGroupHeaders(embedCorridorCandidates.value))
const exportGroupHeaders = computed(() => buildGroupHeaders(exportCorridorCandidates.value))

async function fetchCorridors() {
  if (!apiAccess.value || corridorsLoading.value) return

  corridorsLoading.value = true
  corridorsError.value = null
  try {
    const response = await request<EnterpriseCorridorResponse>('/indices/corridors')
    corridors.value = Array.isArray(response.corridors) ? response.corridors : []
    if (
      corridors.value.length > 0
      && !corridors.value.some(
        corridor => corridor.corridorId === normalizeCorridorId(embedCorridorId.value),
      )
    ) {
      selectEmbedCorridor(corridors.value[0].corridorId)
    }
    selectedExportCorridorIds.value = selectedExportCorridorIds.value.filter(corridorId =>
      corridors.value.some(corridor => corridor.corridorId === corridorId),
    )
  }
 catch {
    corridorsError.value
      = 'The country-pair catalog could not load. Refresh to restore the bank-deposit corridor picker.'
  }
 finally {
    corridorsLoading.value = false
  }
}

async function downloadEmbedVisual(
  key: EmbedVisualKey,
  label: string,
  format: ChartVisualExportFormat,
) {
  const frame = embedPreviewFrames.value[key]
  embedVisualErrors.value[key] = null

  if (!frame) {
    embedVisualErrors.value[key] = 'Publish a static embed before downloading visual exports.'
    return
  }
  if (!(frame instanceof HTMLIFrameElement)) {
    embedVisualErrors.value[key] = 'Embed preview is not ready yet.'
    return
  }

  activeVisualExportKey.value = key
  activeVisualExportFormat.value = format

  try {
    await exportVisual(frame, {
      filename: `remit-scout-${key}-${normalizeCorridorId(embedCorridorId.value).toLowerCase()}-${embedTheme.value}`,
      title: `${label} Published Embed`,
      format,
    })
  }
 catch (error) {
    embedVisualErrors.value[key]
      = error instanceof Error ? error.message : 'Unable to generate visual export.'
  }
 finally {
    activeVisualExportKey.value = null
    activeVisualExportFormat.value = null
  }
}

const copyPublishedUrl = async (publicUrl: string, label: string) => {
  await copyPublishedValue(publicUrl, `${label} URL copied.`, 'No published URL available to copy.')
}

const copyPublishedCode = async (embedCode: string, label: string) => {
  await copyPublishedValue(
    embedCode,
    `${label} embed code copied.`,
    'No embed code available to copy.',
  )
}

onMounted(() => {
  void fetchApiKeys()
  void fetchExportJobs()
  void fetchPublishedEmbeds()
  void fetchCorridors()
})

onBeforeUnmount(() => {
  if (revokeConfirmTimeout) clearTimeout(revokeConfirmTimeout)
})

const CORRIDOR_ID_PATTERN = /^[A-Z]{2}-[A-Z]{2}-[A-Z]{3}-[A-Z]{3}$/
const isCorridorId = (value: string) => CORRIDOR_ID_PATTERN.test(normalizeCorridorId(value))

const normalizedEmbedCorridorInput = computed(() => normalizeCorridorId(embedCorridorInput.value))
const manualEmbedCorridorId = computed(() =>
  isCorridorId(embedCorridorInput.value) ? normalizedEmbedCorridorInput.value : '',
)

const manualExportCorridorId = computed(() => {
  const normalized = normalizeCorridorId(exportCorridorSearch.value)
  if (!isCorridorId(normalized)) return ''
  return selectedExportCorridorIdSet.value.has(normalized) ? '' : normalized
})

const METHOD_PROFILE_LABELS: Record<string, string> = {
  standard_bank: 'Bank to bank',
  standard_card: 'Card to bank',
  cash_pickup: 'Cash pickup',
  mobile_wallet: 'Mobile wallet',
  airtime_topup: 'Airtime top-up',
  card_delivery: 'Card delivery',
  home_delivery: 'Home delivery',
}

function getMethodProfileLabel(methodProfile: string) {
  return METHOD_PROFILE_LABELS[methodProfile] || methodProfile
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="space-y-8">
    <!-- ─── Hero ─── -->
    <section class="overflow-hidden rounded-xl border border-brand-700 bg-brand-600 text-white">
      <div class="px-8 pb-0 pt-8">
        <div class="flex items-start justify-between gap-6">
          <div class="space-y-3">
            <div class="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
              <Icon
name="building-library"
:size="14"
class="text-current"
/>
              Enterprise
            </div>
            <h2 class="text-2xl font-semibold tracking-tight text-white">Data Console</h2>
            <p class="max-w-xl text-sm leading-relaxed text-white/70">
              Manage API keys, publish index embeds, and create data exports across your corridor catalog.
            </p>
            <NuxtLink
              to="/docs/enterprise"
              class="mt-1 inline-flex items-center gap-1.5 rounded-md border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
            >
              <svg
class="h-3.5 w-3.5"
fill="none"
stroke="currentColor"
stroke-width="2"
viewBox="0 0 24 24"
><path
stroke-linecap="round"
stroke-linejoin="round"
d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
/></svg>
              API Documentation
            </NuxtLink>
          </div>
          <div class="hidden items-center gap-2 text-xs text-white/70 sm:flex">
            <span class="rounded-md border border-white/15 bg-white/10 px-2.5 py-1 font-medium">Tier {{ apiTier || 2 }}</span>
            <span class="rounded-md border border-white/15 bg-white/10 px-2.5 py-1 font-medium">{{ apiRateLimitRpm ?? 600 }} req/min</span>
            <span class="rounded-md border border-white/15 bg-white/10 px-2.5 py-1 font-medium">{{ exportWindowLimitDays }}-day window</span>
          </div>
        </div>
      </div>
      <div class="mt-6 grid grid-cols-2 divide-x divide-white/15 border-t border-white/15 lg:grid-cols-4">
        <div class="px-8 py-5">
          <div class="text-2xl font-semibold tabular-nums text-white">{{ apiKeyUsageLabel }}</div>
          <div class="mt-1 text-xs text-white/70">API Keys</div>
        </div>
        <div class="px-8 py-5">
          <div class="text-2xl font-semibold tabular-nums text-white">{{ activePublishedEmbedCount }}</div>
          <div class="mt-1 text-xs text-white/70">Published Embeds</div>
        </div>
        <div class="px-8 py-5">
          <div class="text-2xl font-semibold tabular-nums text-white">{{ corridorCatalogCount }}</div>
          <div class="mt-1 text-xs text-white/70">Corridor Catalog</div>
        </div>
        <div class="px-8 py-5">
          <div class="text-2xl font-semibold tabular-nums text-white">{{ delayedExportJobs.length }}</div>
          <div class="mt-1 text-xs text-white/70">Delayed Exports</div>
        </div>
      </div>
    </section>

    <!-- ─── Onboarding Steps ─── -->
    <nav class="flex items-center gap-3 rounded-xl border border-rs-border bg-surface px-5 py-4">
      <a
        href="#enterprise-api"
        class="inline-flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium text-rs-fg transition-colors hover:bg-brand-50 hover:text-brand-700"
        @click.prevent="scrollToSection('enterprise-api')"
      >
        <span class="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">1</span>
        Create an API key
      </a>
      <svg
class="h-4 w-4 flex-shrink-0 text-neutral-300"
fill="none"
stroke="currentColor"
stroke-width="2"
viewBox="0 0 24 24"
><path
stroke-linecap="round"
stroke-linejoin="round"
d="M8.25 4.5l7.5 7.5-7.5 7.5"
/></svg>
      <a
        href="#enterprise-embeds"
        class="inline-flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium text-rs-fg transition-colors hover:bg-brand-50 hover:text-brand-700"
        @click.prevent="scrollToSection('enterprise-embeds')"
      >
        <span class="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">2</span>
        Pick a corridor
      </a>
      <svg
class="h-4 w-4 flex-shrink-0 text-neutral-300"
fill="none"
stroke="currentColor"
stroke-width="2"
viewBox="0 0 24 24"
><path
stroke-linecap="round"
stroke-linejoin="round"
d="M8.25 4.5l7.5 7.5-7.5 7.5"
/></svg>
      <a
        href="#enterprise-exports"
        class="inline-flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium text-rs-fg transition-colors hover:bg-brand-50 hover:text-brand-700"
        @click.prevent="scrollToSection('enterprise-exports')"
      >
        <span class="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">3</span>
        Publish or export
      </a>
      <div class="ml-auto">
        <NuxtLink
          to="/docs/enterprise"
          class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-brand-700"
        >
          Full documentation
          <svg
class="h-3.5 w-3.5"
fill="none"
stroke="currentColor"
stroke-width="2"
viewBox="0 0 24 24"
><path
stroke-linecap="round"
stroke-linejoin="round"
d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
/></svg>
        </NuxtLink>
      </div>
    </nav>

    <!-- ─── Notices ─── -->
    <div
v-if="enterpriseNotices.length > 0"
class="space-y-2"
>
      <div
        v-for="notice in enterpriseNotices"
        :key="`${notice.tone}-${notice.title}`"
        class="flex items-start gap-3 rounded-lg border px-4 py-3"
        :class="getNoticeClasses(notice.tone)"
      >
        <Icon
:name="getNoticeIcon(notice.tone)"
:size="16"
class="mt-0.5 flex-shrink-0 text-current"
/>
        <div class="min-w-0">
          <div class="text-sm font-medium">{{ notice.title }}</div>
          <p class="mt-0.5 text-sm leading-relaxed opacity-80">{{ notice.body }}</p>
        </div>
      </div>
    </div>

    <!-- ─── API Access ─── -->
    <section
id="enterprise-api"
class="rounded-xl border border-rs-border bg-surface"
>
      <div class="flex items-center justify-between border-b border-rs-border px-6 py-4">
        <div>
          <h3 class="text-base font-semibold text-rs-fg">API Access</h3>
          <p class="mt-0.5 text-sm text-rs-muted">Scoped keys for server-to-server integration.</p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-rs-border px-3 py-1.5 text-xs font-medium text-rs-muted transition-colors hover:border-neutral-400 hover:text-rs-fg disabled:opacity-50"
          :disabled="apiKeysLoading || !apiAccess"
          @click="fetchApiKeys"
        >
          <Icon
name="arrows-right-left"
:size="14"
class="text-current"
/>
          Refresh
        </button>
      </div>

      <div class="space-y-5 p-6">
        <!-- Create key form -->
        <div class="flex flex-col gap-3 rounded-lg border border-rs-border bg-neutral-50 p-4 lg:flex-row lg:items-end">
          <div class="flex-1 space-y-2">
            <div class="flex flex-wrap items-center gap-2 text-xs text-rs-muted">
              <span class="rounded bg-surface px-2 py-0.5 font-medium text-rs-fg">{{ activeApiKeyCount }}/{{ maxApiKeys }} keys</span>
              <span class="rounded bg-surface px-2 py-0.5 font-medium text-rs-fg">{{ apiRateLimitRpm ?? 600 }} req/min</span>
              <span class="rounded bg-surface px-2 py-0.5 font-medium text-rs-fg">Tier {{ apiTier || 2 }}</span>
            </div>
            <input
              v-model="apiKeyName"
              type="text"
              placeholder="Key name"
              class="h-10 w-full rounded-lg border border-rs-border bg-surface px-3 text-sm text-rs-fg focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
            <div class="grid gap-2 sm:grid-cols-3">
              <label
                v-for="scope in availableScopes"
                :key="scope.value"
                class="flex cursor-pointer items-start gap-3 rounded-lg border bg-surface p-3 transition-colors"
                :class="apiKeyScopes.includes(scope.value) ? 'border-brand-300 bg-brand-50/50' : 'border-rs-border hover:border-neutral-300'"
              >
                <input
                  v-model="apiKeyScopes"
                  type="checkbox"
                  :value="scope.value"
                  class="mt-0.5 rounded border-rs-border text-brand-600 focus:ring-brand-200"
                >
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <Icon
:name="SCOPE_META[scope.value]?.icon || 'document'"
:size="14"
class="flex-shrink-0 text-brand-600"
/>
                    <span class="text-xs font-semibold text-rs-fg">{{ SCOPE_META[scope.value]?.label || scope.value }}</span>
                  </div>
                  <p class="mt-0.5 text-[11px] leading-snug text-rs-muted">{{ SCOPE_META[scope.value]?.description || scope.value }}</p>
                </div>
              </label>
            </div>
          </div>
          <button
            type="button"
            class="inline-flex h-10 items-center justify-center rounded-lg bg-brand-600 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
            :disabled="apiKeysLoading || !apiAccess"
            @click="createEnterpriseApiKey"
          >
            Create key
          </button>
        </div>

        <p
v-if="apiKeysError"
class="text-sm text-danger-600"
>
{{ apiKeysError }}
</p>

        <!-- New token banner -->
        <div
v-if="apiKeyToken"
class="rounded-lg border border-success-200 bg-success-50 p-4"
>
          <div class="flex items-center justify-between gap-3">
            <div>
              <div class="text-sm font-medium text-success-900">Token created</div>
              <p class="mt-0.5 text-xs text-success-700">Copy now — this token won't be shown again.</p>
            </div>
            <button
              type="button"
              class="rounded-lg border border-success-300 px-3 py-1.5 text-xs font-medium text-success-700 transition-colors hover:bg-success-100"
              @click="copyApiKeyToken"
            >
              Copy
            </button>
          </div>
          <div class="mt-3 break-all rounded-md border border-success-200 bg-white/70 px-3 py-2.5 font-mono text-xs text-success-900">
            {{ apiKeyToken }}
          </div>
          <div
v-if="apiKeyTokenLabel || apiKeyCopyStatus"
class="mt-2 flex items-center gap-3 text-xs text-success-600"
>
            <span v-if="apiKeyTokenLabel">Prefix {{ apiKeyTokenLabel }}</span>
            <span v-if="apiKeyCopyStatus">{{ apiKeyCopyStatus }}</span>
          </div>
        </div>

        <!-- Keys table -->
        <DataTable
          variant="consumer"
          caption="API keys"
          :columns="apiKeyTableColumns"
          :rows="apiKeys"
          :row-key="apiKeyTableRowKey"
          :loading="apiKeysLoading"
          :empty="{ title: 'No API keys', message: 'Create your first key above.' }"
        >
          <template #cell-name="{ row }">
            <span class="font-medium text-rs-fg">{{ apiKeyFromRow(row).name || 'Untitled' }}</span>
          </template>
          <template #cell-key_prefix="{ row }">
            <span class="font-mono text-xs text-neutral-500">{{ apiKeyFromRow(row).key_prefix }}••••</span>
          </template>
          <template #cell-scopes="{ row }">
            <div class="flex flex-wrap gap-1">
              <span
                v-for="scope in apiKeyFromRow(row).scopes"
                :key="scope"
                class="inline-flex items-center gap-1 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-600"
              >
                <Icon
v-if="SCOPE_META[scope]"
:name="SCOPE_META[scope].icon"
:size="10"
class="text-neutral-400"
/>
                {{ SCOPE_META[scope]?.label || scope }}
              </span>
              <span
v-if="apiKeyFromRow(row).scopes.length === 0"
class="text-xs text-rs-muted"
>—</span>
            </div>
          </template>
          <template #cell-last_used_at="{ row }">
            <span class="text-xs text-rs-muted">{{ apiKeyFromRow(row).last_used_at ? formatRelativeTime(apiKeyFromRow(row).last_used_at!) : 'Never' }}</span>
          </template>
          <template #cell-revoked_at="{ row }">
            <span
              v-if="apiKeyFromRow(row).revoked_at"
              class="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500"
            >Revoked</span>
            <span
              v-else
              class="inline-flex items-center rounded-full bg-success-50 px-2 py-0.5 text-[11px] font-medium text-success-700"
            >Active</span>
          </template>
          <template #row-actions="{ row }">
            <div class="flex items-center justify-end gap-3">
              <button
                type="button"
                class="text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
                :disabled="apiKeysLoading || !apiAccess || Boolean(apiKeyFromRow(row).revoked_at)"
                @click="rotateEnterpriseApiKey(apiKeyFromRow(row))"
              >
Rotate
</button>
              <button
                v-if="!apiKeyFromRow(row).revoked_at"
                type="button"
                class="text-xs font-medium text-danger-600 hover:text-danger-700 disabled:opacity-50"
                :disabled="apiKeysLoading || !apiAccess"
                @click="revokeEnterpriseApiKey(apiKeyFromRow(row))"
              >
Revoke
</button>
            </div>
          </template>
        </DataTable>

        <!-- API Reference -->
        <div class="rounded-lg border border-rs-border">
          <button
            type="button"
            class="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-rs-fg"
            @click="showApiReference = !showApiReference"
          >
            <span>API Reference</span>
            <Icon
:name="showApiReference ? 'chevron-up' : 'chevron-down'"
:size="14"
class="text-neutral-400"
/>
          </button>
          <div
v-if="showApiReference"
class="space-y-4 border-t border-rs-border px-4 pb-4 pt-4"
>
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-lg border border-rs-border bg-neutral-50 p-3">
                <div class="text-xs text-rs-muted">Auth header</div>
                <div class="mt-1 font-mono text-xs text-rs-fg">X-API-Key: &lt;token&gt;</div>
              </div>
              <div class="rounded-lg border border-rs-border bg-neutral-50 p-3">
                <div class="text-xs text-rs-muted">Key policy</div>
                <div class="mt-1 text-xs text-rs-fg">Rotate immediately if exposed.</div>
              </div>
            </div>
            <div class="rounded-lg border border-rs-border bg-neutral-50 p-4">
              <div class="mb-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Endpoints</div>
              <div class="grid gap-1 font-mono text-xs text-rs-fg sm:grid-cols-2">
                <div><span class="text-brand-600">GET</span> /api/v1/indices/series</div>
                <div><span class="text-brand-600">GET</span> /api/v1/indices/latest</div>
                <div><span class="text-brand-600">GET</span> /api/v1/indices/corridors</div>
                <div><span class="text-brand-600">GET</span> /api/v1/indices/health</div>
                <div><span class="text-success-600">POST</span> /api/v1/exports</div>
                <div><span class="text-brand-600">GET</span> /api/v1/exports</div>
                <div><span class="text-brand-600">GET</span> /api/v1/exports/:id/download</div>
                <div><span class="text-brand-600">GET</span> /api/v1/providers</div>
                <div><span class="text-brand-600">GET</span> /api/v1/quotes</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Static Index Embeds ─── -->
    <section
id="enterprise-embeds"
class="rounded-xl border border-rs-border bg-surface"
>
      <div class="flex items-center justify-between border-b border-rs-border px-6 py-4">
        <div>
          <h3 class="text-base font-semibold text-rs-fg">Static Index Embeds</h3>
          <p class="mt-0.5 text-sm text-rs-muted">Publish immutable TEER / RCI / RVI embed bundles.</p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-rs-border px-3 py-1.5 text-xs font-medium text-rs-muted transition-colors hover:border-neutral-400 hover:text-rs-fg disabled:opacity-50"
          :disabled="publishedEmbedsLoading"
          @click="fetchPublishedEmbeds"
        >
          <Icon
name="arrows-right-left"
:size="14"
class="text-current"
/>
          Refresh
        </button>
      </div>

      <div class="space-y-6 p-6">
        <!-- Corridor search + config -->
        <div class="rounded-lg border border-rs-border bg-neutral-50 p-5">
          <div class="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <!-- Left: corridor picker -->
            <div class="space-y-3">
              <label class="text-xs font-medium uppercase tracking-wider text-neutral-500">Corridor</label>
              <div class="grid gap-3 sm:grid-cols-2">
                <div>
                  <label class="mb-1.5 block text-xs font-medium text-neutral-600">From</label>
                  <CountrySelect
                    v-model="embedFromCountry"
                    placeholder="Sending from…"
                    :allowed-codes="goldSendCountries"
                    @country-selected="(code: string) => handleEmbedCountrySelected('from', code)"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-xs font-medium text-neutral-600">To</label>
                  <CountrySelect
                    v-model="embedToCountry"
                    placeholder="Sending to…"
                    :allowed-codes="goldReceiveCountries"
                    :exclude-country="embedFromCountry"
                    @country-selected="(code: string) => handleEmbedCountrySelected('to', code)"
                  />
                </div>
              </div>
              <!-- Currency pair selector (when multiple corridors match) -->
              <div
v-if="embedMatchingCorridors.length > 1"
class="space-y-1.5"
>
                <label class="text-xs font-medium text-neutral-600">Currency pair</label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="corridor in embedMatchingCorridors"
                    :key="corridor.corridorId"
                    type="button"
                    class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                    :class="embedCorridorId === corridor.corridorId ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-rs-border bg-surface text-rs-fg hover:border-brand-300'"
                    @click="selectEmbedCorridor(corridor.corridorId)"
                  >
{{ corridor.sourceCurrency }}/{{ corridor.destCurrency }}
</button>
                </div>
              </div>
              <div
v-else-if="embedFromCountry && embedToCountry && embedMatchingCorridors.length === 0 && !corridorsLoading"
class="rounded-lg border border-dashed border-rs-border bg-surface px-3 py-3 text-center text-xs text-rs-muted"
>
                No corridors found for this pair.
              </div>
              <!-- Manual corridor ID fallback -->
              <details class="text-xs text-rs-muted">
                <summary class="cursor-pointer hover:text-rs-fg">Or enter corridor ID directly</summary>
                <input
                  v-model="embedCorridorInput"
                  type="text"
                  placeholder="e.g. US-PH-USD-PHP"
                  class="mt-2 h-9 w-full rounded-lg border border-rs-border bg-surface px-3 text-sm text-rs-fg placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  @keydown.enter.prevent="commitEmbedSearch"
                >
                <button
                  v-if="manualEmbedCorridorId && (!selectedEmbedCorridor || selectedEmbedCorridor.corridorId !== manualEmbedCorridorId)"
                  type="button"
                  class="mt-2 inline-flex items-center gap-1.5 rounded-md border border-rs-border bg-surface px-2.5 py-1.5 text-xs font-medium text-rs-fg transition-colors hover:border-brand-300"
                  @click="selectEmbedCorridor(manualEmbedCorridorId)"
                >
Use {{ manualEmbedCorridorId }}
</button>
              </details>
            </div>

            <!-- Right: config form -->
            <div class="space-y-3">
              <div
v-if="selectedEmbedCorridor || manualEmbedCorridorId"
class="rounded-lg border border-brand-200 bg-brand-50/50 p-3"
>
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <div class="text-sm font-medium text-rs-fg">
                      {{ selectedEmbedCorridor ? corridorTitle(selectedEmbedCorridor) : manualEmbedCorridorId }}
                    </div>
                    <div class="mt-0.5 text-xs text-rs-muted">
                      {{ selectedEmbedCorridor ? corridorSubtitle(selectedEmbedCorridor) : 'Manual ID' }}
                    </div>
                  </div>
                  <button
                    v-if="exportJobType === 'indices' && manualEmbedCorridorId && !selectedExportCorridorIdSet.has(manualEmbedCorridorId)"
                    type="button"
                    class="text-xs font-medium text-brand-600 hover:text-brand-700"
                    @click="useEmbedCorridorForExport"
                  >
Add to export
</button>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-2 text-xs text-rs-muted">
                <span class="rounded bg-surface px-2 py-0.5 font-medium text-rs-fg">$500 USD bucket</span>
                <span class="rounded bg-surface px-2 py-0.5 font-medium text-rs-fg">Bank deposit</span>
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <div>
                  <label class="text-xs font-medium text-neutral-600">Window</label>
                  <div class="mt-1.5">
                    <UniversalDropdown
                      :model-value="embedDays"
                      :options="windowOptions"
                      placeholder="Select window"
                      @update:model-value="(v: string | number) => embedDays = Number(v)"
                    />
                  </div>
                </div>
                <div>
                  <label class="text-xs font-medium text-neutral-600">Theme</label>
                  <div class="mt-1.5">
                    <UniversalDropdown
                      :model-value="embedTheme"
                      :options="themeOptions"
                      placeholder="Select theme"
                      @update:model-value="(v: string | number) => embedTheme = String(v) as 'dark' | 'light'"
                    />
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  class="inline-flex h-10 items-center justify-center rounded-lg bg-brand-600 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
                  :disabled="embedPublishedGenerating || !indicesEmbedsEnabled"
                  @click="handlePublishEmbed"
                >
{{ embedPublishedGenerating ? 'Publishing…' : 'Publish embed' }}
</button>
                <div class="flex flex-wrap items-center gap-1.5 text-xs text-rs-muted">
                  <span class="rounded bg-neutral-200/60 px-1.5 py-0.5 text-neutral-600">Bank deposit</span>
                  <span class="text-neutral-300">&middot;</span>
                  <span class="rounded bg-neutral-200/60 px-1.5 py-0.5 text-neutral-600">${{ embedAmountBucket }}</span>
                  <span class="text-neutral-300">&middot;</span>
                  <span class="rounded bg-neutral-200/60 px-1.5 py-0.5 text-neutral-600">{{ windowLabel }}</span>
                  <span class="text-neutral-300">&middot;</span>
                  <span class="rounded bg-neutral-200/60 px-1.5 py-0.5 capitalize text-neutral-600">{{ embedTheme }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p
v-if="embedCopyStatus"
class="text-sm text-success-600"
>
{{ embedCopyStatus }}
</p>
        <p
v-if="effectiveEmbedError"
class="text-sm text-danger-600"
>
{{ effectiveEmbedError }}
</p>

        <!-- Publish success -->
        <div
v-if="embedPublishedId"
class="rounded-lg border border-success-200 bg-success-50 p-4"
>
          <div class="text-sm font-medium text-success-900">Bundle published</div>
          <div class="mt-1 text-xs text-success-700">
            ID <span class="font-mono">{{ embedPublishedId }}</span>
            <template v-if="embedPublishedAt"> · {{ formatDate(embedPublishedAt) }}</template>
          </div>
        </div>

        <!-- TEER / RCI / RVI cards -->
        <div class="grid gap-4 lg:grid-cols-3">
          <div
            v-for="item in embedIndices"
            :key="item.key"
            class="rounded-lg border border-rs-border bg-neutral-50"
          >
            <div class="flex items-center justify-between border-b border-rs-border px-4 py-3">
              <div>
                <div class="text-sm font-semibold text-rs-fg">{{ INDEX_DEFINITIONS[item.key]?.full || item.label }}</div>
                <div class="mt-0.5 text-[11px] leading-snug text-rs-muted">{{ INDEX_DEFINITIONS[item.key]?.description }}</div>
              </div>
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  class="text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
                  :disabled="!embedCodes[item.key]"
                  @click="copyEmbedCode(item.key)"
                >
Code
</button>
                <button
                  v-for="format in embedVisualButtons"
                  :key="`${item.key}-${format.value}`"
                  type="button"
                  class="rounded border border-rs-border px-2 py-0.5 text-[10px] font-medium text-rs-fg transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
                  :disabled="!embedUrls[item.key] || visualExporting"
                  @click="downloadEmbedVisual(item.key, item.label, format.value)"
                >
{{ visualExporting && activeVisualExportKey === item.key && activeVisualExportFormat === format.value ? '…' : format.label }}
</button>
              </div>
            </div>
            <div
class="overflow-hidden"
style="height: 200px"
>
              <iframe
                v-if="embedUrls[item.key]"
                :ref="element => setEmbedPreviewFrame(item.key, element)"
                :src="embedUrls[item.key]"
                class="h-full w-full"
                loading="lazy"
              />
              <div
v-else
class="flex h-full items-center justify-center text-xs text-rs-muted"
>
                Publish to preview
              </div>
            </div>
            <div
v-if="embedCodes[item.key]"
class="border-t border-rs-border"
>
              <textarea
                class="w-full resize-none bg-transparent px-4 py-3 font-mono text-[11px] text-neutral-500 focus:outline-none"
                rows="3"
                readonly
                :value="embedCodes[item.key]"
              />
            </div>
            <p
v-if="embedVisualErrors[item.key]"
class="border-t border-rs-border px-4 py-2 text-xs text-danger-600"
>
              {{ embedVisualErrors[item.key] }}
            </p>
          </div>
        </div>

        <!-- Published bundles -->
        <div>
          <div class="mb-3 flex items-center justify-between">
            <h4 class="text-sm font-medium text-rs-fg">Published Bundles</h4>
          </div>

          <div
v-if="publishedEmbedsLoading && publishedEmbeds.length === 0"
class="rounded-lg border border-rs-border px-4 py-4 text-xs text-rs-muted"
>
            Loading…
          </div>
          <div
v-else-if="publishedEmbeds.length === 0"
class="rounded-lg border border-dashed border-rs-border px-4 py-6 text-center text-xs text-rs-muted"
>
            No published embeds yet.
          </div>
          <div
v-else
class="space-y-3"
>
            <div
              v-for="embed in publishedEmbeds"
              :key="embed.id"
              class="rounded-lg border border-rs-border p-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="text-sm font-medium text-rs-fg">{{ formatPublishedEmbedTitle(embed.title) }}</div>
                  <div class="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-rs-muted">
                    <span class="rounded bg-neutral-100 px-1.5 py-0.5 font-medium">{{ embed.surfaceKind === 'pulse' ? 'Pulse' : 'Indices' }}</span>
                    <span>{{ formatDate(embed.publishedAt) }}</span>
                    <span>{{ embed.theme }}</span>
                    <span
v-if="embed.revokedAt"
class="rounded bg-danger-50 px-1.5 py-0.5 font-medium text-danger-600"
>Revoked</span>
                    <span
v-else
class="rounded bg-success-50 px-1.5 py-0.5 font-medium text-success-700"
>Active</span>
                  </div>
                </div>
                <button
                  v-if="!embed.revokedAt"
                  type="button"
                  class="text-xs font-medium text-danger-600 hover:text-danger-700 disabled:opacity-50"
                  :disabled="publishedEmbedsLoading"
                  @click="revokePublishedEmbed(embed.id)"
                >
Revoke
</button>
              </div>
              <div class="mt-3 space-y-2">
                <div
                  v-for="variant in embed.variants"
                  :key="`${embed.id}-${variant.key}`"
                  class="flex items-center justify-between gap-3 rounded-md border border-rs-border bg-neutral-50 px-3 py-2"
                >
                  <div class="min-w-0">
                    <div class="text-xs font-medium text-rs-fg">{{ variant.label }}</div>
                    <div class="mt-0.5 truncate font-mono text-[10px] text-rs-muted">{{ variant.publicUrl }}</div>
                  </div>
                  <div class="flex flex-shrink-0 items-center gap-2">
                    <button
                      type="button"
                      class="text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
                      :disabled="Boolean(embed.revokedAt)"
                      @click="copyPublishedUrl(variant.publicUrl, variant.label)"
                    >
URL
</button>
                    <button
                      type="button"
                      class="text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
                      :disabled="Boolean(embed.revokedAt)"
                      @click="copyPublishedCode(variant.embedCode, variant.label)"
                    >
Embed
</button>
                    <a
                      v-if="!embed.revokedAt"
                      :href="variant.publicUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-xs font-medium text-brand-600 hover:text-brand-700"
                    >Open</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Data Exports ─── -->
    <section
id="enterprise-exports"
class="rounded-xl border border-rs-border bg-surface"
>
      <div class="flex items-center justify-between border-b border-rs-border px-6 py-4">
        <div>
          <h3 class="text-base font-semibold text-rs-fg">Data Exports</h3>
          <p class="mt-0.5 text-sm text-rs-muted">Build and download export jobs from your data catalog.</p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-rs-border px-3 py-1.5 text-xs font-medium text-rs-muted transition-colors hover:border-neutral-400 hover:text-rs-fg disabled:opacity-50"
          :disabled="exportJobsLoading"
          @click="fetchExportJobs"
        >
          <Icon
name="arrows-right-left"
:size="14"
class="text-current"
/>
          Refresh
        </button>
      </div>

      <div class="space-y-5 p-6">
        <!-- Create export bar -->
        <div class="flex flex-col gap-3 rounded-lg border border-rs-border bg-neutral-50 p-4 lg:flex-row lg:items-end">
          <div class="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label class="text-xs font-medium text-neutral-500">Type</label>
              <div class="mt-1.5">
                <UniversalDropdown
                  :model-value="exportJobType"
                  :options="exportTypeOptions"
                  placeholder="Select type"
                  @update:model-value="handleExportJobTypeChange"
                />
              </div>
              <p
v-if="EXPORT_TYPE_DESCRIPTIONS[exportJobType]"
class="mt-1 text-[11px] leading-snug text-rs-muted"
>
                {{ EXPORT_TYPE_DESCRIPTIONS[exportJobType] }}
              </p>
            </div>
            <div>
              <label class="text-xs font-medium text-neutral-500">Format</label>
              <div class="mt-1.5">
                <UniversalDropdown
                  :model-value="exportFormat"
                  :options="exportFormatOptions"
                  placeholder="Select format"
                  @update:model-value="handleExportFormatChange"
                />
              </div>
            </div>
            <div>
              <label class="text-xs font-medium text-neutral-500">From</label>
              <input
                v-model="exportDateFrom"
                type="date"
                class="mt-1.5 h-10 w-full rounded-lg border border-rs-border bg-surface px-3 text-sm text-rs-fg focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
            </div>
            <div>
              <label class="text-xs font-medium text-neutral-500">To</label>
              <input
                v-model="exportDateTo"
                type="date"
                class="mt-1.5 h-10 w-full rounded-lg border border-rs-border bg-surface px-3 text-sm text-rs-fg focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
            </div>
          </div>
          <button
            type="button"
            class="inline-flex h-10 items-center justify-center rounded-lg bg-brand-600 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
            :disabled="exportCreating || (exportJobType === 'indices' && !indicesExportsEnabled)"
            @click="handleCreateExport"
          >
{{ exportCreating ? 'Creating…' : 'Create export' }}
</button>
        </div>

        <!-- Indices corridor picker -->
        <div
v-if="exportJobType === 'indices'"
class="rounded-lg border border-rs-border bg-neutral-50 p-5"
>
          <div class="grid gap-6 lg:grid-cols-2">
            <div class="space-y-3">
              <label class="text-xs font-medium uppercase tracking-wider text-neutral-500">Add corridors</label>
              <div class="grid gap-3 sm:grid-cols-2">
                <div>
                  <label class="mb-1.5 block text-xs font-medium text-neutral-600">From</label>
                  <CountrySelect
                    v-model="exportFromCountry"
                    placeholder="Sending from…"
                    :allowed-codes="goldSendCountries"
                    @country-selected="(code: string) => handleExportCountrySelected('from', code)"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-xs font-medium text-neutral-600">To</label>
                  <CountrySelect
                    v-model="exportToCountry"
                    placeholder="Sending to…"
                    :allowed-codes="goldReceiveCountries"
                    :exclude-country="exportFromCountry"
                    @country-selected="(code: string) => handleExportCountrySelected('to', code)"
                  />
                </div>
              </div>
              <!-- Matching corridors for this pair -->
              <div
v-if="exportMatchingCorridors.length > 0"
class="space-y-1.5"
>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="corridor in exportMatchingCorridors"
                    :key="corridor.corridorId"
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-rs-border bg-surface px-3 py-1.5 text-xs font-medium text-rs-fg transition-colors hover:border-brand-300 disabled:opacity-50"
                    :disabled="selectedExportCorridorIdSet.has(corridor.corridorId)"
                    @click="addExportCorridor(corridor.corridorId)"
                  >
                    {{ corridor.sourceCurrency }}/{{ corridor.destCurrency }}
                    <span
v-if="selectedExportCorridorIdSet.has(corridor.corridorId)"
class="text-success-600"
>Added</span>
                    <span
v-else
class="text-brand-600"
>Add</span>
                  </button>
                </div>
                <button
                  v-if="exportMatchingCorridors.some(c => !selectedExportCorridorIdSet.has(c.corridorId))"
                  type="button"
                  class="text-xs font-medium text-brand-600 hover:text-brand-700"
                  @click="addMatchingExportCorridors"
                >
Add all {{ exportMatchingCorridors.length }} pairs
</button>
              </div>
              <div
v-else-if="exportFromCountry && exportToCountry && !corridorsLoading"
class="rounded-lg border border-dashed border-rs-border bg-surface px-3 py-3 text-center text-xs text-rs-muted"
>
                No corridors found for this pair.
              </div>
              <!-- Manual corridor ID fallback -->
              <details class="text-xs text-rs-muted">
                <summary class="cursor-pointer hover:text-rs-fg">Or enter corridor ID directly</summary>
                <input
                  v-model="exportCorridorSearch"
                  type="text"
                  placeholder="e.g. US-PH-USD-PHP"
                  class="mt-2 h-9 w-full rounded-lg border border-rs-border bg-surface px-3 text-sm text-rs-fg placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  @keydown.enter.prevent="commitExportSearch"
                >
                <button
                  v-if="manualExportCorridorId"
                  type="button"
                  class="mt-2 inline-flex items-center gap-1.5 rounded-md border border-rs-border bg-surface px-2.5 py-1.5 text-xs font-medium text-rs-fg transition-colors hover:border-brand-300"
                  @click="addExportCorridor(manualExportCorridorId)"
                >
Add {{ manualExportCorridorId }}
</button>
              </details>
            </div>

            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <label class="text-xs font-medium uppercase tracking-wider text-neutral-500">Selected</label>
                <span class="text-xs tabular-nums text-rs-muted">{{ selectedExportCorridorIds.length }}</span>
              </div>
              <div
v-if="selectedExportCorridors.length === 0"
class="rounded-lg border border-dashed border-rs-border bg-surface px-3 py-6 text-center text-xs text-rs-muted"
>
                Add corridors to export indices data.
              </div>
              <div
v-else
class="max-h-52 space-y-2 overflow-auto"
>
                <div
                  v-for="corridor in selectedExportCorridors"
                  :key="corridor.corridorId"
                  class="flex items-center justify-between gap-3 rounded-lg border border-rs-border bg-surface p-3"
                >
                  <div>
                    <div class="text-sm font-medium text-rs-fg">{{ corridorTitle(corridor) }}</div>
                    <div class="mt-0.5 text-xs text-rs-muted">{{ corridor.sourceCurrency }}/{{ corridor.destCurrency }} · {{ corridorSubtitle(corridor) }}</div>
                  </div>
                  <button
                    type="button"
                    class="text-xs font-medium text-danger-600 hover:text-danger-700"
                    @click="removeExportCorridor(corridor.corridorId)"
                  >
Remove
</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Export metadata pills -->
        <div class="flex flex-wrap items-center gap-2 text-xs text-rs-muted">
          <span class="rounded-md border border-rs-border bg-neutral-50 px-2 py-1">
            {{ limits.exportsMaxDays === 'unlimited' ? exportWindowLimitDays : limits.exportsMaxDays }}-day window
          </span>
          <span class="rounded-md border border-rs-border bg-neutral-50 px-2 py-1">Parquet available</span>
          <span
            v-if="delayedExportJobs.length > 0"
            class="rounded-md border border-warning-200 bg-warning-50 px-2 py-1 font-medium text-warning-700"
          >Delivery delayed</span>
        </div>

        <p
v-if="effectiveExportError"
class="text-sm text-danger-600"
>
{{ effectiveExportError }}
</p>

        <!-- Export jobs table -->
        <DataTable
          variant="consumer"
          caption="Export jobs"
          :columns="exportJobTableColumns"
          :rows="exportJobs"
          :row-key="exportJobTableRowKey"
          :loading="exportJobsLoading"
          :empty="{ title: 'No exports yet', message: 'Create an export to get started.' }"
        >
          <template #cell-jobType="{ row }">
            <span class="font-medium text-rs-fg">{{ formatExportJobType(exportJobFromRow(row).jobType) }}</span>
          </template>
          <template #cell-status="{ row }">
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                :class="exportStatusClasses(exportJobFromRow(row).status)"
              >{{ exportJobFromRow(row).status }}</span>
              <span
                v-if="['queued', 'running'].includes(exportJobFromRow(row).status)"
                class="text-xs text-rs-muted"
              >{{ formatJobAgeLabel(exportJobFromRow(row).createdAt) }}</span>
              <span
                v-if="isDelayedJob(exportJobFromRow(row))"
                class="rounded-full bg-warning-50 px-2 py-0.5 text-[11px] font-medium text-warning-700"
              >Delayed</span>
            </div>
            <div
              v-if="exportJobFromRow(row).status === 'failed' && exportJobFromRow(row).error"
              class="mt-1 text-xs text-danger-500"
            >
{{ exportJobFromRow(row).error }}
</div>
          </template>
          <template #cell-createdAt="{ row }">
            <div>
              <div class="text-sm text-rs-fg">{{ formatOptionalDate(exportJobFromRow(row).createdAt) }}</div>
              <div class="mt-0.5 text-xs text-rs-muted">{{ formatOptionalRelativeTime(exportJobFromRow(row).createdAt) }}</div>
              <div
                v-if="exportJobFromRow(row).finishedAt"
                class="mt-0.5 text-xs text-rs-muted"
              >
Finished {{ formatOptionalRelativeTime(exportJobFromRow(row).finishedAt) }}
</div>
              <div
                v-if="exportJobFromRow(row).expiresAt"
                class="mt-0.5 text-[10px] text-neutral-400"
              >
Expires {{ formatOptionalDate(exportJobFromRow(row).expiresAt) }}
</div>
            </div>
          </template>
          <template #row-actions="{ row }">
            <button
              v-if="exportJobFromRow(row).status === 'done'"
              type="button"
              class="text-xs font-medium text-brand-600 hover:text-brand-700"
              @click="downloadExport(exportJobFromRow(row).id)"
            >
Download
</button>
            <span
v-else-if="exportJobFromRow(row).status === 'failed'"
class="text-xs text-danger-600"
>Failed</span>
            <span
v-else
class="text-xs text-neutral-400"
>Pending</span>
          </template>
        </DataTable>
      </div>
    </section>
  </div>
</template>
