'use client';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
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
        {/* Title Skeleton */}
        <div className="mb-8">
          <div className="w-48 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-64 h-4 bg-gray-200 rounded mt-2 animate-pulse"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex justify-between items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="w-12 h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="mt-4">
                <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-24 h-4 bg-gray-200 rounded mt-2 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions Skeleton */}
        <div className="mb-8">
          <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto animate-pulse"></div>
                <div className="w-24 h-4 bg-gray-200 rounded mt-3 mx-auto animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 flex items-center space-x-4">
                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
