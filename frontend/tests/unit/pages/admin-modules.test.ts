import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';

const mockGetModuleHealth = vi.hoisted(() => vi.fn());

vi.mock('~/lib/opsApi', () => ({
  getModuleHealth: (...args: unknown[]) => mockGetModuleHealth(...args),
}));

const mountModulesPage = async () => {
  const ModulesPage = (await import('~/pages/admin/modules.vue')).default;
  return mount(ModulesPage, {
    global: {
      stubs: {
        AdminPageShell: {
          props: ['title', 'subtitle', 'loading', 'error', 'meta'],
          template: '<div><div v-if="error">{{ error }}</div><slot /><slot name="actions" /></div>',
        },
        ModuleHealthCard: {
          props: ['module'],
          template: '<div class="module-card">{{ module.display_name }}</div>',
        },
      },
    },
  });
};

describe('admin modules page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetModuleHealth.mockResolvedValue({ modules: [], updatedAt: null });

    vi.stubGlobal('definePageMeta', vi.fn());
    vi.stubGlobal('useAdminPage', vi.fn());
    vi.stubGlobal('ref', ref);
    vi.stubGlobal('computed', computed);
    vi.stubGlobal('watch', watch);
    vi.stubGlobal('onMounted', onMounted);
    vi.stubGlobal('onUnmounted', onUnmounted);
    vi.stubGlobal('useAdminFormat', () => ({
      formatDateTime: (value: string | null) => value || '—',
      formatDuration: (value: number | null | undefined) => (value == null ? '—' : `${value}s`),
      formatNumber: (value: number | null | undefined) => (value == null ? '—' : String(value)),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders registry guidance when no modules are registered', async () => {
    const wrapper = await mountModulesPage();

    await flushPromises();
    await flushPromises();

    expect(wrapper.text()).toContain('No modules registered yet');
    expect(wrapper.text()).toContain('silver.module_registry');
  });

  it('filters the inventory by search and attention state', async () => {
    mockGetModuleHealth.mockResolvedValue({
      updatedAt: '2026-03-07T12:00:00.000Z',
      modules: [
        {
          module_id: 'remitly-bank',
          display_name: 'Remitly Bank Rails',
          provider_id: 'remitly',
          collector_type: 'api',
          status: 'production',
          quarantine_reason: null,
          quarantined_at: null,
          last_success_at: '2026-03-07T11:55:00.000Z',
          last_failure_at: null,
          parse_error_rate: 0,
          consecutive_failures: 0,
          last_health_check_at: '2026-03-07T11:58:00.000Z',
          updated_at: '2026-03-07T12:00:00.000Z',
        },
        {
          module_id: 'wise-wallet',
          display_name: 'Wise Sandbox',
          provider_id: 'wise',
          collector_type: 'browser',
          status: 'sandbox',
          quarantine_reason: null,
          quarantined_at: null,
          last_success_at: '2026-03-06T08:00:00.000Z',
          last_failure_at: '2026-03-06T08:30:00.000Z',
          parse_error_rate: 0.04,
          consecutive_failures: 2,
          last_health_check_at: '2026-03-05T08:00:00.000Z',
          updated_at: '2026-03-07T12:00:00.000Z',
        },
      ],
    });

    const wrapper = await mountModulesPage();

    await flushPromises();
    await flushPromises();

    expect(wrapper.text()).toContain('Remitly Bank Rails');
    expect(wrapper.text()).toContain('Wise Sandbox');

    await wrapper.get('input[placeholder="Filter module or provider"]').setValue('wise');
    await flushPromises();

    expect(wrapper.text()).toContain('Wise Sandbox');
    expect(wrapper.text()).not.toContain('Remitly Bank Rails');

    await wrapper.get('select').setValue('attention');
    await flushPromises();

    expect(wrapper.text()).toContain('Wise Sandbox');
  });
});
