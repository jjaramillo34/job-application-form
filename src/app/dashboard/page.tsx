'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { decryptData } from '../lib/encryption';
import { Gift, BarChart2, Download, X } from 'lucide-react';

interface Application {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  counselor_email: string;
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
  fingerprintPaymentPreference: 'yes' | 'no' | 'pending';
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

// Add Notification interface
interface Notification {
  type: 'success' | 'error';
  message: string;
  id: number;
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
  const itemsPerPage = 30;
  const [sortBy, setSortBy] = useState<'payment' | 'status' | 'submittedAt' | 'counselorEmail' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterPayment, setFilterPayment] = useState<'all' | 'yes' | 'no' | 'pending'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'accepted'>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [searchName, setSearchName] = useState<string>('');
  const [searchCounselorEmail, setSearchCounselorEmail] = useState<string>('');
  const dateFromRef = useRef<HTMLInputElement>(null);
  const dateToRef = useRef<HTMLInputElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);

  useEffect(() => {
    fetchApplications();
    fetchAssignedCoupons();
    fetchAvailableCoupons();
    
  }, [currentPage, searchName, searchCounselorEmail, filterPayment, filterStatus, filterDateFrom, filterDateTo, sortBy, sortOrder]);

  const fetchApplications = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        searchName: searchName,
        searchCounselorEmail: searchCounselorEmail,
        filterPayment: filterPayment,
        filterStatus: filterStatus,
        filterDateFrom: filterDateFrom,
        filterDateTo: filterDateTo,
        sortBy: sortBy || '',
        sortOrder: sortOrder
      });

      const response = await fetch(`/api/applications?${queryParams.toString()}`);
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

  // Add notification function
  const showNotification = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { type, message, id }]);
    
    // Clear previous timeout
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    
    // Auto remove notification after 5 seconds
    notificationTimeoutRef.current = setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
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
      
      const data = await response.json();
      await fetchAssignedCoupons();
      await fetchAvailableCoupons();
      setIsAssignModalOpen(false);
      setSelectedStudent('');
      setSelectedCoupon('');
      
      // Show success notification with coupon code
      const assignedCoupon = availableCoupons.find(c => c._id === selectedCoupon);
      if (assignedCoupon) {
        showNotification('success', `Coupon ${assignedCoupon.coupon_code} assigned successfully!`);
      }
    } catch (err) {
      showNotification('error', 'Failed to assign coupon. Please try again.');
    }
  };

  // Remove the local filtering logic since it's now handled by the API
  let filteredApplications = applications;

  // Add a function to get coupon code for a student
  const getStudentCouponCode = (studentId: string) => {
    const assignment = assignedCoupons.find(c => c.assigned_to === studentId);
    return assignment?.coupon_code || '-';
  };

  // Add new function for bulk status update
  const handleBulkStatusUpdate = async (newStatus: 'approved' | 'rejected' | 'accepted') => {
    try {
      const response = await fetch('/api/applications/bulk-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationIds: selectedApplications,
          status: newStatus
        }),
      });

      if (!response.ok) throw new Error('Failed to update statuses');
      
      // Update local state
      setApplications(applications.map(app => 
        selectedApplications.includes(app._id) ? { ...app, status: newStatus } : app
      ));
      
      // Clear selection
      setSelectedApplications([]);
      showNotification('success', `Successfully updated ${selectedApplications.length} applications`);
    } catch (err) {
      showNotification('error', 'Failed to update application statuses');
    }
  };

  // Add function to handle selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedApplications(applications.map(app => app._id));
    } else {
      setSelectedApplications([]);
    }
  };

  const handleSelectApplication = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedApplications([...selectedApplications, id]);
    } else {
      setSelectedApplications(selectedApplications.filter(appId => appId !== id));
    }
  };

  const handleBulkCouponAssignment = async () => {
    try {
      // Get students without coupons
      const studentsWithoutCoupons = applications.filter(app => 
        app.status === 'accepted' && !assignedCoupons.find(c => c.assigned_to === app._id)
      );

      if (studentsWithoutCoupons.length === 0) {
        showNotification('error', 'No students available for coupon assignment');
        return;
      }

      if (availableCoupons.length === 0) {
        showNotification('error', 'No available coupons to assign');
        return;
      }

      // Shuffle available coupons
      const shuffledCoupons = [...availableCoupons].sort(() => Math.random() - 0.5);
      
      // Assign coupons to students
      const assignments = studentsWithoutCoupons.slice(0, Math.min(studentsWithoutCoupons.length, shuffledCoupons.length))
        .map((student, index) => ({
          studentId: student._id,
          couponId: shuffledCoupons[index]._id
        }));

      // Make bulk assignment request
      const response = await fetch('/api/coupons/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments })
      });

      if (!response.ok) throw new Error('Failed to assign coupons');
      
      await fetchAssignedCoupons();
      await fetchAvailableCoupons();
      
      showNotification('success', `Successfully assigned ${assignments.length} coupons`);
    } catch (err) {
      showNotification('error', 'Failed to assign coupons. Please try again.');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto px-2 py-16 max-w-[1920px]">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg flex items-center justify-between ${
              notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white min-w-[300px]`}
          >
            <span>{notification.message}</span>
            <button
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
              className="ml-4 hover:opacity-75"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart2 className="h-7 w-7 text-blue-600" />
          Applications Dashboard
        </h1>
        <div className="flex gap-3">
          {selectedApplications.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setIsBulkActionOpen(!isBulkActionOpen)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow"
              >
                Bulk Actions ({selectedApplications.length})
              </button>
              {isBulkActionOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        handleBulkStatusUpdate('approved');
                        setIsBulkActionOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Approve Selected
                    </button>
                    <button
                      onClick={() => {
                        handleBulkStatusUpdate('accepted');
                        setIsBulkActionOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Accept Selected
                    </button>
                    <button
                      onClick={() => {
                        handleBulkStatusUpdate('rejected');
                        setIsBulkActionOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Reject Selected
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <button
            onClick={handleBulkCouponAssignment}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors shadow"
          >
            <Gift className="h-5 w-5" />
            Auto-Assign Coupons
          </button>
          <button
            onClick={() => router.push('/dashboard/analytics')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors shadow"
          >
            <BarChart2 className="h-5 w-5" />
            Analytics
          </button>
          <button
            onClick={() => setIsDownloadModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow"
          >
            <Download className="h-5 w-5" />
            Download All
          </button>
        </div>
      </div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Search Name</label>
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Search by name..."
            className="border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Search Counselor Email</label>
          <input
            type="text"
            value={searchCounselorEmail}
            onChange={(e) => setSearchCounselorEmail(e.target.value)}
            placeholder="Search by counselor email..."
            className="border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Payment</label>
          <select
            value={filterPayment}
            onChange={e => setFilterPayment(e.target.value as any)}
            className="border rounded px-2 py-1"
          >
            <option value="all">All</option>
            <option value="yes">Willing to Pay</option>
            <option value="no">Not Willing</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className="border rounded px-2 py-1"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="accepted">Accepted</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Submitted Date From</label>
          <input
            type="date"
            ref={dateFromRef}
            value={filterDateFrom}
            onChange={e => setFilterDateFrom(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Submitted Date To</label>
          <input
            type="date"
            ref={dateToRef}
            value={filterDateTo}
            onChange={e => setFilterDateTo(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <button
          className="ml-2 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-xs"
          onClick={() => {
            setFilterPayment('all');
            setFilterStatus('all');
            setFilterDateFrom('');
            setFilterDateTo('');
            setSearchCounselorEmail('');
            if (dateFromRef.current) dateFromRef.current.value = '';
            if (dateToRef.current) dateToRef.current.value = '';
          }}
        >
          Clear Filters
        </button>
      </div>
      <div className="flex justify-center w-full">
        <div className="w-full overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedApplications.length === applications.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                <th
                  className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => {
                    setSortBy('counselorEmail');
                    setSortOrder(sortBy === 'counselorEmail' && sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  Counselor Email
                  {sortBy === 'counselorEmail' && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
                </th>
                <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Locations</th>
                <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th
                  className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => {
                    setSortBy('status');
                    setSortOrder(sortBy === 'status' && sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  Status
                  {sortBy === 'status' && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
                </th>
                <th
                  className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => {
                    setSortBy('submittedAt');
                    setSortOrder(sortBy === 'submittedAt' && sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  Submitted
                  {sortBy === 'submittedAt' && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
                </th>
                <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coupon Code</th>
                <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredApplications.map((app) => {
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

                return (
                  <tr key={app._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedApplications.includes(app._id)}
                        onChange={(e) => handleSelectApplication(app._id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{app.firstName} {app.lastName}</div>
                      <div className="text-sm text-green-500">
                        
                        <span className="text-xs text-green-500 font-small">{app.email.toLowerCase()}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        
                        <span className="text-xs text-green-500 font-small">({app.phone.slice(0, 3)}) {app.phone.slice(3, 6)}-{app.phone.slice(6)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      <div className="text-xs text-green-500 font-small">{app.program}</div>
                      <div className="text-xs text-green-500 font-small">{app.site}</div>
                      <div className="text-xs text-green-500 font-small">{app.geographicDistrict}</div>
                      <div className="text-xs text-green-500 font-small">{app.lcgmsCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">{app.counselor_email.toLowerCase()}</td>
                    <td className='px-6 py-4 whitespace-nowrap text-xs text-gray-500'>
                      <div className="text-xs text-green-500 font-small">{app.workPreferences.bronx ? 'Bronx' : ''}</div>
                      <div className="text-xs text-green-500 font-small">{app.workPreferences.brooklyn ? 'Brooklyn' : ''}</div>
                      <div className="text-xs text-green-500 font-small">{app.workPreferences.queens ? 'Queens' : ''}</div>
                      <div className="text-xs text-green-500 font-small">{app.workPreferences.statenIsland ? 'Staten Island' : ''}</div>
                      <div className="text-xs text-green-500 font-small">{app.workPreferences.manhattan ? 'Manhattan' : ''}</div>
                      <div className="text-xs text-green-500 font-small">{app.workPreferences.morning ? 'Morning' : ''}</div>
                      <div className="text-xs text-green-500 font-small">{app.workPreferences.afternoon ? 'Afternoon' : ''}</div>
                      <div className="text-xs text-green-500 font-small">{app.workPreferences.evening ? 'Evening' : ''}</div>
                      <div className="text-xs text-green-500 font-small">{app.workPreferences.weekend ? 'Weekend' : ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        app.fingerprintPaymentPreference === 'yes' ? 'bg-green-100 text-green-800' :
                        app.fingerprintPaymentPreference === 'no' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {app.fingerprintPaymentPreference === 'yes' ? 'Willing to Pay' :
                         app.fingerprintPaymentPreference === 'no' ? 'Not Willing' :
                         'Pending'}
                      </span>
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
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {format(new Date(app.submittedAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {getStudentCouponCode(app._id)}
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