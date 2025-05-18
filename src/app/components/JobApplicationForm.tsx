'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';

interface FormData {
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
}

export default function JobApplicationForm() {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSSN, setShowSSN] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: 'NY',
    zipCode: '',
    phone: '',
    email: '',
    counselor_email: '',
    ssn: '',
    dateOfBirth: '',
    program: '',
    site: '',
    lcgmsCode: '',
    geographicDistrict: '',
    workPreferences: {
      bronx: false,
      brooklyn: false,
      queens: false,
      statenIsland: false,
      manhattan: false,
      morning: false,
      afternoon: false,
      evening: false,
      weekend: false,
    },
    fingerprintQuestionnaire: false,
    documentsVerified: false,
    attendanceVerified: false,
    fingerprintPaymentPreference: 'pending',
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const validateSSN = (ssn: string): boolean => {
    const cleanSSN = ssn.replace(/\D/g, '');
    if (cleanSSN.length !== 9) return false;
    const groups = [
      cleanSSN.substring(0, 3),
      cleanSSN.substring(3, 5),
      cleanSSN.substring(5, 9)
    ];
    if (groups.some(group => parseInt(group) === 0)) return false;
    const firstGroup = parseInt(groups[0]);
    if (firstGroup === 666 || (firstGroup >= 900 && firstGroup <= 999)) return false;
    return true;
  };

  const handleSSNChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    let formattedValue = '';
    if (value.length > 0) {
      formattedValue = value.substring(0, 3);
      if (value.length > 3) {
        formattedValue += '-' + value.substring(3, 5);
      }
      if (value.length > 5) {
        formattedValue += '-' + value.substring(5, 9);
      }
    }
    setFormData(prev => ({
      ...prev,
      ssn: formattedValue
    }));
  };

  const handleWorkPreferenceChange = (preference: keyof FormData['workPreferences']) => {
    setFormData(prev => ({
      ...prev,
      workPreferences: {
        ...prev.workPreferences,
        [preference]: !prev.workPreferences[preference]
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSSN(formData.ssn)) {
      setError('Please enter a valid SSN');
      return;
    }
    if (!formData.fingerprintQuestionnaire || !formData.documentsVerified || !formData.attendanceVerified) {
      setError('Please verify all required checks before submitting');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/submit-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      router.push('/success');
    } catch (err) {
      setError('Failed to submit application. Please try again.');
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Job Application Form</h1>
      {isClient ? (
        <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">Important Directions</h2>
            <p className="text-blue-700 mb-2">Please fill this out for each student. Before submitting names, please be sure you have:</p>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              <li>Reviewed the Fingerprint Questionnaire with them</li>
              <li>Seen their personal documents in person (to be sure they have them and you will upload them)</li>
              <li>Reviewed their attendance to ensure they are regularly attending</li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Program Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="program" className="block text-sm font-medium text-gray-700 mb-1">
                  Program *
                </label>
                <input
                  type="text"
                  id="program"
                  name="program"
                  value={formData.program}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="site" className="block text-sm font-medium text-gray-700 mb-1">
                  Site *
                </label>
                <input
                  type="text"
                  id="site"
                  name="site"
                  value={formData.site}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="lcgmsCode" className="block text-sm font-medium text-gray-700 mb-1">
                  LCGMS Code *
                </label>
                <input
                  type="text"
                  id="lcgmsCode"
                  name="lcgmsCode"
                  value={formData.lcgmsCode}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="geographicDistrict" className="block text-sm font-medium text-gray-700 mb-1">
                  Geographic District *
                </label>
                <input
                  type="text"
                  id="geographicDistrict"
                  name="geographicDistrict"
                  value={formData.geographicDistrict}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mt-8">Student Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="ssn" className="block text-sm font-medium text-gray-700 mb-1">
                  Social Security Number *
                </label>
                <div className="relative">
                  <input
                    type={showSSN ? "text" : "password"}
                    id="ssn"
                    name="ssn"
                    value={formData.ssn}
                    onChange={handleSSNChange}
                    required
                    pattern="\d{3}-\d{2}-\d{4}"
                    placeholder="XXX-XX-XXXX"
                    maxLength={11}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSSN(!showSSN)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showSSN ? "Hide" : "Show"}
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Format: XXX-XX-XXXX
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{5}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{10}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="counselor_email" className="block text-sm font-medium text-gray-700 mb-1">
                Counselor Email Address *
              </label>
              <input
                type="email"
                id="counselor_email"
                name="counselor_email"
                value={formData.counselor_email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mt-8">Work Preferences</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.workPreferences.bronx}
                    onChange={() => handleWorkPreferenceChange('bronx')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Bronx</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.workPreferences.brooklyn}
                    onChange={() => handleWorkPreferenceChange('brooklyn')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Brooklyn</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.workPreferences.queens}
                    onChange={() => handleWorkPreferenceChange('queens')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Queens</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.workPreferences.statenIsland}
                    onChange={() => handleWorkPreferenceChange('statenIsland')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Staten Island</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.workPreferences.manhattan}
                    onChange={() => handleWorkPreferenceChange('manhattan')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Manhattan</span>
                </label>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.workPreferences.morning}
                    onChange={() => handleWorkPreferenceChange('morning')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Morning</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.workPreferences.afternoon}
                    onChange={() => handleWorkPreferenceChange('afternoon')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Afternoon</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.workPreferences.evening}
                    onChange={() => handleWorkPreferenceChange('evening')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Evening</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.workPreferences.weekend}
                    onChange={() => handleWorkPreferenceChange('weekend')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Weekend</span>
                </label>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mt-8">Verification Checklist</h2>
            <div className="space-y-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.fingerprintQuestionnaire}
                  onChange={(e) => setFormData(prev => ({ ...prev, fingerprintQuestionnaire: e.target.checked }))}
                  required
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>I have reviewed the Fingerprint Questionnaire with the student</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.documentsVerified}
                  onChange={(e) => setFormData(prev => ({ ...prev, documentsVerified: e.target.checked }))}
                  required
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>I have verified the student's personal documents in person</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.attendanceVerified}
                  onChange={(e) => setFormData(prev => ({ ...prev, attendanceVerified: e.target.checked }))}
                  required
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>I have reviewed and confirmed the student's regular attendance</span>
              </label>
            </div>

            {/* Fingerprint Payment Preference */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Fingerprint Payment</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Would you like to pay for fingerprints?
                  </label>
                  <select
                    name="fingerprintPaymentPreference"
                    value={formData.fingerprintPaymentPreference}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="pending">Select an option</option>
                    <option value="yes">Yes, I am willing to pay</option>
                    <option value="no">No, I am not willing to pay</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Please indicate your preference for fingerprint payment. This information will be used to process your application.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      ) : (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-8"></div>
          <div className="space-y-6">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      )}
    </div>
  );
} 