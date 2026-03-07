type PushSubscribeResult = {
  success: boolean;
  settings?: {
    pushEnabled: boolean;
  };
};

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const usePushNotifications = () => {
  const { request } = useApi();
  const config = useRuntimeConfig();

  const supported = computed(() => {
    if (!import.meta.client) return false;
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  });

  const permission = ref<NotificationPermission>('default');
  const loading = ref(false);
  const error = ref<string | null>(null);

  if (import.meta.client) {
    permission.value = Notification.permission;
  }

  const ensureRegistration = async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) return registration;
    return navigator.serviceWorker.register('/push-sw.js');
  };

  const subscribeWebPush = async (): Promise<PushSubscribeResult> => {
    if (!supported.value) {
      error.value = 'Browser notifications are not supported in this browser.';
      return { success: false };
    }

    const vapidKey = config.public.pushVapidKey as string | undefined;
    if (!vapidKey) {
      error.value =
        'Browser notifications are temporarily unavailable on this environment. Email notifications still work.';
      return { success: false };
    }

    loading.value = true;
    error.value = null;

    try {
      const result = await Notification.requestPermission();
      permission.value = result;
      if (result !== 'granted') {
        error.value =
          'Browser notifications are blocked. Enable them in your browser settings and try again.';
        return { success: false };
      }

      const registration = await ensureRegistration();
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const payload = subscription.toJSON();
      const response = await request<PushSubscribeResult>('/notifications/push/subscribe', {
        method: 'POST',
        body: {
          platform: 'web',
          subscription: payload,
        },
      });

      return response;
    } catch (err: any) {
      error.value = err?.message || 'Unable to enable browser notifications right now.';
      return { success: false };
    } finally {
      loading.value = false;
    }
  };

  const unsubscribeWebPush = async (): Promise<PushSubscribeResult> => {
    if (!supported.value) return { success: false };
    loading.value = true;
    error.value = null;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      const endpoint = subscription?.endpoint;
      if (subscription) {
        await subscription.unsubscribe();
      }

      const response = await request<PushSubscribeResult>('/notifications/push/unsubscribe', {
        method: 'POST',
        body: {
          platform: 'web',
          endpoint,
        },
      });

      return response;
    } catch (err: any) {
      error.value = err?.message || 'Unable to disable browser notifications right now.';
      return { success: false };
    } finally {
      loading.value = false;
    }
  };

  return {
    supported,
    permission,
    loading,
    error,
    subscribeWebPush,
    unsubscribeWebPush,
  };
};
