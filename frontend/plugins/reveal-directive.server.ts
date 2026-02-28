import type { Directive } from 'vue'

const noopReveal: Directive = {}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('reveal', noopReveal)
})
