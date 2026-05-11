'use client'

import { useNotifications } from '@/hooks/useNotifications'

export function NotificationPrompt() {
  const { permission, requestPermission, isSupported } = useNotifications()

  if (!isSupported || permission !== 'default') {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg border border-gray-100 p-4 z-50">
      <div className="flex items-start gap-3">
        <div className="text-2xl">🔔</div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Enable Notifications</h3>
          <p className="text-sm text-gray-600 mt-1">
            Get notified about new trials, mission reminders, and special offers.
          </p>
        </div>
        <button
          onClick={requestPermission}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700"
        >
          Enable
        </button>
      </div>
    </div>
  )
}
