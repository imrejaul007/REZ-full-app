'use client';

export default function PerformanceLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </header>

      {/* Navigation Skeleton */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="py-4 w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content Skeleton */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title & Buttons */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="w-48 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-64 h-4 bg-gray-200 rounded mt-2 animate-pulse"></div>
          </div>
          <div className="flex space-x-3">
            <div className="w-24 h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-24 h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Score Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-8">
            <div className="flex items-center space-x-6">
              <div className="w-32 h-32 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-3">
                <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-48 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="w-32 h-20 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Metrics & Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-40 h-6 bg-gray-200 rounded animate-pulse mb-6"></div>
            <div className="space-y-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-6"></div>
            <div className="h-64 flex items-end justify-between space-x-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex-1 bg-gray-200 rounded-t animate-pulse" style={{ height: `${Math.random() * 60 + 40}%` }}></div>
              ))}
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="w-48 h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
