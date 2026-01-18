import { File } from 'node:buffer'

if (typeof globalThis.File === 'undefined') {
  globalThis.File = File as unknown as typeof globalThis.File
}

const stringPrototype = String.prototype as {
  toWellFormed?: () => string
}

if (typeof stringPrototype.toWellFormed !== 'function') {
  stringPrototype.toWellFormed = function toWellFormed(): string {
    return String(this)
  }
}
