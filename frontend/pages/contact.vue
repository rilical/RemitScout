<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <Breadcrumbs :items="breadcrumbItems" />

      <div class="mx-auto max-w-4xl">
        <div class="mb-8 rounded-lg bg-white p-8 shadow-md">
          <h1 class="mb-6 text-4xl font-bold text-gray-900">Contact Us</h1>
          <p class="mb-8 text-xl text-gray-600">
            Have questions about money transfers or need help choosing the right provider? We're
            here to help.
          </p>

          <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <h2 class="mb-6 text-2xl font-bold text-gray-900">Get in Touch</h2>

              <form class="space-y-6">
                <div>
                  <label for="name" class="mb-2 block text-sm font-medium text-gray-700"
                    >Name</label
                  >
                  <input
                    id="name"
                    type="text"
                    class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label for="email" class="mb-2 block text-sm font-medium text-gray-700"
                    >Email</label
                  >
                  <input
                    id="email"
                    type="email"
                    class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label for="subject" class="mb-2 block text-sm font-medium text-gray-700"
                    >Subject</label
                  >
                  <select
                    id="subject"
                    class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option>General Question</option>
                    <option>Provider Comparison</option>
                    <option>Technical Support</option>
                    <option>Partnership Inquiry</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label for="message" class="mb-2 block text-sm font-medium text-gray-700"
                    >Message</label
                  >
                  <textarea
                    id="message"
                    rows="6"
                    class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <button type="submit" class="btn-primary w-full">Send Message</button>
              </form>
            </div>

            <div>
              <h2 class="mb-6 text-2xl font-bold text-gray-900">Contact Information</h2>

              <div class="space-y-6">
                <div class="flex items-start">
                  <svg
                    class="mr-3 mt-1 h-6 w-6 text-primary-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <div>
                    <h3 class="font-semibold text-gray-900">Address</h3>
                    <p class="text-gray-600">
                      123 Transfer Street<br />Suite 100<br />Financial City, FC 12345
                    </p>
                  </div>
                </div>

                <div class="flex items-start">
                  <svg
                    class="mr-3 mt-1 h-6 w-6 text-primary-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"
                    />
                  </svg>
                  <div>
                    <h3 class="font-semibold text-gray-900">Phone</h3>
                    <p class="text-gray-600">+1 (555) 123-4567</p>
                  </div>
                </div>

                <div class="flex items-start">
                  <svg
                    class="mr-3 mt-1 h-6 w-6 text-primary-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"
                    />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <div>
                    <h3 class="font-semibold text-gray-900">Email</h3>
                    <p class="text-gray-600">support@Remit-Scout.com</p>
                  </div>
                </div>

                <div class="flex items-start">
                  <svg
                    class="mr-3 mt-1 h-6 w-6 text-primary-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <div>
                    <h3 class="font-semibold text-gray-900">Business Hours</h3>
                    <p class="text-gray-600">
                      Monday - Friday: 9:00 AM - 6:00 PM EST<br />Saturday: 10:00 AM - 4:00 PM
                      EST<br />Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Meta
useHead({
  title: 'Contact Us | Get Help with Money Transfers | Remit-Scout',
  meta: [
    {
      name: 'description',
      content:
        'Contact Remit-Scout for help with money transfer questions, provider comparisons, or technical support. Our team is here to assist you.',
    },
  ],
});

// Breadcrumbs
const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Contact', path: '/contact' },
];
</script>
