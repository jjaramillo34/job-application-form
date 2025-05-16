import { NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';
import { decryptData } from '@/app/lib/encryption';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('applications');

    const application = await collection.findOne({ _id: new ObjectId(params.id) });

    if (!application) {
      return new NextResponse('Application not found', { status: 404 });
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
    return new NextResponse('Error fetching application', { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('applications');

    const { status } = await request.json();

    if (!status || !['pending', 'reviewed', 'accepted', 'rejected'].includes(status)) {
      return new NextResponse('Invalid status', { status: 400 });
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { status } }
    );

    if (result.matchedCount === 0) {
      return new NextResponse('Application not found', { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating application status:', error);
    return new NextResponse('Error updating application status', { status: 500 });
  }
} 