import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import { encryptData, decryptData } from '@/app/lib/encryption';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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