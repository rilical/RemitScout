import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import DataTable from '~/ui/DataTable/DataTable.vue'

describe('DataTable', () => {
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'amount', label: 'Amount', align: 'right' as const },
  ]

  const rowKey = (row: any) => row.id

  it('renders headers and rows', () => {
    const wrapper = mount(DataTable, {
      props: {
        caption: 'Example table',
        columns,
        rows: [
          { id: 'r1', name: 'Alice', amount: 10 },
          { id: 'r2', name: 'Bob', amount: 20 },
        ],
        rowKey,
      },
    })

    expect(wrapper.get('caption').text()).toBe('Example table')

    const headers = wrapper.findAll('th').map(th => th.text())
    expect(headers).toEqual(['Name', 'Amount'])

    const cells = wrapper.findAll('td').map(td => td.text())
    expect(cells).toEqual(['Alice', '10', 'Bob', '20'])
  })

  it('supports terminal and consumer variants', () => {
    const consumer = mount(DataTable, {
      props: { columns, rows: [{ id: 'r1', name: 'Alice', amount: 10 }], rowKey },
    })

    expect(consumer.classes()).toContain('rounded-xl')

    const terminal = mount(DataTable, {
      props: {
        variant: 'terminal',
        columns,
        rows: [{ id: 'r1', name: 'Alice', amount: 10 }],
        rowKey,
      },
    })

    expect(terminal.classes()).toContain('rounded-lg')
  })

  it('renders loading state and sets aria-busy', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns,
        rows: [],
        rowKey,
        loading: true,
      },
    })

    expect(wrapper.get('table').attributes('aria-busy')).toBe('true')
    expect(wrapper.text()).toContain('Loading')
  })

  it('renders empty state when no rows', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns,
        rows: [],
        rowKey,
        empty: { title: 'Nothing here' },
      },
    })

    expect(wrapper.text()).toContain('Nothing here')
  })

  it('supports per-column header and cell slots', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns,
        rows: [{ id: 'r1', name: 'Alice', amount: 10 }],
        rowKey,
      },
      slots: {
        'header-name': '<span>Full Name</span>',
        'cell-amount': ({ value }: any) => h('span', `$${value}`),
      },
    })

    expect(wrapper.findAll('th').map(th => th.text())).toEqual([
      'Full Name',
      'Amount',
    ])
    expect(wrapper.findAll('td').map(td => td.text())).toEqual(['Alice', '$10'])
  })
})
