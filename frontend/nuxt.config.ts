import { promises as fs } from 'node:fs'
import { join } from 'node:path'

const isAwsEnvironment = Boolean(
  process.env.AWS_REGION || process.env.CLOUDFRONT_DISTRIBUTION_ID,
)

const ensureClientPrecomputed = async () => {
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
    return
  }
  const serverDist = join(process.cwd(), '.nuxt', 'dist', 'server')
  await fs.mkdir(serverDist, { recursive: true })
  const precomputedPath = join(serverDist, 'client.precomputed.mjs')
  try {
    await fs.access(precomputedPath)
  } catch {
    await fs.writeFile(precomputedPath, 'export default undefined', 'utf8')
  }
}

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
  hooks: {
    'build:before': async () => {
      // Copy SVG files from frontend/png/SVG to public/png/SVG for proper routing
      const sourceDir = join(process.cwd(), 'frontend', 'png', 'SVG')
      const destDir = join(process.cwd(), 'frontend', 'public', 'png', 'SVG')
      try {
        await fs.mkdir(destDir, { recursive: true })
        const files = await fs.readdir(sourceDir)
        for (const file of files) {
          if (file.endsWith('.svg')) {
            const sourcePath = join(sourceDir, file)
            const destPath = join(destDir, file)
            await fs.copyFile(sourcePath, destPath)
          }
        }
      } catch (error) {
        // Source directory doesn't exist or is empty - that's okay
      }

      // Copy provider logos from PROVIDERS folder to public/logos with slug-based names
      const providersSourceDir = join(process.cwd(), 'frontend', 'png', 'SVG', 'PROVIDERS')
      const logosDestDir = join(process.cwd(), 'frontend', 'public', 'logos')
      const providerLogoMap: Record<string, string> = {
        'WISE_LOGO.svg': 'wise.svg',
        'REMITLY_LOGO.svg': 'remitly.svg',
        'WORLD_REMIT_LOGO.svg': 'worldremit.svg',
        'WESTERN_UNION_LOGO.svg': 'western-union.svg',
        'XE_LOGO.svg': 'xe-money.svg',
      }
      try {
        await fs.mkdir(logosDestDir, { recursive: true })
        const providerFiles = await fs.readdir(providersSourceDir)
        for (const file of providerFiles) {
          if (file.endsWith('.svg') && providerLogoMap[file]) {
            const sourcePath = join(providersSourceDir, file)
            const destPath = join(logosDestDir, providerLogoMap[file])
            await fs.copyFile(sourcePath, destPath)
          }
        }
      } catch {
        // Providers directory doesn't exist or is empty - that's okay
      }
    },
    'build:done': async () => {
      await ensureClientPrecomputed()
    },
    'nitro:build:done': async () => {
      await ensureClientPrecomputed()
    },
  },

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
    // Server-only backend base URL for BFF proxying (must be absolute).
    apiBase: process.env.API_BASE || 'http://localhost:4000/api/v1',
    public: {
      siteUrl:
        process.env.PUBLIC_SITE_URL ||
        (isAwsEnvironment && process.env.CLOUDFRONT_DISTRIBUTION_ID
          ? `https://d${process.env.CLOUDFRONT_DISTRIBUTION_ID}.cloudfront.net`
          : 'https://Remit-Scout.com'),
      apiBase: process.env.PUBLIC_API_BASE || '/api',
      imageBase:
        process.env.PUBLIC_IMAGE_BASE ||
        (isAwsEnvironment && process.env.CLOUDFRONT_DISTRIBUTION_ID
          ? `https://d${process.env.CLOUDFRONT_DISTRIBUTION_ID}.cloudfront.net/images`
          : 'https://images.Remit-Scout.com'),
      supabaseUrl:
        process.env.PUBLIC_SUPABASE_URL ||
        process.env.SUPABASE_URL ||
        '',
      supabaseAnonKey:
        process.env.PUBLIC_SUPABASE_ANON_KEY ||
        process.env.SUPABASE_PUBLISHABLE_KEY ||
        '',
      devControls: process.env.PUBLIC_DEV_CONTROLS === '1' && !isAwsEnvironment,
      devAuthEnabled: process.env.PUBLIC_DEV_AUTH === '1' && !isAwsEnvironment,
      devAuthToken:
        process.env.PUBLIC_DEV_AUTH_TOKEN ||
        process.env.SUPABASE_MOCK_ADMIN_TOKEN ||
        process.env.SUPABASE_MOCK_TOKEN ||
        'admin-token',
      devSuperAdminEmail:
        process.env.DEV_SUPER_ADMIN_EMAIL ||
        process.env.PUBLIC_DEV_SUPER_ADMIN_EMAIL ||
        'admin@remitscout.test',
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
    minify: !isAwsEnvironment, // Disable minify in dev to avoid build issues
    preset: isAwsEnvironment ? 'static' : undefined, // Use static generation for AWS deployment
    prerender: {
      crawlLinks: true,
      routes: ['/'],
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
    provider: isAwsEnvironment ? 'ipx' : 'ipx',
    sizes: [320, 640, 768, 1024, 1280, 1536],
    format: ['webp', 'avif', 'png', 'jpg'],
    domains: isAwsEnvironment && process.env.CLOUDFRONT_DISTRIBUTION_ID
      ? [`d${process.env.CLOUDFRONT_DISTRIBUTION_ID}.cloudfront.net`]
      : [],
    cloudflare: false,
  },

  // Robots Configuration
  robots: {
    disallow: process.env.NODE_ENV !== 'production' ? ['/'] : undefined,
    sitemap: process.env.NODE_ENV === 'production' ? [`${process.env.PUBLIC_SITE_URL || 'https://Remit-Scout.com'}/sitemap.xml`] : undefined,
  },
})
