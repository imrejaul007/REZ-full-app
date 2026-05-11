'use client';

export default function OrdersLoading() {
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
        {/* Title */}
        <div className="mb-8">
          <div className="w-48 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-64 h-4 bg-gray-200 rounded mt-2 animate-pulse"></div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="py-4 px-6 flex items-center">
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-6 h-4 bg-gray-200 rounded ml-2 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-20 h-5 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="w-20 h-5 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="w-40 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
