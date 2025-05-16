import { NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';
import { encryptData } from '@/app/lib/encryption';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'firstName', 'lastName', 'address', 'city', 'state', 'zipCode',
      'phone', 'email', 'counselor_email', 'ssn', 'dateOfBirth',
      'program', 'site', 'lcgmsCode', 'geographicDistrict'
    ];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Encrypt sensitive data
    const encryptedData = {
      ...data,
      ssn: encryptData(data.ssn),
      dateOfBirth: encryptData(data.dateOfBirth),
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('applications');

    const result = await collection.insertOne(encryptedData);
    
    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error('Error submitting application:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
} 