import { defineNitroPlugin } from 'nitropack/runtime/plugin'

const encodeNuxtAssetUrls = (html: string) => {
  return html.replace(
    /(href|src)=(")(\/_nuxt\/[^"]*)(")/g,
    (_match, attr: string, openQuote: string, rawUrl: string, closeQuote: string) => {
      const encodedUrl = rawUrl.includes(' ') ? encodeURI(rawUrl) : rawUrl
      return `${attr}=${openQuote}${encodedUrl}${closeQuote}`
    },
  )
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', (response) => {
    if (typeof response.body !== 'string') return
    if (!response.body.includes('<html')) return
    response.body = encodeNuxtAssetUrls(response.body)
  })
})
