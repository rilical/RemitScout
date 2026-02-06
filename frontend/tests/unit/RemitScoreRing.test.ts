import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RemitScoreRing from '../../components/shared/RemitScoreRing.vue'

describe('RemitScoreRing', () => {
  it('renders the score with one decimal place and an aria-label', () => {
    const wrapper = mount(RemitScoreRing, { props: { score: 8.25 } })
    expect(wrapper.text()).toContain('8.3')
    expect(wrapper.find('svg').attributes('aria-label')).toContain('8.3 out of 10')
  })

  it('clamps values to [0, 10]', () => {
    const tooLow = mount(RemitScoreRing, { props: { score: -5 } })
    expect(tooLow.text()).toContain('0.0')

    const tooHigh = mount(RemitScoreRing, { props: { score: 99 } })
    expect(tooHigh.text()).toContain('10.0')
  })

  it('uses consistent color mapping by score band', () => {
    const green = mount(RemitScoreRing, { props: { score: 9.0 } })
    expect(green.findAll('circle')[1]?.attributes('stroke')).toBe('#10b981')

    const blue = mount(RemitScoreRing, { props: { score: 8.0 } })
    expect(blue.findAll('circle')[1]?.attributes('stroke')).toBe('#2563eb')

    const yellow = mount(RemitScoreRing, { props: { score: 7.0 } })
    expect(yellow.findAll('circle')[1]?.attributes('stroke')).toBe('#eab308')

    const gray = mount(RemitScoreRing, { props: { score: 6.9 } })
    expect(gray.findAll('circle')[1]?.attributes('stroke')).toBe('#6b7280')
  })

  it('computes a dashArray proportional to the score', () => {
    const wrapper = mount(RemitScoreRing, { props: { score: 10 } })
    const circles = wrapper.findAll('circle')
    const dashArray = circles[1]?.attributes('stroke-dasharray') || ''
    const [dashRaw, circumferenceRaw] = dashArray.split(' ')
    const dash = Number.parseFloat(dashRaw)
    const circumference = Number.parseFloat(circumferenceRaw)

    expect(Number.isFinite(dash)).toBe(true)
    expect(Number.isFinite(circumference)).toBe(true)
    expect(Math.abs(dash - circumference)).toBeLessThan(1e-6)
  })
})
