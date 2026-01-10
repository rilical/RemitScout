import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ScoreBadge from '../../components/shared/ScoreBadge.vue'

describe('ScoreBadge', () => {
  it('renders the score with one decimal place', () => {
    const wrapper = mount(ScoreBadge, { props: { score: 8.25 } })
    expect(wrapper.text()).toContain('8.3')
  })

  it('emits click when clickable', async () => {
    const wrapper = mount(ScoreBadge, { props: { score: 9.1, clickable: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})
