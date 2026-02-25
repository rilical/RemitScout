import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
  scrollBehavior(to, _from, savedPosition) {
    // Restore saved position (back/forward navigation)
    if (savedPosition) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(savedPosition), 100)
      })
    }

    // Smooth scroll to anchor with header offset
    if (to.hash) {
      return {
        el: to.hash,
        top: 80,
        behavior: 'smooth',
      }
    }

    // All other navigations: jump to top instantly
    return { top: 0, left: 0, behavior: 'instant' as ScrollBehavior }
  },
}
