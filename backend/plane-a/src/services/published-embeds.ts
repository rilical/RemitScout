import { config } from '../../../shared/config'
import type {
  PublishedEmbedRow,
  PublishedEmbedSurfaceKind,
} from '../repositories/interfaces/published-embed-repository.interface'

export type PublishedEmbedVariant = {
  key: string
  label: string
  publicUrl: string
  embedCode: string
}

export type PublishedEmbedListItem = {
  id: string
  surfaceKind: PublishedEmbedSurfaceKind
  title: string
  theme: 'dark' | 'light'
  createdAt: string
  publishedAt: string
  revokedAt: string | null
  publicUrl: string
  embedCode: string
  variants: PublishedEmbedVariant[]
}

const escapeHtmlAttribute = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const buildPublishedEmbedCode = (publicUrl: string, title: string, height = 320) => [
  '<figure class="remit-scout-embed">',
  `  <iframe src="${publicUrl}" width="100%" height="${height}" style="border:0;border-radius:8px;" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="${escapeHtmlAttribute(title)}"></iframe>`,
  '  <figcaption style="font-size:12px;color:#64748b;">Source: Remit-Scout · Static published embed</figcaption>',
  '</figure>',
].join('\n')

const INDICES_VARIANTS: Array<{ key: string; label: string }> = [
  { key: 'teer', label: 'TEER' },
  { key: 'rci', label: 'RCI' },
  { key: 'rvi_bps', label: 'RVI (bps)' },
]

export const resolvePublishedEmbedBaseUrl = (): string => {
  const configured = config.billing.stripe.frontendBaseUrl || config.newsletter.baseUrl || 'https://remit-scout.com'
  return configured.replace(/\/$/, '')
}

export const buildPulsePublishedEmbedUrl = (
  baseUrl: string,
  chartKey: string,
  publishedId: string,
) => `${baseUrl}/embed/pulse/${encodeURIComponent(chartKey)}?published_id=${encodeURIComponent(publishedId)}`

export const buildIndicesPublishedEmbedUrl = (
  baseUrl: string,
  indexKey: string,
  publishedId: string,
) => `${baseUrl}/embed/indices/${encodeURIComponent(indexKey)}?published_id=${encodeURIComponent(publishedId)}`

export const buildPublishedEmbedListItem = (
  row: PublishedEmbedRow,
  baseUrl = resolvePublishedEmbedBaseUrl(),
): PublishedEmbedListItem => {
  const variants = row.surface_kind === 'pulse'
    ? (() => {
        const key = row.chart_key || 'chart'
        const publicUrl = buildPulsePublishedEmbedUrl(baseUrl, key, row.id)
        return [{
          key,
          label: row.title,
          publicUrl,
          embedCode: buildPublishedEmbedCode(publicUrl, row.title, 400),
        }]
      })()
    : INDICES_VARIANTS.map((variant) => {
        const publicUrl = buildIndicesPublishedEmbedUrl(baseUrl, variant.key, row.id)
        return {
          key: variant.key,
          label: variant.label,
          publicUrl,
          embedCode: buildPublishedEmbedCode(publicUrl, `${row.title} · ${variant.label}`, 320),
        }
      })

  return {
    id: row.id,
    surfaceKind: row.surface_kind,
    title: row.title,
    theme: row.theme,
    createdAt: row.created_at.toISOString(),
    publishedAt: row.published_at.toISOString(),
    revokedAt: row.revoked_at ? row.revoked_at.toISOString() : null,
    publicUrl: variants[0]?.publicUrl || '',
    embedCode: variants[0]?.embedCode || '',
    variants,
  }
}
