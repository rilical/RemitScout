import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminCommandPalette from '~/components/admin/AdminCommandPalette.vue'

const commands = [
  {
    id: 'nav:/admin',
    label: 'Go to Overview',
    description: 'Open admin overview page',
    keywords: ['overview', 'admin'],
  },
  {
    id: 'query:audit',
    label: 'Search audit by actor',
    description: 'Open audit search query',
    keywords: ['audit', 'actor'],
  },
]

describe('AdminCommandPalette', () => {
  it('filters commands and emits execute for selected item', async () => {
    const wrapper = mount(AdminCommandPalette, {
      props: {
        open: true,
        commands,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await wrapper.get('input').setValue('audit')
    const buttons = wrapper.findAll('button')
    const actionButton = buttons.find(button => button.text().includes('Search audit by actor'))
    expect(actionButton).toBeTruthy()

    await actionButton!.trigger('click')

    const emitted = wrapper.emitted('execute')
    expect(emitted).toBeTruthy()
    expect(emitted?.[0]?.[0]).toMatchObject({ id: 'query:audit' })
  })

  it('emits close on escape', async () => {
    const wrapper = mount(AdminCommandPalette, {
      props: {
        open: true,
        commands,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await wrapper.get('div.fixed').trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
