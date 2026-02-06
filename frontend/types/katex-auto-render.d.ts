declare module 'katex/contrib/auto-render' {
  export type Delimiter = {
    left: string
    right: string
    display: boolean
  }

  export type RenderMathInElementOptions = {
    delimiters?: Delimiter[]
    throwOnError?: boolean
    errorColor?: string
    macros?: Record<string, string>
    ignoredTags?: string[]
    ignoredClasses?: string[]
  }

  export default function renderMathInElement(
    elem: HTMLElement,
    options?: RenderMathInElementOptions,
  ): void

  export function renderMathInElement(
    elem: HTMLElement,
    options?: RenderMathInElementOptions,
  ): void
}
