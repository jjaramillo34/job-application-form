import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import { encryptData, decryptData } from '@/app/lib/encryption';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { db } = await connectToDatabase();
    const application = await db.collection('applications').findOne({ _id: new ObjectId(id) });
    
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Decrypt sensitive data
    const decryptedApplication = {
      ...application,
      ssn: application.ssn ? decryptData(application.ssn) : null,
      dateOfBirth: application.dateOfBirth ? decryptData(application.dateOfBirth) : null,
    };
    
    return NextResponse.json(decryptedApplication);
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { db } = await connectToDatabase();
    const collection = db.collection('applications');

    // First check if the application exists
    const application = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Delete the application
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 });
    }

    // Also remove any associated coupon assignments
    const couponsCollection = db.collection('coupons');
    await couponsCollection.deleteMany({ assigned_to: id });

    return NextResponse.json({ 
      message: 'Application deleted successfully',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Delete application error:', error);
    return NextResponse.json(
      { error: 'Failed to delete application' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { db } = await connectToDatabase();
    const body = await request.json();

    // Remove _id from the update body to prevent immutable field update
    const { _id, ...updateData } = body;

    // Encrypt sensitive data if it's being updated
    if (updateData.ssn) {
      updateData.ssn = encryptData(updateData.ssn);
    }
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = encryptData(updateData.dateOfBirth);
    }

    const result = await db.collection('applications').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Application updated successfully' });
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 