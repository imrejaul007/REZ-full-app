import Link from 'next/link'
import Image from 'next/image'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Rz</span>
            </div>
            <span className="font-bold text-xl">ReZ Try</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-600 hover:text-purple-600 font-medium">
              Login
            </Link>
            <Link href="/login" className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-orange-50 py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <span>✨</span>
                  <span>The smart way to explore your city</span>
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                  Try Before You Buy,
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-orange-500">
                    Get Rewarded
                  </span>
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-lg">
                  Discover amazing experiences, pay a small commitment fee, and earn coins on every trial. No risk, all reward.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/login" className="bg-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-purple-700 transition">
                    Start Exploring
                  </Link>
                  <Link href="/#how-it-works" className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-purple-600 hover:text-purple-600 transition">
                    How It Works
                  </Link>
                </div>
                <div className="flex items-center gap-8 mt-10 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🪙</span>
                    <span>Earn coins on trials</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    <span>Weekly missions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🏆</span>
                    <span>Leaderboards</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-purple-100 to-orange-100 rounded-3xl p-8">
                  <div className="bg-white rounded-2xl shadow-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                        💆
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Full Spa Massage</p>
                        <p className="text-sm text-gray-500">Serenity Spa • 1.2km</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">⭐</span>
                      <span className="font-semibold">4.8</span>
                      <span className="text-gray-400">(124 reviews)</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-3xl font-bold text-purple-600">80 🪙</span>
                      <span className="text-gray-400 line-through">₹599</span>
                    </div>
                    <button className="w-full bg-nileBlue text-white py-3 rounded-xl font-semibold">
                      Book for ₹49
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                How ReZ Try Works
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Three simple steps to discover your next favorite place
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: '1', emoji: '🔍', title: 'Discover', desc: 'Browse trials near you by category, price, or rating. Find your perfect experience.' },
                { step: '2', emoji: '📅', title: 'Book', desc: 'Pay a small refundable commitment fee. Get your QR code instantly.' },
                { step: '3', emoji: '🎁', title: 'Earn', desc: 'Visit, enjoy, and earn coins. Use coins for more trials.' },
              ].map((item) => (
                <div key={item.step} className="bg-white rounded-2xl p-8 text-center shadow-sm">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                    {item.emoji}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Explore Categories</h2>
              <p className="text-gray-600">From beauty to food, find trials in every category</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { emoji: '💅', name: 'Beauty' },
                { emoji: '☕', name: 'Food' },
                { emoji: '💪', name: 'Fitness' },
                { emoji: '💆', name: 'Wellness' },
                { emoji: '🏠', name: 'Home' },
                { emoji: '🎨', name: 'Art' },
              ].map((cat) => (
                <div key={cat.name} className="bg-gray-50 rounded-xl p-4 text-center hover:bg-purple-50 transition cursor-pointer">
                  <div className="text-4xl mb-2">{cat.emoji}</div>
                  <p className="font-medium text-gray-900">{cat.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-r from-purple-600 to-purple-800 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to Explore?</h2>
            <p className="text-xl text-purple-200 mb-8">Join thousands of explorers discovering new experiences every day</p>
            <Link href="/login" className="inline-block bg-white text-purple-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-purple-50 transition">
              Get Started Free
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Rz</span>
                </div>
                <span className="font-bold">ReZ Try</span>
              </div>
              <p className="text-gray-500 text-sm">© 2024 ReZ Try. Part of the ReZ Ecosystem.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
