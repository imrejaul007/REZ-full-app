'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  requestNotificationPermission,
  getNotificationPermission,
  showLocalNotification,
  registerServiceWorker
} from '@/lib/notifications'

export function useNotifications() {
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default')
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    setPermission(getNotificationPermission())
    setIsSupported('Notification' in window && 'serviceWorker' in navigator)

    // Register service worker
    registerServiceWorker()
  }, [])

  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission()
    setPermission(granted ? 'granted' : 'denied')
    return granted
  }, [])

  const notify = useCallback(async (title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      await showLocalNotification(title, options)
    }
  }, [permission])

  return {
    permission,
    isSupported,
    requestPermission,
    notify,
  }
}
