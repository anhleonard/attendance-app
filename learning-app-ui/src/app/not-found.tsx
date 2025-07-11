import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-200">404</h1>
          <div className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</div>
          <p className="text-gray-600 mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        </div>

        <div className="space-y-4">
          <Link
            href="/auth/login"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Back to Login
          </Link>

          <div className="text-sm text-gray-500">Or try using the navigation menu above</div>
        </div>

        {/* Helpful links relevant to the learning app */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">You might be looking for:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/auth/register" className="text-blue-600 hover:text-blue-800 text-sm underline">
              Register
            </Link>
            <Link href="/classes" className="text-blue-600 hover:text-blue-800 text-sm underline">
              Classes
            </Link>
            <Link href="/students" className="text-blue-600 hover:text-blue-800 text-sm underline">
              Students
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
