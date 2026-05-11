'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import Image from 'next/image'
import { Clock, CheckCircle, XCircle, MapPin } from 'lucide-react'
import { tryApi } from '@/lib/api'
import { Header } from '@/components/Header'

export default function HistoryPage() {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['history'],
    queryFn: () => tryApi.getHistory(),
  })

  const statusConfig = {
    active: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Active' },
    completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Completed' },
    expired: { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Expired' },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No bookings yet</p>
            <Link href="/" className="text-purple-600 font-medium hover:underline">
              Explore trials →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((booking: any) => {
              const config = statusConfig[booking.status] || statusConfig.active
              const Icon = config.icon

              return (
                <Link key={booking.bookingId} href={`/book/${booking.bookingId}`}>
                  <div className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-purple-200 transition">
                    <div className="flex">
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <Image
                          src={booking.image}
                          alt={booking.title}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 p-3">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 line-clamp-1">{booking.title}</h3>
                          <div className={`flex items-center gap-1 ${config.bg} px-2 py-0.5 rounded-full`}>
                            <Icon className={`w-3 h-3 ${config.color}`} />
                            <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-500 mb-2">{booking.merchant}</p>

                        {booking.status === 'active' && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-purple-600 font-medium">View QR →</span>
                          </div>
                        )}

                        {booking.status === 'completed' && booking.rating && (
                          <div className="flex items-center gap-1">
                            <span className="text-amber-500">★</span>
                            <span className="text-sm font-medium">{booking.rating}</span>
                            {booking.reviewText && (
                              <span className="text-xs text-gray-400">- "{booking.reviewText.slice(0, 20)}..."</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
