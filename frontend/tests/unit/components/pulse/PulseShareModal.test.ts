import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const mockCreatePulsePublishedEmbed = vi.hoisted(() => vi.fn())

vi.mock('~/lib/pulseApi', async () => {
  const actual = await vi.importActual<typeof import('~/lib/pulseApi')>('~/lib/pulseApi')
  return {
    ...actual,
    createPulsePublishedEmbed: (...args: unknown[]) => mockCreatePulsePublishedEmbed(...args),
  }
})

vi.mock('~/composables/useFocusTrap', () => ({
  useFocusTrap: () => ({
    activate: vi.fn(),
    deactivate: vi.fn(),
  }),
}))

vi.mock('~/composables/useChartImageExport', async () => {
  const actual = await vi.importActual<typeof import('~/composables/useChartImageExport')>(
    '~/composables/useChartImageExport',
  )
  return {
    ...actual,
    useChartImageExport: () => ({
      exportVisual: vi.fn(),
      exportAsImage: vi.fn(),
      exporting: { value: false },
    }),
  }
})

describe('PulseShareModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreatePulsePublishedEmbed.mockResolvedValue({
      publishedId: '123e4567-e89b-12d3-a456-426614174000',
      publicUrl: 'https://remit-scout.test/embed/pulse/all-in-cost?published_id=123e4567-e89b-12d3-a456-426614174000',
      embedCode: '<iframe src="https://remit-scout.test/embed/pulse/all-in-cost?published_id=123e4567-e89b-12d3-a456-426614174000"></iframe>',
      createdAt: '2026-03-05T12:00:00.000Z',
      publishedAt: '2026-03-05T12:00:00.000Z',
      chartId: 'all-in-cost',
      corridorId: 'US-PH-USD-PHP',
      title: 'All-in Cost Index (RCI)',
      theme: 'dark',
      variants: [
        {
          key: 'all-in-cost',
          label: 'All-in Cost Index (RCI)',
          publicUrl:
            'https://remit-scout.test/embed/pulse/all-in-cost?published_id=123e4567-e89b-12d3-a456-426614174000',
          embedCode:
            '<iframe src="https://remit-scout.test/embed/pulse/all-in-cost?published_id=123e4567-e89b-12d3-a456-426614174000"></iframe>',
        },
      ],
    })

    vi.stubGlobal('useLogger', () => ({
      error: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const mountModal = async (overrides?: { range?: '7d' | '30d' | '90d' | '365d' }) => {
    const PulseShareModal = (await import('~/components/pulse/PulseShareModal.vue')).default
    const wrapper = mount(PulseShareModal, {
      props: {
        chartId: 'all-in-cost',
        filters: {
          corridor: 'usd-php',
          corridorId: 'US-PH-USD-PHP',
          amount: 500,
          fundingMethod: 'bank',
          payoutMethod: 'bank',
        },
        range: overrides?.range ?? '30d',
      },
      global: {
        stubs: {
          Icon: true,
        },
      },
    })

    await flushPromises()
    return wrapper
  }

  it('renders publish-first embed copy without auto-publishing on open', async () => {
    const wrapper = await mountModal()

    expect(wrapper.text()).toContain(
      'Publish a durable static embed and paste this code into your website.',
    )
    expect(wrapper.text()).toContain('Viewers only access the public published URL created here.')
    expect(wrapper.text()).not.toContain('Copy the link below to share this chart with others.')
    expect(mockCreatePulsePublishedEmbed).not.toHaveBeenCalled()
  })

  it('shows enterprise-only copy when publishing is rejected', async () => {
    mockCreatePulsePublishedEmbed.mockRejectedValue({
      message: 'Forbidden',
      data: {
        error: 'enterprise_required',
      },
    })

    const wrapper = await mountModal()
    await wrapper.findAll('button').find(button => button.text() === 'Publish Static Embed')?.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain(
      'Enterprise embed access is required to publish static Pulse embeds.',
    )
  })

  it('publishes using the active chart range', async () => {
    const wrapper = await mountModal({ range: '365d' })
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Publish Static Embed')
      ?.trigger('click')
    await flushPromises()

    expect(mockCreatePulsePublishedEmbed).toHaveBeenCalledWith(
      expect.objectContaining({
        range: '365d',
      }),
    )
  })

  it('clears the published embed when the theme changes', async () => {
    const wrapper = await mountModal()
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Publish Static Embed')
      ?.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Published embed ready')

    await wrapper.get('#pulse-embed-theme').setValue('light')
    await flushPromises()

    expect(wrapper.text()).not.toContain('Published embed ready')
    expect(wrapper.text()).toContain('Publish a static embed to preview it here.')
  })

  it('offers PNG, SVG, and PDF visual exports', async () => {
    const wrapper = await mountModal()

    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Download Visual')
      ?.trigger('click')

    expect(wrapper.text()).toContain('Download PNG')
    expect(wrapper.text()).toContain('Download SVG')
    expect(wrapper.text()).toContain('Download PDF')
    expect(wrapper.text()).toContain('Visual exports preserve legends, context, and attribution')
  })
})
