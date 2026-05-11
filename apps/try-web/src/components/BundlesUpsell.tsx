import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

export function BundlesUpsell() {
  return (
    <Link href="/bundles">
      <div className="bg-gradient-to-r from-nileBlue to-purple-800 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold">Save with Bundles</h3>
            <p className="text-sm text-white/70">3 trials for ₹249 (Save 40%)</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="text-white/70">Includes</span>{' '}
            <span className="font-semibold">100 bonus coins</span>
          </div>
          <span className="bg-white/20 px-3 py-1 rounded-lg text-sm font-medium">
            View Bundle →
          </span>
        </div>
      </div>
    </Link>
  )
}
