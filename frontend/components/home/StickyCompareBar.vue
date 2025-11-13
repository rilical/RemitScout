<template>
  <Transition name="slide-down">
    <div
      v-if="isVisible"
      class="fixed top-0 left-0 right-0 z-40 bg-white border-b border-neutral-200 shadow-md"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <form @submit.prevent="handleSubmit" class="flex items-center gap-3 py-3">
          <div class="flex items-center gap-2 flex-1">
            <div class="flex-1 min-w-0">
              <CountrySelect
                v-model="from"
                label="From"
                id="sticky-from"
                class="text-sm"
                :select-class="'border-neutral-300 h-11'"
              />
            </div>

            <svg class="h-4 w-4 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>

            <div class="flex-1 min-w-0">
              <CountrySelect
                v-model="to"
                label="To"
                id="sticky-to"
                class="text-sm"
                :select-class="'border-neutral-300 h-11'"
              />
            </div>

            <div class="flex-1 min-w-0">
              <AmountInput
                v-model="amount"
                label="Amount"
                id="sticky-amount"
                :from="from"
                :to="to"
                :input-class="'border-neutral-300 h-11'"
              />
            </div>

            <div class="hidden md:flex items-center gap-2">
              <button
                v-for="method in deliveryMethods"
                :key="method.value"
                type="button"
                @click="selectedMethod = method.value"
                :title="method.label"
                class="h-11 w-11 flex items-center justify-center rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-brand-600"
                :class="selectedMethod === method.value 
                  ? 'border-brand-600 bg-brand-50' 
                  : 'border-neutral-200 bg-white hover:border-brand-300'"
              >
                <span class="text-xl">{{ method.icon }}</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="h-11 px-6 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 disabled:opacity-50 whitespace-nowrap"
          >
            {{ STR.stickyBar.cta }}
          </button>
        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { DELIVERY_METHODS } from '~/utils/constants';

const { STR } = useStrings();

interface Props {
  scrollThreshold?: number;
}

const props = withDefaults(defineProps<Props>(), {
  scrollThreshold: 80
});

const from = ref('US');
const to = ref('PH');
const amount = ref(500);
const selectedMethod = ref('bank');
const isSubmitting = ref(false);
const isVisible = ref(false);
const deliveryMethods = DELIVERY_METHODS;

const handleScroll = () => {
  isVisible.value = window.scrollY >= props.scrollThreshold;
};

const handleSubmit = async () => {
  isSubmitting.value = true;
  try {
    await navigateTo(
      `/send-money/${from.value.toLowerCase()}-to-${to.value.toLowerCase()}?amount=${amount.value}&method=${selectedMethod.value}`
    );
  } catch (error) {
    console.error('Navigation error:', error);
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>


