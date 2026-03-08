import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockToCanvas = vi.hoisted(() => vi.fn())
const mockToSvg = vi.hoisted(() => vi.fn())
const mockPdfAddImage = vi.hoisted(() => vi.fn())
const mockPdfSave = vi.hoisted(() => vi.fn())
const mockJsPdf = vi.hoisted(() => vi.fn())

vi.mock('html-to-image', () => ({
  toCanvas: (...args: unknown[]) => mockToCanvas(...args),
  toSvg: (...args: unknown[]) => mockToSvg(...args),
}))

vi.mock('jspdf', () => ({
  jsPDF: class {
    constructor(...args: unknown[]) {
      mockJsPdf(...args)
    }

    addImage(...args: unknown[]) {
      mockPdfAddImage(...args)
    }

    save(...args: unknown[]) {
      mockPdfSave(...args)
    }
  },
}))

function setRect(element: HTMLElement, width: number, height: number) {
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      width,
      height,
      top: 0,
      right: width,
      bottom: height,
      left: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
  })
}

function createCanvasStub() {
  const canvas = document.createElement('canvas')
  canvas.toBlob = ((callback: BlobCallback) =>
    callback(new Blob(['png'], { type: 'image/png' }))) as typeof canvas.toBlob
  canvas.toDataURL = vi.fn(() => 'data:image/png;base64,ZmFrZQ==') as typeof canvas.toDataURL
  return canvas
}

describe('useChartImageExport', () => {
  const downloads: string[] = []

  beforeEach(() => {
    vi.clearAllMocks()
    downloads.length = 0

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(() => 'blob:remit-scout'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    })

    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloads.push(this.download)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('exports the nested chart card as PNG instead of the wrapper shell', async () => {
    const wrapper = document.createElement('div')
    const exportRoot = document.createElement('div')
    exportRoot.setAttribute('data-chart-export-root', '')
    exportRoot.style.backgroundColor = 'rgb(23, 23, 23)'
    setRect(exportRoot, 640, 360)
    wrapper.appendChild(exportRoot)
    mockToCanvas.mockResolvedValue(createCanvasStub())

    const { useChartImageExport } = await import('~/composables/useChartImageExport')
    const { exportAsImage } = useChartImageExport()

    await exportAsImage(wrapper, { filename: 'pulse-card' })

    expect(mockToCanvas).toHaveBeenCalledWith(
      exportRoot,
      expect.objectContaining({
        backgroundColor: 'rgb(23, 23, 23)',
        pixelRatio: 2,
      }),
    )
    expect(downloads).toEqual(['pulse-card.png'])
  })

  it('exports SVG payloads from full DOM cards', async () => {
    const exportRoot = document.createElement('div')
    exportRoot.setAttribute('data-chart-export-root', '')
    setRect(exportRoot, 720, 400)
    mockToSvg.mockResolvedValue(
      'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http://www.w3.org/2000/svg%22%3E%3C/svg%3E',
    )

    const { useChartImageExport } = await import('~/composables/useChartImageExport')
    const { exportVisual } = useChartImageExport()

    await exportVisual(exportRoot, { filename: 'pulse-card', format: 'svg' })

    expect(mockToSvg).toHaveBeenCalledWith(
      exportRoot,
      expect.objectContaining({
        pixelRatio: 2,
      }),
    )
    expect(downloads).toEqual(['pulse-card.svg'])
  })

  it('exports iframe-backed embed previews to PDF', async () => {
    const iframe = document.createElement('iframe')
    const iframeDocument = document.implementation.createHTMLDocument('embed-preview')
    Object.defineProperty(iframeDocument, 'readyState', {
      configurable: true,
      value: 'complete',
    })
    const exportRoot = iframeDocument.createElement('div')
    exportRoot.setAttribute('data-chart-export-root', '')
    setRect(exportRoot, 680, 320)
    iframeDocument.body.appendChild(exportRoot)
    Object.defineProperty(iframe, 'contentDocument', {
      configurable: true,
      value: iframeDocument,
    })

    mockToCanvas.mockResolvedValue(createCanvasStub())

    const { useChartImageExport } = await import('~/composables/useChartImageExport')
    const { exportVisual } = useChartImageExport()

    await exportVisual(iframe, { filename: 'indices-teer', format: 'pdf' })

    expect(mockToCanvas).toHaveBeenCalledWith(
      exportRoot,
      expect.objectContaining({
        pixelRatio: 2,
      }),
    )
    expect(mockJsPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        format: [680, 320],
        orientation: 'landscape',
      }),
    )
    expect(mockPdfAddImage).toHaveBeenCalled()
    expect(mockPdfSave).toHaveBeenCalledWith('indices-teer.pdf')
  })
})
