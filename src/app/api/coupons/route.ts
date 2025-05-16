import { NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('coupons');

    const coupons = await collection.find({}).toArray();
    return NextResponse.json(coupons);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { studentId, couponId } = await request.json();

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const couponsCollection = db.collection('coupons');
    const applicationsCollection = db.collection('applications');

    // Check if student exists and is accepted
    const student = await applicationsCollection.findOne({ _id: new ObjectId(studentId) });
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Check if coupon is available
    const coupon = await couponsCollection.findOne({ 
      _id: new ObjectId(couponId),
      status: 'available'
    });

    if (!coupon) {
      return NextResponse.json(
        { error: 'Coupon not available' },
        { status: 400 }
      );
    }

    // Assign coupon to student
    const result = await couponsCollection.updateOne(
      { _id: new ObjectId(couponId) },
      {
        $set: {
          assigned_to: studentId,
          assigned_at: new Date().toISOString(),
          status: 'assigned'
        }
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error assigning coupon:', error);
    return NextResponse.json(
      { error: 'Failed to assign coupon' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { studentId, couponId } = await request.json();

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const couponsCollection = db.collection('coupons');

    // Unassign coupon
    const result = await couponsCollection.updateOne(
      { 
        _id: new ObjectId(couponId),
        assigned_to: studentId
      },
      {
        $set: {
          assigned_to: null,
          assigned_at: null,
          status: 'available'
        }
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unassigning coupon:', error);
    return NextResponse.json(
      { error: 'Failed to unassign coupon' },
      { status: 500 }
    );
  }
} 