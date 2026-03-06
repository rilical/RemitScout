import { ref, computed } from 'vue';
import { useApi } from '~/composables/useApi';
import { useEntitlements } from '~/composables/useEntitlements';
import { mapPlanStateFailureMessage } from '~/composables/usePlanStateError';
import type { DataTableColumn } from '~/ui';
import { EXPORTS_MAX_WINDOW_DAYS_HARD_CAP } from '~/shared/lib/exports';

type ExportJobRecord = {
  id: string;
  jobType: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  expiresAt: string | null;
  error: string | null;
};

export function useEnterpriseExports() {
  const { request } = useApi();
  const { limits, indicesExportsEnabled } = useEntitlements();

  const jobs = ref<ExportJobRecord[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const loaded = ref(false);
  const jobType = ref<'history' | 'watchlist' | 'alerts' | 'all' | 'indices'>('history');
  const format = ref<'csv' | 'pdf' | 'parquet'>('csv');
  const dateFrom = ref('');
  const dateTo = ref('');
  const corridorIdsText = ref('');
  const creating = ref(false);

  const exportWindowLimitDays = computed(() => {
    const raw = limits.value.exportsMaxDays;
    if (raw === 'unlimited') return EXPORTS_MAX_WINDOW_DAYS_HARD_CAP;
    if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
      return Math.min(raw, EXPORTS_MAX_WINDOW_DAYS_HARD_CAP);
    }
    return EXPORTS_MAX_WINDOW_DAYS_HARD_CAP;
  });

  const parsedCorridorIds = computed(() => {
    return corridorIdsText.value
      .split(/[\n,]/)
      .map(value => value.trim().toUpperCase())
      .filter(Boolean);
  });

  const columns: DataTableColumn[] = [
    { key: 'jobType', label: 'Type' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created' },
    { key: 'actions', label: '', align: 'right', widthClass: 'w-28' },
  ];

  const rowKey = (row: unknown, rowIndex: number) => {
    return (row as ExportJobRecord).id || String(rowIndex);
  };

  const fromRow = (row: unknown): ExportJobRecord => row as ExportJobRecord;

  const statusClasses = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-success-100 text-success-700';
      case 'failed':
        return 'bg-danger-100 text-danger-700';
      case 'running':
        return 'bg-brand-100 text-brand-700';
      default:
        return 'bg-neutral-100 text-neutral-600';
    }
  };

  const toErrorMessage = (err: unknown, fallback: string) => {
    const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
    if (/429|too many|rate.?limit/i.test(raw))
      return 'Rate limited — wait a moment then press Refresh.';
    const errorData =
      err && typeof err === 'object' && 'data' in err
        ? ((err as { data?: Record<string, unknown> }).data ?? null)
        : null;
    if (
      errorData?.error === 'export_window_exceeds_plan_limit' &&
      typeof errorData.allowedDays === 'number'
    ) {
      return `Export window too large. Max is ${errorData.allowedDays} days.`;
    }
    return mapPlanStateFailureMessage(err, fallback, {
      enterprise_required: 'Enterprise bulk export access is required.',
      indices_export_enterprise_only: 'TEER / RCI / RVI exports require an Enterprise plan.',
      plan_inactive: 'Your paid plan is inactive. Reactivate billing to create exports.',
    });
  };

  const fetchJobs = async () => {
    if (loading.value) return;
    loading.value = true;
    error.value = null;
    try {
      const response = await request<{ success: boolean; jobs: ExportJobRecord[] }>('/exports');
      jobs.value = response.jobs ?? [];
      loaded.value = true;
    } catch (err) {
      error.value = toErrorMessage(err, 'Unable to load exports.');
    } finally {
      loading.value = false;
    }
  };

  const createJob = async () => {
    if (creating.value) return;
    creating.value = true;
    error.value = null;
    try {
      const body: Record<string, unknown> = {
        dataType: jobType.value,
        format: format.value,
      };
      if (dateFrom.value) body.dateFrom = dateFrom.value;
      if (dateTo.value) body.dateTo = dateTo.value;
      if (jobType.value === 'indices') {
        if (!indicesExportsEnabled.value) {
          throw new Error('TEER / RCI / RVI exports require an Enterprise plan.');
        }
        if (parsedCorridorIds.value.length === 0) {
          throw new Error('Enter at least one corridor ID for TEER / RCI / RVI exports.');
        }
        body.corridorIds = parsedCorridorIds.value;
      }

      const requiresDateRange =
        jobType.value === 'history' || jobType.value === 'all' || jobType.value === 'indices';
      if (requiresDateRange) {
        if (!dateFrom.value || !dateTo.value) {
          throw new Error(`Please select a date range (max ${exportWindowLimitDays.value} days).`);
        }
        const from = new Date(`${dateFrom.value}T00:00:00.000Z`);
        const to = new Date(`${dateTo.value}T23:59:59.999Z`);
        if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
          throw new Error('Invalid date range.');
        }
        const diffDays = Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) + 1;
        if (diffDays > exportWindowLimitDays.value) {
          throw new Error(`Export window too large. Max is ${exportWindowLimitDays.value} days.`);
        }
      }

      await request<{
        success: boolean;
        job: { id: string; status: string; jobType: string; createdAt: string };
      }>('/exports', { method: 'POST', body });
      await fetchJobs();
    } catch (err) {
      error.value = toErrorMessage(err, 'Unable to create export.');
    } finally {
      creating.value = false;
    }
  };

  const downloadJob = async (jobId: string) => {
    try {
      const result = await request<{ url: string }>(`/exports/${jobId}/download`);
      if (import.meta.client) {
        window.open(result.url, '_blank', 'noopener');
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
      error.value = raw || 'Unable to fetch export download URL.';
    }
  };

  return {
    jobs,
    loading,
    error,
    loaded,
    jobType,
    format,
    dateFrom,
    dateTo,
    corridorIdsText,
    parsedCorridorIds,
    exportWindowLimitDays,
    creating,
    columns,
    rowKey,
    fromRow,
    statusClasses,
    fetchJobs,
    createJob,
    downloadJob,
  };
}
