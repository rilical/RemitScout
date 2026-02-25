/**
 * Chart-to-image export composable.
 *
 * Captures any container element (typically containing an SVG chart) as a
 * high-resolution branded PNG with Remit-Scout attribution, source metadata,
 * and a backlink watermark — optimized for blog embeds and social sharing.
 */
import { ref } from 'vue'

export type ChartImageExportOptions = {
  /** Title shown in the branded header */
  title: string
  /** Subtitle / corridor description */
  subtitle?: string
  /** Source attribution line */
  source?: string
  /** Scale factor for retina output (default 2) */
  scale?: number
  /** Background color (default #171717 — neutral-900) */
  bgColor?: string
  /** Brand accent color (default #2563EB — brand-600) */
  accentColor?: string
  /** Filename without extension */
  filename?: string
}

const PADDING = 32
const HEADER_HEIGHT = 72
const FOOTER_HEIGHT = 48
const BRAND_FONT = '600 16px Inter, system-ui, sans-serif'
const SUBTITLE_FONT = '400 12px Inter, system-ui, sans-serif'
const FOOTER_FONT = '500 11px Inter, system-ui, sans-serif'
const WATERMARK_FONT = '600 10px Inter, system-ui, sans-serif'

export function useChartImageExport() {
  const exporting = ref(false)

  /**
   * Render an element to a branded PNG and trigger download.
   *
   * @param el - The container element to capture (should contain the SVG chart)
   * @param options - Branding and metadata options
   */
  async function exportAsImage(
    el: HTMLElement,
    options: ChartImageExportOptions,
  ): Promise<void> {
    if (exporting.value) return
    exporting.value = true

    try {
      const scale = options.scale ?? 2
      const bgColor = options.bgColor ?? '#171717'
      const accentColor = options.accentColor ?? '#2563EB'

      // Find the SVG inside the element
      const svg = el.querySelector('svg')
      if (!svg) throw new Error('No SVG chart found in the container.')

      // Clone the SVG and inline computed styles for a self-contained snapshot
      const clonedSvg = svg.cloneNode(true) as SVGSVGElement
      inlineComputedStyles(svg, clonedSvg)

      // Resolve the intrinsic SVG size from the viewBox
      const viewBox = clonedSvg.getAttribute('viewBox')?.split(/\s+/).map(Number)
      const svgW = viewBox?.[2] ?? svg.clientWidth ?? 800
      const svgH = viewBox?.[3] ?? svg.clientHeight ?? 320

      // Canvas dimensions
      const chartW = svgW
      const chartH = svgH
      const canvasW = chartW + PADDING * 2
      const canvasH = HEADER_HEIGHT + chartH + FOOTER_HEIGHT + PADDING
      const scaledW = canvasW * scale
      const scaledH = canvasH * scale

      // Set the cloned SVG to the exact render size
      clonedSvg.setAttribute('width', String(chartW))
      clonedSvg.setAttribute('height', String(chartH))
      clonedSvg.removeAttribute('class')

      // Serialize the SVG to a data URL
      const svgData = new XMLSerializer().serializeToString(clonedSvg)
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const svgUrl = URL.createObjectURL(svgBlob)

      const img = new Image()
      img.width = chartW * scale
      img.height = chartH * scale

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to rasterize SVG.'))
        img.src = svgUrl
      })

      // Create the canvas
      const canvas = document.createElement('canvas')
      canvas.width = scaledW
      canvas.height = scaledH
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context unavailable.')

      ctx.scale(scale, scale)

      // Background
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, canvasW, canvasH)

      // --- Header ---
      // Brand accent bar
      ctx.fillStyle = accentColor
      ctx.fillRect(0, 0, canvasW, 4)

      // Title
      ctx.fillStyle = '#FFFFFF'
      ctx.font = BRAND_FONT
      ctx.textBaseline = 'top'
      ctx.fillText(options.title, PADDING, 20)

      // Subtitle
      if (options.subtitle) {
        ctx.fillStyle = '#A3A3A3'
        ctx.font = SUBTITLE_FONT
        ctx.fillText(options.subtitle, PADDING, 42)
      }

      // Remit-Scout logo text (right-aligned)
      ctx.fillStyle = accentColor
      ctx.font = BRAND_FONT
      const logoText = 'Remit-Scout'
      const logoW = ctx.measureText(logoText).width
      ctx.fillText(logoText, canvasW - PADDING - logoW, 20)

      // Date (right-aligned under logo)
      ctx.fillStyle = '#737373'
      ctx.font = SUBTITLE_FONT
      const dateText = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      const dateW = ctx.measureText(dateText).width
      ctx.fillText(dateText, canvasW - PADDING - dateW, 42)

      // --- Chart area ---
      ctx.drawImage(img, PADDING, HEADER_HEIGHT, chartW, chartH)
      URL.revokeObjectURL(svgUrl)

      // --- Footer ---
      const footerY = HEADER_HEIGHT + chartH + 12

      // Source attribution
      const sourceText = options.source ?? 'Source: remit-scout.com'
      ctx.fillStyle = '#A3A3A3'
      ctx.font = FOOTER_FONT
      ctx.fillText(sourceText, PADDING, footerY)

      // Backlink watermark (right)
      ctx.fillStyle = '#525252'
      ctx.font = WATERMARK_FONT
      const watermark = 'remit-scout.com/pulse'
      const wmW = ctx.measureText(watermark).width
      ctx.fillText(watermark, canvasW - PADDING - wmW, footerY)

      // Divider line above footer
      ctx.strokeStyle = '#404040'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(PADDING, footerY - 8)
      ctx.lineTo(canvasW - PADDING, footerY - 8)
      ctx.stroke()

      // --- Download ---
      const filename = (options.filename ?? sanitizeFilename(options.title)) + '.png'
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b)
          else reject(new Error('Failed to generate PNG.'))
        }, 'image/png')
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      exporting.value = false
    }
  }

  return { exportAsImage, exporting }
}

/** Recursively copy computed styles from source to clone so the SVG renders self-contained. */
function inlineComputedStyles(source: Element, clone: Element) {
  const computed = window.getComputedStyle(source)
  const importantProps = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-opacity', 'font-size', 'font-family', 'font-weight', 'opacity', 'color']
  for (const prop of importantProps) {
    const val = computed.getPropertyValue(prop)
    if (val) {
      ;(clone as HTMLElement).style.setProperty(prop, val)
    }
  }
  const sourceChildren = source.children
  const cloneChildren = clone.children
  for (let i = 0; i < sourceChildren.length && i < cloneChildren.length; i++) {
    inlineComputedStyles(sourceChildren[i], cloneChildren[i])
  }
}

function sanitizeFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'remit-scout-chart'
}
