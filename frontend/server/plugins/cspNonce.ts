import { defineNitroPlugin } from 'nitropack/runtime/plugin'

const addNonceToScripts = (html: string, nonce: string) => {
  return html.replace(/<script(?![^>]*\bnonce=)/g, `<script nonce="${nonce}"`)
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    const nonce = (event?.context as { cspNonce?: string } | undefined)?.cspNonce
    if (!nonce) return

    html.head = html.head.map((fragment) => addNonceToScripts(fragment, nonce))
    html.bodyPrepend = html.bodyPrepend.map((fragment) => addNonceToScripts(fragment, nonce))
    html.bodyAppend = html.bodyAppend.map((fragment) => addNonceToScripts(fragment, nonce))
  })
})
