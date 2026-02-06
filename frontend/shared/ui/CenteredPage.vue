<script setup lang="ts">
type Props = {
  rootClass?: string
  containerClass?: string
}

defineProps<Props>()
</script>

<template>
  <div class="w-full" :class="rootClass">
    <div
      class="mx-auto w-full max-w-page px-page-x py-page-y"
      :class="containerClass"
    >
      <div class="flex flex-col gap-y-stack">
        <header v-if="$slots.header">
          <slot name="header" />
        </header>

        <main class="min-w-0">
          <slot />
        </main>

        <footer v-if="$slots.footer">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </div>
</template>
