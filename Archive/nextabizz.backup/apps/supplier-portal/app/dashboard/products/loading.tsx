'use client';

export default function ProductsLoading() {
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
        {/* Title & Button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-48 h-4 bg-gray-200 rounded mt-2 animate-pulse"></div>
          </div>
          <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-64 h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex space-x-4">
              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <div key={i} className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 flex items-center space-x-4">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-10 h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex-1 w-48 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
            <div className="w-48 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
