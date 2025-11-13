<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <Breadcrumbs :items="breadcrumbItems" />

      <div class="mx-auto max-w-4xl">
        <div class="rounded-lg bg-white p-8 shadow-md">
          <div class="mb-8">
            <h1 class="mb-4 text-4xl font-bold text-gray-900">Privacy Policy</h1>
            <p class="text-gray-600">Last updated: January 1, 2024</p>
          </div>

          <div class="prose prose-lg max-w-none">
            <p class="mb-6">
              At Remit-Scout, we take your privacy seriously. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you visit our website and
              use our services.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Information We Collect</h2>

            <h3 class="mb-2 text-xl font-semibold text-gray-900">Personal Information</h3>
            <p class="mb-4">We may collect personal information such as:</p>
            <ul class="mb-6 list-inside list-disc space-y-1">
              <li>Name and contact information</li>
              <li>Email address</li>
              <li>Usage data and preferences</li>
              <li>Communication records</li>
            </ul>

            <h3 class="mb-2 text-xl font-semibold text-gray-900">
              Automatically Collected Information
            </h3>
            <p class="mb-4">
              We automatically collect certain information about your device and usage:
            </p>
            <ul class="mb-6 list-inside list-disc space-y-1">
              <li>IP address and location data</li>
              <li>Browser type and version</li>
              <li>Pages visited and time spent</li>
              <li>Referring websites</li>
            </ul>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">How We Use Your Information</h2>
            <p class="mb-4">We use the collected information to:</p>
            <ul class="mb-6 list-inside list-disc space-y-1">
              <li>Provide and improve our services</li>
              <li>Personalize your experience</li>
              <li>Communicate with you</li>
              <li>Analyze usage patterns</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Information Sharing</h2>
            <p class="mb-6">
              We do not sell, trade, or otherwise transfer your personal information to third
              parties without your consent, except as described in this policy or required by law.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Data Security</h2>
            <p class="mb-6">
              We implement appropriate technical and organizational measures to protect your
              personal information against unauthorized access, alteration, disclosure, or
              destruction.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Your Rights</h2>
            <p class="mb-4">You have the right to:</p>
            <ul class="mb-6 list-inside list-disc space-y-1">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing</li>
              <li>Request data portability</li>
            </ul>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Cookies</h2>
            <p class="mb-6">
              We use cookies and similar technologies to enhance your browsing experience, analyze
              site traffic, and personalize content. You can control cookie settings through your
              browser preferences.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Contact Us</h2>
            <p class="mb-6">
              If you have questions about this Privacy Policy, please contact us at
              <a
                href="mailto:privacy@Remit-Scout.com"
                class="text-primary-600 hover:text-primary-700"
                >privacy@Remit-Scout.com</a
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
  title: 'Privacy Policy | How We Protect Your Data | Remit-Scout',
  meta: [
    {
      name: 'description',
      content:
        "Read Remit-Scout's Privacy Policy to understand how we collect, use, and protect your personal information when using our money transfer comparison service.",
    },
  ],
});

// Breadcrumbs
const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Privacy Policy', path: '/privacy' },
];
</script>
