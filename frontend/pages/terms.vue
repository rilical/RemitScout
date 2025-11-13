<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <Breadcrumbs :items="breadcrumbItems" />

      <div class="mx-auto max-w-4xl">
        <div class="rounded-lg bg-white p-8 shadow-md">
          <div class="mb-8">
            <h1 class="mb-4 text-4xl font-bold text-gray-900">Terms of Service</h1>
            <p class="text-gray-600">Last updated: January 1, 2024</p>
          </div>

          <div class="prose prose-lg max-w-none">
            <p class="mb-6">
              These Terms of Service ("Terms") govern your access to and use of Remit-Scout's
              website, services, and applications. By using our services, you agree to be bound by
              these Terms.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Acceptance of Terms</h2>
            <p class="mb-6">
              By accessing or using Remit-Scout, you acknowledge that you have read, understood, and
              agree to be bound by these Terms. If you do not agree to these Terms, please do not
              use our services.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Description of Services</h2>
            <p class="mb-6">
              Remit-Scout provides comparison tools, reviews, and educational content about money
              transfer services. We are not a money transfer provider and do not process financial
              transactions.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">User Responsibilities</h2>
            <p class="mb-4">You agree to:</p>
            <ul class="mb-6 list-inside list-disc space-y-1">
              <li>Provide accurate and complete information</li>
              <li>Use our services only for lawful purposes</li>
              <li>Not attempt to gain unauthorized access to our systems</li>
              <li>Respect intellectual property rights</li>
              <li>Not use our services for fraudulent activities</li>
            </ul>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Intellectual Property</h2>
            <p class="mb-6">
              All content, features, and functionality of Remit-Scout are owned by us and are
              protected by copyright, trademark, and other intellectual property laws.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Disclaimer of Warranties</h2>
            <p class="mb-6">
              Our services are provided "as is" without warranties of any kind. We do not guarantee
              the accuracy, completeness, or reliability of information provided through our
              platform.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Limitation of Liability</h2>
            <p class="mb-6">
              In no event shall Remit-Scout be liable for any indirect, incidental, special, or
              consequential damages arising out of or in connection with your use of our services.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Third-Party Services</h2>
            <p class="mb-6">
              Our platform may contain links to third-party websites or services. We are not
              responsible for the content, privacy policies, or practices of third-party services.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Termination</h2>
            <p class="mb-6">
              We may terminate or suspend your access to our services at any time, without prior
              notice or liability, for any reason, including breach of these Terms.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Changes to Terms</h2>
            <p class="mb-6">
              We reserve the right to modify these Terms at any time. Changes will be effective
              immediately upon posting. Your continued use of our services constitutes acceptance of
              the modified Terms.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Governing Law</h2>
            <p class="mb-6">
              These Terms shall be governed by and construed in accordance with the laws of the
              jurisdiction in which Remit-Scout operates, without regard to its conflict of law
              provisions.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Contact Information</h2>
            <p class="mb-6">
              If you have questions about these Terms, please contact us at
              <a href="mailto:legal@Remit-Scout.com" class="text-primary-600 hover:text-primary-700"
                >legal@Remit-Scout.com</a
              >.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Meta
useHead({
  title: 'Terms of Service | Remit-Scout Legal Agreement',
  meta: [
    {
      name: 'description',
      content:
        'Read the Terms of Service for Remit-Scout. Understand the rules and conditions for using our money transfer comparison platform.',
    },
  ],
});

// Breadcrumbs
const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Terms of Service', path: '/terms' },
];
</script>
