<template>
  <div class="min-h-screen bg-neutral-100 py-8">
    <div class="mx-auto max-w-4xl px-page-x">
      <div class="mb-8">
        <NuxtLink
          to="/dashboard"
          class="text-brand-600 hover:underline text-body-sm font-medium"
        >
          ← Back to dashboard
        </NuxtLink>
        <h1 class="mt-2 text-h3 font-bold text-neutral-800">
          Email Templates Preview
        </h1>
        <p class="mt-1 text-body-sm text-neutral-600">
          Preview the branded email layouts used across Remit-Scout.
        </p>
      </div>

      <div class="mb-6 flex flex-wrap gap-2">
        <button
          v-for="view in views"
          :key="view.id"
          class="px-4 py-2 rounded-lg text-body-sm font-medium transition-colors"
          :class="activeView === view.id ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'"
          @click="activeView = view.id"
        >
          {{ view.label }}
        </button>
      </div>

      <div class="mb-4 overflow-hidden rounded-xl border border-neutral-200 bg-surface shadow-lg">
        <div class="p-4 text-body-sm text-neutral-500 border-b border-neutral-200 bg-neutral-50 font-mono">
          <strong>From:</strong> {{ currentView.from }} &middot; <strong>Subject:</strong> {{ currentView.subject }}
        </div>

        <div
          class="p-6 md:p-8"
          style="background-color: #F1F5F9; font-family: 'Inter', system-ui, -apple-system, sans-serif;"
        >
          <!-- Logo above card -->
          <div class="mx-auto max-w-[600px] mb-6 text-center">
            <a
href="/"
style="text-decoration:none; display:inline-block;"
>
              <NuxtImg
                :src="['alert-score', 'billing-active'].includes(currentView.id) ? '/png/SVG/FULL_LOGO_PLUS.svg' : '/png/SVG/FULL_LOGO.svg'"
                :alt="['alert-score', 'billing-active'].includes(currentView.id) ? 'Remit-Scout Plus logo' : 'Remit-Scout logo'"
                height="36"
                loading="eager"
                class="h-12 w-auto object-contain"
              />
            </a>
          </div>

          <!-- Main Card -->
          <div
            class="mx-auto max-w-[600px] overflow-hidden"
            style="max-width: 600px; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.06);"
          >
            <!-- Header -->
            <div
              style="padding: 32px 36px; color: #FFFFFF;"
              :style="`background: ${currentView.headerColor};`"
            >
              <h2 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.3;">
                {{ currentView.title }}
              </h2>
              <p
                v-if="currentView.subtitle"
                style="margin: 8px 0 0; font-size: 20px; font-weight: 600; color: rgba(255,255,255,0.9); letter-spacing: -0.01em; line-height: 1.3;"
              >
                {{ currentView.subtitle }}
              </p>
            </div>

            <!-- Body -->
            <div style="padding: 28px 36px 32px; font-size: 15px; line-height: 1.65; color: #0F172A;">
              <div v-html="currentView.bodyHtml" />

              <table
                v-if="currentView.cta"
                role="presentation"
                cellpadding="0"
                cellspacing="0"
                style="margin-top: 24px;"
              >
                <tr>
                  <td :style="`background: ${currentView.buttonColor}; border-radius: 8px;`">
                    <a
                      :href="currentView.cta.url"
                      style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; letter-spacing: -0.01em;"
                    >
                      {{ currentView.cta.text }}
                    </a>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Footer -->
            <div
              v-if="currentView.footerHtml"
              style="padding: 0 36px 28px;"
            >
              <div
                style="border-top: 1px solid #E2E8F0; padding-top: 20px; font-size: 13px; color: #64748B; line-height: 1.6;"
                v-html="currentView.footerHtml"
              />
            </div>
          </div>

          <!-- Bottom links -->
          <div
class="mx-auto max-w-[600px] mt-6 text-center"
style="font-size: 12px; color: #94A3B8;"
>
            remit-scout.com &middot;
            <a
href="#"
style="color: #94A3B8; text-decoration: underline;"
>Email preferences</a>
            <br>
            &copy; 2026 Remit-Scout LLC. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { setSeo } from '~/composables/useSeo'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const { public: { siteUrl } } = useRuntimeConfig()

setSeo({
  title: 'Email Templates Preview | Remit-Scout',
  description: 'Preview of all email templates.',
  canonical: `${siteUrl}${route.path}`,
  noindex: true,
})

const BRAND_NAVY = '#0F172A'
const BRAND_BLUE = '#2563EB'

const views = [
  {
    id: 'alert',
    label: 'Rate Alert',
    from: 'Remit-Scout Alerts <no-reply@remit-scout.com>',
    subject: 'Rate Alert: Recipient gets crossed above 1,200',
    title: 'Rate Alert',
    subtitle: '\ud83c\uddfa\ud83c\uddf8 US \u2192 MX \ud83c\uddf2\ud83c\uddfd',
    headerColor: BRAND_NAVY,
    buttonColor: BRAND_BLUE,
    bodyHtml: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:0 16px;">
                  <div style="font-size:40px; line-height:1;">\ud83c\uddfa\ud83c\uddf8</div>
                  <div style="font-size:14px; font-weight:700; color:#0F172A; margin-top:6px;">US</div>
                </td>
                <td align="center" style="padding:0 12px;">
                  <div style="font-size:22px; color:#94A3B8;">\u2192</div>
                </td>
                <td align="center" style="padding:0 16px;">
                  <div style="font-size:40px; line-height:1;">\ud83c\uddf2\ud83c\uddfd</div>
                  <div style="font-size:14px; font-weight:700; color:#0F172A; margin-top:6px;">MX</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px 18px; font-size:15px; line-height:1.6; color:#0F172A;">
        Recipient gets crossed above 1,200 (now 1,215).
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px; font-size:13px; border-collapse:separate; border-spacing:0; border-radius:8px; overflow:hidden; border:1px solid #E2E8F0;">
        <tr>
          <td style="padding:8px 12px; color:#64748B; width:35%; font-weight:600; background:#F8FAFC;">Metric</td>
          <td style="padding:8px 12px; color:#0F172A; background:#F8FAFC;">Recipient gets</td>
        </tr>
        <tr>
          <td style="padding:8px 12px; color:#64748B; font-weight:600;">Condition</td>
          <td style="padding:8px 12px; color:#0F172A;">at least</td>
        </tr>
        <tr>
          <td style="padding:8px 12px; color:#64748B; font-weight:600; background:#F8FAFC;">Threshold</td>
          <td style="padding:8px 12px; color:#0F172A; background:#F8FAFC;">1,200</td>
        </tr>
        <tr>
          <td style="padding:8px 12px; color:#64748B; font-weight:600;">Current value</td>
          <td style="padding:8px 12px; color:#0F172A;">1,215</td>
        </tr>
      </table>
    `,
    cta: { text: 'View Alert', url: '#' },
    footerHtml: 'Recipient gets at least 1,200 \xb7 US \u2192 MX<br><br><a href="#" style="color:#64748B; text-decoration:underline;">Manage notification preferences</a> | <a href="#" style="color:#64748B; text-decoration:underline;">Unsubscribe</a>',
  },
  {
    id: 'alert-score',
    label: 'Alert (SendScore)',
    from: 'Remit-Scout Alerts <no-reply@remit-scout.com>',
    subject: 'Rate Alert: Smart score crossed above 8.0',
    title: 'Rate Alert',
    subtitle: '\ud83c\uddfa\ud83c\uddf8 US \u2192 MX \ud83c\uddf2\ud83c\uddfd',
    headerColor: BRAND_NAVY,
    buttonColor: BRAND_BLUE,
    bodyHtml: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td style="background:#F0FDF4; border-radius:12px; border:1px solid rgba(22,163,74,0.15); padding:24px; text-align:center;">
            <div style="font-size:11px; color:#64748B; font-weight:600; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:8px;">Smart Score</div>
            <div style="font-size:40px; font-weight:700; color:#16A34A; line-height:1;">8.5<span style="font-size:18px; color:#94A3B8; font-weight:500;"> / 10</span></div>
            <div style="font-size:13px; font-weight:600; color:#16A34A; margin-top:6px;">Excellent</div>
            <div style="margin-top:16px; height:6px; background:#E2E8F0; border-radius:3px; overflow:hidden;">
              <div style="height:100%; width:85%; background:#16A34A; border-radius:3px;"></div>
            </div>
          </td>
        </tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:0 16px;">
                  <div style="font-size:40px; line-height:1;">\ud83c\uddfa\ud83c\uddf8</div>
                  <div style="font-size:14px; font-weight:700; color:#0F172A; margin-top:6px;">US</div>
                </td>
                <td align="center" style="padding:0 12px;">
                  <div style="font-size:22px; color:#94A3B8;">\u2192</div>
                </td>
                <td align="center" style="padding:0 16px;">
                  <div style="font-size:40px; line-height:1;">\ud83c\uddf2\ud83c\uddfd</div>
                  <div style="font-size:14px; font-weight:700; color:#0F172A; margin-top:6px;">MX</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px 18px; font-size:15px; line-height:1.6; color:#0F172A;">
        Smart score crossed above 8.0 (now 8.5).
      </div>
    `,
    cta: { text: 'View Alert', url: '#' },
    footerHtml: 'Smart score at least 8.0 \xb7 US \u2192 MX<br><br><a href="#" style="color:#64748B; text-decoration:underline;">Manage notification preferences</a>',
  },
  {
    id: 'welcome',
    label: 'Welcome',
    from: 'Omar Ghabayen <support@remit-scout.com>',
    subject: 'Welcome to Remit-Scout \ud83d\udc4b',
    title: 'Welcome to Remit-Scout',
    subtitle: 'The smartest way to track remittance rates',
    headerColor: BRAND_NAVY,
    buttonColor: BRAND_BLUE,
    bodyHtml: `
      <p style="margin: 0 0 16px 0;">Hey there \ud83d\udc4b</p>
      <p style="margin: 0 0 16px 0;">Welcome to Remit-Scout! We help you track real-time exchange rates, compare providers, and send money when the rates are best.</p>
      
      <div style="background:#F8FAFC; border-radius:12px; border:1px solid #E2E8F0; padding:20px; margin: 24px 0;">
        <h3 style="margin: 0 0 12px 0; font-size: 16px; color:#0F172A; font-weight:700;">Get started in 3 steps:</h3>
        <ol style="margin: 0; padding-left: 20px; color:#334155; line-height: 1.7;">
          <li style="margin-bottom: 8px;"><strong>Track a corridor</strong> \u2014 Pick your send and receive countries.</li>
          <li style="margin-bottom: 8px;"><strong>Set an alert</strong> \u2014 Tell us what rate or amount you want.</li>
          <li style="margin-bottom: 0;"><strong>Get notified</strong> \u2014 We'll email you the moment your target is reached.</li>
        </ol>
      </div>

      <p style="margin: 0 0 16px 0;">Ready to catch the best rates?</p>
      
      <p style="margin: 32px 0 0 0; font-size: 15px;">
        Best,<br>
        <strong>Omar Ghabayen</strong><br>
        <span style="color:#64748B; font-size:13px;">Founder, Remit-Scout</span>
      </p>
    `,
    cta: { text: 'Set up your first alert', url: '#' },
    footerHtml: 'You are receiving this because you signed up for Remit-Scout. If you need help, simply reply to this email.',
  },
  {
    id: 'billing-active',
    label: 'Billing (Active)',
    from: 'Remit-Scout Billing <no-reply@remit-scout.com>',
    subject: 'Your Remit-Scout Plus subscription is active',
    title: 'Subscription Active',
    subtitle: 'Remit-Scout Plus',
    headerColor: BRAND_NAVY,
    buttonColor: '#16A34A',
    bodyHtml: `
      <p style="margin: 0 0 16px 0;">Thanks for joining <strong>Remit-Scout Plus</strong>.</p>
      <p style="margin: 0 0 16px 0;">Your subscription is now active. You now have full access to premium features, alerts, and market insights.</p>
    `,
    cta: { text: 'Go to your dashboard', url: '#' },
    footerHtml: 'This email confirms your new subscription. You can manage your billing settings in your dashboard at any time.',
  },
  {
    id: 'billing-failed',
    label: 'Billing (Failed)',
    from: 'Remit-Scout Billing <no-reply@remit-scout.com>',
    subject: 'Payment failed for your Plus subscription',
    title: 'Payment Failed',
    subtitle: 'Remit-Scout Plus',
    headerColor: BRAND_NAVY,
    buttonColor: '#D97706',
    bodyHtml: `
      <p style="margin: 0 0 16px 0;">We couldn't process your payment for <strong>Remit-Scout Plus</strong>.</p>
      <p style="margin: 0 0 16px 0;">Your access may be interrupted soon if your payment method isn't updated. Please check your card details to ensure uninterrupted access.</p>
    `,
    cta: { text: 'Update billing details', url: '#' },
    footerHtml: 'Automated billing alert from Remit-Scout.',
  },
  {
    id: 'security',
    label: 'New Sign-in',
    from: 'Remit-Scout Security <no-reply@remit-scout.com>',
    subject: 'New sign-in to your Remit-Scout account',
    title: 'New Sign-in Detected',
    subtitle: 'Security Alert',
    headerColor: BRAND_NAVY,
    buttonColor: '#D97706',
    bodyHtml: `
      <p style="margin: 0 0 16px 0;">We noticed a recent sign-in to your Remit-Scout account from a new device or location.</p>
      
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0; font-size:14px; border-collapse:separate; border-spacing:0; border-radius:12px; overflow:hidden; border:1px solid #E2E8F0;">
        <tr>
          <td style="padding:10px 12px; font-weight:600; width:80px; color:#64748B; background:#F8FAFC;">Device</td>
          <td style="padding:10px 12px; color:#0F172A; background:#F8FAFC;">Mac / Chrome</td>
        </tr>
        <tr>
          <td style="padding:10px 12px; font-weight:600; color:#64748B;">Location</td>
          <td style="padding:10px 12px; color:#0F172A;">San Francisco, CA</td>
        </tr>
        <tr>
          <td style="padding:10px 12px; font-weight:600; color:#64748B; background:#F8FAFC;">IP</td>
          <td style="padding:10px 12px; color:#0F172A; background:#F8FAFC;">192.168.1.1</td>
        </tr>
        <tr>
          <td style="padding:10px 12px; font-weight:600; color:#64748B;">Time</td>
          <td style="padding:10px 12px; color:#0F172A;">Feb 22, 2026, 10:30 AM UTC</td>
        </tr>
      </table>

      <p style="margin: 0 0 16px 0;"><strong>If this was you</strong>, you can safely ignore this email.</p>
      <p style="margin: 0 0 16px 0;"><strong>If you don't recognize this activity</strong>, please secure your account immediately.</p>
    `,
    cta: { text: 'Secure your account', url: '#' },
    footerHtml: 'This is an automated security notification from Remit-Scout. Do not reply to this email.',
  },
  {
    id: 'deletion',
    label: 'Account Deletion',
    from: 'Remit-Scout Security <no-reply@remit-scout.com>',
    subject: 'Account deletion scheduled',
    title: 'Account Deletion Scheduled',
    subtitle: 'Security Alert',
    headerColor: BRAND_NAVY,
    buttonColor: '#DC2626',
    bodyHtml: `
      <p style="margin: 0 0 16px 0;">We received a request to delete your Remit-Scout account.</p>
      <p style="margin: 0 0 16px 0;">Your account is scheduled for permanent deletion on <strong>Mar 1, 2026 10:30 AM UTC</strong>.</p>
      <p style="margin: 0 0 16px 0;">If you did not request this or you changed your mind, you must cancel within the grace window using the button below.</p>
    `,
    cta: { text: 'Cancel account deletion', url: '#' },
    footerHtml: 'This is an automated security notification from Remit-Scout. Do not reply to this email.',
  },
  {
    id: 'newsletter',
    label: 'Newsletter Confirm',
    from: 'RemitScout Newsletter <no-reply@remit-scout.com>',
    subject: 'Confirm your Remit-Scout newsletter subscription',
    title: 'Confirm Your Subscription',
    subtitle: 'Remit-Scout Newsletter',
    headerColor: BRAND_NAVY,
    buttonColor: BRAND_BLUE,
    bodyHtml: `
      <p style="margin: 0 0 16px 0;">Thanks for signing up for the Remit-Scout newsletter.</p>
      <p style="margin: 0 0 16px 0;">Please click the button below to confirm your subscription. You'll start receiving our updates and insights right away.</p>
    `,
    cta: { text: 'Confirm subscription', url: '#' },
    footerHtml: 'If you did not request this, you can safely ignore this email.<br><a href="#" style="color:#64748B; text-decoration:underline; display:inline-block; margin-top:8px;">Unsubscribe</a>',
  },
  {
    id: 'forgot-password',
    label: 'Forgot Password',
    from: 'Remit-Scout <no-reply@remit-scout.com>',
    subject: 'Reset your Remit-Scout password',
    title: 'Reset Your Password',
    subtitle: null,
    headerColor: BRAND_NAVY,
    buttonColor: BRAND_BLUE,
    bodyHtml: `
      <p style="margin: 0 0 16px 0;">We received a request to reset the password for your Remit-Scout account.</p>
      <p style="margin: 0 0 16px 0;">Click the button below to securely set a new password. This link will expire in 1 hour.</p>
    `,
    cta: { text: 'Reset password', url: '#' },
    footerHtml: 'If you did not request this, you can safely ignore this email. Your password will remain unchanged.',
  },
  {
    id: 'confirm-email',
    label: 'Confirm Email',
    from: 'Remit-Scout <no-reply@remit-scout.com>',
    subject: 'Confirm your email address',
    title: 'Confirm Your Email',
    subtitle: null,
    headerColor: BRAND_NAVY,
    buttonColor: BRAND_BLUE,
    bodyHtml: `
      <p style="margin: 0 0 16px 0;">Thanks for signing up for Remit-Scout!</p>
      <p style="margin: 0 0 16px 0;">Please click the button below to verify your email address and finish setting up your account.</p>
    `,
    cta: { text: 'Confirm email address', url: '#' },
    footerHtml: 'If you did not request this, you can safely ignore this email.',
  },
]

const activeView = ref('alert-score')
const currentView = computed(() => views.find(v => v.id === activeView.value) || views[0])
</script>
