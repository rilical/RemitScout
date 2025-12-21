export default defineNuxtConfig({
  // Development

  // Modules
  modules: ['@nuxtjs/tailwindcss', '@nuxt/image', '@nuxtjs/robots', '@pinia/nuxt'],

  components: {
    dirs: [
      '~/components',
      '~/components/shared',
      '~/components/home',
      '~/components/nav',
      '~/components/pulse',
    ],
  },
  devtools: { enabled: true },

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
  css: ['./assets/css/tailwind.css', './assets/css/reduced-motion.css'],

  // Runtime Configuration
  runtimeConfig: {
    public: {
      siteUrl: process.env.PUBLIC_SITE_URL || 'https://Remit-Scout.com',
      apiBase: process.env.PUBLIC_API_BASE || '/api',
      imageBase: process.env.PUBLIC_IMAGE_BASE || 'https://images.Remit-Scout.com',
      devControls: process.env.PUBLIC_DEV_CONTROLS === '1',
    },
  },

  // Build Configuration
  build: {
    transpile: ['@nuxtjs/tailwindcss', 'echarts', 'vue-echarts', 'resize-detector'],
  },

  // Route Rules (ISR)
  routeRules: {
    '/send-money/**': { isr: 600 }, // 10 minutes
    '/providers/**': { isr: 1800 }, // 30 minutes
    '/compare/**': { isr: 86400 }, // 24 hours
    '/learn/**': { isr: 604800 }, // 7 days
    '/pulse': { isr: 300 }, // 5 minutes - main pulse dashboard
    '/pulse/charts/**': { isr: 300 }, // 5 minutes - chart detail pages
    '/embed/pulse/**': { isr: 60 }, // 1 minute - embeds refresh faster
    '/legal/methodology': { redirect: '/methodology' },
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
    output: {
      dir: '.output',
      serverDir: '.output/server',
      publicDir: '.output/public',
    },
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

  // TypeScript
  typescript: {
    typeCheck: false,
  },

  // i18n Configuration (temporarily disabled)
  // i18n: {
  //   locales: [
  //     { code: 'en', iso: 'en-US', name: 'English', file: 'en.json' },
  //     { code: 'es', iso: 'es-ES', name: 'Español', file: 'es.json' },
  //   ],
  //   lazy: true,
  //   langDir: 'locales',
  //   defaultLocale: 'en',
  //   strategy: 'prefix_except_default',
  //   detectBrowserLanguage: {
  //     useCookie: true,
  //     cookieKey: 'i18n_redirected',
  //     redirectOn: 'root',
  //     alwaysRedirect: false,
  //     fallbackLocale: 'en',
  //   },
  //   vueI18n: './i18n.config.ts',
  //   seo: true,
  // },

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
})
