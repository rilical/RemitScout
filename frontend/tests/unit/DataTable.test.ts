import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import DataTable from '~/components/shared/DataTable.vue'

describe('DataTable', () => {
  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'amount', header: 'Amount', align: 'right' as const },
  ]

  it('renders headers and rows', () => {
    const wrapper = mount(DataTable, {
      props: {
        caption: 'Example table',
        columns,
        rows: [
          { id: 'r1', name: 'Alice', amount: 10 },
          { id: 'r2', name: 'Bob', amount: 20 },
        ],
      },
    })

    expect(wrapper.get('caption').text()).toBe('Example table')

    const headers = wrapper.findAll('th').map(th => th.text())
    expect(headers).toEqual(['Name', 'Amount'])

    const cells = wrapper.findAll('td').map(td => td.text())
    expect(cells).toEqual(['Alice', '10', 'Bob', '20'])
  })

  it('supports terminal and dashboard variants', () => {
    const dashboard = mount(DataTable, {
      props: { columns, rows: [{ id: 'r1', name: 'Alice', amount: 10 }] },
    })

    expect(dashboard.get('[data-testid="data-table-root"]').classes()).toEqual(
      expect.arrayContaining(['rounded-rs-lg']),
    )
    expect(dashboard.get('[data-testid="data-table"]').classes()).toEqual(
      expect.arrayContaining(['text-body-sm']),
    )

    const terminal = mount(DataTable, {
      props: {
        variant: 'terminal',
        columns,
        rows: [{ id: 'r1', name: 'Alice', amount: 10 }],
      },
    })

    expect(terminal.get('[data-testid="data-table-root"]').classes()).toEqual(
      expect.arrayContaining(['rounded-rs-md']),
    )
    expect(terminal.get('[data-testid="data-table"]').classes()).toEqual(
      expect.arrayContaining(['text-body-sm']),
    )
  })

  it('renders loading state and sets aria-busy', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns,
        loading: true,
      },
    })

    expect(wrapper.get('[data-testid="data-table"]').attributes('aria-busy')).toBe(
      'true',
    )
    expect(wrapper.get('[role="status"]').attributes('aria-label')).toBe('Loading table')
  })

  it('renders empty state when no rows', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns,
        rows: [],
        emptyText: 'Nothing here',
      },
    })

    expect(wrapper.text()).toContain('Nothing here')
  })

  it('supports per-column header and cell slots', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns,
        rows: [{ id: 'r1', name: 'Alice', amount: 10 }],
      },
      slots: {
        'header-name': '<span>Full Name</span>',
        'cell-amount': ({ value }) => h('span', `$${value}`),
      },
    })

    expect(wrapper.findAll('th').map(th => th.text())).toEqual([
      'Full Name',
      'Amount',
    ])
    expect(wrapper.findAll('td').map(td => td.text())).toEqual(['Alice', '$10'])
  })
})
