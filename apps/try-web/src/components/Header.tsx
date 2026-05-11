'use client'

import Link from 'next/link'
import { useState } from 'react'

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Rz</span>
            </div>
            <span className="font-bold text-xl text-gray-900">ReZ Try</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-600 hover:text-purple-600 transition">
              Explore
            </Link>
            <Link href="/history" className="text-gray-600 hover:text-purple-600 transition">
              My Bookings
            </Link>
            <Link href="/profile" className="text-gray-600 hover:text-purple-600 transition">
              Profile
            </Link>
          </nav>

          {/* Coin Balance */}
          <div className="flex items-center gap-4">
            <Link
              href="/coins"
              className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full"
            >
              <span className="text-lg">🪙</span>
              <span className="font-semibold text-amber-700">340</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col gap-1">
              <Link href="/" className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-2">
                <span>🏠</span> Explore
              </Link>
              <Link href="/history" className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-2">
                <span>📋</span> My Bookings
              </Link>
              <Link href="/profile" className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-2">
                <span>👤</span> Profile
              </Link>
              <Link href="/coins" className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-2">
                <span>🪙</span> My Coins
              </Link>
              <Link href="/missions" className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-2">
                <span>🎯</span> Missions
              </Link>
              <Link href="/badges" className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-2">
                <span>🏅</span> Badges
              </Link>
              <Link href="/leaderboard" className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-2">
                <span>🏆</span> Leaderboard
              </Link>
              <Link href="/bundles" className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-2">
                <span>📦</span> Bundles
              </Link>
              <Link href="/campaigns" className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-2">
                <span>🎉</span> Campaigns
              </Link>
              <Link href="/surprise" className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-2">
                <span>🎁</span> Surprise
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
