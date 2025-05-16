'use client';

import { useState, useEffect } from 'react';
import { Gift, X } from 'lucide-react';

interface Coupon {
  _id: string;
  coupon_id: string;
  coupon_code: string;
  assigned_to: string | null;
  assigned_at: string | null;
  status: 'available' | 'assigned' | 'used';
}

interface CouponManagerProps {
  studentId: string;
  isAccepted: boolean;
}

export default function CouponManager({ studentId, isAccepted }: CouponManagerProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<string>('');

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await fetch('/api/coupons');
      if (!response.ok) throw new Error('Failed to fetch coupons');
      const data = await response.json();
      setCoupons(data);
    } catch (err) {
      setError('Failed to load coupons');
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedCoupon) return;

    try {
      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          couponId: selectedCoupon
        })
      });

      if (!response.ok) throw new Error('Failed to assign coupon');
      
      await fetchCoupons();
      setSelectedCoupon('');
    } catch (err) {
      setError('Failed to assign coupon');
      console.error('Error assigning coupon:', err);
    }
  };

  const handleUnassign = async (couponId: string) => {
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
      
      await fetchCoupons();
    } catch (err) {
      setError('Failed to unassign coupon');
      console.error('Error unassigning coupon:', err);
    }
  };

  if (loading) return <div>Loading coupons...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  const assignedCoupon = coupons.find(c => c.assigned_to === studentId);
  const availableCoupons = coupons.filter(c => c.status === 'available');

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Coupon Management</h3>
      
      {!isAccepted ? (
        <div className="text-yellow-600 bg-yellow-50 p-4 rounded-md">
          Student must be accepted before assigning coupons
        </div>
      ) : assignedCoupon ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-green-50 p-4 rounded-md">
            <div>
              <p className="text-sm text-green-800">Assigned Coupon:</p>
              <p className="font-medium text-green-900">{assignedCoupon.coupon_code}</p>
              <p className="text-xs text-green-600">
                Assigned on: {new Date(assignedCoupon.assigned_at!).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => handleUnassign(assignedCoupon._id)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <X className="w-4 h-4 mr-2" />
              Unassign
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <select
              value={selectedCoupon}
              onChange={(e) => setSelectedCoupon(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Select a coupon</option>
              {availableCoupons.map((coupon) => (
                <option key={coupon._id} value={coupon._id}>
                  {coupon.coupon_code}
                </option>
              ))}
            </select>
            <button
              onClick={handleAssign}
              disabled={!selectedCoupon}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                !selectedCoupon ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Gift className="w-4 h-4 mr-2" />
              Assign Coupon
            </button>
          </div>
          {availableCoupons.length === 0 && (
            <p className="text-sm text-gray-500">No available coupons</p>
          )}
        </div>
      )}
    </div>
  );
} 