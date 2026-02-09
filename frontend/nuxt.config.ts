import { promises as fs, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const isStagingOrProd = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging'
const isDev = !isStagingOrProd
const isAwsEnvironment = !isDev && Boolean(
  process.env.AWS_REGION || process.env.CLOUDFRONT_DISTRIBUTION_ID,
)
const envFileCandidates = [
  join(process.cwd(), '.env.local'),
  join(process.cwd(), '.env'),
]
const readEnvValue = (key: string) => {
  const direct = process.env[key]
  if (direct) return direct
  for (const filePath of envFileCandidates) {
    if (!existsSync(filePath)) continue
    const contents = readFileSync(filePath, 'utf8')
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const match = trimmed.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/)
      if (!match) continue
      const [, envKey, rawValue] = match
      if (envKey !== key) continue
      return rawValue.replace(/^['"]|['"]$/g, '')
    }
  }
  return undefined
}
const resolveEnvValue = (...keys: string[]) => {
  for (const key of keys) {
    const value = readEnvValue(key)
    if (value) return value
  }
  return undefined
}
const parseEnvFlag = (value?: string) => value === 'true' || value === '1'
const isAbsoluteUrl = (value?: string) => Boolean(value && /^https?:\/\//.test(value))
const normalizeApiBase = (base?: string) => {
  if (!base || !isAbsoluteUrl(base)) return base
  const url = new URL(base)
  let pathname = url.pathname.replace(/\/$/, '')
  if (!pathname || pathname === '') {
    pathname = '/api/v1'
  }
  else if (!pathname.endsWith('/api/v1')) {
    if (pathname.endsWith('/api')) {
      pathname = `${pathname}/v1`
    }
    else {
      pathname = `${pathname}/api/v1`
    }
  }
  url.pathname = pathname
  return url.toString().replace(/\/$/, '')
}
const resolvePublicApiBase = () => {
  const publicBase = readEnvValue('PUBLIC_API_BASE')
  if (publicBase) return normalizeApiBase(publicBase) || publicBase
  const cloudFrontDomain = readEnvValue('PLANE_A_CLOUDFRONT_DOMAIN')
  if (cloudFrontDomain) {
    return `https://${cloudFrontDomain.replace(/\/$/, '')}/api/v1`
  }
  const apiEndpoint = readEnvValue('PLANE_A_API_ENDPOINT')
  if (apiEndpoint) {
    return `${apiEndpoint.replace(/\/$/, '')}/api/v1`
  }
  return isAwsEnvironment ? '/api' : '/api'
}
const resolveServerApiBase = () => {
  const apiBase = readEnvValue('API_BASE')
  if (apiBase) return normalizeApiBase(apiBase) || apiBase
  const planeAEndpoint = readEnvValue('PLANE_A_API_ENDPOINT')
  if (planeAEndpoint) return `${planeAEndpoint.replace(/\/$/, '')}/api/v1`
  const planeACloudFront = readEnvValue('PLANE_A_CLOUDFRONT_DOMAIN')
  if (planeACloudFront) {
    return `https://${planeACloudFront.replace(/\/$/, '')}/api/v1`
  }
  const publicBase = resolvePublicApiBase()
  if (isAbsoluteUrl(publicBase)) return publicBase as string
  if (isDev) return 'http://127.0.0.1:4000/api/v1'
  return ''
}
const hmrPort = Number(process.env.NUXT_VITE_HMR_PORT || process.env.VITE_HMR_PORT) || 24678
const isrRouteRules = isStagingOrProd
  ? {
      '/send-money/**': { isr: 600 }, // 10 minutes
      '/providers/**': { isr: 1800 }, // 30 minutes
      '/compare/**': { isr: 86400 }, // 24 hours
      '/learn/**': { isr: 604800 }, // 7 days
      '/pulse': { isr: 300 }, // 5 minutes - main pulse dashboard
      '/pulse/charts/**': { isr: 300 }, // 5 minutes - chart detail pages
      '/embed/pulse/**': { isr: 60 }, // 1 minute - embeds refresh faster
    }
  : {}
const projectRoot = process.cwd()
const workspaceRoot = join(projectRoot, '..')
const localNodeModules = join(projectRoot, 'node_modules')
const workspaceNodeModules = join(workspaceRoot, 'node_modules')
const workspacePnpmStore = join(workspaceNodeModules, '.pnpm')
const defaultWatchIgnored = [
  '**/node_modules/**',
  '**/.pnpm/**',
  '**/.pnpm-store/**',
  '**/.git/**',
  '**/dist/**',
  '**/.nuxt/**',
  '**/coverage/**',
  localNodeModules,
  workspaceNodeModules,
  workspacePnpmStore,
]
const watchIgnored = process.env.NUXT_DISABLE_WATCH === '1'
  ? ['**/*']
  : defaultWatchIgnored
const usePolling = process.env.NUXT_USE_POLLING === '1'
  || process.env.CHOKIDAR_USEPOLLING === '1'
const watchOptions = {
  followSymlinks: false,
  ignored: watchIgnored,
  ...(usePolling ? { usePolling: true, interval: 1000 } : {}),
}
const nuxtModules = ['@nuxtjs/tailwindcss', '@nuxt/image', '@pinia/nuxt']
const enableEzoic = (process.env.PUBLIC_ENABLE_EZOIC === 'true' || process.env.ENABLE_EZOIC === 'true') && isStagingOrProd
const adsEnabled = enableEzoic
const analyticsEnabled = (() => {
  const flag = resolveEnvValue('NUXT_PUBLIC_ANALYTICS_ENABLED', 'PUBLIC_ANALYTICS_ENABLED')
  // Default ON for staging/prod, OFF for local/dev. Consent gates execution regardless.
  return flag !== undefined ? parseEnvFlag(flag) : isStagingOrProd
})()
const ezoicScripts = adsEnabled
  ? [
      {
        'key': 'ezoic-privacy-cmp',
        'data-cfasync': 'false',
        'src': 'https://cmp.gatekeeperconsent.com/min.js',
        'tagPriority': -10,
      },
      {
        'key': 'ezoic-privacy-gatekeeper',
        'data-cfasync': 'false',
        'src': 'https://the.gatekeeperconsent.com/cmp.min.js',
        'tagPriority': -10,
      },
      {
        key: 'ezoic-header',
        async: true,
        src: 'https://www.ezojs.com/ezoic/sa.min.js',
        tagPriority: -10,
      },
      {
        key: 'ezoic-init',
        innerHTML: 'window.ezstandalone=window.ezstandalone||{};ezstandalone.cmd=ezstandalone.cmd||[];',
        tagPriority: -10,
      },
    ]
  : []

const ensureClientPrecomputed = async () => {
  const serverDist = join(process.cwd(), '.nuxt', 'dist', 'server')
  await fs.mkdir(serverDist, { recursive: true })
  const precomputedPath = join(serverDist, 'client.precomputed.mjs')
  try {
    await fs.access(precomputedPath)
  }
  catch {
    await fs.writeFile(precomputedPath, 'export default undefined', 'utf8')
  }
}

const ensureNuxtPaths = async () => {
  const buildDir = join(process.cwd(), '.nuxt')
  await fs.mkdir(buildDir, { recursive: true })
  const pathsPath = join(buildDir, 'paths.mjs')
  try {
    await fs.access(pathsPath)
    return
  }
  catch {
    // Continue and write fallback file if missing.
  }

  const appConfig = {
    baseURL: '/',
    buildAssetsDir: '/_nuxt/',
    cdnURL: '',
  }
  const contents = [
    'import { joinRelativeURL } from \'ufo\'',
    `const getAppConfig = () => (${JSON.stringify(appConfig)})`,
    'export const baseURL = () => getAppConfig().baseURL',
    'export const buildAssetsDir = () => getAppConfig().buildAssetsDir',
    'export const buildAssetsURL = (...path) => joinRelativeURL(publicAssetsURL(), buildAssetsDir(), ...path)',
    'export const publicAssetsURL = (...path) => {',
    '  const appConfig = getAppConfig()',
    '  const publicBase = appConfig.cdnURL || appConfig.baseURL',
    '  return path.length ? joinRelativeURL(publicBase, ...path) : publicBase',
    '}',
    'if (import.meta.client) {',
    '  globalThis.__buildAssetsURL = buildAssetsURL',
    '  globalThis.__publicAssetsURL = publicAssetsURL',
    '}',
  ].join('\n')
  await fs.writeFile(pathsPath, contents, 'utf8')
}

export default defineNuxtConfig({
  // Development

  // Modules
  modules: nuxtModules,

  components: {
    dirs: [
      '~/components',
      '~/components/shared',
      '~/components/home',
      '~/components/nav',
      '~/components/pulse',
    ],
  },
  devtools: { enabled: false },

  // App Head
  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
      },
      script: [
        ...ezoicScripts,
      ],
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
            'money transfer, remittance, international payments, compare rates, send money abroad, wire transfer, foreign exchange',
        },
        { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
        { name: 'googlebot', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
        { name: 'author', content: 'Remit-Scout' },
        { name: 'language', content: 'English' },
        { name: 'geo.region', content: 'US' },
        { name: 'geo.placename', content: 'United States' },
        // Open Graph defaults
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Remit-Scout' },
        { property: 'og:locale', content: 'en_US' },
        // Twitter Card defaults
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@RemitScout' },
        // Verification tags (can be overridden by env vars)
        ...(process.env.GOOGLE_SITE_VERIFICATION
          ? [{ name: 'google-site-verification', content: process.env.GOOGLE_SITE_VERIFICATION }]
          : []),
        ...(process.env.BING_SITE_VERIFICATION
          ? [{ name: 'msvalidate.01', content: process.env.BING_SITE_VERIFICATION }]
          : []),
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        // Favicon - using Remit-Scout logo
        { rel: 'icon', type: 'image/svg+xml', href: '/png/SVG/LOGO.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/png/SVG/LOGO.svg' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/png/SVG/LOGO.svg' },
        // Apple touch icons
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/png/SVG/LOGO.svg' },
        { rel: 'manifest', href: '/site.webmanifest' },
        // DNS prefetch for performance
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
  css: [
    './assets/css/tokens.css',
    './assets/css/tailwind.css',
    './assets/css/reduced-motion.css',
    'katex/dist/katex.min.css',
  ],

  // Runtime Configuration
  runtimeConfig: {
    // Server-only backend base URL for BFF proxying (must be absolute).
    apiBase: resolveServerApiBase(),
    public: {
      siteUrl:
        process.env.PUBLIC_SITE_URL
        || (isAwsEnvironment && process.env.CLOUDFRONT_DISTRIBUTION_ID
          ? `https://d${process.env.CLOUDFRONT_DISTRIBUTION_ID}.cloudfront.net`
          : 'https://Remit-Scout.com'),
      apiBase: resolvePublicApiBase(),
      mediaKitPressKitUrl: process.env.PUBLIC_MEDIA_KIT_PRESS_KIT_URL || '',
      mediaKitBrandAssetsUrl: process.env.PUBLIC_MEDIA_KIT_BRAND_ASSETS_URL || '',
      mediaKitFactSheetUrl: process.env.PUBLIC_MEDIA_KIT_FACT_SHEET_URL || '',
      b2cRefreshPollMs: Number(process.env.PUBLIC_B2C_REFRESH_POLL_MS) || 2500,
      b2cRefreshStatusPollMs: Number(process.env.PUBLIC_B2C_REFRESH_STATUS_POLL_MS) || 2500,
      b2cBackgroundRefreshEnabled: process.env.PUBLIC_B2C_BACKGROUND_REFRESH_ENABLED === '1',
      imageBase:
        process.env.PUBLIC_IMAGE_BASE
        || (isAwsEnvironment && process.env.CLOUDFRONT_DISTRIBUTION_ID
          ? `https://d${process.env.CLOUDFRONT_DISTRIBUTION_ID}.cloudfront.net/images`
          : 'https://images.Remit-Scout.com'),
      supabaseUrl: resolveEnvValue(
        'PUBLIC_SUPABASE_URL',
        'NUXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_URL',
      ) || '',
      supabaseAnonKey: resolveEnvValue(
        'PUBLIC_SUPABASE_ANON_KEY',
        'NUXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_PUBLISHABLE_KEY',
      ) || '',
      pushVapidKey: process.env.PUBLIC_PUSH_VAPID_KEY || '',
      ga4MeasurementId: process.env.PUBLIC_GA4_MEASUREMENT_ID || process.env.GA4_MEASUREMENT_ID || '',
      metaPixelId: process.env.PUBLIC_META_PIXEL_ID || process.env.META_PIXEL_ID || '',
      analyticsEnabled,
      adsEnabled,
      stripeTrialDays: Number(process.env.PUBLIC_STRIPE_TRIAL_DAYS || process.env.STRIPE_TRIAL_DAYS || 14),
      pulseEnabled: (() => {
        const flag = resolveEnvValue('NUXT_PUBLIC_PULSE_ENABLED', 'PUBLIC_PULSE_ENABLED')
        // Default ON. Pre-alpha: Pulse should be visible for marketing and gated by entitlements.
        // Set NUXT_PUBLIC_PULSE_ENABLED=0 to hard-disable.
        return flag !== undefined ? parseEnvFlag(flag) : true
      })(),
      enterpriseEnabled: (() => {
        const flag = resolveEnvValue('NUXT_PUBLIC_ENTERPRISE_ENABLED', 'PUBLIC_ENTERPRISE_ENABLED')
        return flag !== undefined ? parseEnvFlag(flag) : false
      })(),
    },
  },

  // Build Configuration
  build: {
    transpile: ['@nuxtjs/tailwindcss', 'echarts', 'vue-echarts', 'resize-detector'],
  },

  // Route Rules (ISR)
  routeRules: {
    ...isrRouteRules,
    '/ads.txt': { redirect: { to: 'https://srv.adstxtmanager.com/19390/remit-scout.com', statusCode: 301 } },
    '/legal/methodology': { redirect: '/methodology' },
    '/how-we-make-money': { redirect: { to: '/legal/how-we-make-money', statusCode: 301 } },
    '/about-old': { redirect: { to: '/about', statusCode: 301 } },
  },

  watchers: {
    chokidar: {
      ...watchOptions,
    },
  },

  // Experimental Features
  experimental: {
    payloadExtraction: false,
    viewTransition: true,
    watcher: 'chokidar-granular',
  },

  // Nitro Configuration
  nitro: {
    compressPublicAssets: true,
    minify: !isAwsEnvironment, // Disable minify in dev to avoid build issues
    preset: isAwsEnvironment ? 'static' : undefined, // Use static generation for AWS deployment
    prerender: isAwsEnvironment
      ? {
          crawlLinks: false,
          routes: ['/'],
          failOnError: false,
        }
      : {
          crawlLinks: true,
          routes: ['/'],
        },
  },

  // Vite Configuration
  vite: {
    server: {
      fs: {
        allow: [workspaceRoot],
      },
      hmr: {
        overlay: false,
        port: hmrPort,
      },
      watch: {
        ...watchOptions,
      },
    },
  },

  // TypeScript
  typescript: {
    typeCheck: false,
  },
  hooks: {
    'build:before': async () => {
      // Copy SVG files from frontend/png/SVG to public/png/SVG for proper routing
      const sourceDir = join(projectRoot, 'png', 'SVG')
      const destDir = join(projectRoot, 'public', 'png', 'SVG')
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
      }
      catch (error) {
        // Source directory doesn't exist or is empty - that's okay
      }

      // Copy PROVIDERS SVG files to public/png/SVG/PROVIDERS
      const providersSourceDirForPublic = join(projectRoot, 'png', 'SVG', 'PROVIDERS')
      const providersDestDir = join(projectRoot, 'public', 'png', 'SVG', 'PROVIDERS')
      try {
        await fs.mkdir(providersDestDir, { recursive: true })
        const providerFiles = await fs.readdir(providersSourceDirForPublic)
        for (const file of providerFiles) {
          if (file.endsWith('.svg') || file.endsWith('.png') || file.endsWith('.webp')) {
            const sourcePath = join(providersSourceDirForPublic, file)
            const destPath = join(providersDestDir, file)
            await fs.copyFile(sourcePath, destPath)
          }
        }
      }
      catch (error) {
        // Providers directory doesn't exist or is empty - that's okay
      }

      // Copy provider logos from PROVIDERS folder to public/logos with slug-based names
      const providersSourceDir = join(projectRoot, 'png', 'SVG', 'PROVIDERS')
      const logosDestDir = join(projectRoot, 'public', 'logos')
      const providerLogoMap: Record<string, string> = {
        'WISE_LOGO.svg': 'wise.svg',
        'REMITLY_LOGO.svg': 'remitly.svg',
        'WORLD_REMIT_LOGO.svg': 'worldremit.svg',
        'WESTERN_UNION_LOGO.svg': 'western-union.svg',
        'XE_LOGO.svg': 'xe-money.svg',
        'WELLS_FARGO_LOGO.svg': 'wellsfargo.svg',
        'TRANSFERGO_LOGO.svg': 'transfergo.svg',
        'PAYSEND_LOGO.svg': 'paysend.svg',
        'SENDWAVE_LOGO.svg': 'sendwave.svg',
        'INSTAREM_LOGO.svg': 'instarem.svg',
        'KORONAPAY_LOGO.svg': 'koronapay.svg',
        'REMITBEE_LOGO.svg': 'remitbee.svg',
        'RIA_LOGO.svg': 'ria.svg',
        'XOOM_LOGO.svg': 'xoom.svg',
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
      }
      catch {
        // Providers directory doesn't exist or is empty - that's okay
      }
    },
    'build:done': async () => {
      await ensureClientPrecomputed()
      await ensureNuxtPaths()
    },
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

  // robots.txt is served by `server/routes/robots.txt.ts` (env-aware).
})
