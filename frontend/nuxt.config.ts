export default defineNuxtConfig({
  // Development
  devtools: { enabled: true },

  components: {
    dirs: [
      '~/components',
      '~/components/shared',
      '~/components/home',
      '~/components/nav'
    ],
  },

  // Modules
  modules: ['@nuxtjs/tailwindcss', '@nuxt/image', '@nuxtjs/robots'],

  // App Head
  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#0ea5e9' },
        {
          name: 'description',
          content:
            'Compare money transfer providers and find the best rates for international money transfers. Send money abroad with confidence.',
        },
        {
          name: 'keywords',
          content:
            'money transfer, remittance, international payments, compare rates, send money abroad',
        },
        { name: 'robots', content: 'index, follow' },
        { name: 'googlebot', content: 'index, follow' },
        { name: 'author', content: 'Remit-Scout' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        ...(process.env.PUBLIC_IMAGE_BASE
          ? [
              { rel: 'preconnect', href: process.env.PUBLIC_IMAGE_BASE },
              { rel: 'dns-prefetch', href: process.env.PUBLIC_IMAGE_BASE },
            ]
          : []),
      ],
    },
  },

  // CSS
  css: ['./assets/css/tailwind.css'],

  // Runtime Configuration
  runtimeConfig: {
    public: {
      siteUrl: process.env.PUBLIC_SITE_URL || 'https://Remit-Scout.com',
      apiBase: process.env.PUBLIC_API_BASE || '/api',
      imageBase: process.env.PUBLIC_IMAGE_BASE || 'https://images.Remit-Scout.com',
    },
  },

  // Build Configuration
  build: {
    transpile: ['@nuxtjs/tailwindcss'],
  },

  // Route Rules (ISR)
  routeRules: {
    '/send-money/**': { isr: 600 }, // 10 minutes
    '/providers/**': { isr: 1800 }, // 30 minutes
    '/compare/**': { isr: 86400 }, // 24 hours
    '/learn/**': { isr: 604800 }, // 7 days
  },

  // Experimental Features
  experimental: {
    payloadExtraction: false,
    viewTransition: true,
  },

  // Nitro Configuration
  nitro: {
    compressPublicAssets: true,
    minify: true,
  },

  // Vite Configuration
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "./assets/css/tailwind.css" as *;',
        },
      },
    },
    server: {
      hmr: {
        overlay: false,
      },
    },
  },

  // Image Configuration
  image: {
    provider: 'ipx',
    sizes: [320, 640, 768, 1024, 1280, 1536],
    format: ['webp', 'avif', 'png', 'jpg'],
  },

  // Robots Configuration
  robots: {
    disallow: process.env.NODE_ENV !== 'production' ? ['/'] : undefined,
    sitemap: process.env.NODE_ENV === 'production' ? [`${process.env.PUBLIC_SITE_URL || 'https://Remit-Scout.com'}/sitemap.xml`] : undefined,
  },

  // TypeScript
  typescript: {
    typeCheck: false
  }
})
