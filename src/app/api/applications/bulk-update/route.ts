import { NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PATCH(request: Request) {
  try {
    const { applicationIds, status } = await request.json();

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return NextResponse.json({ error: 'No applications selected' }, { status: 400 });
    }

    if (!status || !['approved', 'rejected', 'accepted'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('applications');

    // Convert string IDs to ObjectId
    const objectIds = applicationIds.map(id => new ObjectId(id));

    // Update all selected applications
    const result = await collection.updateMany(
      { _id: { $in: objectIds } },
      { $set: { status } }
    );

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    return NextResponse.json(
      { error: 'Failed to update applications' },
      { status: 500 }
    );
  }
} 