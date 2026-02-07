import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DataTable from '../../shared/ui/DataTable/DataTable.vue'

describe('DataTable', () => {
  it('renders columns and rows', () => {
    const wrapper = mount(DataTable, {
      props: {
        variant: 'consumer',
        caption: 'Example table',
        columns: [
          { key: 'name', label: 'Name' },
          { key: 'value', label: 'Value', align: 'right' },
        ],
        rows: [{ id: '1', name: 'A', value: 1 }],
        rowKey: (row: any) => row.id,
      },
    })

    expect(wrapper.text()).toContain('Name')
    expect(wrapper.text()).toContain('Value')
    expect(wrapper.text()).toContain('A')
    expect(wrapper.text()).toContain('1')
  })

  it('shows loading state', () => {
    const wrapper = mount(DataTable, {
      props: {
        variant: 'consumer',
        columns: [{ key: 'name', label: 'Name' }],
        rows: [],
        rowKey: () => 'k',
        loading: true,
      },
    })

    expect(wrapper.text()).toContain('Loading')
  })

  it('shows empty state', () => {
    const wrapper = mount(DataTable, {
      props: {
        variant: 'consumer',
        columns: [{ key: 'name', label: 'Name' }],
        rows: [],
        rowKey: () => 'k',
        empty: { title: 'No rows', message: 'Try again' },
      },
    })

    expect(wrapper.text()).toContain('No rows')
    expect(wrapper.text()).toContain('Try again')
  })

  it('shows error state', () => {
    const wrapper = mount(DataTable, {
      props: {
        variant: 'terminal',
        columns: [{ key: 'name', label: 'Name' }],
        rows: [],
        rowKey: () => 'k',
        error: { title: 'Failed', message: 'Boom' },
      },
    })

    expect(wrapper.text()).toContain('Failed')
    expect(wrapper.text()).toContain('Boom')
  })

  it('emits sort changes via onSortChange', async () => {
    const onSortChange = vi.fn()
    const wrapper = mount(DataTable, {
      props: {
        variant: 'consumer',
        columns: [{ key: 'name', label: 'Name', sortable: true }],
        rows: [{ id: '1', name: 'A' }],
        rowKey: (row: any) => row.id,
        sort: null,
        onSortChange,
      },
    })

    await wrapper.find('th').trigger('click')
    expect(onSortChange).toHaveBeenCalledWith({ key: 'name', direction: 'desc' })
  })

  it('calls onPageChange when pagination is used', async () => {
    const onPageChange = vi.fn()
    const wrapper = mount(DataTable, {
      props: {
        variant: 'consumer',
        columns: [{ key: 'name', label: 'Name' }],
        rows: [{ id: '1', name: 'A' }],
        rowKey: (row: any) => row.id,
        pagination: { page: 1, pageSize: 10, total: 25 },
        onPageChange,
      },
    })

    const next = wrapper.findAll('button').find(b => b.text() === 'Next')
    expect(next).toBeTruthy()
    await next!.trigger('click')
    expect(onPageChange).toHaveBeenCalledWith(2)
  })
})
