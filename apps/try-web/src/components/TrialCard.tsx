import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin } from 'lucide-react'
import { TrialCard as TrialCardType } from '@/lib/types'

interface TrialCardProps {
  trial: TrialCardType
}

export function TrialCard({ trial }: TrialCardProps) {
  const isLimited = trial.slotsRemaining <= 5
  const discount = Math.round((1 - trial.coinPrice / trial.originalPrice) * 100)

  return (
    <Link href={`/trial/${trial.id}`}>
      <div className="group bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={trial.image}
            alt={trial.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Category Badge */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <span>{trial.categoryEmoji}</span>
            <span className="text-xs font-medium text-gray-700">{trial.category}</span>
          </div>

          {/* Limited Slots Badge */}
          {isLimited && (
            <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
              Only {trial.slotsRemaining} left
            </div>
          )}

          {/* Discount Badge */}
          <div className="absolute bottom-3 right-3 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
            {discount}% off
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">{trial.title}</h3>
          <p className="text-sm text-gray-500 mb-2">{trial.merchant.name}</p>

          {/* Rating & Distance */}
          <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
            {trial.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-medium">{trial.rating}</span>
                <span className="text-gray-400">({trial.ratingCount})</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{trial.distance} {trial.distanceUnit}</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-purple-600">{trial.coinPrice} 🪙</span>
                <span className="text-sm text-gray-400 line-through">₹{trial.originalPrice}</span>
              </div>
              <div className="text-xs text-gray-500">+ ₹{trial.commitmentFee} refundable</div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
