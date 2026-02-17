import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import InstitutionalTeaser from '~/components/home/InstitutionalTeaser.vue'

describe('InstitutionalTeaser', () => {
  it('stays stealth-safe (no product terms, no /institutions deep-links)', () => {
    const wrapper = mount(InstitutionalTeaser, {
      global: {
        stubs: {
          NuxtLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
        },
      },
    })

    const text = wrapper.text()
    expect(text).toContain('For institutions')

    expect(text).not.toContain('Data API')
    expect(text).not.toContain('Compliance')
    expect(text).not.toContain('RESTful API')
    expect(text).not.toContain('Synthetically Verified')

    const html = wrapper.html()
    expect(html).not.toContain('/institutions/api')
    expect(html).not.toContain('/institutions/compliance')

    expect(html).not.toContain('/institutions')
    expect(html).toContain('/contact?type=enterprise&amp;topic=pulse')
  })
})
