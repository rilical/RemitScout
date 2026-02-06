import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CenteredPage from '~/shared/ui/CenteredPage.vue'

describe('CenteredPage', () => {
  it('renders header, content, and footer slots when provided', () => {
    const wrapper = mount(CenteredPage, {
      slots: {
        header: 'Header',
        default: 'Content',
        footer: 'Footer',
      },
    })

    expect(wrapper.find('header').text()).toContain('Header')
    expect(wrapper.find('main').text()).toContain('Content')
    expect(wrapper.find('footer').text()).toContain('Footer')

    const container = wrapper.find('.max-w-page')
    expect(container.exists()).toBe(true)
    expect(container.classes()).toEqual(
      expect.arrayContaining(['mx-auto', 'w-full', 'max-w-page', 'px-page-x', 'py-page-y']),
    )
  })

  it('does not render header/footer wrappers when slots are absent', () => {
    const wrapper = mount(CenteredPage, {
      slots: {
        default: 'Only content',
      },
    })

    expect(wrapper.find('header').exists()).toBe(false)
    expect(wrapper.find('footer').exists()).toBe(false)
    expect(wrapper.find('main').text()).toContain('Only content')
  })
})

