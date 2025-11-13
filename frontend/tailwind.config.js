/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      screens: {
        'xs': '360px',
        'sm': '768px',
        'md': '1024px',
        'lg': '1280px',
        'xl': '1536px',
      },
      colors: {
        brand: {
          600: '#2563EB',
          700: '#1D4ED8',
        },
        neutral: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        surface: '#FFFFFF',
        success: {
          600: '#059669',
        },
        warning: {
          600: '#D97706',
        },
        danger: {
          600: '#DC2626',
        },
        accent: {
          600: '#7C3AED',
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
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
        18: '4.5rem',
        72: '18rem',
        88: '22rem',
        'section-desktop': '4.5rem',
        'section-mobile': '3.5rem',
      },
      maxWidth: {
        '960': '960px',
        '1200': '1200px',
      },
      height: {
        18: '4.5rem',
        '520': '520px',
      },
      minHeight: {
        'btn': '44px',
      },
      borderRadius: {
        'btn': '12px',
      },
      gridTemplateColumns: {
        '12': 'repeat(12, minmax(0, 1fr))',
      },
      gap: {
        'gutter': '24px',
      },
      ringOffsetWidth: {
        '3': '2px',
      },
    },
  },
  plugins: [],
};
