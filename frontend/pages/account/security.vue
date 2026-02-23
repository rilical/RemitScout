<template>
  <div class="min-h-screen bg-neutral-50 px-page-x py-12">
    <div class="mx-auto w-full max-w-3xl space-y-6">
      <div
        v-if="mfaRequiredByPolicy"
        class="rounded-xl border-2 border-warning-400 bg-warning-50 px-5 py-4"
      >
        <p class="text-body font-semibold text-warning-800">Multi-factor authentication is required</p>
        <p class="mt-1 text-body-sm text-warning-700">Your account requires MFA to be enabled before you can continue. Please set up an authenticator app below.</p>
      </div>

      <div>
        <h1 class="text-h2 font-bold text-rs-fg">Account security</h1>
        <p class="mt-2 text-body-sm text-rs-muted">Manage multi-factor authentication for your account.</p>
      </div>

      <section class="rounded-2xl border border-rs-border bg-surface p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-body-lg font-semibold text-rs-fg">Multi-factor authentication (MFA)</h2>
            <p class="text-body-sm text-rs-muted">Add an authenticator app for extra protection.</p>
          </div>
          <button
            class="rounded-lg border border-rs-border px-4 py-2 text-body-sm font-semibold text-rs-fg hover:bg-neutral-50 disabled:opacity-60"
            :disabled="loading"
            @click="loadFactors"
          >
            {{ loading ? 'Refreshing…' : 'Refresh' }}
          </button>
        </div>

        <div
          v-if="errorMessage"
          class="mt-4 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-body-sm text-danger-800"
        >
          {{ errorMessage }}
        </div>

        <div class="mt-6">
          <div
            v-if="mfaEnabled"
            class="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-body-sm text-success-800"
          >
            MFA is enabled for your account.
          </div>
          <div
            v-else
            class="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-body-sm text-neutral-700"
          >
            MFA is not enabled yet.
          </div>
        </div>

        <div class="mt-4">
          <h3 class="text-body-sm font-semibold text-neutral-700">Enrolled factors</h3>
          <ul
            v-if="factorList.length > 0"
            class="mt-2 space-y-2"
          >
            <li
              v-for="factor in factorList"
              :key="factor.id"
              class="flex items-center justify-between rounded-lg border border-rs-border bg-rs-bg px-3 py-2"
            >
              <div>
                <div class="text-body-sm font-semibold text-neutral-900">{{ factorLabel(factor) }}</div>
                <div class="text-body-sm text-neutral-600">{{ factorStatus(factor.status) }}</div>
              </div>
              <button
                class="rounded-lg border border-rs-border px-3 py-1.5 text-body-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
                :disabled="loading || removingFactorId === factor.id"
                @click="removeFactor(factor.id)"
              >
                {{ removingFactorId === factor.id ? 'Disabling…' : 'Disable' }}
              </button>
            </li>
          </ul>
          <div
            v-else
            class="mt-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-body-sm text-neutral-700"
          >
            No MFA factors enrolled.
          </div>
        </div>

        <div class="mt-6 space-y-4">
          <button
            class="rounded-lg bg-brand-600 px-4 py-2 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            :disabled="loading || enrolling"
            @click="startEnrollment"
          >
            {{ enrolling ? 'Starting…' : 'Enable MFA' }}
          </button>

          <div v-if="enrollment" class="rounded-xl border border-rs-border bg-neutral-50 p-4">
            <p class="text-body-sm text-neutral-700">Scan the QR code with your authenticator app, or enter the secret manually.</p>
            <div class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <img
                v-if="enrollment.totp?.qr_code"
                :src="enrollment.totp.qr_code"
                alt="MFA QR code"
                class="h-36 w-36 rounded-lg border border-neutral-200 bg-white p-2"
              >
              <div class="text-body-sm text-neutral-700">
                <div class="font-semibold text-neutral-900">Secret</div>
                <div class="font-mono break-all">{{ enrollment.totp?.secret }}</div>
              </div>
            </div>

            <div class="mt-4">
              <label class="block text-body-sm font-semibold text-neutral-700 mb-2">Verification code</label>
              <input
                v-model.trim="verificationCode"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                class="h-11 w-full max-w-xs rounded-lg border-2 border-neutral-300 bg-surface px-4 text-rs-fg placeholder:text-neutral-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors"
                placeholder="123456"
              >
            </div>
            <div class="mt-4 flex items-center gap-3">
              <button
                class="rounded-lg bg-brand-600 px-4 py-2 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                :disabled="verifying"
                @click="verifyEnrollment"
              >
                {{ verifying ? 'Verifying…' : 'Verify MFA' }}
              </button>
              <button
                class="rounded-lg border border-rs-border px-4 py-2 text-body-sm font-semibold text-rs-fg hover:bg-neutral-50"
                @click="resetEnrollment"
              >
                Cancel
              </button>
            </div>
          </div>

          <div class="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-body-sm text-neutral-700">
            Recovery path: if you lose your authenticator device, sign in from an active session and use <code>Disable</code> on the current factor, then enroll a new one.
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const router = useRouter()

const {
  listMfaFactors,
  enrollMfaFactor,
  verifyMfaEnrollment,
  unenrollMfaFactor,
} = useAuth()

const mfaRequiredByPolicy = computed(() => route.query.mfa === 'required')

onBeforeRouteLeave((_to, _from, next) => {
  if (mfaRequiredByPolicy.value && !mfaEnabled.value) {
    next(false)
    return
  }
  next()
})

const loading = ref(false)
const enrolling = ref(false)
const verifying = ref(false)
const removingFactorId = ref<string | null>(null)
const errorMessage = ref<string | null>(null)
type MfaFactor = {
  id: string
  status?: string | null
  factor_type?: string | null
  friendly_name?: string | null
  created_at?: string | null
}

const factors = ref<{ totp?: MfaFactor[]; all?: MfaFactor[] } | null>(null)
const enrollment = ref<any | null>(null)
const verificationCode = ref('')

const mfaEnabled = computed(() => {
  const totp = factors.value?.totp || []
  return totp.some(factor => factor.status === 'verified')
})

const factorList = computed<MfaFactor[]>(() => {
  const allFactors = factors.value?.all
  if (Array.isArray(allFactors) && allFactors.length > 0) {
    return allFactors
  }
  const totp = factors.value?.totp
  if (Array.isArray(totp)) {
    return totp
  }
  return []
})

const factorStatus = (status?: string | null) => {
  if (status === 'verified') return 'Verified'
  if (status) return status
  return 'Unknown'
}

const factorLabel = (factor: MfaFactor) => {
  if (factor.friendly_name) return factor.friendly_name
  if (factor.factor_type) return factor.factor_type.toUpperCase()
  return 'Authenticator factor'
}

const loadFactors = async () => {
  loading.value = true
  errorMessage.value = null
  factors.value = await listMfaFactors()
  loading.value = false
}

const startEnrollment = async () => {
  enrolling.value = true
  errorMessage.value = null
  const result = await enrollMfaFactor()
  enrolling.value = false
  if (!result.ok) {
    errorMessage.value = result.error || 'Unable to start MFA enrollment.'
    return
  }
  enrollment.value = result.factor
}

const resetEnrollment = () => {
  enrollment.value = null
  verificationCode.value = ''
}

const verifyEnrollment = async () => {
  if (!enrollment.value?.id) {
    errorMessage.value = 'Enrollment data missing. Please restart MFA setup.'
    return
  }
  verifying.value = true
  errorMessage.value = null
  const result = await verifyMfaEnrollment(enrollment.value.id, verificationCode.value)
  verifying.value = false
  if (!result.ok) {
    errorMessage.value = result.error || 'Unable to verify MFA code.'
    return
  }
  resetEnrollment()
  await loadFactors()

  if (mfaRequiredByPolicy.value) {
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
    await router.replace(redirect)
  }
}

const removeFactor = async (factorId: string) => {
  if (!factorId) return
  if (!confirm('Disable this MFA factor? You can re-enroll after removal.')) return

  removingFactorId.value = factorId
  errorMessage.value = null
  const result = await unenrollMfaFactor(factorId)
  removingFactorId.value = null

  if (!result.ok) {
    errorMessage.value = result.error || 'Unable to disable MFA factor.'
    return
  }

  if (enrollment.value?.id === factorId) {
    resetEnrollment()
  }
  await loadFactors()
}

onMounted(() => {
  void loadFactors()
})
</script>
