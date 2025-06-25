export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="bg-white shadow-lg rounded-lg p-8 md:p-12">
            {/* Warning Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Application Form Closed
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-6">
              The D79 Job Application Form has been closed as of today.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-blue-800 mb-3">
                Important Information
              </h2>
              <ul className="text-blue-700 space-y-2 text-left">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  Applications are no longer being accepted through this form
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  All submitted applications are being processed
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  Applicants will be contacted regarding their application status
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  For questions about existing applications, please contact your counselor
                </li>
              </ul>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-md font-semibold text-gray-800 mb-2">
                Contact Information
              </h3>
              <p className="text-gray-600">
                If you have any questions about the application process or your submitted application, 
                please contact your school counselor or email{' '}
                <a 
                  href="mailto:jjaramillo7@schools.nyc.gov" 
                  className="text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  Javier Jaramillo
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
