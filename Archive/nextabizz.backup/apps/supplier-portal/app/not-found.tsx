import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          {/* 404 Illustration */}
          <div className="w-32 h-32 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl font-bold text-purple-600">404</span>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Page Not Found
          </h2>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          {/* Navigation Links */}
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="block w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/"
              className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Back to Home
            </Link>
          </div>

          {/* Help Text */}
          <p className="mt-6 text-sm text-gray-500">
            If you think this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
