<template>
  <div class="rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg">
    <div class="mb-4 flex items-start justify-between">
      <div class="flex items-center">
        <ProviderLogo :provider="provider" class="mr-3 h-12 w-12" />
        <div>
          <h3 class="text-lg font-semibold text-gray-900">
            {{ provider?.name }}
          </h3>
          <div class="flex items-center">
            <Stars :rating="provider?.rating" size="sm" />
            <span class="ml-2 text-gray-600">{{ provider?.reviewCount }} reviews</span>
          </div>
        </div>
      </div>
      <Badge v-if="provider?.featured" variant="primary"> Featured </Badge>
    </div>

    <p class="mb-4 text-gray-600">
      {{ provider?.description }}
    </p>

    <div class="mb-4 grid grid-cols-2 gap-4">
      <div>
        <div class="text-sm text-gray-500">Transfer Speed</div>
        <div class="font-medium">
          {{ provider?.transferSpeed }}
        </div>
      </div>
      <div>
        <div class="text-sm text-gray-500">Countries</div>
        <div class="font-medium">{{ provider?.countries }}+</div>
      </div>
    </div>

    <NuxtLink :to="`/providers/${provider?.slug}`" class="btn-primary block w-full text-center">
      View Details
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
interface Provider {
  id: string;
  name: string;
  slug: string;
  rating: number;
  reviewCount: number;
  description: string;
  transferSpeed: string;
  countries: number;
  featured?: boolean;
}

interface Props {
  provider?: Provider;
  compact?: boolean;
}

withDefaults(defineProps<Props>(), {
  compact: false,
});
</script>
