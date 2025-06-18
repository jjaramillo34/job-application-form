import { NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    const { assignments } = await request.json();

    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json({ error: 'No assignments provided' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('coupons');

    // Process each assignment
    const results = await Promise.all(
      assignments.map(async ({ studentId, couponId }) => {
        try {
          const result = await collection.updateOne(
            { _id: new ObjectId(couponId), status: 'available' },
            {
              $set: {
                assigned_to: studentId,
                assigned_at: new Date().toISOString(),
                status: 'assigned'
              }
            }
          );
          return { success: result.modifiedCount > 0, studentId, couponId };
        } catch (error) {
          return { success: false, studentId, couponId, error: 'Failed to assign' };
        }
      })
    );

    const successfulAssignments = results.filter(r => r.success);
    const failedAssignments = results.filter(r => !r.success);

    return NextResponse.json({
      success: true,
      totalAssignments: assignments.length,
      successfulAssignments: successfulAssignments.length,
      failedAssignments: failedAssignments.length,
      details: {
        successful: successfulAssignments,
        failed: failedAssignments
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to assign coupons' },
      { status: 500 }
    );
  }
} 