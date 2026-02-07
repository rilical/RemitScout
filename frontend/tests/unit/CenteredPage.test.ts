import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CenteredPage from '../../shared/ui/CenteredPage/CenteredPage.vue'

describe('CenteredPage', () => {
  it('renders title and subtitle via props', () => {
    const wrapper = mount(CenteredPage, {
      props: {
        title: 'Dashboard',
        subtitle: 'Overview',
      },
    })

    expect(wrapper.find('h1').text()).toBe('Dashboard')
    expect(wrapper.find('p').text()).toBe('Overview')
  })

  it('renders actions slot', () => {
    const wrapper = mount(CenteredPage, {
      props: { title: 'T' },
      slots: {
        actions: '<button id="action">Action</button>',
      },
    })

    expect(wrapper.find('#action').exists()).toBe(true)
  })

  it('applies maxWidth and paddingY classes', () => {
    const wrapper = mount(CenteredPage, {
      props: {
        title: 'T',
        maxWidth: 'sm',
        paddingY: 'lg',
      },
    })

    const container = wrapper.find('div.mx-auto')
    expect(container.classes()).toContain('max-w-sm')
    expect(wrapper.classes()).toContain('py-14')
  })
})
