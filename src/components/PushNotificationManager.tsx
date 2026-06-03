'use client'

import { useEffect, useState } from 'react';
import { savePushSubscription } from '@/app/actions';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      
      // Intentar suscribir si ya tiene permiso, o pedirlo si es 'default'
      if (Notification.permission === 'default') {
        const timer = setTimeout(() => {
            requestPermission();
        }, 2000); // Pequeño retraso para dejar que la app cargue primero
        return () => clearTimeout(timer);
      } else if (Notification.permission === 'granted') {
          subscribeUser();
      }
    }
  }, []);

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        await subscribeUser();
      }
    } catch (error) {
      console.error("Error pidiendo permiso de notificación:", error);
    }
  };

  const subscribeUser = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicVapidKey) {
            console.warn("Falta configurar NEXT_PUBLIC_VAPID_PUBLIC_KEY en Vercel");
            return;
        }
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });
      }

      await savePushSubscription(JSON.parse(JSON.stringify(subscription)));
    } catch (error) {
      console.error("Error suscribiendo usuario a push notifications:", error);
    }
  };

  // Componente silencioso en background, no dibuja nada en la UI
  return null;
}
