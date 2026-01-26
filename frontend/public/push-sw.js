self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : {}
  const title = payload.title || 'Remit-Scout'
  const options = {
    body: payload.body || 'You have a new update.',
    icon: payload.icon || '/icons/icon-192.png',
    data: {
      url: payload.url || '/',
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(self.clients.openWindow(url))
})
