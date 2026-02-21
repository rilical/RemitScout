<template>
  <div class="fixed top-3 right-3 z-[9999] flex items-center gap-1 rounded-full border border-neutral-300 bg-white/90 px-2 py-1 shadow-lg backdrop-blur text-body-sm">
    <span class="pl-1 pr-2 text-neutral-500 font-medium select-none">DEV</span>
    <button
      v-for="role in ROLES"
      :key="role"
      type="button"
      class="rounded-full px-3 py-1 font-semibold transition-colors"
      :class="current === role
        ? 'bg-brand-600 text-white'
        : 'text-neutral-600 hover:bg-neutral-100'"
      @click="apply(role)"
    >
      {{ labels[role] }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { User } from '~/composables/useAuth'
import type { Plan, PlanLimits } from '~/composables/useEntitlements'

const ROLES = ['unsigned', 'free', 'plus', 'enterprise', 'admin'] as const
type Role = (typeof ROLES)[number]

const labels: Record<Role, string> = {
  unsigned: 'Unsigned',
  free: 'Free',
  plus: 'Plus',
  enterprise: 'Enterprise',
  admin: 'Admin',
}

const current = ref<Role>('unsigned')

const FAKE_USER: User = {
  id: 'dev-00000000-0000-0000-0000-000000000000',
  email: 'dev@remit-scout.local',
  name: 'Dev User',
}

const ADMIN_USER: User = {
  ...FAKE_USER,
  role: 'admin',
  appRole: 'admin',
  isAdmin: true,
}

const LIMITS: Record<Plan, PlanLimits> = {
  free: { watchlistItems: 3, alerts: 1, historyDays: 30, exports: false, exportsMaxDays: 0 },
  plus: { watchlistItems: 25, alerts: 10, historyDays: 365, exports: true, exportsMaxDays: 90 },
  enterprise: { watchlistItems: 'unlimited', alerts: 'unlimited', historyDays: 'unlimited', exports: true, exportsMaxDays: 'unlimited' },
}

const PULSE: Record<Plan, 'none' | 'lite' | 'full'> = {
  free: 'none',
  plus: 'lite',
  enterprise: 'full',
}

function apply(role: Role) {
  const devOverride = useState<boolean>('dev:role-override', () => false)
  const user = useState<User | null>('auth:user')
  const authHydrated = useState<boolean>('auth:hydrated')
  const plan = useState<Plan>('entitlements:plan')
  const limits = useState<PlanLimits>('entitlements:limits')
  const pulseAccess = useState<string>('entitlements:pulse-access')
  const entHydrated = useState<boolean>('entitlements:hydrated')

  if (role === 'unsigned') {
    devOverride.value = false
    user.value = null
    plan.value = 'free'
    limits.value = LIMITS.free
    pulseAccess.value = 'none'
  } else {
    devOverride.value = true
    const effectivePlan: Plan = role === 'admin' ? 'enterprise' : (role as Plan)
    user.value = role === 'admin' ? ADMIN_USER : FAKE_USER
    plan.value = effectivePlan
    limits.value = LIMITS[effectivePlan]
    pulseAccess.value = PULSE[effectivePlan]
  }

  authHydrated.value = true
  entHydrated.value = true
  current.value = role
}
</script>
