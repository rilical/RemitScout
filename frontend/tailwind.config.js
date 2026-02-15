/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors'

const BRAND = colors.blue
const PRIMARY = colors.blue
const NEUTRAL = colors.slate
const SUCCESS = colors.emerald
const WARNING = colors.amber
const DANGER = colors.red
const ACCENT = colors.violet

export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './composables/**/*.{js,ts}',
    './domains/**/*.{js,vue,ts}',
    './ui/**/*.{js,vue,ts}',
    './utils/**/*.{js,ts}',
    './legacy/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './shared/**/*.{js,vue,ts}',
    '!./shared/lib/api/**',
    './nuxt.config.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      screens: {
        xs: '360px',
        sm: '768px',
        md: '1024px',
        lg: '1280px',
        xl: '1536px',
      },
      colors: {
        rs: {
          // Use RGB triplet CSS vars so Tailwind opacity modifiers work (e.g. `border-rs-border/60`).
          bg: 'rgb(var(--rs-color-bg) / <alpha-value>)',
          surface: 'rgb(var(--rs-color-surface) / <alpha-value>)',
          fg: 'rgb(var(--rs-color-fg) / <alpha-value>)',
          muted: 'rgb(var(--rs-color-muted) / <alpha-value>)',
          border: 'rgb(var(--rs-color-border) / <alpha-value>)',
          brand: 'rgb(var(--rs-color-brand) / <alpha-value>)',
        },
        brand: BRAND,
        neutral: NEUTRAL,
        surface: '#FFFFFF',
        success: SUCCESS,
        warning: WARNING,
        danger: DANGER,
        accent: ACCENT,
        primary: PRIMARY,
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'scale-1': '0.875rem',
        'scale-2': '1rem',
        'scale-3': '1.125rem',
        'scale-4': '1.25rem',
        'scale-5': '1.5rem',
        'scale-6': '1.75rem',
        'scale-7': '2.25rem',
        'scale-8': '3rem',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '72': '18rem',
        '88': '22rem',
        'section-desktop': '4.5rem',
        'section-mobile': '3.5rem',

        'page-x': 'var(--rs-space-page-x)',
        'page-y': 'var(--rs-space-page-y)',
        'stack': 'var(--rs-space-stack)',
      },
      maxWidth: {
        960: '960px',
        1200: '1200px',
        page: 'var(--rs-page-max-width)',
      },
      height: {
        18: '4.5rem',
        22: '5.5rem',
        520: '520px',
      },
      minHeight: {
        btn: '44px',
      },
      borderRadius: {
        'btn': '12px',
        'rs-md': 'var(--rs-radius-md)',
        'rs-lg': 'var(--rs-radius-lg)',
      },
      gridTemplateColumns: {
        12: 'repeat(12, minmax(0, 1fr))',
      },
      gap: {
        gutter: '24px',
      },
      zIndex: {
        base: '0',
        dropdown: '20',
        sticky: '40',
        modal: '50',
        overlay: '60',
        toast: '70',
        skip: '100',
      },
      ringOffsetWidth: {
        3: '2px',
      },
    },
  },
  plugins: [],
}
