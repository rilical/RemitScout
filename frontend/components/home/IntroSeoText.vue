<template>
  <section
    class="bg-white py-12"
    aria-labelledby="intro-heading"
  >
    <div class="container mx-auto px-4">
      <div class="mx-auto max-w-4xl text-center">
        <h2
          id="intro-heading"
          class="mb-6 text-2xl font-bold text-gray-900 md:text-3xl"
        >
          How Remit-Scout helps you save on international money transfers
        </h2>

        <div class="prose prose-lg prose-gray max-w-none">
          <p class="mb-6 text-lg leading-relaxed text-gray-700">
            Sending money abroad doesn't have to be expensive or complicated. At Remit-Scout, we make
            it easy to
            <strong>compare money transfer providers</strong> and find the best deals on exchange
            rates and fees. Whether you're sending money to family, paying for services, or managing
            international business payments, our comprehensive comparison tools help you save money
            on every transfer.
          </p>

          <p class="mb-6 text-lg leading-relaxed text-gray-700">
            Our platform compares <strong>exchange rates</strong> and
            <strong>transfer fees</strong> from over 30 trusted money transfer companies including
            Wise (formerly TransferWise), Western Union, Remitly, and many more. We show you
            real-time rates, hidden fees, and delivery times so you can make informed decisions
            about your international money transfers.
          </p>

          <p class="mb-6 text-lg leading-relaxed text-gray-700">
            Unlike other comparison sites, we don't just show you numbers – we explain how money
            transfer services work, what affects exchange rates, and how to avoid hidden fees. Our
            independent reviews and user ratings help you choose the right provider for your
            specific needs, whether you need instant transfers, cash pickup, or the absolute lowest
            fees for large amounts.
          </p>

          <p class="text-lg leading-relaxed text-gray-700">
            Start comparing today and see how much you can save on your next international money
            transfer. Our tools are free to use and updated every 10 minutes to ensure you always
            get the most current information.
          </p>
        </div>

        <!-- Key statistics -->
        <div class="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div class="text-center">
            <div class="mb-2 text-3xl font-bold text-primary-600">
              30+
            </div>
            <div class="text-gray-600">
              Money transfer providers compared
            </div>
          </div>
          <div class="text-center">
            <div class="mb-2 text-3xl font-bold text-primary-600">
              200+
            </div>
            <div class="text-gray-600">
              Countries and territories covered
            </div>
          </div>
          <div class="text-center">
            <div class="mb-2 text-3xl font-bold text-primary-600">
              24/7
            </div>
            <div class="text-gray-600">
              Real-time rate monitoring
            </div>
          </div>
        </div>

        <!-- CTA -->
        <div class="mt-10">
          <NuxtLink
            to="/send-money"
            class="btn-primary inline-block text-center"
          >
            Start Comparing Now
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// This component contains SEO-optimized content with relevant keywords
// No client-side logic needed - pure presentation with semantic HTML
</script>

<style scoped>
.btn-primary {
  @apply rounded-lg bg-primary-600 px-8 py-3 font-medium text-white transition-colors duration-200 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
}
</style>
