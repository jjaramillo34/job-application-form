'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { format } from 'date-fns';
import { decryptData } from '@/app/lib/encryption';
import { formatDate } from '@/app/lib/utils';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';

interface Application {
  _id: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  counselor_email: string;
  ssn: string;
  dateOfBirth: string;
  program: string;
  site: string;
  lcgmsCode: string;
  geographicDistrict: string;
  workPreferences: {
    bronx: boolean;
    brooklyn: boolean;
    queens: boolean;
    statenIsland: boolean;
    manhattan: boolean;
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
    weekend: boolean;
  };
  fingerprintQuestionnaire: boolean;
  documentsVerified: boolean;
  attendanceVerified: boolean;
  fingerprintPaymentPreference: 'yes' | 'no' | 'pending';
  submittedAt: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  coupon?: {
    _id: string;
    coupon_code: string;
    assigned_at: string;
  };
  createdAt: string;
}

export default function ApplicationDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [coupon, setCoupon] = useState<Application['coupon'] | null>(null);

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      const response = await fetch(`/api/applications/${id}`);
      if (!response.ok) throw new Error('Failed to fetch application');
      const data = await response.json();
      setApplication(data);

      // Fetch coupon information
      const couponResponse = await fetch('/api/coupons');
      if (couponResponse.ok) {
        const coupons = await couponResponse.json();
        const studentCoupon = coupons.find((c: any) => c.assigned_to === id);
        setCoupon(studentCoupon || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  

  const handleStatusChange = async (newStatus: Application['status']) => {
    try {
      setIsUpdating(true);
      setUpdateError(null);
      
      const response = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update status');
      }
      
      setApplication(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Failed to update status');
      // Revert the select value to the previous status
      if (application) {
        const select = document.querySelector('select') as HTMLSelectElement;
        if (select) {
          select.value = application.status;
        }
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEdit = () => {
    router.push(`/edit/${params.id}`);
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  if (!application) return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">Application not found</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const workPreferences = application.workPreferences || {
    bronx: false,
    brooklyn: false,
    queens: false,
    statenIsland: false,
    manhattan: false,
    morning: false,
    afternoon: false,
    evening: false,
    weekend: false,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-2">
          <Link href="/dashboard" className="text-sm text-gray-500 flex items-center space-x-2">
            <ArrowLeftIcon className="w-4 h-4" />
            <span className="text-sm text-gray-500">Back to Dashboard</span>
          </Link>
        </div>
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Application Details
          </h3>
          <Link
            href={`/edit/${id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Edit Application
          </Link>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-sm text-gray-500">Submitted on {formatDate(application.submittedAt)}</p>
          </div>
          <div className="flex space-x-4">
            <select
              value={application.status}
              onChange={(e) => handleStatusChange(e.target.value as Application['status'])}
              disabled={isUpdating}
              className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${getStatusColor(application.status)} ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
            {isUpdating && (
              <div className="ml-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
            {updateError && (
              <div className="absolute top-0 right-0 mt-2 mr-2">
                <div className="bg-red-50 border-l-4 border-red-400 p-2">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-2">
                      <p className="text-xs text-red-700">{updateError}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Coupon Information</h2>
                {coupon ? (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-red-600">{coupon.coupon_code}</span>
                      <span className="text-sm text-gray-500">
                        Assigned on {format(new Date(coupon.assigned_at), 'MMMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-500">No coupon assigned</p>
                )}
              </div>
              {application.status === 'accepted' && !coupon && (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Assign Coupon
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 space-y-8">
            {/* Personal Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Full Name</label>
                  <p className="mt-1 text-sm text-gray-900">{application.firstName} {application.lastName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">SSN</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {application.ssn ? decryptData(application.ssn) : 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Date of Birth</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(application.dateOfBirth)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{application.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Counselor Email</label>
                  <p className="mt-1 text-sm text-gray-900">{application.counselor_email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{application.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Address</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {application.address}<br />
                    {application.city}, {application.state} {application.zipCode}
                  </p>
                </div>
              </div>
            </div>

            {/* Program Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Program Information</h2>
              <span className="text-green-500 text-sm mb-4">D79 District Office only</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Program</label>
                  <p className="mt-1 text-sm text-gray-900">{application.program}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Site</label>
                  <p className="mt-1 text-sm text-gray-900">{application.site}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">LCGMS Code</label>
                  <p className="mt-1 text-sm text-gray-900">{application.lcgmsCode}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Geographic District</label>
                  <p className="mt-1 text-sm text-gray-900">{application.geographicDistrict}</p>
                </div>
              </div>
            </div>

            {/* Work Preferences */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Work Preferences</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Preferred Locations</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(workPreferences)
                      .filter(([key, value]) => value && ['bronx', 'brooklyn', 'queens', 'statenIsland', 'manhattan'].includes(key))
                      .map(([key]) => (
                        <span key={key} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </span>
                      ))}
                    {!Object.entries(workPreferences).some(([key, value]) => value && ['bronx', 'brooklyn', 'queens', 'statenIsland', 'manhattan'].includes(key)) && (
                      <span className="text-sm text-gray-500">None selected</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Preferred Times</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(workPreferences)
                      .filter(([key, value]) => value && ['morning', 'afternoon', 'evening', 'weekend'].includes(key))
                      .map(([key]) => (
                        <span key={key} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </span>
                      ))}
                    {!Object.entries(workPreferences).some(([key, value]) => value && ['morning', 'afternoon', 'evening', 'weekend'].includes(key)) && (
                      <span className="text-sm text-gray-500">None selected</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Status */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Verification Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg ${application.fingerprintQuestionnaire ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-5 w-5 ${application.fingerprintQuestionnaire ? 'text-green-400' : 'text-red-400'}`}>
                      {application.fingerprintQuestionnaire ? (
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">Fingerprint Questionnaire</h3>
                      <p className="text-sm text-gray-500">{application.fingerprintQuestionnaire ? 'Completed' : 'Not Completed'}</p>
                    </div>
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${application.documentsVerified ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-5 w-5 ${application.documentsVerified ? 'text-green-400' : 'text-red-400'}`}>
                      {application.documentsVerified ? (
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">Documents</h3>
                      <p className="text-sm text-gray-500">{application.documentsVerified ? 'Verified' : 'Not Verified'}</p>
                    </div>
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${application.attendanceVerified ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-5 w-5 ${application.attendanceVerified ? 'text-green-400' : 'text-red-400'}`}>
                      {application.attendanceVerified ? (
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">Attendance</h3>
                      <p className="text-sm text-gray-500">{application.attendanceVerified ? 'Verified' : 'Not Verified'}</p>
                    </div>
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${
                  application.fingerprintPaymentPreference === 'yes' ? 'bg-green-50' : 
                  application.fingerprintPaymentPreference === 'no' ? 'bg-red-50' : 
                  'bg-yellow-50'
                }`}>
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-5 w-5 ${
                      application.fingerprintPaymentPreference === 'yes' ? 'text-green-400' : 
                      application.fingerprintPaymentPreference === 'no' ? 'text-red-400' : 
                      'text-yellow-400'
                    }`}>
                      {application.fingerprintPaymentPreference === 'yes' ? (
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : application.fingerprintPaymentPreference === 'no' ? (
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">Fingerprint Payment</h3>
                      <p className="text-sm text-gray-500">
                        {application.fingerprintPaymentPreference === 'yes' ? 'Willing to Pay' :
                         application.fingerprintPaymentPreference === 'no' ? 'Not Willing to Pay' :
                         'Pending Decision'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 