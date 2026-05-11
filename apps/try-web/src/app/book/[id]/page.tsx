'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { MapPin, Clock, CheckCircle, Share2 } from 'lucide-react'
import { tryApi } from '@/lib/api'

export default function BookingPage() {
  const params = useParams()
  const bookingId = params.id as string

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => tryApi.getBookingDetails(bookingId),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
          <Link href="/" className="text-purple-600 hover:underline">
            Back to Explore
          </Link>
        </div>
      </div>
    )
  }

  const expiresAt = new Date(booking.qrExpiresAt)
  const now = new Date()
  const hoursLeft = Math.max(0, Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-lg mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <h1 className="text-xl font-bold text-gray-900">Booking Confirmed!</h1>
          </div>
          <p className="text-gray-600">Show this QR code at the store</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* QR Code Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="bg-white border-2 border-gray-100 rounded-xl p-4 flex justify-center mb-4">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG
                value={booking.qrToken || bookingId}
                size={200}
                level="H"
                includeMargin
              />
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-500 text-sm mb-1">Valid for</p>
            <p className="text-2xl font-bold text-purple-600">{hoursLeft} hours</p>
            <p className="text-gray-500 text-sm">
              Expires {expiresAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Merchant Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <h2 className="font-semibold text-gray-900 mb-2">{booking.title}</h2>
          <p className="text-gray-600 mb-3">{booking.merchant}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>1.2 km away</span>
            </div>

            <button className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium">
              <MapPin className="w-4 h-4" />
              Navigate
            </button>
          </div>
        </div>

        {/* After Visit */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">After Your Visit</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-center gap-2">
              <span className="text-lg">+50</span> ReZ Coins
            </li>
            <li className="flex items-center gap-2">
              <span className="text-lg">+20</span> Trial Coins
            </li>
            <li>Leave a review (optional)</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <button className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

        {/* Back to Explore */}
        <Link
          href="/"
          className="block text-center text-purple-600 font-medium hover:underline"
        >
          Back to explore more trials
        </Link>
      </main>
    </div>
  )
}
