import { ref } from 'vue'

export const CHART_VISUAL_EXPORT_FORMATS = ['png', 'svg', 'pdf'] as const
export type ChartVisualExportFormat = (typeof CHART_VISUAL_EXPORT_FORMATS)[number]

export type ChartImageExportTarget = HTMLElement | HTMLIFrameElement

export type ChartImageExportOptions = {
  /** Legacy metadata retained for compatibility with existing callers. */
  title?: string
  subtitle?: string
  source?: string
  /** Scale factor for raster outputs. */
  scale?: number
  /** Export background color override. */
  bgColor?: string
  /** Legacy brand color field retained for compatibility. */
  accentColor?: string
  /** Filename without extension. */
  filename?: string
  /** Output format. Defaults to png. */
  format?: ChartVisualExportFormat
  /** Optional selector to locate the exact export root within the target. */
  rootSelector?: string
}

const DEFAULT_EXPORT_ROOT_SELECTOR = '[data-chart-export-root]'
const DEFAULT_BACKGROUND = '#0a0a0a'
const DEFAULT_SCALE = 2

type ResolvedExportTarget = {
  node: HTMLElement
  width: number
  height: number
}

export function useChartImageExport() {
  const exporting = ref(false)

  async function exportVisual(
    target: ChartImageExportTarget,
    options: ChartImageExportOptions = {},
  ): Promise<void> {
    if (exporting.value) return
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('Visual export is only available in the browser.')
    }

    exporting.value = true

    try {
      const format = options.format ?? 'png'
      const resolved = await resolveExportTarget(target, options.rootSelector)
      const filename = `${sanitizeFilename(options.filename || options.title || 'remit-scout-chart')}.${format}`
      const backgroundColor = options.bgColor || resolveBackgroundColor(resolved.node)
      const scale = normalizeScale(options.scale)

      const htmlToImage = await import('html-to-image')
      const renderOptions = {
        backgroundColor,
        cacheBust: true,
        pixelRatio: scale,
        skipAutoScale: true,
      }

      if (format === 'svg') {
        const svgDataUrl = await htmlToImage.toSvg(resolved.node, renderOptions)
        triggerDownload(dataUrlToBlob(svgDataUrl), filename)
        return
      }

      const canvas = await htmlToImage.toCanvas(resolved.node, renderOptions)
      if (format === 'pdf') {
        const { jsPDF } = await import('jspdf')
        const pdf = new jsPDF({
          orientation: resolved.width >= resolved.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [resolved.width, resolved.height],
          compress: true,
        })
        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          0,
          0,
          resolved.width,
          resolved.height,
          undefined,
          'FAST',
        )
        pdf.save(filename)
        return
      }

      const blob = await canvasToBlob(canvas, 'image/png')
      triggerDownload(blob, filename)
    }
 finally {
      exporting.value = false
    }
  }

  async function exportAsImage(
    target: ChartImageExportTarget,
    options: ChartImageExportOptions = {},
  ): Promise<void> {
    await exportVisual(target, { ...options, format: 'png' })
  }

  return {
    exportAsImage,
    exportVisual,
    exporting,
  }
}

async function resolveExportTarget(
  target: ChartImageExportTarget,
  rootSelector = DEFAULT_EXPORT_ROOT_SELECTOR,
): Promise<ResolvedExportTarget> {
  if (target instanceof HTMLIFrameElement) {
    const iframeRoot = await resolveIframeRoot(target, rootSelector)
    return buildResolvedTarget(iframeRoot)
  }

  const root = resolveElementRoot(target, rootSelector)
  return buildResolvedTarget(root)
}

function resolveElementRoot(target: HTMLElement, rootSelector: string): HTMLElement {
  if (target.matches(rootSelector)) return target
  const nestedRoot = target.querySelector<HTMLElement>(rootSelector)
  return nestedRoot || target
}

async function resolveIframeRoot(
  iframe: HTMLIFrameElement,
  rootSelector: string,
): Promise<HTMLElement> {
  await waitForIframeDocument(iframe)

  const doc = iframe.contentDocument
  if (!doc) {
    throw new Error('Embed preview is not ready yet.')
  }

  const root
    = doc.querySelector<HTMLElement>(rootSelector)
      || doc.body?.firstElementChild
      || doc.documentElement

  if (!(root instanceof HTMLElement)) {
    throw new Error('Unable to find a renderable embed root.')
  }

  return root
}

async function waitForIframeDocument(iframe: HTMLIFrameElement): Promise<void> {
  const doc = iframe.contentDocument
  if (doc?.readyState === 'complete' || doc?.readyState === 'interactive') {
    return
  }

  await new Promise<void>((resolve, reject) => {
    const onLoad = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error('Embed preview failed to load.'))
    }
    const cleanup = () => {
      iframe.removeEventListener('load', onLoad)
      iframe.removeEventListener('error', onError)
    }

    iframe.addEventListener('load', onLoad, { once: true })
    iframe.addEventListener('error', onError, { once: true })
  })
}

function buildResolvedTarget(node: HTMLElement): ResolvedExportTarget {
  const rect = node.getBoundingClientRect()
  const width = Math.max(Math.round(rect.width || node.scrollWidth || node.offsetWidth || 0), 1)
  const height = Math.max(
    Math.round(rect.height || node.scrollHeight || node.offsetHeight || 0),
    1,
  )

  if (width <= 1 || height <= 1) {
    throw new Error('Rendered chart is not ready for export yet.')
  }

  return { node, width, height }
}

function resolveBackgroundColor(node: HTMLElement): string {
  const win = node.ownerDocument.defaultView
  const background = win?.getComputedStyle(node).backgroundColor || ''
  if (!background || background === 'rgba(0, 0, 0, 0)' || background === 'transparent') {
    return DEFAULT_BACKGROUND
  }
  return background
}

function normalizeScale(scale?: number): number {
  if (typeof scale === 'number' && Number.isFinite(scale) && scale > 0) {
    return Math.min(Math.max(scale, 1), 4)
  }
  return DEFAULT_SCALE
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, payload] = dataUrl.split(',')
  if (!meta || !payload) {
    throw new Error('Invalid SVG export payload.')
  }
  const mime = /data:(.*?)(;|$)/.exec(meta)?.[1] || 'image/svg+xml'
  if (meta.includes(';base64')) {
    const bytes = Uint8Array.from(atob(payload), char => char.charCodeAt(0))
    return new Blob([bytes], { type: mime })
  }
  return new Blob([decodeURIComponent(payload)], { type: mime })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
        return
      }
      reject(new Error('Failed to generate image export.'))
    }, type)
  })
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function sanitizeFilename(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'remit-scout-chart'
  )
}
