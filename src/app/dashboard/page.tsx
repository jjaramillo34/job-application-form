'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { decryptData } from '../lib/encryption';
import { Gift } from 'lucide-react';

interface Application {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
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
  status: 'pending' | 'approved' | 'rejected' | 'accepted';
  submittedAt: string;
}

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: (password: string) => void;
}

interface CouponAssignment {
  _id: string;
  coupon_code: string;
  assigned_to: string;
  assigned_at: string;
  status: 'available' | 'assigned' | 'used';
  student?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface AvailableCoupon {
  _id: string;
  coupon_code: string;
  status: 'available' | 'assigned' | 'used';
}

function DownloadModal({ isOpen, onClose, onDownload }: DownloadModalProps) {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-xl">
        <h3 className="text-lg font-semibold mb-4">Enter Password to Download</h3>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded mb-4"
          placeholder="Enter password"
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onDownload(password)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [assignedCoupons, setAssignedCoupons] = useState<CouponAssignment[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedCoupon, setSelectedCoupon] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchApplications();
    fetchAssignedCoupons();
    fetchAvailableCoupons();
  }, [currentPage]);

  const fetchApplications = async () => {
    try {
      const response = await fetch(`/api/applications?page=${currentPage}&limit=${itemsPerPage}`);
      if (!response.ok) throw new Error('Failed to fetch applications');
      const data = await response.json();
      setApplications(data.applications);
      setTotalPages(Math.ceil(data.total / itemsPerPage));
    } catch (err) {
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedCoupons = async () => {
    try {
      const response = await fetch('/api/coupons');
      if (!response.ok) throw new Error('Failed to fetch coupons');
      const data = await response.json();
      
      // Get all assigned coupons
      const assignedCoupons = data.filter((c: CouponAssignment) => c.status === 'assigned');
      
      // Fetch student details for each assigned coupon
      const couponsWithStudents = await Promise.all(
        assignedCoupons.map(async (coupon: CouponAssignment) => {
          if (coupon.assigned_to) {
            const studentResponse = await fetch(`/api/applications/${coupon.assigned_to}`);
            if (studentResponse.ok) {
              const studentData = await studentResponse.json();
              return {
                ...coupon,
                student: {
                  firstName: studentData.firstName,
                  lastName: studentData.lastName,
                  email: studentData.email
                }
              };
            }
          }
          return coupon;
        })
      );
      
      setAssignedCoupons(couponsWithStudents);
    } catch (err) {
      console.error('Error fetching assigned coupons:', err);
    }
  };

  const fetchAvailableCoupons = async () => {
    try {
      const response = await fetch('/api/coupons');
      if (!response.ok) throw new Error('Failed to fetch coupons');
      const data = await response.json();
      setAvailableCoupons(data.filter((c: AvailableCoupon) => c.status === 'available'));
    } catch (err) {
      console.error('Error fetching available coupons:', err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      
      setApplications(applications.map(app => 
        app._id === id ? { ...app, status: newStatus } : app
      ));
    } catch (err) {
      setError('Failed to update application status');
    }
  };

  const handleUnassignCoupon = async (couponId: string, studentId: string) => {
    try {
      const response = await fetch('/api/coupons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          couponId
        })
      });

      if (!response.ok) throw new Error('Failed to unassign coupon');
      
      await fetchAssignedCoupons();
      await fetchAvailableCoupons();
    } catch (err) {
      setError('Failed to unassign coupon');
    }
  };

  const handleDownload = async (password: string) => {
    try {
      const response = await fetch('/api/applications/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) throw new Error('Invalid password or download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `applications-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setIsDownloadModalOpen(false);
    } catch (err) {
      setError('Failed to download applications');
    }
  };

  const handleAssignCoupon = async () => {
    if (!selectedStudent || !selectedCoupon) return;

    try {
      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent,
          couponId: selectedCoupon
        })
      });

      if (!response.ok) throw new Error('Failed to assign coupon');
      
      await fetchAssignedCoupons();
      await fetchAvailableCoupons();
      setIsAssignModalOpen(false);
      setSelectedStudent('');
      setSelectedCoupon('');
    } catch (err) {
      setError('Failed to assign coupon');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Applications Dashboard</h1>
        <button
          onClick={() => setIsDownloadModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Download All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
              <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
              <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
              <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Locations</th>
              <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verification</th>
              <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
              <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {applications.map((app) => {
              const workPreferences = app.workPreferences || {
                bronx: false,
                brooklyn: false,
                queens: false,
                statenIsland: false,
                manhattan: false,
                morning: false,
                afternoon: false,
                evening: false,
                weekend: false
              };

              const selectedLocations = Object.entries(workPreferences)
                .filter(([key, value]) => ['bronx', 'brooklyn', 'queens', 'statenIsland', 'manhattan'].includes(key) && value)
                .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1))
                .join(', ') || 'None selected';

              return (
                <tr key={app._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{app.firstName} {app.lastName}</div>
                    <div className="text-sm text-gray-500">{app.email}</div>
                    <div className="text-sm text-gray-500">{app.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.program}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.site}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.geographicDistrict}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{selectedLocations}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      <div className={`inline-block px-2 py-1 rounded text-xs ${app.fingerprintQuestionnaire ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        Fingerprint
                      </div>
                      <div className={`inline-block px-2 py-1 rounded text-xs ${app.documentsVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        Documents
                      </div>
                      <div className={`inline-block px-2 py-1 rounded text-xs ${app.attendanceVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        Attendance
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      (app.status || 'pending') === 'approved' ? 'bg-green-100 text-green-800' :
                      (app.status || 'pending') === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {(app.status || 'pending').charAt(0).toUpperCase() + (app.status || 'pending').slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(app.submittedAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/dashboard/${app._id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      {app.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(app._id, 'approved')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusChange(app._id, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-700">
          Showing page {currentPage} of {totalPages}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        onDownload={handleDownload}
      />

      {/* Coupon Assignments Section */}
      <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Gift className="h-6 w-6 text-red-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Coupon Management</h2>
            </div>
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Assign New Coupon
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coupon Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignedCoupons.map((assignment) => (
                <tr key={assignment._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg font-bold text-red-600">
                      {assignment.coupon_code}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {assignment.student ? `${assignment.student.firstName} ${assignment.student.lastName}` : 'Loading...'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {assignment.student?.email || 'Loading...'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(assignment.assigned_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleUnassignCoupon(assignment._id, assignment.assigned_to)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Unassign
                    </button>
                  </td>
                </tr>
              ))}
              {assignedCoupons.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No coupon assignments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AssignCouponModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedStudent('');
          setSelectedCoupon('');
        }}
        onAssign={handleAssignCoupon}
        availableCoupons={availableCoupons}
        applications={applications}
        selectedStudent={selectedStudent}
        setSelectedStudent={setSelectedStudent}
        selectedCoupon={selectedCoupon}
        setSelectedCoupon={setSelectedCoupon}
        assignedCoupons={assignedCoupons}
      />
    </div>
  );
}

function AssignCouponModal({ 
  isOpen, 
  onClose, 
  onAssign, 
  availableCoupons,
  applications,
  selectedStudent,
  setSelectedStudent,
  selectedCoupon,
  setSelectedCoupon,
  assignedCoupons
}: {
  isOpen: boolean;
  onClose: () => void;
  onAssign: () => void;
  availableCoupons: AvailableCoupon[];
  applications: Application[];
  selectedStudent: string;
  setSelectedStudent: (id: string) => void;
  selectedCoupon: string;
  setSelectedCoupon: (id: string) => void;
  assignedCoupons: CouponAssignment[];
}) {
  if (!isOpen) return null;

  // Get list of student IDs who already have coupons assigned
  const studentsWithCoupons = assignedCoupons.map(coupon => coupon.assigned_to);

  // Filter applications to only show accepted students without coupons
  const availableStudents = applications.filter(app => 
    app.status === 'accepted' && !studentsWithCoupons.includes(app._id)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Assign Coupon</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Student
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select a student</option>
              {availableStudents.map(app => (
                <option key={app._id} value={app._id}>
                  {app.firstName} {app.lastName} ({app.email})
                </option>
              ))}
            </select>
            {availableStudents.length === 0 && (
              <p className="mt-2 text-sm text-gray-500">
                No available students found. All accepted students have been assigned coupons.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Coupon
            </label>
            <select
              value={selectedCoupon}
              onChange={(e) => setSelectedCoupon(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select a coupon</option>
              {availableCoupons.map(coupon => (
                <option key={coupon._id} value={coupon._id}>
                  {coupon.coupon_code}
                </option>
              ))}
            </select>
            {availableCoupons.length === 0 && (
              <p className="mt-2 text-sm text-gray-500">
                No available coupons found.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={onAssign}
            disabled={!selectedStudent || !selectedCoupon}
            className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
              (!selectedStudent || !selectedCoupon) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}