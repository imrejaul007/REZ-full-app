'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import { Star, MapPin, Clock, Check, ChevronLeft } from 'lucide-react'
import { tryApi } from '@/lib/api'
import { useState, useEffect } from 'react'
import { analytics } from '@/lib/analytics'

export default function TrialDetailPage() {
  const params = useParams()
  const trialId = params.id as string

  const { data: trial, isLoading } = useQuery({
    queryKey: ['trial', trialId],
    queryFn: () => tryApi.getTrialDetails(trialId),
  })

  const [booking, setBooking] = useState(false)

  // Track when user views trial
  useEffect(() => {
    if (trial) {
      analytics.trialView(trial.id, trial.category)
    }
  }, [trial])

  const handleBook = async () => {
    if (!trial) return

    setBooking(true)

    // Track trial booking attempt
    analytics.trialBook(trial.id, trial.category, trial.commitmentFee)

    try {
      // In production, this would create a Razorpay order first
      const result = await tryApi.bookTrial({
        trialId: trial.id,
        commitmentFeePaymentId: 'mock-payment',
        userGeo: { lat: 19.076, lng: 72.877 },
      })

      if (result.success) {
        window.location.href = `/book/${result.data.bookingId}`
      }
    } catch (error) {
      console.error('Booking failed:', error)
      setBooking(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!trial) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Trial Not Found</h1>
          <Link href="/" className="text-purple-600 hover:underline">
            Back to Explore
          </Link>
        </div>
      </div>
    )
  }

  const discount = Math.round((1 - trial.coinPrice / trial.originalPrice) * 100)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <span className="font-semibold">Trial Details</span>
        </div>
      </header>

      {/* Hero Image */}
      <div className="relative h-72 sm:h-96">
        <Image
          src={trial.image}
          alt={trial.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Category Badge */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <span>{trial.categoryEmoji}</span>
          <span className="text-sm font-medium">{trial.category}</span>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Title & Merchant */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{trial.title}</h1>
        <p className="text-gray-600 mb-4">{trial.merchant.name}</p>

        {/* Rating & Distance */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
          {trial.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold">{trial.rating}</span>
              <span>({trial.ratingCount} reviews)</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{trial.distance} {trial.distanceUnit} away</span>
          </div>
        </div>

        {/* Booking Card */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-6">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl font-bold text-purple-600">{trial.coinPrice} 🪙</span>
            <span className="text-lg text-gray-400 line-through">₹{trial.originalPrice}</span>
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-sm font-semibold">
              {discount}% off
            </span>
          </div>

          <div className="text-sm text-gray-600 mb-4">
            + ₹{trial.commitmentFee} refundable commitment fee
          </div>

          <button
            onClick={handleBook}
            disabled={booking}
            className="w-full bg-nileBlue text-white py-4 rounded-xl font-semibold text-lg hover:bg-nileBlue/90 transition disabled:opacity-50"
          >
            {booking ? 'Booking...' : `Book for ₹${trial.commitmentFee}`}
          </button>

          {trial.slotsRemaining <= 5 && (
            <p className="text-center text-red-500 text-sm mt-3">
              Only {trial.slotsRemaining} slots remaining!
            </p>
          )}
        </div>

        {/* What's Included */}
        <section className="mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">What's Included</h2>
          <ul className="space-y-2">
            {['Full experience', 'Expert consultation', 'Premium products'].map((item) => (
              <li key={item} className="flex items-center gap-2 text-gray-700">
                <Check className="w-5 h-5 text-green-500" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Availability */}
        <section className="mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Availability</h2>
          <div className="flex items-center gap-2 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Available Today • {trial.slotsRemaining} slots left</span>
          </div>
        </section>

        {/* Rewards Preview */}
        {trial.rewards && (
          <section className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h2 className="font-semibold text-gray-900 mb-2">Earn on Completion</h2>
            <div className="flex gap-4">
              <span className="text-lg">+{trial.rewards.coinsEarned} ReZ Coins</span>
              <span className="text-lg">+{trial.rewards.brandedCoinsEarned} Trial Coins</span>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
