import { PassThrough } from 'node:stream'
import PDFDocument from 'pdfkit'
import archiver from 'archiver'
import { ParquetSchema, ParquetWriter } from 'parquetjs-lite'

export type CsvSection = {
  title: string
  headers: string[]
  rows: Array<Record<string, unknown>>
}

export const escapeCsv = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  const str = typeof value === 'string' ? value : JSON.stringify(value)
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export const buildCsv = (headers: string[], rows: Array<Record<string, unknown>>): string => {
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsv(row[header])).join(','))
  }
  return lines.join('\n')
}

export const buildCsvSections = (sections: CsvSection[]): string => {
  const lines: string[] = []
  for (const section of sections) {
    lines.push(`SECTION:${section.title}`)
    lines.push(buildCsv(section.headers, section.rows))
    lines.push('')
  }
  return lines.join('\n')
}

export const renderPdf = async (title: string, sections: CsvSection[]): Promise<Buffer> => {
  return await new Promise<Buffer>((resolve, reject) => {
    const useLandscape = sections.some((s) => s.headers.length > 5)
    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      layout: useLandscape ? 'landscape' : 'portrait',
      bufferPages: true,
      info: {
        Title: title,
        Author: 'Remit-Scout',
        Creator: 'Remit-Scout Data Export',
      },
    })
    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const pageMargin = 40
    const pageWidth = (doc.page.width as number) - pageMargin * 2
    const generatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC'

    // --- Header ---
    doc.font('Helvetica-Bold').fontSize(20).fillColor('#111827').text('Remit-Scout', pageMargin, pageMargin)
    doc.font('Helvetica').fontSize(10).fillColor('#6B7280').text('Data Export Report', pageMargin, pageMargin + 24)
    doc.fontSize(9).text(`Generated: ${generatedAt}`, pageMargin, pageMargin + 38)
    doc.moveTo(pageMargin, pageMargin + 56).lineTo(pageMargin + pageWidth, pageMargin + 56).strokeColor('#D1D5DB').lineWidth(1).stroke()
    doc.y = pageMargin + 68

    // --- Title ---
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#111827').text(title)
    doc.moveDown(0.8)

    const HEADER_BG = '#1F2937'
    const HEADER_TEXT = '#FFFFFF'
    const ROW_ALT_BG = '#F9FAFB'
    const BORDER_COLOR = '#E5E7EB'
    const CELL_PAD_X = 4
    const CELL_PAD_Y = 4
    const BASE_FONT_SIZE = 8
    const BASE_HEADER_FONT_SIZE = 8
    const ROW_HEIGHT = 18
    const HEADER_HEIGHT = 22
    const MIN_COL_WIDTH = 30

    for (let si = 0; si < sections.length; si++) {
      const section = sections[si]
      const colCount = section.headers.length

      // Adaptive font sizing for wide tables
      const FONT_SIZE = colCount > 10 ? 6 : BASE_FONT_SIZE
      const HEADER_FONT_SIZE = colCount > 10 ? 6 : BASE_HEADER_FONT_SIZE

      // Proportional column widths based on max content length per column
      const colMaxLengths = section.headers.map((header, ci) => {
        let maxLen = header.length
        for (const row of section.rows) {
          const val = String(row[header] ?? '')
          if (val.length > maxLen) maxLen = val.length
        }
        return Math.max(maxLen, 2) // minimum 2 chars
      })
      const totalContentLength = colMaxLengths.reduce((a, b) => a + b, 0)
      const colWidths = colMaxLengths.map((len) => {
        const proportional = (len / totalContentLength) * pageWidth
        return Math.max(MIN_COL_WIDTH, proportional)
      })
      const totalTableWidth = colWidths.reduce((a, b) => a + b, 0)
      // Apply scale factor AFTER the min-width floor
      const scale = totalTableWidth > pageWidth ? pageWidth / totalTableWidth : 1
      const scaledWidths = colWidths.map((w) => w * scale)

      // Section title
      if (si > 0) doc.moveDown(0.5)
      const sectionTitleY = doc.y
      if (sectionTitleY + HEADER_HEIGHT + ROW_HEIGHT > (doc.page.height as number) - 80) {
        doc.addPage()
      }
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#374151').text(section.title)
      doc.moveDown(0.3)

      // Table header
      let tableX = pageMargin
      let tableY = doc.y

      doc.save()
      doc.rect(tableX, tableY, pageWidth, HEADER_HEIGHT).fill(HEADER_BG)
      doc.font('Helvetica-Bold').fontSize(HEADER_FONT_SIZE).fillColor(HEADER_TEXT)
      let cx = tableX
      for (let ci = 0; ci < colCount; ci++) {
        doc.text(section.headers[ci], cx + CELL_PAD_X, tableY + CELL_PAD_Y, {
          width: scaledWidths[ci] - CELL_PAD_X * 2,
          height: HEADER_HEIGHT,
          ellipsis: true,
          lineBreak: false,
        })
        cx += scaledWidths[ci]
      }
      doc.restore()
      tableY += HEADER_HEIGHT

      // Data rows
      for (let ri = 0; ri < section.rows.length; ri++) {
        if (tableY + ROW_HEIGHT > (doc.page.height as number) - 60) {
          doc.addPage()
          tableY = pageMargin
        }

        // Alternating row background
        if (ri % 2 === 1) {
          doc.save()
          doc.rect(tableX, tableY, pageWidth, ROW_HEIGHT).fill(ROW_ALT_BG)
          doc.restore()
        }

        // Row border
        doc.save()
        doc.moveTo(tableX, tableY + ROW_HEIGHT).lineTo(tableX + pageWidth, tableY + ROW_HEIGHT).strokeColor(BORDER_COLOR).lineWidth(0.5).stroke()
        doc.restore()

        cx = tableX
        const row = section.rows[ri]
        for (let ci = 0; ci < colCount; ci++) {
          const val = String(row[section.headers[ci]] ?? '')
          const isNumeric = val !== '' && !Number.isNaN(Number(val))
          doc.font(isNumeric ? 'Courier' : 'Helvetica').fontSize(FONT_SIZE).fillColor('#374151')
          doc.text(val, cx + CELL_PAD_X, tableY + CELL_PAD_Y, {
            width: scaledWidths[ci] - CELL_PAD_X * 2,
            height: ROW_HEIGHT,
            ellipsis: true,
            lineBreak: false,
          })
          cx += scaledWidths[ci]
        }
        tableY += ROW_HEIGHT
      }

      doc.y = tableY + 8
    }

    // --- Footer on every page ---
    const pageCount = doc.bufferedPageRange().count
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i)
      const footerY = (doc.page.height as number) - 30
      doc.font('Helvetica').fontSize(8).fillColor('#9CA3AF')
      doc.text(`Page ${i + 1} of ${pageCount}`, pageMargin, footerY, { width: pageWidth / 2 })
      doc.text('Generated by Remit-Scout \u00B7 remit-scout.com', pageMargin + pageWidth / 2, footerY, {
        width: pageWidth / 2,
        align: 'right',
      })
    }

    doc.end()
  })
}

export const buildZip = async (
  entries: Array<{ name: string; content: Buffer | string }>,
  onWarning?: (warning: Error) => void,
): Promise<Buffer> => {
  return await new Promise<Buffer>((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } })
    const chunks: Buffer[] = []
    archive.on('data', (chunk) => chunks.push(chunk))
    archive.on('warning', (warning) => {
      onWarning?.(warning)
    })
    archive.on('error', reject)
    archive.on('end', () => resolve(Buffer.concat(chunks)))

    for (const entry of entries) {
      archive.append(entry.content, { name: entry.name })
    }
    try {
      archive.finalize()
    } catch (error) {
      reject(error)
    }
  })
}

export type ParquetFieldType = 'UTF8' | 'DOUBLE' | 'INT32' | 'BOOLEAN'
export type ParquetFieldDefinition = { type: ParquetFieldType; optional?: boolean }
export type ParquetSchemaDefinition = Record<string, ParquetFieldDefinition>

export const buildParquetBuffer = async (
  schemaDefinition: ParquetSchemaDefinition,
  rows: Array<Record<string, unknown>>,
): Promise<Buffer> => {
  const schema = new ParquetSchema(schemaDefinition)
  const stream = new PassThrough()
  const chunks: Buffer[] = []

  stream.on('data', (chunk) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  })

  const writer = await ParquetWriter.openStream(schema, stream)
  for (const row of rows) {
    await writer.appendRow(row)
  }
  await writer.close()

  await new Promise<void>((resolve, reject) => {
    stream.on('finish', () => resolve())
    stream.on('error', (error) => reject(error))
  })

  return Buffer.concat(chunks)
}
