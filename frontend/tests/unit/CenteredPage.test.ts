import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CenteredPage from '~/ui/CenteredPage/CenteredPage.vue'

describe('CenteredPage', () => {
  it('renders title and default slot', () => {
    const wrapper = mount(CenteredPage, {
      props: { title: 'Page Title' },
      slots: {
        default: 'Content',
      },
    })

    expect(wrapper.find('h1').text()).toContain('Page Title')
    expect(wrapper.text()).toContain('Content')

    const container = wrapper.find('.mx-auto')
    expect(container.exists()).toBe(true)
    expect(container.classes()).toEqual(
      expect.arrayContaining(['mx-auto', 'w-full', 'max-w-page', 'px-page-x']),
    )
  })

  it('does not render header when no title/subtitle/actions provided', () => {
    const wrapper = mount(CenteredPage, {
      slots: {
        default: 'Only content',
      },
    })

    expect(wrapper.find('header').exists()).toBe(false)
    expect(wrapper.text()).toContain('Only content')
  })
})
