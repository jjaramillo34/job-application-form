import Link from 'next/link';
import { CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/solid';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center bg-white/80 rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center">
          <CheckCircleIcon className="h-20 w-20 text-green-500 animate-bounce mb-4" />
          <h2 className="mt-2 text-3xl font-extrabold text-green-700">Application Submitted!</h2>
          <p className="mt-2 text-base text-gray-700">
            Thank you for applying to <span className="font-semibold text-blue-700">NYC District 79 Alternative Schools</span> programs.<br />
            We will review your application and contact you soon.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            If you have questions, please contact us at <a href="mailto:jjaramillo7@schools.nyc.gov" className="text-blue-600 underline">jjaramillo7@schools.nyc.gov</a>.
          </p>
        </div>
        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-semibold rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow"
          >
            <span>Return to Home</span>
            <ArrowRightIcon className="h-5 w-5 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
} 