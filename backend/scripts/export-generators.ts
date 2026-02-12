import PDFDocument from 'pdfkit'
import archiver from 'archiver'

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
    const doc = new PDFDocument({ margin: 40 })
    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.fontSize(18).text(title)
    doc.moveDown()

    for (const section of sections) {
      doc.fontSize(14).text(section.title)
      doc.moveDown(0.5)
      doc.fontSize(10).text(section.headers.join(' | '))
      doc.moveDown(0.25)
      for (const row of section.rows) {
        const line = section.headers.map((header) => String(row[header] ?? '')).join(' | ')
        doc.text(line)
      }
      doc.moveDown()
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
