import Link from 'next/link'
import { Gift } from 'lucide-react'

export function SurpriseCard() {
  return (
    <Link href="/surprise">
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-6 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Gift className="w-7 h-7" />
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-lg">Surprise Trial This Week</h3>
            <p className="text-purple-200 text-sm">Tap to reveal your mystery experience</p>
          </div>

          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
            <span className="font-semibold">Reveal</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
