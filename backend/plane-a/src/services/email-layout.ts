export type EmailTheme = 'default' | 'warning' | 'danger' | 'success'

export interface EmailLayoutOptions {
  title: string
  subtitle?: string | null
  preheader?: string | null
  bodyHtml: string
  cta?: {
    text: string
    url: string
  } | null
  secondaryCta?: {
    text: string
    url: string
  } | null
  footerHtml?: string | null
  theme?: EmailTheme
  siteUrl?: string
}

const BRAND_BLUE = '#2563EB'
const BRAND_NAVY = '#0F172A'
const BRAND_LIGHT_BG = '#F1F5F9'
const BRAND_SURFACE = '#FFFFFF'
const BRAND_BORDER = '#E2E8F0'
const BRAND_TEXT = '#0F172A'
const BRAND_TEXT_MUTED = '#64748B'
const BRAND_TEXT_SUBTLE = '#94A3B8'

const THEME_COLORS: Record<EmailTheme, { header: string; button: string }> = {
  default: { header: BRAND_NAVY, button: BRAND_BLUE },
  warning: { header: BRAND_NAVY, button: '#D97706' },
  danger:  { header: BRAND_NAVY, button: '#DC2626' },
  success: { header: BRAND_NAVY, button: '#16A34A' },
}

export function countryCodeToFlagEmoji(code?: string | null): string {
  if (!code || typeof code !== 'string') return '\u{1f30d}'
  const normalized = code.trim().toUpperCase()
  if (normalized.length !== 2) return '\u{1f30d}'
  const base = 0x1f1e6
  return String.fromCodePoint(
    base + normalized.charCodeAt(0) - 65,
    base + normalized.charCodeAt(1) - 65,
  )
}

const LOGO_SVG = `<svg width="28" height="36" viewBox="0 0 128.34 162.52" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="${BRAND_BLUE}" d="M98.74,102.17c13.36-8.62,25.3-20.51,28.42-36.77C133.82,30.75,111.46,2.63,76.48.66c-15.34-.86-36.51-.91-51.82,0C11.66,1.43,1.85,7.46.03,21.1l-.03,126.09c.69,10.81,10.96,18.56,21.34,13.99,4.11-1.81,23.5-21.66,27.42-26.17,3.88-4.46,7.54-8.46,4.26-14.65-4.3-8.13-20.93-17.58-23.6-26.34-1.72-5.65-.36-9.12,3.17-13.54,5.17-6.46,12.26-12.55,18.92-18.72l-3.08-3.08c-1.65-1.65-.89-4.46,1.36-5.06l17.89-4.79c2.25-.6,4.31,1.46,3.7,3.7l-4.79,17.89c-.6,2.25-3.41,3-5.06,1.36l-3.46-3.46c-6.21,5.96-13.13,11.75-18.46,17.96-1.93,2.22-1.5,5.63,0,7.92,2.36,3.63,12.87,13.27,16.66,17.14,15.72,16.02,31.84,31.73,47.7,47.62,7.14,5.97,18.86,4.43,22.84-4.36,3.09-6.83-.14-11.16-3.62-16.68-7.63-12.1-16.94-23.49-24.45-35.72Z"/></svg>`

export function buildEmailHtml(options: EmailLayoutOptions): string {
  const theme = THEME_COLORS[options.theme || 'default']
  const siteUrl = (options.siteUrl || 'https://remit-scout.com').replace(/\/$/, '')

  const safePreheader = options.preheader
    ? options.preheader.replace(/<[^>]*>?/gm, '').replace(/\n/g, ' ').slice(0, 120)
    : ''

  const ctaHtml = options.cta ? `
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td bgcolor="${theme.button}" style="border-radius:8px; mso-padding-alt:14px 28px;">
                    <a href="${options.cta.url}" style="display:inline-block; padding:14px 28px; color:#ffffff; text-decoration:none; font-weight:600; font-size:15px; font-family:'Inter',system-ui,-apple-system,sans-serif; letter-spacing:-0.01em;">${options.cta.text}</a>
                  </td>
                  ${options.secondaryCta ? `
                  <td style="padding-left:12px;">
                    <a href="${options.secondaryCta.url}" style="display:inline-block; padding:14px 20px; color:${BRAND_BLUE}; text-decoration:none; font-weight:600; font-size:15px; font-family:'Inter',system-ui,-apple-system,sans-serif;">${options.secondaryCta.text}</a>
                  </td>
                  ` : ''}
                </tr>
              </table>` : ''

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${options.title} | Remit-Scout</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; }
    body, table, td { font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .email-body-padding { padding: 20px 20px 24px !important; }
      .email-header-padding { padding: 20px !important; }
      .mobile-full-width { width: 100% !important; display: block !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:${BRAND_LIGHT_BG}; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
  ${safePreheader ? `<div style="display:none; max-height:0; overflow:hidden; font-size:1px; line-height:1px; color:${BRAND_LIGHT_BG};">${safePreheader}${'&zwnj;&nbsp;'.repeat(30)}</div>` : ''}

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND_LIGHT_BG};">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Logo -->
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td align="center">
              <a href="${siteUrl}" style="text-decoration:none; display:inline-flex; align-items:center;">
                ${LOGO_SVG}
                <span style="margin-left:10px; font-size:20px; font-weight:700; color:${BRAND_NAVY}; font-family:'Inter',system-ui,-apple-system,sans-serif; letter-spacing:-0.03em;">Remit-Scout</span>
              </a>
            </td>
          </tr>
        </table>

        <!-- Main Card -->
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" style="width:100%; max-width:600px; background:${BRAND_SURFACE}; border-radius:16px; overflow:hidden; border:1px solid ${BRAND_BORDER}; box-shadow:0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.06);">

          <!-- Header -->
          <tr>
            <td class="email-header-padding" style="background:${theme.header}; padding:32px 36px;">
              <h1 style="margin:0; font-size:22px; font-weight:700; color:#FFFFFF; font-family:'Inter',system-ui,-apple-system,sans-serif; letter-spacing:-0.02em; line-height:1.3;">${options.title}</h1>
              ${options.subtitle ? `<p style="margin:8px 0 0; font-size:20px; font-weight:600; color:rgba(255,255,255,0.9); font-family:'Inter',system-ui,-apple-system,sans-serif; line-height:1.3; letter-spacing:-0.01em;">${options.subtitle}</p>` : ''}
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="email-body-padding" style="padding:28px 36px 32px; font-size:15px; line-height:1.65; color:${BRAND_TEXT}; font-family:'Inter',system-ui,-apple-system,sans-serif;">
              ${options.bodyHtml}
              ${ctaHtml}
            </td>
          </tr>

          ${options.footerHtml ? `
          <!-- Footer -->
          <tr>
            <td style="padding:0 36px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="border-top:1px solid ${BRAND_BORDER}; padding-top:20px; font-size:13px; color:${BRAND_TEXT_MUTED}; line-height:1.6; font-family:'Inter',system-ui,-apple-system,sans-serif;">
                  ${options.footerHtml}
                </td></tr>
              </table>
            </td>
          </tr>
          ` : ''}

        </table>

        <!-- Bottom links -->
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
          <tr>
            <td align="center" style="font-size:12px; color:${BRAND_TEXT_SUBTLE}; font-family:'Inter',system-ui,-apple-system,sans-serif; line-height:1.6;">
              <a href="${siteUrl}" style="color:${BRAND_TEXT_SUBTLE}; text-decoration:none;">remit-scout.com</a>
              &nbsp;&middot;&nbsp;
              <a href="${siteUrl}/dashboard?tab=account&section=notifications" style="color:${BRAND_TEXT_SUBTLE}; text-decoration:underline;">Email preferences</a>
              <br>
              &copy; ${new Date().getFullYear()} Remit-Scout LLC. All rights reserved.
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`.trim()
}
