import Link from 'next/link';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Application Submitted Successfully!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Thank you for applying to NYC District 79 Alternative Schools programs. We will review your application and contact you soon.
          </p>
        </div>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 