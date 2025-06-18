import { NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';
import { encryptData } from '@/app/lib/encryption';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('applications');

    // Encrypt sensitive data
    const encryptedData = {
      ...data,
      ssn: data.ssn ? encryptData(data.ssn) : null,
      dateOfBirth: data.dateOfBirth ? encryptData(data.dateOfBirth) : null,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };

    const result = await collection.insertOne(encryptedData);

    return NextResponse.json({
      success: true,
      id: result.insertedId
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
} 